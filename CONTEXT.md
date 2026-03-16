# Contexto Operacional — Virtual Try-On (pruebalo.wilkiedevs.com)

> Archivo de referencia rápida para evitar redescubrir rutas, credenciales y comandos en cada sesión.
> Actualizar cuando cambien rutas, credenciales o estructura.

---

## Instrucciones para Kiro — Herramientas Disponibles

Antes de ejecutar cualquier tarea, Kiro debe considerar qué herramienta es la más eficiente para cada operación. Todas las credenciales necesarias están en este archivo y en `backend/.env`.

### Supabase (Power MCP)
Usar el **Power de Supabase** para cualquier operación de base de datos en lugar de scripts Python o curl:
- `SUPABASE_URL`: `https://vkdooutklowctuudjnkl.supabase.co`
- `SUPABASE_SERVICE_KEY`: ver `backend/.env` (rol `service_role` — acceso total sin RLS)
- `SUPABASE_ANON_KEY`: ver `backend/.env` (rol `anon` — respeta RLS)
- Usar para: ejecutar migraciones SQL, consultar tablas, insertar/actualizar datos, verificar esquemas

### Deploy en VPS (Python + paramiko)
Usar `scripts/_deploy_now.py` para cualquier deploy. Credenciales del VPS:
- `HOST`: `31.220.18.39` | `USER`: `root` | `PASS`: `Travis18456916#`
- Flags: `--frontend`, `--backend`, `--restart` (solo reinicia sin rebuild, ~5s)
- Siempre hacer `git commit + push` antes de ejecutar el script

### Email (SMTP Hostinger)
- `SMTP_HOST`: `smtp.hostinger.com` | `PORT`: `465` | `SECURE`: true
- `SMTP_USER`: `info@pruebalo.wilkiedevs.com` | `SMTP_PASS`: `Travis2305*`

### Pagos Wompi
- `WOMPI_PUBLIC_KEY`: `pub_test_3X84dh5ArV79atO6WwNFznjK3kv45JI2`
- `WOMPI_PRIVATE_KEY`: `prv_test_ZrBx84WuuB6V7NDPf7Ed9XyRYhg77J1s`
- `WOMPI_EVENTS_SECRET`: `test_events_ywYgTECX1VdqCmLiGPxeUYXzaJqIAVsg`

### MinIO (almacenamiento de imágenes)
- `ENDPOINT`: `https://minio.wilkiedevs.com` | `BUCKET`: `images`
- `ACCESS_KEY`: `Wilkiedevs` | `SECRET_KEY`: `Travis2305*`
- Imágenes públicas: `https://minio.wilkiedevs.com/images/{path}`

### n8n (workflows de IA)
- Solo interactuar con workflows autorizados (ver sección "Workflows n8n" más abajo)
- `N8N_API_KEY`: ver `backend/.env`
- `N8N_BEARER_TOKEN`: `Travis2305**`
- Webhook principal: `https://n8n.wilkiedevs.com/webhook/tryon`

### GitHub
- `GITHUB_TOKEN`: `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`
- `GITHUB_REPO`: `https://github.com/depper-IA/virtual-tryon.git`

### Admin del sistema
- `SUPERADMIN_EMAIL`: `info.samwilkie@gmail.com` | `PASS`: `Travis2305*`
- Login: `POST https://api.pruebalo.wilkiedevs.com/api/admin/auth/login`

---

---

## Accesos

| Recurso | Valor |
|---|---|
| VPS IP | `31.220.18.39` |
| VPS usuario | `root` |
| VPS contraseña | `Travis18456916#` |
| SSH método | Python + paramiko |
| GitHub repo | `https://github.com/depper-IA/virtual-tryon` |
| GitHub token | `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` |
| Superadmin email | `info.samwilkie@gmail.com` |
| Superadmin pass | `Travis2305*` |
| Supabase URL | `https://vkdooutklowctuudjnkl.supabase.co` |
| MinIO endpoint | `https://minio.wilkiedevs.com` |
| MinIO user | `Wilkiedevs` |
| MinIO pass | `Travis2305*` |
| MinIO bucket | `images` (acceso público de lectura) |

