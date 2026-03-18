# AUDIT_TASKS.md — Plan de Auditoría Lookitry

> Dividido en tareas independientes para ejecutar por partes.
> Marcar cada tarea como `[ ]` pendiente, `[~]` en progreso, `[x]` completada.

---

## TAREA 1 — Auditoría de Base de Datos

### 1.1 Tablas y relaciones
- [ ] Verificar que todas las FK tienen índices (brands, products, generations, generation_feedback, subscription_payments, trial_registrations)
- [ ] Confirmar que no hay registros huérfanos: `products` sin `brand_id` válido
- [ ] Confirmar que no hay `generations` sin `brand_id` o `product_id` válido
- [ ] Confirmar que no hay `generation_feedback` sin `generation_id` o `brand_id` válido
- [ ] Confirmar que no hay `subscription_payments` sin `brand_id` válido
- [ ] Confirmar que no hay `trial_registrations` sin `brand_id` o `campaign_id` válido
- [ ] Verificar que `admin_notifications` con `brand_id` no nulo apuntan a marcas existentes

### 1.2 Datos duplicados
- [ ] Verificar emails duplicados en `brands` (debería ser UNIQUE pero revisar datos legacy)
- [ ] Verificar slugs duplicados en `brands`
- [ ] Verificar códigos duplicados en `coupons`
- [ ] Verificar emails duplicados en `admins`

### 1.3 Datos inconsistentes
- [ ] Marcas con `subscription_status = 'active'` pero `subscription_end_date` en el pasado
- [ ] Marcas con `trial_end_date` en el pasado pero sin `subscription_status` definido
- [ ] Marcas con `has_landing_page = true` pero `landing_suspended_at` no nulo (verificar lógica de suspensión)
- [ ] Marcas con `plan = 'PRO'` pero sin `subscription_start_date`
- [ ] Generaciones con `status = 'PENDING'` de más de 24 horas (stuck)

### 1.4 Tabla pricing_config
- [ ] Verificar que existen los 6 registros esperados: `basic`, `pro`, `descuentos_duracion`, `metas`, `costos_operativos`, `landing`
- [ ] Verificar que `basic.data.precio_mensual_cop` y `pro.data.precio_mensual_cop` tienen valores correctos
- [ ] Verificar que `descuentos_duracion.data` tiene `meses_1`, `meses_3`, `meses_6`, `meses_12`

### SQL de auditoría rápida
```sql
-- Huérfanos en products
SELECT COUNT(*) FROM products p WHERE NOT EXISTS (SELECT 1 FROM brands b WHERE b.id = p.brand_id);

-- Huérfanos en generations
SELECT COUNT(*) FROM generations g WHERE NOT EXISTS (SELECT 1 FROM brands b WHERE b.id = g.brand_id);

-- Suscripciones activas vencidas
SELECT id, email, subscription_status, subscription_end_date 
FROM brands 
WHERE subscription_status = 'active' AND subscription_end_date < now();

-- Generaciones stuck
SELECT COUNT(*) FROM generations WHERE status = 'PENDING' AND generated_at < now() - interval '24 hours';

-- Registros pricing_config
SELECT id, updated_at FROM pricing_config ORDER BY id;
```

---

## TAREA 2 — Auditoría de Datos Dinámicos

### 2.1 Precios dinámicos (pricing_config)
- [ ] Verificar que `/checkout` público carga precios desde `pricing_config` (no hardcodeados)
- [ ] Verificar que `/dashboard/checkout` carga precios desde `pricing_config`
- [ ] Verificar que `UpgradeModal` carga precios desde `pricing_config`
- [ ] Verificar que el panel admin `/admin/pricing` guarda y lee correctamente de `pricing_config`
- [ ] Verificar que los descuentos por meses se aplican correctamente en ambos checkouts

### 2.2 Configuración de pagos (payment_settings)
- [ ] Verificar que `GET /api/payment-settings/public` devuelve `landingPrice`, `landingOriginalPrice`, `wompiEnabled`, `wompiPublicKey`, `manualEnabled`, `manualWhatsapp`, `manualEmail`
- [ ] Verificar que el panel admin `/admin/payment-settings` guarda y lee correctamente
- [ ] Verificar que `WOMPI_ENABLED` en `.env` y `wompi_enabled` en BD están sincronizados

