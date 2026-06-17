# Especificación Técnica: Hardening de Seguridad Lookitry

## 1. VULN-001: Implementación de Account Lockout

### Comportamiento esperado
El sistema implementará un bloqueo temporal tras 5 intentos fallidos de login consecutivos.
- Se debe almacenar `failed_login_attempts` (entero) y `locked_until` (timestamp) en la tabla `brands`.
- Tras el 5to intento fallido, `locked_until` se actualizará a `NOW() + 15 minutes`.
- Cualquier intento de login durante el periodo de bloqueo será rechazado con un error 423 (Locked).

### Casos de borde
- **Redis caído**: El sistema debe fallar cerrado (bloquear el login si no se puede verificar el estado, o caer a la verificación en base de datos si la arquitectura lo permite).
- **Relojes desincronizados**: Utilizar timestamp del servidor de base de datos para la comparación.

### Criterios de validación
- Intentar login 5 veces con contraseña incorrecta.
- Verificar que el 6to intento responde 423.
- Esperar 15 minutos y verificar que el login funciona.

---

## 2. VULN-002: Sistema de Auditoría de Login

### Comportamiento esperado
Registrar todos los intentos de login (exitosos y fallidos) en una nueva tabla `login_audit`.
- Campos: `id`, `brand_id`, `email`, `ip`, `user_agent`, `status` (success/failed), `created_at`.
- Panel de administración en `/admin/login-audit` para visualización.

### Casos de borde
- **Fallo al escribir en auditoría**: El login NO debe bloquearse si la tabla de auditoría falla (fail-open para la funcionalidad de login, pero loguear el error en el backend).

### Criterios de validación
- Realizar login exitoso y fallido.
- Verificar que la tabla `login_audit` contiene los registros correspondientes.
- Verificar visualización en `/admin/login-audit`.

---

## 3. VULN-004: Gestión de Sesión y Dual JWT

### Comportamiento esperado
- TTL de sesiones reducido a 7 días.
- Implementación de rotación segura: soportar `JWT_SECRET_PREVIOUS` para tokens antiguos durante la rotación.
- Soporte para refresh tokens.

### Casos de borde
- **JWT expirado**: El sistema debe solicitar re-autenticación limpia.
- **`JWT_SECRET_PREVIOUS` ausente**: El sistema debe usar el `JWT_SECRET` actual.

### Criterios de validación
- Verificar que los tokens generados expiran a los 7 días.
- Verificar la rotación de claves no invalida sesiones activas inmediatamente.

---

## 4. VULN-005: Seguridad de Cookies y Headers

### Comportamiento esperado
- Cookies configuradas como `HTTP-only`, `Secure` (en producción), `SameSite=Strict`.
- Configuración dinámica del `COOKIE_DOMAIN` vía `.env` para producción.

### Casos de borde
- **Entorno local**: `Secure` debe desactivarse para permitir desarrollo sin HTTPS.

### Criterios de validación
- Inspeccionar cabeceras `Set-Cookie` en respuestas del servidor.

---

## 5. Auditoría de Base de Datos (RLS)

### Comportamiento esperado
- Revisión y reforzamiento de políticas RLS en todas las tablas sensibles (`brands`, `subscription_payments`, `leads`).
- Asegurar que ninguna tabla privada es accesible sin JWT válido y scope correcto.

### Casos de borde
- **Servicio admin (service role)**: Debe saltarse RLS correctamente.

### Criterios de validación
- Intentar consultas SELECT desde el cliente `supabase` (anon) en tablas protegidas y verificar error de permisos (403).
- Ejecutar `supabase_get_advisors` (security) para detectar políticas faltantes.