---

## URLs de Producción

| Servicio | URL |
|---|---|
| Frontend | `https://pruebalo.wilkiedevs.com` |
| Backend API | `https://api.pruebalo.wilkiedevs.com` |
| MinIO | `https://minio.wilkiedevs.com` |
| n8n | corre en el mismo VPS — no reiniciar |

## Rutas del Frontend (actualizadas 16/03/2026)

| Ruta | Descripción |
|---|---|
| `/sitio/[brandSlug]` | Mini-landing pública de cada marca (ruta oficial) |
| `/pruebalo/[brandSlug]` | Ruta anterior — sigue existiendo por compatibilidad |
| `/dashboard/mi-pagina` | Formulario de configuración de mini-landing (marca) |
| `/admin/brands` | Panel admin — toggle `has_landing_page` por marca |

---

## Estructura en el VPS

```
/root/
├── docker-compose.yml              ← Traefik + n8n + redis + minio (NO tocar)
├── virtual-tryon/
│   ├── docker-compose.backend.yml
│   ├── docker-compose.frontend.yml
│   ├── backend/                    ← código backend (sin subcarpeta Mostrador_wilkiedevs)
│   └── frontend/                   ← código frontend
```

**Contenedores del proyecto:**
- `virtual-tryon-backend`
- `virtual-tryon-frontend`

**Estructura local (repo):**
```
Mostrador_wilkiedevs/
├── backend/
├── frontend/
├── scripts/          ← scripts Python para deploy/sync
└── CONTEXT.md        ← este archivo
```

---

## Comandos de Rebuild / Deploy

### Script principal (recomendado)
```bash
python scripts/_deploy_now.py              # detecta qué cambió, usa caché Docker (rápido)
python scripts/_deploy_now.py --no-cache   # rebuild completo sin caché (usar cuando cambia package.json)
python scripts/_deploy_now.py --backend    # solo backend
python scripts/_deploy_now.py --frontend   # solo frontend
```

### Backend manual
```bash
cd /root/virtual-tryon
docker compose -f docker-compose.backend.yml build --no-cache
docker compose -f docker-compose.backend.yml up -d
```

### Frontend
```bash
cd /root/virtual-tryon
docker compose -f docker-compose.frontend.yml build --no-cache
docker compose -f docker-compose.frontend.yml up -d
```

### Ver logs en tiempo real
```bash
docker logs -f virtual-tryon-backend
docker logs -f virtual-tryon-frontend
```

### Restart sin rebuild
```bash
docker compose -f docker-compose.backend.yml restart
docker compose -f docker-compose.frontend.yml restart
```

---

## Flujo de Deploy

1. Editar archivos localmente en `Mostrador_wilkiedevs/`
2. Commit + push a GitHub (`main`)
3. En VPS: `git pull` dentro de `/root/virtual-tryon/`
4. Rebuild del servicio afectado (backend y/o frontend)
5. Verificar con curl o en browser

### Git pull en VPS
```bash
cd /root/virtual-tryon && git pull origin main
```

---

## Endpoints de Testing

### Verificar que el backend responde
```bash
curl -s -w '\nHTTP: %{http_code}' https://api.pruebalo.wilkiedevs.com/health
```
Esperado: `{"status":"ok"}` con HTTP 200

### Verificar ruta /api/upload (debe dar 401, no 404)
```bash
curl -s -w '\nHTTP: %{http_code}' https://api.pruebalo.wilkiedevs.com/api/upload \
  -X POST -H 'Content-Type: application/json' -d '{}'
```
Esperado: HTTP 401

### Verificar ruta /api/products/upload (debe dar 401, no 404)
```bash
curl -s -w '\nHTTP: %{http_code}' https://api.pruebalo.wilkiedevs.com/api/products/upload \
  -X POST -H 'Content-Type: application/json' -d '{}'
```
Esperado: HTTP 401