### 2.3 Cupones
- [ ] Verificar que `POST /api/coupons/validate` funciona correctamente (frontend route)
- [ ] Verificar que el panel admin `/admin/marketing/promotions` lista, crea, edita y elimina cupones
- [ ] Verificar que el controller usa `supabaseAdmin` (ya corregido — confirmar en producción)
- [ ] Verificar que `uses_count` se incrementa al usar un cupón en el checkout

### 2.4 Promociones
- [ ] Verificar que `GET /api/promotions` devuelve promociones activas
- [ ] Verificar que `PromoModal` en la landing muestra la promoción activa si existe
- [ ] Verificar que las fechas `starts_at` / `ends_at` se respetan

---

## TAREA 3 — Auditoría de Frontend

### 3.1 Páginas públicas
- [ ] `/` — Landing: carga correctamente, SEO OK, precios hardcodeados intencionales
- [ ] `/planes` — Página de planes: precios dinámicos o hardcodeados? Verificar
- [ ] `/register` — Registro: Turnstile activo, validaciones OK
- [ ] `/login` — Login: JWT correcto, redirección a dashboard
- [ ] `/sobre-nosotros` — Contenido correcto
- [ ] `/terminos` — Contenido correcto
- [ ] `/politicas-privacidad` — Contenido correcto
- [ ] `/checkout` — Precios dinámicos, cupones, Wompi OK
- [ ] `/pago-exitoso` — Muestra confirmación correcta
- [ ] `/trial-payment` — Flujo de pago de trial OK
- [ ] `/trial-activado` — Confirmación de trial OK
- [ ] `/verify-email` — Verificación de email OK
- [ ] `/registro-pro` — Registro directo a PRO OK

### 3.2 Dashboard (rutas privadas)
- [ ] `/dashboard` — Home del dashboard, stats correctas
- [ ] `/dashboard/products` — CRUD de productos, límite por plan
- [ ] `/dashboard/generations` — Historial de generaciones
- [ ] `/dashboard/analytics` — Métricas de uso
- [ ] `/dashboard/usage` — Contador de generaciones del mes
- [ ] `/dashboard/subscription` — Estado de suscripción, fechas, plan
- [ ] `/dashboard/checkout` — Precios dinámicos, upgrade/downgrade OK
- [ ] `/dashboard/settings` — Configuración del widget
- [ ] `/dashboard/embed` — Código de integración del widget
- [ ] `/dashboard/mi-pagina` — Editor de mini-landing (solo si `has_landing_page = true`)
- [ ] `/dashboard/profile` — Perfil de la marca

### 3.3 Panel Admin (rutas admin)
- [ ] `/admin/dashboard` — Métricas globales
- [ ] `/admin/brands` — Lista y gestión de marcas
- [ ] `/admin/subscriptions` — Gestión de suscripciones
- [ ] `/admin/payments` — Historial de pagos
- [ ] `/admin/revenue` — Ingresos y proyecciones
- [ ] `/admin/pricing` — Editor de precios dinámicos
- [ ] `/admin/payment-settings` — Configuración de pasarelas de pago
- [ ] `/admin/marketing/promotions` — Gestión de cupones y promociones
- [ ] `/admin/mini-landings` — Gestión de mini-landings
- [ ] `/admin/analytics` — Analytics globales
- [ ] `/admin/feedback` — Feedback de generaciones
- [ ] `/admin/notifications` — Notificaciones del sistema
- [ ] `/admin/health` — Estado del sistema
- [ ] `/admin/configuracion` — Configuración general
- [ ] `/admin/admins` — Gestión de administradores
- [ ] `/admin/conversion` — Métricas de conversión

### 3.4 Páginas especiales
- [ ] `/pruebalo/[slug]` — Widget público de prueba virtual
- [ ] `/marca/[slug]` — Mini-landing pública de marca
- [ ] `/sitio/[slug]` — Variante de mini-landing
- [ ] `/embed/[slug]` — Embed del widget
- [ ] `/auth/callback` — Callback de autenticación

### 3.5 Modo light/dark
- [ ] Verificar que TODOS los paneles admin usan variables CSS (`var(--text-primary)`, etc.)
- [ ] Verificar que no hay colores hardcodeados en paneles admin
- [ ] Verificar que el toggle de tema funciona correctamente

---

