# Diseño Técnico: Hardening de Seguridad Lookitry

## 1. Enfoque Técnico Centralizado (Code Sync)

Implementamos un enfoque quirúrgico y modular para el hardening de middlewares y la base de datos sin duplicar lógica. De acuerdo con el *Code Sync Checker*, reutilizamos y actualizamos los archivos existentes:

- **`rateLimiter.ts`**: Centraliza el rate-limiting con tolerancia a fallos de Redis (fallar-cerrado para rutas críticas, degradación a memoria local para endpoints públicos).
- **`widgetSecurity.ts`**: Encapsula la validación de orígenes del widget y la sanitización de cabeceras en registros de logs.
- **`security.config.ts`**: Reemplaza el CORS wildcard permisivo de rutas del widget por una validación de orígenes dinámica y segura.
- **`auth.service.ts`**: Refuerza la lógica híbrida de Account Lockout (Redis + DB) e integra el registro asíncrono de logs de auditoría en la nueva tabla `login_audit`.

---

## 2. Arquitectura de Middlewares

### 2.1 Flujo de Validación de CORS Dinámico
Sustituimos el wildcard `*` en rutas públicas por validación dinámica contra el campo `allowed_origins` de las marcas, cacheado en Redis por rendimiento:

```
Request con Origin (Widget)
       │
       ▼
 [Dynamic CORS Middleware]
   ¿Origen registrado en brands.social_links.allowed_origins?
       ├── SÍ ───────────────────────────────► [Permitir Acceso (Next)]
       └── NO (o falta header Origin)
             │
             ▼
        [¿Es localhost / dominio Lookitry?]
             ├── SÍ ─────────────────────────► [Permitir Acceso (Next)]
             └── NO ─────────────────────────► [Bloquear 403 Forbidden]
```

### 2.2 Flujo de Rate Limiting Tolerante a Fallos (Redis Fail-Closed)

```
Petición Entrante
       │
       ▼
[¿Redis está disponible (ready)?]
       ├── SÍ ──► [Usar RedisStore Rate Limiter] ──► [Procesar / Bloquear 429]
       └── NO
             │
             ▼
      [¿Ruta Crítica / Auth?]
             ├── SÍ (Login/Admin) ──► [Fail-Closed] ──► [Retornar 503 Unavailable]
             └── NO (Pública) ──────► [Memory Fallback] ──► [Procesar / Bloquear 429]
```

### 2.3 Sanitización de Logs (VULN-004)
Implementamos una función utilitaria para enmascarar credenciales antes de serializar cualquier cabecera en logs de auditoría en `widgetSecurity.ts`:

```typescript
export function sanitizeHeaders(headers: any) {
  const sensitive = ['authorization', 'x-api-key', 'cookie', 'set-cookie'];
  const sanitized = { ...headers };
  sensitive.forEach(key => {
    if (sanitized[key]) sanitized[key] = '[REDACTED]';
  });
  return sanitized;
}
```

---

## 3. Decisiones de Arquitectura

| Componente | Opción | Tradeoffs | Decisión y Razón |
| :--- | :--- | :--- | :--- |
| **VULN-001 Lockout** | Redis vs DB vs Híbrido | Redis es volátil (resets); DB añade escrituras. Híbrido consume recursos de red. | **Híbrido**: Redis almacena el contador rápido en memoria. La base de datos actúa como verdad de respaldo persistente, garantizando que el bloqueo sobreviva a reinicios. |
| **VULN-002 CORS** | Lista estática vs Base de datos | Estática no escala. DB requiere query. Redis mitiga latencia. | **Dynamic Origin Matcher (Supabase + Redis)**: Valida orígenes de marcas de forma dinámica y los almacena en Redis por 1 hora para evitar cuello de botella. |
| **VULN-005 Redis Fallback** | Fail-Open vs Fail-Closed | Fail-open expone la API ante caídas de Redis. Fail-closed total interrumpe el servicio del widget. | **Estrategia Dual**: Las rutas públicas se degradan a rate-limit local en memoria (Fail-Open a nivel Redis pero protegido en memoria). Rutas admin y de login fallan-cerrado (503). |

---

## 4. Estrategia de Base de Datos y RLS

### 4.1 Migración SQL (`20260609_security_hardening.sql`)