### Verificar ruta /api/upload/selfie (debe dar 401 con token inválido)
```bash
curl -s -w '\nHTTP: %{http_code}' https://api.pruebalo.wilkiedevs.com/api/upload/selfie \
  -X POST -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer token-invalido' -d '{}'
```
Esperado: HTTP 401 — si da 404, el backend no está actualizado

### Login superadmin (ruta correcta confirmada 16/03/2026)
```bash
curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"info.samwilkie@gmail.com","password":"Travis2305*"}'
```
Nota: la ruta es `/api/admin/auth/login`, NO `/api/admin/login`

### Listar marcas (requiere token de admin)
```bash
curl -s https://api.pruebalo.wilkiedevs.com/api/admin/brands \
  -H 'Authorization: Bearer <token>'
```
- Devuelve array con campos: `id`, `name`, `slug`, `plan`, `subscription_status`, `stats.productsCount`
- Campo de estado activo: `subscription_status: "active"` (NO `is_active`)
- Marcas con productos: filtrar por `stats.productsCount > 0`
- Marca de prueba con productos: `wilkie-devs` (3 productos)

### Config pública del probador (sin auth)
```bash
curl -s https://api.pruebalo.wilkiedevs.com/api/pruebalo/wilkie-devs
```
- Devuelve `brand` + `products[]` con campos: `id`, `name`, `image_url`, `category`

### Webhook n8n Virtual Try-On
```bash
curl -s -X POST https://n8n.wilkiedevs.com/webhook/tryon \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer Travis2305**' \
  -d '{"brand_id":"...","product_id":"...","selfie_base64":"...","product_image_url":"...","prompt":"..."}'
```
- Responde HTTP 200 pero con body vacío (problema pendiente — ver abajo)

### Login superadmin
```bash
curl -s -X POST https://api.pruebalo.wilkiedevs.com/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"info.samwilkie@gmail.com","password":"Travis2305*"}'
```

---

## Variables de Entorno Clave

### Backend `.env` (en VPS: `/root/virtual-tryon/backend/.env`)
```
MINIO_ENDPOINT=https://minio.wilkiedevs.com
MINIO_BUCKET=images
MINIO_ACCESS_KEY=Wilkiedevs
MINIO_SECRET_KEY=Travis2305*
MINIO_PUBLIC_URL=https://minio.wilkiedevs.com
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
CORS_ORIGIN=https://pruebalo.wilkiedevs.com
FRONTEND_URL=https://pruebalo.wilkiedevs.com
```

### Frontend `.env` (en VPS: `/root/virtual-tryon/frontend/.env`)
```
NEXT_PUBLIC_API_URL=https://api.pruebalo.wilkiedevs.com
```

---

## Migraciones SQL

| Archivo | Estado | Descripción |
|---|---|---|
| `backend/migrations/create_trial_campaigns_table.sql` | EJECUTADO (16/03/2026) | Tablas trial_campaigns + trial_registrations + campos en brands |
| `backend/migrations/add_email_verification_to_brands.sql` | EJECUTADO (incluido arriba) | |
| `backend/migrations/add_trial_payment_status.sql` | EJECUTADO (incluido arriba) | |
| `backend/migrations/add_mini_landing_fields.sql` | **EJECUTADO (16/03/2026)** | Campos de mini-landing en tabla brands |
| `backend/migrations/add_product_price_badge.sql` | **EJECUTADO (16/03/2026)** | Campos `price` y `badge` en tabla products; campos nuevos en brands: city_display, national_shipping, whatsapp_message, cta_button_text, rating, total_reviews, landing_template, schedule, slogan |

### Campos en `brands` confirmados en BD:
- `email_verified` BOOLEAN DEFAULT false (usuarios existentes marcados como true)
- `email_verification_token` TEXT nullable
- `trial_payment_status` TEXT nullable
- `trial_end_date` TIMESTAMPTZ nullable
- `trial_generations_limit` INTEGER DEFAULT 30