## TAREA 4 — Auditoría de Backend

### 4.1 Endpoints de autenticación
- [ ] `POST /api/auth/register` — Registro con Turnstile, email verification
- [ ] `POST /api/auth/login` — Login, JWT
- [ ] `POST /api/auth/logout` — Logout
- [ ] `POST /api/auth/forgot-password` — Reset de contraseña
- [ ] `POST /api/auth/reset-password` — Confirmar reset
- [ ] `GET /api/auth/verify-email` — Verificación de email

### 4.2 Endpoints de marcas
- [ ] `GET /api/brands/me` — Perfil de la marca autenticada
- [ ] `PUT /api/brands/me` — Actualizar perfil
- [ ] `GET /api/brands/:slug` — Perfil público por slug

### 4.3 Endpoints de productos
- [ ] `GET /api/products` — Listar productos de la marca
- [ ] `POST /api/products` — Crear producto (con límite por plan)
- [ ] `PUT /api/products/:id` — Actualizar producto
- [ ] `DELETE /api/products/:id` — Eliminar producto
- [ ] `POST /api/upload` — Subir imagen a MinIO

### 4.4 Endpoints de generaciones
- [ ] `POST /api/generations` — Crear generación (llama a n8n)
- [ ] `GET /api/generations` — Historial de generaciones
- [ ] `GET /api/generations/:id` — Detalle de generación

### 4.5 Endpoints de pagos
- [ ] `GET /api/payment-settings/public` — Config pública de pagos
- [ ] `GET /api/payments/wompi/config` — Config de Wompi
- [ ] `GET /api/payments/wompi/checkout-url` — URL de checkout Wompi
- [ ] `POST /api/payments/wompi/webhook` — Webhook de Wompi (eventos de pago)

### 4.6 Endpoints de suscripción
- [ ] `GET /api/subscription` — Estado de suscripción
- [ ] `POST /api/subscription/activate` — Activar suscripción tras pago

### 4.7 Endpoints de cupones
- [ ] `POST /api/coupons/validate` — Validar cupón (público)
- [ ] `GET /api/admin/coupons` — Listar cupones (admin)
- [ ] `POST /api/admin/coupons` — Crear cupón (admin, usa supabaseAdmin)
- [ ] `PUT /api/admin/coupons/:id` — Actualizar cupón (admin, usa supabaseAdmin)
- [ ] `DELETE /api/admin/coupons/:id` — Eliminar cupón (admin, usa supabaseAdmin)

### 4.8 Endpoints de trial
- [ ] `POST /api/trial/register` — Registrar trial
- [ ] `GET /api/trial/campaign` — Obtener campaña activa

### 4.9 Endpoints de analytics y revenue
- [ ] `GET /api/analytics` — Métricas de la marca
- [ ] `GET /api/admin/revenue` — Ingresos globales (admin)
- [ ] `GET /api/usage` — Uso de generaciones del mes

### 4.10 Endpoints de pruebalo (widget público)
- [ ] `GET /api/pruebalo/:slug` — Config del widget por slug
- [ ] `POST /api/pruebalo/:slug/generate` — Generar try-on desde widget público

---

## TAREA 5 — Auditoría de Seguridad

### 5.1 RLS (Row Level Security)
- [ ] `brands` — Solo la marca puede leer/editar sus propios datos
- [ ] `products` — Solo la marca dueña puede CRUD
- [ ] `generations` — Solo la marca dueña puede leer
- [ ] `generation_feedback` — Solo la marca dueña puede insertar
- [ ] `subscription_payments` — Solo la marca dueña puede leer
- [ ] `trial_registrations` — Solo la marca dueña puede leer
- [ ] `coupons` — Solo admins pueden CRUD (service role key)
- [ ] `promotions` — Solo admins pueden CRUD (service role key)
- [ ] `pricing_config` — Solo admins pueden escribir, lectura pública OK
- [ ] `payment_settings` — Solo admins pueden escribir, lectura pública limitada
- [ ] `admins` — Solo service role puede acceder
- [ ] `admin_notifications` — Solo service role puede insertar, admins pueden leer
- [ ] `admin_notification_preferences` — Solo admins pueden CRUD