```sql
-- 1. Tabla de Auditoría de Login
CREATE TABLE IF NOT EXISTS public.login_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  status VARCHAR(20) CHECK (status IN ('success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en login_audit (Bloqueo total, accesible solo por service_role en backend)
ALTER TABLE public.login_audit ENABLE ROW LEVEL SECURITY;

-- 2. Asegurar RLS en tablas críticas
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas e inseguras
DROP POLICY IF EXISTS "Public brands select" ON public.brands;
DROP POLICY IF EXISTS "Permissive read on payments" ON public.subscription_payments;

-- Crear políticas estrictas con USING para anon
CREATE POLICY "Public brand widget data readable by anon" 
ON public.brands FOR SELECT TO anon 
USING (true); -- El backend filtra campos sensibles (hash, etc.) para select públicos

-- Bloqueo explícito en pagos y leads para anon/authenticated
-- (No se añaden políticas de lectura, por tanto PostgREST bloquea todo acceso de estos roles)
```

### 4.2 Script de Verificación de Políticas (RLS Auditor)
Query SQL para verificar que las tablas críticas tengan RLS activado y reportar cualquier anomalía de roles:

```sql
SELECT 
  tablename, 
  rowsecurity AS rls_enabled,
  ARRAY_AGG(policyname) AS active_policies
FROM pg_policies
RIGHT JOIN pg_tables ON tablename = relname
WHERE schemaname = 'public' 
  AND tablename IN ('brands', 'subscription_payments', 'leads', 'login_audit', 'admins')
GROUP BY tablename, rowsecurity;
```

---

## 5. Manejo de Errores & Fail-Closed en Redis (VULN-005)

Modificamos el cargador de RedisStore en `rateLimiter.ts`:

```typescript
function makeRedisStore(prefix: string): RedisStore | undefined {
  if (redis.status !== 'ready') {
    return undefined; // Permite al rate-limiter caer al fallback en memoria
  }
  return new RedisStore({
    // @ts-expect-error - diferencias de tipos
    sendCommand: (...args: string[]) => {
      if (redis.status !== 'ready') throw new Error('Redis no disponible');
      return redis.call(...args);
    },
    prefix,
  });
}
```

- **Rutas Admin y Login**: Envolvemos los rate-limiters con un middleware interceptor. Si `redis.status !== 'ready'`, respondemos `503 Service Unavailable` de inmediato (fail-closed).
- **Rutas Públicas del Widget**: Si Redis falla, el rate-limiter se degrada automáticamente a un almacén en memoria en el servidor Node (fail-safe de disponibilidad operativa).

---

## 6. Mapeo de Cambios (Mapeo Exacto)

| Archivo | Acción | Descripción |
| :--- | :--- | :--- |
| `backend/src/config/security.config.ts` | Modificar | Reemplazar CORS wildcard de rutas públicas por comprobación dinámica contra marcas. |
| `backend/src/middleware/rateLimiter.ts` | Modificar | Añadir lógica de tolerancia a fallos, fail-closed para admin/login y degradación en memoria. |
| `backend/src/middleware/widgetSecurity.ts` | Modificar | Sanitizar registros de log con `sanitizeHeaders` antes de imprimir. |
| `backend/src/services/auth.service.ts` | Modificar | Reforzar Account Lockout y añadir registro asíncrono en `login_audit`. |
| `backend/src/controllers/auth.controller.ts` | Modificar | Capturar intentos fallidos y loguear en `login_audit`. |
| `backend/supabase/migrations/20260609_security_hardening.sql` | Crear | Crear tabla `login_audit`, habilitar RLS, y configurar vistas de auditoría de seguridad. |

---

## 7. Plan de Implementación Gradual

1. **Fase 1 (DB & Auditoría)**: Ejecutar migración SQL para habilitar RLS en `login_audit`, `brands`, `subscription_payments` y `leads`. Verificar el estado con el RLS Auditor SQL.
2. **Fase 2 (Centralización CORS & Logging)**: Actualizar `security.config.ts` y `widgetSecurity.ts` para habilitar el CORS dinámico e implementar la sanitización de cabeceras en logs.
3. **Fase 3 (Lockout y Robustez de Redis)**: Implementar la validación híbrida de Account Lockout en `AuthService` y la protección de fail-closed/fallback en `rateLimiter.ts`.
4. **Fase 4 (Verificación General)**: Correr pruebas unitarias de login y autenticación para confirmar el correcto comportamiento.