### Tablas creadas:
- `trial_campaigns` — con RLS habilitado
- `trial_registrations` — con RLS habilitado

---

## Infraestructura Docker

- Traefik maneja SSL (certresolver `mytlschallenge`) y reverse proxy
- Red Docker: `proxy`
- El `docker-compose.yml` en `/root/` maneja: Traefik + n8n + redis + minio
- **NUNCA** hacer `docker compose down` en `/root/` — bajaría n8n y minio

---

## Estado de Datos en BD

### URLs de imágenes de productos (verificado 15/03/2026)
- Todos los productos tienen `image_url` apuntando a MinIO (`https://minio.wilkiedevs.com/images/...`) o placeholders
- Producto "Life Kombucha - Lulo" (`a1a567a9`) tenía URL de WordPress (ya no existía) — reemplazada con placeholder
- El admin debe subir una nueva imagen para ese producto desde el dashboard
- No quedan URLs `wp-content` en la tabla `products`

---

## Notas de Arquitectura

- Upload de imágenes: MinIO vía AWS Signature V4 (sin SDK, solo axios)
- Imágenes públicas: `https://minio.wilkiedevs.com/images/{path}`
- Carpetas en MinIO: `products/` para productos, `temp/` para temporales
- Plan PRO: el usuario puede modificar el slug del widget
- Campañas trial: feature de marketing futuro, no bloquea el registro actual
- Flujo de registro: registro → verificar email → login → checkout (pago directo con tarjeta)
- n8n corre en el mismo VPS — no reiniciar servicios que lo afecten

---

## Scripts Útiles (en `Mostrador_wilkiedevs/scripts/`)

| Script | Uso |
|---|---|
| `sync-and-deploy.py` | Sincroniza archivos locales al VPS vía SFTP y hace rebuild |
| `vps-check-dns-propagation.py` | Verifica propagación DNS |
| `vps-verify-final.py` | Verificación final post-deploy |
| `n8n-patch-tryon.py` | Actualiza nodos de upload en workflows de n8n (WordPress → MinIO) |
| `n8n-manage.py` | Elimina workflows inactivos y lista todos los workflows |
| `n8n-inspect-workflow.py` | Inspecciona nodos de un workflow específico por ID |

Para SSH desde Windows usar Python + paramiko (PowerShell no acepta `&&`, usar `;` o `cwd`).

---

## REGLAS DE ACCESO A n8n — LEER ANTES DE TOCAR CUALQUIER WORKFLOW

> El n8n de este VPS es compartido con otros clientes y proyectos de Wilkiedevs.
> Violar estas reglas puede romper flujos de producción de terceros.

- SOLO se puede leer, modificar o interactuar con workflows que pertenezcan al proyecto SaaS (Virtual Try-On)
- Los únicos workflows autorizados son los listados en la sección "Workflows n8n — Virtual Try-On" más abajo
- PROHIBIDO crear nuevos workflows
- PROHIBIDO modificar cualquier workflow que no esté en la lista autorizada
- PROHIBIDO eliminar workflows (el borrado del duplicado `Ft86NDu6ZJCyOpgD` fue un error — no repetir)
- Antes de cualquier acción en n8n, verificar que el ID del workflow esté en la lista autorizada

---

## Workflows n8n — Virtual Try-On

| ID | Nombre | Estado | Notas |
|---|---|---|---|
| `wPLypk7KhBcFLicX` | Virtual Try-On - Flujo Completo | **ACTIVO** | Flujo principal de generación |
| `Ft86NDu6ZJCyOpgD` | Virtual Try-On - Actualizado | ELIMINADO (15/03/2026) | Era duplicado inactivo |

### Nodos actualizados en `wPLypk7KhBcFLicX` (15/03/2026):
- **Subir Selfie Temporal** → `POST https://api.pruebalo.wilkiedevs.com/api/upload/selfie` con `Authorization: Bearer Travis2305**`, body `{image_base64, filename: "selfie.jpg"}`
- **Subir Imagen Final** → misma URL, body `{image_base64, filename: "result.jpg"}`
- **Eliminar Selfie Temporal** → convertido a `NoOp` (MinIO no requiere delete explícito)