### 5.2 Autenticación y autorización
- [ ] Verificar que todas las rutas `/api/admin/*` requieren middleware de admin
- [ ] Verificar que todas las rutas `/api/brands/*` requieren JWT válido
- [ ] Verificar que el JWT_SECRET no es el valor por defecto en producción
- [ ] Verificar que las claves de Wompi en producción son las de producción (no test)
- [ ] Verificar que `TURNSTILE_ENABLED=true` en producción

### 5.3 Variables de entorno expuestas
- [ ] Verificar que `SUPABASE_SERVICE_KEY` NO está en el frontend (solo en backend)
- [ ] Verificar que `WOMPI_PRIVATE_KEY` NO está en el frontend
- [ ] Verificar que `JWT_SECRET` NO está en el frontend
- [ ] Verificar que `.env.local` está en `.gitignore`
- [ ] Verificar que `backend/.env` está en `.gitignore`

### 5.4 CORS y headers
- [ ] Verificar configuración de CORS en el backend (solo dominios autorizados)
- [ ] Verificar que el backend no expone headers sensibles

---

## TAREA 6 — Auditoría de Integraciones

### 6.1 n8n
- [ ] Verificar que el workflow `wPLypk7KhBcFLicX` (Try-On) está activo en producción
- [ ] Verificar que el webhook `/webhook/tryon` responde correctamente
- [ ] Verificar que el Error Handler `PNri7NdZYkZhpPnm` está activo
- [ ] Verificar que las notificaciones de error llegan a `admin_notifications`
- [ ] Verificar que el workflow `ZjVTV3QxoPEi60GX` (Descriptor IA) funciona

### 6.2 Wompi
- [ ] Verificar que las llaves de producción están configuradas en BD (`payment_settings`)
- [ ] Verificar que el webhook de Wompi está configurado en el dashboard de Wompi
- [ ] Verificar que `WOMPI_EVENTS_SECRET` coincide entre BD y Wompi dashboard
- [ ] Verificar que el flujo completo de pago funciona en producción

### 6.3 MinIO
- [ ] Verificar que el bucket `images` existe y es accesible
- [ ] Verificar que las imágenes subidas son accesibles públicamente via `https://minio.wilkiedevs.com`
- [ ] Verificar que el cleanup de imágenes temporales funciona

### 6.4 Cloudflare Turnstile
- [ ] Verificar que el site key `0x4AAAAAACsmy7e_yL9iyAXM` está activo en Cloudflare
- [ ] Verificar que `TURNSTILE_ENABLED=true` en el VPS
- [ ] Verificar que el registro falla si Turnstile no se completa

### 6.5 SMTP (Hostinger)
- [ ] Verificar que los emails de verificación llegan correctamente
- [ ] Verificar que los emails de reset de contraseña llegan
- [ ] Verificar que el remitente es `info@pruebalo.wilkiedevs.com`

---

## TAREA 7 — Auditoría de Infraestructura

### 7.1 Docker / VPS
- [ ] Verificar que los contenedores `frontend`, `backend`, `nginx` están corriendo
- [ ] Verificar que el proyecto Docker es `virtual-tryon`
- [ ] Verificar que los logs no muestran errores críticos
- [ ] Verificar que el VPS tiene suficiente espacio en disco y RAM

### 7.2 DNS y SSL
- [ ] Verificar que `pruebalo.wilkiedevs.com` resuelve correctamente
- [ ] Verificar que `api.pruebalo.wilkiedevs.com` resuelve correctamente
- [ ] Verificar que los certificados SSL no están próximos a vencer
- [ ] Verificar que `minio.wilkiedevs.com` y `n8n.wilkiedevs.com` están activos

### 7.3 Sitemap y SEO
- [ ] Verificar que `sitemap.ts` incluye todas las páginas públicas
- [ ] Verificar que `robots.ts` bloquea las páginas privadas
- [ ] Verificar que el favicon se muestra correctamente en todos los navegadores
- [ ] Verificar que los meta tags OG están configurados en la landing

---

## Orden de ejecución recomendado

1. Tarea 1 (BD) — base de todo
2. Tarea 5 (Seguridad) — crítico
3. Tarea 2 (Datos dinámicos) — funcionalidad core
4. Tarea 4 (Backend) — endpoints
5. Tarea 3 (Frontend) — UI/UX
6. Tarea 6 (Integraciones) — servicios externos
7. Tarea 7 (Infraestructura) — operaciones
