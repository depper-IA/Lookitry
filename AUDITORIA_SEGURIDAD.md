# Auditoría de Seguridad — Lookitry
Fecha: 2026-03-18

---

## 64.1 RLS por tabla

### Estado antes de la auditoría

| Tabla | Problema detectado |
|---|---|
| `brands` | UPDATE con `USING (true)` — cualquier usuario autenticado podía actualizar cualquier marca |
| `products` | ALL con `USING (true)` — cualquier usuario autenticado podía leer/editar productos de otras marcas |
| `subscription_payments` | INSERT/UPDATE con `WITH CHECK (true)` y rol `public` — cualquier usuario podía insertar pagos |
| `trial_registrations` | ALL con `USING (true)` y rol `public` — sin restricción de acceso |
| `trial_campaigns` | ALL con `USING (true)` y rol `public` — sin restricción de escritura |
| `generations` | SELECT con `USING (true)` — cualquier usuario podía ver generaciones de otras marcas |
| `pricing_config` | Política de escritura usaba `auth.role()` en policy de rol `public` (ineficaz) |

### Correcciones aplicadas (migración `fix_rls_policies_security_audit`)

| Tabla | Política corregida |
|---|---|
| `brands` UPDATE | Ahora filtra por `id = JWT.brandId` |
| `products` ALL | Ahora filtra por `brand_id = JWT.brandId` |
| `subscription_payments` | Movido a `service_role` exclusivamente (INSERT/UPDATE/SELECT) |
| `trial_registrations` | Movido a `service_role` exclusivamente |
| `trial_campaigns` | SELECT público (lectura de campaña activa), escritura solo `service_role` |
| `generations` SELECT | Ahora filtra por `brand_id = JWT.brandId` + `service_role` para ALL |
| `pricing_config` escritura | Movido a `service_role` con política correcta |

### Estado final — todas las tablas

| Tabla | RLS | Acceso lectura | Acceso escritura |
|---|---|---|---|
| `brands` | Habilitado | Propia marca (JWT) + anon (datos públicos) | Solo propia marca (JWT) |
| `products` | Habilitado | Anon (activos), propia marca (JWT) | Solo propia marca (JWT) |
| `generations` | Habilitado | Solo propia marca (JWT) | Solo service_role |
| `generation_feedback` | Habilitado | Solo service_role | Solo service_role |
| `subscription_payments` | Habilitado | Solo service_role | Solo service_role |
| `trial_registrations` | Habilitado | Solo service_role | Solo service_role |
| `trial_campaigns` | Habilitado | Público (lectura) | Solo service_role |
| `coupons` | Habilitado | Anon/authenticated (activos) | Solo service_role |
| `promotions` | Habilitado | Anon/authenticated (activas) | Solo service_role |
| `pricing_config` | Habilitado | Público (lectura) | Solo service_role |
| `payment_settings` | Habilitado | Solo service_role | Solo service_role |
| `admins` | Habilitado | Solo service_role | Solo service_role |
| `admin_notifications` | Habilitado | Solo service_role | Solo service_role |
| `admin_notification_preferences` | Habilitado | Solo service_role | Solo service_role |

---

## 64.2 Autenticación y autorización

### Rutas `/api/admin/*`
- Todas protegidas con `adminAuthMiddleware` via `router.use(adminAuthMiddleware)` en `admin.routes.ts`
- Permiso granular adicional con `requirePermission()` por recurso
- Única excepción correcta: `POST /api/admin/auth/login` (antes del middleware)

### Rutas `/api/brands/*`
- Todas protegidas con `authMiddleware` via `router.use(authMiddleware)` en `brands.routes.ts`
- Rutas de suscripción, productos, generaciones, analytics, usage: todas requieren JWT

### JWT_SECRET
- **Problema encontrado:** Fallback a `'your-secret-key-change-this'` si la variable no estaba definida
- **Corrección aplicada:** `jwt.ts` ahora lanza error al iniciar si `JWT_SECRET` no está definido
- **Acción requerida en producción:** Verificar que el VPS tenga `JWT_SECRET` con valor seguro (actualmente `virtual-tryon-saas-secret-key-change-in-production-2026` — cambiar por uno generado aleatoriamente)

### Wompi
- **Estado actual:** Llaves de TEST (`pub_test_*`, `prv_test_*`) en `.env` local
- **Acción requerida:** Cambiar a llaves de producción en el VPS antes de aceptar pagos reales

### Turnstile
- `TURNSTILE_ENABLED=true` en `.env` local y en producción — correcto

---

## 64.3 Variables de entorno expuestas

| Variable | Frontend | Resultado |
|---|---|---|
| `SUPABASE_SERVICE_KEY` | Solo en API Routes del servidor (`/api/pricing`, `/api/coupons/validate`, `/api/admin/promotions`) — sin prefijo `NEXT_PUBLIC_` | Correcto |
| `WOMPI_PRIVATE_KEY` | No presente en frontend | Correcto |
| `JWT_SECRET` | No presente en frontend | Correcto |
| `.env.local` en `.gitignore` | Sí, cubierto por `.env.local` y `.env` | Correcto |
| `backend/.env` en `.gitignore` | Sí, cubierto por `.env` | Correcto |

### Nota sobre `SUPABASE_SERVICE_KEY` en frontend
La clave está en `frontend/.env.local` pero **solo se usa en API Routes de Next.js** (código que corre en el servidor, nunca en el browser). No tiene prefijo `NEXT_PUBLIC_` por lo que no se expone al cliente. Es un patrón válido.

---

## 64.4 CORS y headers del backend

### CORS
- Lista blanca explícita: `pruebalo.wilkiedevs.com`, `api.pruebalo.wilkiedevs.com`, `localhost:3000/3001`
- Requests sin `origin` (mobile apps, curl) permitidos — aceptable para una API
- Métodos permitidos: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers permitidos: `Content-Type`, `Authorization`

### Security headers
Todos configurados en `app.ts`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Powered-By` removido

---

## Funciones PostgreSQL — search_path mutable

Corregidas con `SET search_path = public` y `SECURITY DEFINER`:
- `update_pricing_config_timestamp`
- `set_pricing_config_updated_at`
- `update_gf_updated_at`
- `sync_gf_content`
- `match_generation_feedback`
- `search_similar_feedback`

---

## Acciones pendientes (requieren intervención manual en VPS)

1. **JWT_SECRET en producción:** Generar un secreto aleatorio seguro y actualizar en el VPS:
   ```bash
   openssl rand -base64 64
   # Actualizar JWT_SECRET en el contenedor Docker del backend
   ```

2. **Llaves Wompi de producción:** Reemplazar `pub_test_*` / `prv_test_*` por las llaves de producción cuando se active el cobro real.

3. **Extensión `vector` en schema `extensions`:** Actualmente instalada en `public`. Mover a schema `extensions` para seguir buenas prácticas (requiere coordinación con Supabase support o recrear la extensión).