---

## Workflows n8n — Otros relevantes al proyecto

| ID | Nombre | Estado | Webhook path |
|---|---|---|---|
| `ZjVTV3QxoPEi60GX` | Describir con IA | **ACTIVO** | `descriptor` |

### Workflow "Describir con IA" (`ZjVTV3QxoPEi60GX`):
- Webhook path: `descriptor` → URL completa: `https://n8n.wilkiedevs.com/webhook/descriptor` (o vía IP interna)
- Nodos: Webhook → Extraer parámetros → Analyze an image (Google Gemini) → Construir prompt enriquecido → Formatear respuesta → Respond to Webhook
- Función: recibe imagen, la analiza con Gemini y devuelve descripción enriquecida

---

## Endpoints Backend Registrados

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/health` | ninguna | Health check del sistema |
| `POST` | `/api/auth/register` | ninguna | Registro de marca |
| `POST` | `/api/auth/login` | ninguna | Login de marca |
| `POST` | `/api/admin/login` | ninguna | Login de superadmin |
| `GET` | `/api/brands/me` | JWT marca | Datos de la marca autenticada |
| `PATCH` | `/api/brands/me` | JWT marca | Actualizar configuración de marca |
| `GET` | `/api/products` | JWT marca | Listar productos |
| `POST` | `/api/products` | JWT marca | Crear producto |
| `PUT` | `/api/products/:id` | JWT marca | Editar producto |
| `DELETE` | `/api/products/:id` | JWT marca | Eliminar producto (soft) |
| `POST` | `/api/upload` | JWT marca | Subir imagen a MinIO |
| `POST` | `/api/upload/selfie` | Bearer `N8N_BEARER_TOKEN` | Subir selfie temporal (para n8n) |
| `GET` | `/api/pruebalo/:brandSlug` | ninguna | Config pública del probador |
| `POST` | `/api/pruebalo/:brandSlug/generate` | ninguna | Generar try-on |
| `GET` | `/api/trial/status` | ninguna | Estado público de campaña trial |
| `GET` | `/api/usage/stats` | JWT marca | Estadísticas de uso |
| `GET` | `/api/brands/subscription` | JWT marca | Estado de suscripción |
| `GET` | `/api/admin/stats` | JWT admin | Estadísticas globales |
| `GET` | `/api/admin/brands` | JWT admin | Listar marcas |
| `PATCH` | `/api/admin/brands/:id/plan` | JWT admin | Cambiar plan de marca |
| `GET` | `/api/admin/subscriptions` | JWT admin | Listar suscripciones |
| `PATCH` | `/api/admin/subscriptions/:brandId/renew` | JWT admin | Renovar suscripción |
| `PATCH` | `/api/admin/subscriptions/:brandId/suspend` | JWT admin | Suspender marca |
| `PATCH` | `/api/admin/subscriptions/:brandId/reactivate` | JWT admin | Reactivar marca |
| `POST` | `/api/admin/subscriptions/:brandId/payment` | JWT admin | Registrar pago manual |
| `GET` | `/api/payment-settings/public` | ninguna | Config pública de medios de pago |
| `POST` | `/api/payments/wompi/webhook` | HMAC Wompi | Webhook de pagos Wompi |
| `POST` | `/api/brands/request-upgrade` | JWT marca | Solicitar upgrade de plan |
| `GET` | `/api/admin/stats/conversion` | JWT admin | Métricas de conversión |
| `GET` | `/api/admin/trial-campaign` | JWT admin | Listar campañas trial |
| `POST` | `/api/admin/trial-campaign` | JWT admin | Crear campaña trial |
| `PATCH` | `/api/admin/trial-campaign/:id` | JWT admin | Activar/desactivar campaña |

---

## Correcciones Aplicadas

| Fecha | Componente | Problema | Fix |
|---|---|---|---|
| 15/03/2026 | n8n `wPLypk7KhBcFLicX` | Nodos "Subir Selfie/Imagen" apuntaban a WordPress | Actualizados a `https://api.pruebalo.wilkiedevs.com/api/upload/selfie` |
| 15/03/2026 | n8n `wPLypk7KhBcFLicX` | Nodo "Subir Imagen Final" usaba `$json.image_base64` | Corregido a `$json.generated_image_base64` (mismatch de campo) |
| 15/03/2026 | Supabase `products` | Producto "Life Kombucha - Lulo" tenía URL de WordPress (404) | Reemplazada con placeholder — admin debe subir imagen real |
| 16/03/2026 | `frontend` (25+ archivos) | Fallbacks `localhost:3001` / `localhost:3000` en código fuente | Reemplazados por URLs de producción |
| 16/03/2026 | `backend/.env` | `FRONTEND_URL=http://localhost:3000` | Corregido a `https://pruebalo.wilkiedevs.com` |
| 16/03/2026 | `audit.service.ts` | `'brand.landing_page_toggle'` no era `AuditAction` válido | Agregado al tipo `AuditAction` |
| 16/03/2026 | `mi-pagina/page.tsx` | `authService` usado sin importar | Agregado import de `auth.service` |
| 16/03/2026 | Ruta pública del probador | `/pruebalo/[brandSlug]` → `/sitio/[brandSlug]` | Nueva carpeta `sitio/[brandSlug]`, ruta anterior sigue activa |
| 16/03/2026 | `MiniLanding.tsx` | Template básico sin sección "Cómo funciona" ni FAB WhatsApp | Rediseño completo: hero mejorado, sección pasos, FAB flotante WhatsApp |
| 16/03/2026 | `ProductForm.tsx` | Sin campos `price` y `badge` | Agregados: input precio COP + selector badge (nuevo/top/oferta) |
| 16/03/2026 | `ProductList.tsx` | Sin precio ni badge en cards | Muestra precio formateado COP y badge con color según tipo |
| 16/03/2026 | `mi-pagina/page.tsx` | Sin campos nuevos de marca | Agregados: slogan, city_display, national_shipping, whatsapp_message, cta_button_text, landing_template |
| 16/03/2026 | `brands.controller.ts` | No aceptaba campos nuevos de mini-landing | Agregados todos los campos nuevos al PATCH /api/brands/me |
| 16/03/2026 | `brands.service.ts` | `UpdateBrandDto` sin campos nuevos | Extendido con city_display, national_shipping, whatsapp_message, cta_button_text, rating, total_reviews, landing_template, schedule, slogan |
| 16/03/2026 | `MiniLanding.tsx` | Un solo template | Dos templates: `classic` (hero + pasos + catálogo) y `editorial` (header sticky + cover + stats bar + layout 2 columnas + panel probador sticky) |

---

## Problema Pendiente — Webhook n8n devuelve body vacío

**Detectado:** 16/03/2026  
**Síntoma:** `POST https://n8n.wilkiedevs.com/webhook/tryon` responde HTTP 200 con body vacío `""`  
**Consecuencia:** El backend recibe respuesta vacía, no puede parsear `imageUrl`, lanza error 502  
**Causa probable:** El nodo "Respond to Webhook" del workflow `wPLypk7KhBcFLicX` no está configurado correctamente para devolver el JSON con `imageUrl`  
**Pendiente:** Inspeccionar y corregir el nodo "Respond to Webhook" en el workflow autorizado  
**Script de diagnóstico:** `scripts/inspect-respond-node.py`

### Flujo esperado del webhook (para referencia al corregir):
```
Webhook recibe → procesa con Gemini → sube imagen a MinIO → responde:
{
  "success": true,
  "imageUrl": "https://minio.wilkiedevs.com/images/temp/tryon-xxx.jpg"
}
```

---

## Rutas y Datos Confirmados en Tests (16/03/2026)

| Dato | Valor confirmado |
|---|---|
| Login admin | `POST /api/admin/auth/login` con `{"email","password"}` |
| Marca de prueba | slug `wilkie-devs`, 3 productos activos |
| Producto de prueba | "Bolso Nike Verde" ID `ee5bf4ec-da9b-4cd5-b8da-2484797d0a71` |
| Imagen producto | `https://minio.wilkiedevs.com/images/products/1773627349562-dca0d866bbf3.jpg` |
| n8n IP interna | `172.19.0.4` (puede cambiar — obtener con `docker inspect root-n8n-1`) |
| Variables backend OK | `N8N_WEBHOOK_URL`, `N8N_BEARER_TOKEN`, `N8N_API_KEY` correctamente configuradas en VPS |
| Endpoint generate | Espera `multipart/form-data` con campos `productId` (texto) y `selfie` (archivo) |


# Reglas Importantes del Proyecto

## Gestión de Workflows de n8n

### ⚠️ CRÍTICO: No Crear Nuevos Nodos sin Consentimiento

**REGLA:** No crear, importar ni modificar workflows de n8n sin el consentimiento explícito del usuario.

**Razón:** Los workflows de n8n pueden tener configuraciones específicas, credenciales y paths de webhook que no deben ser duplicados o modificados sin supervisión.

**Workflows Activos:**
- **Virtual Try-On** (`wPLypk7KhBcFLicX`) — webhook: `https://n8n.wilkiedevs.com/webhook/tryon`
  - Modelo aprobado para generación de imágenes: `google/gemini-2.5-flash-image` (Nano Banana, ~$0.039/imagen)
- **Describir con IA** (`ZjVTV3QxoPEi60GX`) — webhook: `https://n8n.wilkiedevs.com/webhook/descriptor`
  - Modelo aprobado para visión/análisis: `google/gemma-3-27b-it:free` (gratuito, vision, 131K ctx)
  - Prompt configurado para devolver texto plano (sin markdown, sin asteriscos, sin títulos)
- **Acción permitida:** Solo actualizar los workflows existentes si el usuario lo solicita explícitamente

### Acciones Permitidas sin Consentimiento

1. ✅ Leer configuración de workflows existentes
2. ✅ Crear scripts de prueba para webhooks
3. ✅ Actualizar documentación
4. ✅ Actualizar código del backend que consume el webhook
5. ✅ Crear archivos JSON de workflows como respaldo (sin importar)

### Acciones que Requieren Consentimiento Explícito

1. ❌ Crear nuevos workflows en n8n
2. ❌ Importar workflows a n8n
3. ❌ Activar/desactivar workflows
4. ❌ Modificar nodos de workflows existentes
5. ❌ Cambiar paths de webhooks
6. ❌ Modificar credenciales de n8n

## ⛔ CRÍTICO: Uso de APIs y Modelos de IA — Solo Versiones Gratuitas

**REGLA ABSOLUTA:** Está TOTALMENTE PROHIBIDO usar modelos de IA de pago o APIs con costo sin consentimiento explícito del usuario.

**Esto aplica a:**
- Modelos de Google Gemini (usar solo `gemini-1.5-flash` o `gemini-2.0-flash` en tier gratuito, NUNCA `gemini-1.5-pro` ni modelos de pago)
- OpenRouter: usar solo modelos con sufijo `:free` (ej. `google/gemini-2.0-flash-exp:free`), NUNCA modelos sin ese sufijo
- OpenAI: PROHIBIDO usar sin autorización explícita (todos son de pago)
- Anthropic/Claude: PROHIBIDO usar sin autorización explícita
- Cualquier otra API de IA con costo por token o por llamada

**En n8n específicamente:**
- Al configurar nodos de IA, verificar siempre que el modelo seleccionado sea gratuito
- Si hay duda sobre si un modelo tiene costo, preguntar antes de usarlo
- No asumir que un modelo es gratuito por estar disponible en la lista

**Consecuencia de incumplimiento:** Genera costos no autorizados al usuario. Esto es inaceptable.

---