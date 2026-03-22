# LOOKITRY - MASTER MEMORY CONTEXT

> Este es el ÚNICO archivo maestro de memoria para todas las interfaces de IA (Kiro, Gemini CLI, Antigravity, Cursor).
> Reemplaza todo el mar de documentos sueltos que existían antes. ¡Léelo antes de tocar rutas principales o lógicas de negocio!

## 1. SKILLS & PROCEDIMIENTOS OBLIGATORIOS
- **Diseño UI/UX (Pro Max)**: Aplicar SIEMPRE (`.agent/skills/ui-ux-pro-max/SKILL.md`) a cualquier componente frontend. Lookitry debe sentirse premium.
- **Testing & QA**: Referir a (`.gemini/skills/testing/SKILL.md`) al tocar lógicas de pago (Wompi) o Try-On (n8n).
- **Optimización de Desarrollo (NUEVO)**: Referir a (`.agent/skills/dev-optimization/SKILL.md`) para flujos ultra rápidos y ahorro de créditos.



============================================================
# END SECTION -- BEGIN: CONTEXT.md
============================================================

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


============================================================
# END SECTION -- BEGIN: CONTEXTO_PROYECTO.md
============================================================

# Virtual Try-On — Contexto del Proyecto

## Qué es

Virtual Try-On es un SaaS B2B que permite a marcas colombianas ofrecer un probador virtual de ropa y accesorios impulsado por IA. El cliente final de la marca sube una selfie, elige un producto y la IA genera una imagen mostrando cómo le quedaría.

El negocio es simple: la marca paga una suscripción mensual y obtiene un probador listo para usar, sin necesidad de desarrollar nada propio.

---

## Servidores en desarrollo

| Servicio  | URL                      |
|-----------|--------------------------|
| Frontend  | http://localhost:3000    |
| Backend   | http://localhost:3001    |
| n8n (IA)  | https://n8n.wilkiedevs.com |
| Supabase  | https://vkdooutklowctuudjnkl.supabase.co |

---

## Estructura del proyecto

```
Mostrador_wilkiedevs/
├── frontend/          # Next.js 14 + TypeScript + TailwindCSS
│   └── src/
│       ├── app/       # Páginas (App Router)
│       └── components/
└── backend/           # Express + TypeScript
    └── src/
        ├── controllers/
        ├── services/
        ├── routes/
        └── middleware/
```

---

## Páginas principales (Frontend)

| Ruta                        | Descripción                                      |
|-----------------------------|--------------------------------------------------|
| `/`                         | Landing page — página de venta principal         |
| `/planes`                   | Comparativa de planes con selector de meses      |
| `/register`                 | Registro de nueva marca (con trial si hay campaña activa) |
| `/login`                    | Login de marca                                   |
| `/dashboard`                | Panel de la marca (productos, configuración, uso)|
| `/dashboard/subscription`   | Estado de suscripción e historial de pagos       |
| `/pruebalo/[brandSlug]`     | Probador virtual público del cliente final       |
| `/embed/[brandSlug]`        | Versión embebible del probador (iframe)          |
| `/pago-exitoso`             | Confirmación de pago con Wompi                   |
| `/registro-pro`             | Registro post-pago para visitantes que compraron Pro |
| `/admin/login`              | Login del administrador del sistema              |
| `/admin/dashboard`          | Estadísticas globales del sistema                |
| `/admin/brands`             | Gestión de marcas                                |
| `/admin/subscriptions`      | Gestión de suscripciones                         |
| `/admin/trial-campaign`     | Control de campañas de trial gratuito            |

---

## Flujo completo de la aplicación

### 1. Visitante llega a la landing (`/`)

La landing tiene:
- Hero con CTA "Empezar gratis" → `/register` y "Ver planes" → `/planes`
- Sección "Cómo funciona" (3 pasos: sube foto, elige producto, ve resultado)
- Features destacados (velocidad, sin instalación, personalizable)
- Testimonios de clientes
- Sección de precios resumida con botón "Contratar Pro" → Wompi checkout directo
- CTA final con ambas opciones

El botón "Contratar Pro" llama a `GET /api/payments/wompi/config` para obtener la firma de integridad y abre el widget de Wompi directamente en la página, sin redirigir.

---

### 2. Registro de marca (`/register`)

Al cargar el formulario:
1. El frontend consulta `GET /api/trial/status` para saber si hay campaña de trial activa
2. Si hay campaña activa → muestra banner verde "Prueba gratis por X días"
3. El frontend genera un fingerprint del dispositivo con `@fingerprintjs/fingerprintjs`
4. El usuario completa: nombre de marca, slug (auto-generado desde el nombre), email, contraseña

Al enviar:
- `POST /api/auth/register` con `{ name, email, password, slug, fingerprint }`
- El backend extrae la IP del request
- Si hay campaña activa: verifica IP y fingerprint contra `trial_registrations` (últimos 30 días)
  - Si hay abuso → responde `429 TRIAL_ABUSE` → frontend muestra enlace a `/planes`
  - Si no hay abuso → crea cuenta con `trial_end_date` y `trial_generations_limit = 30`
- Si no hay campaña activa → crea cuenta sin trial (créditos = 0)
- Guarda JWT en `localStorage` como `token` y `brandToken`
- Redirige a `/dashboard`

---

### 3. Dashboard de la marca (`/dashboard`)

El dashboard muestra:
- Uso del mes: generaciones usadas vs límite del plan
- Productos activos vs límite del plan
- Badge de suscripción en el header (verde/amarillo/rojo según días restantes)
- Si está en trial: badge "Prueba gratuita — X días restantes"
- Si la suscripción está suspendida: modal bloqueante con instrucciones de renovación

Secciones del dashboard:
- **Productos**: crear, editar y eliminar productos con imagen de referencia
- **Configuración**: logo, colores, template del widget, texto del botón (Pro), mensaje de bienvenida (Pro)
- **Uso**: estadísticas detalladas con barras de progreso
- **Suscripción**: estado, historial de pagos, botón de renovación

---

### 4. Probador virtual público (`/pruebalo/[brandSlug]`)

Esta página es pública — no requiere login. Es la que la marca comparte con sus clientes.

Flujo del cliente final:
1. Carga configuración de la marca: `GET /api/pruebalo/:brandSlug`
   - Retorna: logo, colores, template, productos activos, buttonText, welcomeMessage
   - Si el slug no existe → página 404
2. El cliente sube una selfie (JPG/PNG/WEBP, máx 5MB) con drag & drop o selector
3. Elige el producto que quiere probarse del grid
4. Confirma → `POST /api/pruebalo/:brandSlug/generate` con la selfie en base64
5. El backend:
   - Verifica límites del plan (generaciones mensuales y por hora)
   - Crea registro en `generations` con estado PENDING
   - Envía a n8n: selfie en base64, URL de imagen del producto, brandId, productId
   - n8n llama a Gemini (OpenRouter) para generar la imagen
   - Sube el resultado a WordPress (`/wp-content/uploads/tryon/`)
   - Actualiza el registro a SUCCESS con la URL de la imagen generada
6. El frontend muestra la imagen resultante con botón de descarga

---

### 5. Widget embebible (`/embed/[brandSlug]`)

Versión del probador optimizada para iframe. La marca obtiene el código de embed desde su dashboard:

```html
<iframe
  src="https://pruebalo.wilkiedevs.com/embed/mi-marca"
  width="100%"
  height="700"
  frameborder="0"
></iframe>
```

Cuando se completa una generación, el widget envía un evento `postMessage` al padre:
```js
{ type: 'PRUEBALO_COMPLETE', imageUrl: '...', productId: '...' }
```

---

### 6. Contratación del Plan Pro (Wompi)

Desde la landing o `/planes`:
1. El usuario hace clic en "Contratar Pro"
2. El frontend llama a `GET /api/payments/wompi/config?plan=PRO&amount=250000`
3. El backend genera una referencia única (`TRYON-{brandId}-{timestamp}`) y la firma de integridad SHA256
4. El frontend abre el widget de Wompi con esos datos
5. El usuario completa el pago con tarjeta
6. Wompi envía webhook a `POST /api/payments/wompi/webhook`
7. El backend verifica la firma HMAC, extrae el `brandId` de la referencia y renueva la suscripción
8. Si el usuario no tenía cuenta → redirige a `/registro-pro` para crear la cuenta post-pago
9. Si ya tenía cuenta → redirige a `/pago-exitoso`

---

### 7. Panel de administración (`/admin`)

Acceso exclusivo del administrador del sistema (credenciales separadas de las marcas).

Funcionalidades:
- **Estadísticas globales**: total de marcas, generaciones, ingresos, tasa de conversión
- **Gestión de marcas**: buscar, filtrar, crear manualmente, editar, ver detalles
- **Gestión de suscripciones**: renovar, suspender, reactivar, cambiar plan, registrar pagos manuales
- **Campañas de trial**: crear campañas con nombre y duración, activar/desactivar, ver historial
- **Reporte de ingresos**: ingresos por mes, desglose por plan, proyección

---

## Sistema anti-abuso de trials

El trial gratuito solo existe cuando el admin activa una campaña desde `/admin/trial-campaign`.

Cuando hay campaña activa:
- Cada registro nuevo recibe `trial_end_date` y 30 créditos de generación
- Se registra la IP y el fingerprint del dispositivo en `trial_registrations`
- Si la misma IP o el mismo dispositivo intenta registrarse de nuevo en 30 días → `429 TRIAL_ABUSE`
- El frontend muestra un mensaje con enlace a `/planes` para contratar directamente

Cuando no hay campaña activa:
- Los registros nuevos crean la cuenta sin trial (créditos = 0)
- La marca debe ser activada manualmente por el admin tras confirmar el pago

---

## Planes

| Característica              | Básico              | Pro                  |
|-----------------------------|---------------------|----------------------|
| Precio                      | $150.000 COP/mes    | $250.000 COP/mes     |
| Productos en el probador    | 5                   | 15                   |
| Generaciones por mes        | 400                 | 1.200                |
| Templates del widget        | Solo Bare           | Minimal, Modern, Bold|
| Texto del botón             | No                  | Si                   |
| Mensaje de bienvenida       | No                  | Si                   |
| Modificar slug del probador | No                  | Si                   |
| Soporte prioritario         | No                  | Si                   |
| Trial gratuito              | 7 días (si hay campaña activa) | No (pago directo) |

Descuentos por pago anticipado:
- 3 meses: 5% de descuento
- 6 meses: 10% de descuento
- 12 meses: 15% de descuento

---

## Stack tecnológico

| Capa         | Tecnología                                      |
|--------------|-------------------------------------------------|
| Frontend     | Next.js 14, TypeScript, TailwindCSS             |
| Backend      | Express, TypeScript, Node.js                    |
| Base de datos| Supabase (PostgreSQL)                           |
| IA           | n8n + OpenRouter (Gemini)                       |
| Almacenamiento | WordPress REST API (plugin propio)            |
| Pagos        | Wompi (Colombia)                                |
| Email        | SMTP Hostinger                                  |
| Auth         | JWT (7 días de expiración)                      |
| Fingerprint  | @fingerprintjs/fingerprintjs                    |

---

## Variables de entorno clave (backend)

```env
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
N8N_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/tryon
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_INTEGRITY_SECRET=test_integrity_...
WOMPI_ENABLED=true
SMTP_HOST=smtp.hostinger.com
FRONTEND_URL=http://localhost:3000
```

---

## Tablas principales en Supabase

| Tabla                    | Descripción                                      |
|--------------------------|--------------------------------------------------|
| `brands`                 | Cuentas de marcas con plan, suscripción y trial  |
| `products`               | Productos de cada marca                          |
| `generations`            | Historial de generaciones de imágenes            |
| `subscription_payments`  | Historial de pagos                               |
| `admins`                 | Credenciales de administradores                  |
| `trial_campaigns`        | Campañas de trial activas/inactivas              |
| `trial_registrations`    | IPs y fingerprints de registros con trial        |
| `admin_notifications`    | Notificaciones internas para el admin            |
| `notification_preferences` | Preferencias de email por marca               |



============================================================
# END SECTION -- BEGIN: API_DOCUMENTATION.md
============================================================

# API Documentation - Virtual Try-On SaaS

Documentación completa de todos los endpoints de la API REST.

**Base URL**: `http://localhost:3001/api` (desarrollo)

**Autenticación**: JWT Bearer Token en header `Authorization: Bearer {token}`

---

## 📑 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Marcas](#marcas)
- [Productos](#productos)
- [Uso](#uso)
- [Analytics](#analytics)
- [Probador Virtual (Público)](#probador-virtual-público)
- [Códigos de Error](#códigos-de-error)

---

## Autenticación

### Registrar Marca

Crea una nueva cuenta de marca en el sistema.

**Endpoint**: `POST /api/auth/register`

**Autenticación**: No requerida

**Request Body**:
```json
{
  "email": "marca@example.com",
  "password": "password123",
  "name": "Mi Marca",
  "slug": "mi-marca"
}
```

**Validaciones**:
- `email`: Debe ser un email válido y único
- `password`: Mínimo 6 caracteres
- `name`: Requerido, nombre de la marca
- `slug`: Requerido, único, formato kebab-case (solo letras minúsculas, números y guiones)

**Response Success (201)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "brand": {
    "id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
    "email": "marca@example.com",
    "name": "Mi Marca",
    "slug": "mi-marca",
    "plan": "BASIC"
  }
}
```

**Response Error (400)**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "El email ya está registrado"
}
```

---

### Iniciar Sesión

Autentica una marca y obtiene un token JWT.

**Endpoint**: `POST /api/auth/login`

**Autenticación**: No requerida

**Request Body**:
```json
{
  "email": "marca@example.com",
  "password": "password123"
}
```

**Response Success (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "brand": {
    "id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
    "email": "marca@example.com",
    "name": "Mi Marca",
    "slug": "mi-marca",
    "plan": "BASIC"
  }
}
```

**Response Error (401)**:
```json
{
  "error": "UNAUTHORIZED",
  "message": "Credenciales inválidas"
}
```

---

## Marcas

### Obtener Datos de Marca

Obtiene la información de la marca autenticada.

**Endpoint**: `GET /api/brands/me`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200)**:
```json
{
  "id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
  "email": "marca@example.com",
  "name": "Mi Marca",
  "slug": "mi-marca",
  "plan": "BASIC",
  "logo": "https://example.com/logo.png",
  "primary_color": "#FF5733",
  "secondary_color": "#FFFFFF",
  "created_at": "2026-03-01T10:00:00.000Z",
  "updated_at": "2026-03-10T15:30:00.000Z"
}
```

---

### Actualizar Configuración de Marca

Actualiza la configuración visual de la marca (logo, colores).

**Endpoint**: `PATCH /api/brands/me`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body** (todos los campos son opcionales):
```json
{
  "name": "Nuevo Nombre de Marca",
  "logo": "https://example.com/nuevo-logo.png",
  "primary_color": "#3498db",
  "secondary_color": "#ecf0f1"
}
```

**Validaciones**:
- `primary_color` y `secondary_color`: Deben ser colores hexadecimales válidos (ej: #FF5733)

**Response Success (200)**:
```json
{
  "id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
  "email": "marca@example.com",
  "name": "Nuevo Nombre de Marca",
  "slug": "mi-marca",
  "plan": "BASIC",
  "logo": "https://example.com/nuevo-logo.png",
  "primary_color": "#3498db",
  "secondary_color": "#ecf0f1",
  "created_at": "2026-03-01T10:00:00.000Z",
  "updated_at": "2026-03-12T16:45:00.000Z"
}
```

**Response Error (400)**:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "El color primario debe ser un hexadecimal válido"
}
```

---

## Productos

### Listar Productos

Obtiene todos los productos activos de la marca autenticada.

**Endpoint**: `GET /api/products`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200)**:
```json
{
  "products": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "brand_id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
      "name": "Camiseta Logo",
      "description": "Camiseta con logo frontal",
      "image_url": "https://example.com/camiseta.jpg",
      "category": "tshirt",
      "is_active": true,
      "created_at": "2026-03-05T12:00:00.000Z",
      "updated_at": "2026-03-05T12:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "brand_id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
      "name": "Hoodie Premium",
      "description": "Hoodie con capucha",
      "image_url": "https://example.com/hoodie.jpg",
      "category": "hoodie",
      "is_active": true,
      "created_at": "2026-03-06T14:30:00.000Z",
      "updated_at": "2026-03-06T14:30:00.000Z"
    }
  ],
  "count": 2,
  "limit": 5
}
```

---

### Crear Producto

Crea un nuevo producto para la marca autenticada.

**Endpoint**: `POST /api/products`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Gorra Snapback",
  "description": "Gorra ajustable con logo bordado",
  "image_url": "https://example.com/gorra.jpg",
  "category": "cap"
}
```

**Validaciones**:
- `name`: Requerido
- `image_url`: Requerido, debe ser una URL válida
- `category`: Requerido
- `description`: Opcional
- Límite de productos según plan (5 para BASIC, 15 para PRO)

**Response Success (201)**:
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "brand_id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
  "name": "Gorra Snapback",
  "description": "Gorra ajustable con logo bordado",
  "image_url": "https://example.com/gorra.jpg",
  "category": "cap",
  "is_active": true,
  "created_at": "2026-03-12T17:00:00.000Z",
  "updated_at": "2026-03-12T17:00:00.000Z"
}
```

**Response Error (403)**:
```json
{
  "error": "LIMIT_EXCEEDED",
  "message": "Has alcanzado el límite de 5 productos para tu plan",
  "limit": 5,
  "current": 5
}
```

---

### Actualizar Producto

Actualiza un producto existente.

**Endpoint**: `PUT /api/products/:id`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**URL Parameters**:
- `id`: UUID del producto

**Request Body** (todos los campos son opcionales):
```json
{
  "name": "Gorra Snapback Edición Limitada",
  "description": "Gorra ajustable con logo bordado - Edición limitada",
  "image_url": "https://example.com/gorra-limited.jpg",
  "category": "cap"
}
```

**Response Success (200)**:
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "brand_id": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
  "name": "Gorra Snapback Edición Limitada",
  "description": "Gorra ajustable con logo bordado - Edición limitada",
  "image_url": "https://example.com/gorra-limited.jpg",
  "category": "cap",
  "is_active": true,
  "created_at": "2026-03-12T17:00:00.000Z",
  "updated_at": "2026-03-12T17:30:00.000Z"
}
```

**Response Error (404)**:
```json
{
  "error": "NOT_FOUND",
  "message": "Producto no encontrado"
}
```

---

### Eliminar Producto

Elimina un producto (soft delete - mantiene generaciones históricas).

**Endpoint**: `DELETE /api/products/:id`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**URL Parameters**:
- `id`: UUID del producto

**Response Success (200)**:
```json
{
  "message": "Producto eliminado exitosamente"
}
```

**Response Error (404)**:
```json
{
  "error": "NOT_FOUND",
  "message": "Producto no encontrado"
}
```

---

## Uso

### Obtener Estadísticas de Uso

Obtiene las estadísticas de uso de la marca autenticada (generaciones y productos).

**Endpoint**: `GET /api/usage/stats`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200)**:
```json
{
  "currentMonth": {
    "generationsUsed": 45,
    "generationsLimit": 400,
    "productsCount": 3,
    "productsLimit": 5
  },
  "percentageUsed": 11.25,
  "resetDate": "2026-04-01T00:00:00.000Z"
}
```

**Descripción de campos**:
- `generationsUsed`: Generaciones exitosas en el mes actual
- `generationsLimit`: Límite mensual según plan
- `productsCount`: Productos activos actuales
- `productsLimit`: Límite de productos según plan
- `percentageUsed`: Porcentaje de generaciones usadas
- `resetDate`: Fecha de reset del contador mensual

---

## Analytics

### Obtener Analytics Completos

Obtiene analytics completos de la marca: generaciones, productos más usados y tendencias mensuales.

**Endpoint**: `GET /api/analytics/overview`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200)**:
```json
{
  "totalGenerations": 127,
  "successfulGenerations": 115,
  "failedGenerations": 12,
  "successRate": 90.55,
  "mostUsedProducts": [
    {
      "productId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "productName": "Camiseta Logo",
      "productImageUrl": "https://example.com/camiseta.jpg",
      "category": "tshirt",
      "totalGenerations": 67,
      "successfulGenerations": 62,
      "lastUsed": "2026-03-12T16:30:00.000Z"
    },
    {
      "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "productName": "Hoodie Premium",
      "productImageUrl": "https://example.com/hoodie.jpg",
      "category": "hoodie",
      "totalGenerations": 48,
      "successfulGenerations": 43,
      "lastUsed": "2026-03-12T15:45:00.000Z"
    }
  ],
  "generationsByMonth": [
    {
      "month": "2025-10",
      "count": 0
    },
    {
      "month": "2025-11",
      "count": 12
    },
    {
      "month": "2025-12",
      "count": 28
    },
    {
      "month": "2026-01",
      "count": 35
    },
    {
      "month": "2026-02",
      "count": 42
    },
    {
      "month": "2026-03",
      "count": 10
    }
  ]
}
```

---

### Obtener Estadísticas de Generaciones

Obtiene solo las estadísticas de generaciones de la marca.

**Endpoint**: `GET /api/analytics/generations`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200)**:
```json
{
  "brandId": "92a6ae1b-48e3-4a7d-8639-8215340704c3",
  "brandName": "Mi Marca",
  "totalGenerations": 127,
  "successfulGenerations": 115,
  "failedGenerations": 12,
  "successRate": 90.55
}
```

---

### Obtener Productos Más Usados

Obtiene los productos más usados ordenados por número de generaciones.

**Endpoint**: `GET /api/analytics/products/most-used`

**Autenticación**: Requerida (JWT)

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters**:
- `limit` (opcional): Número máximo de productos a retornar (default: 10)

**Ejemplo**: `GET /api/analytics/products/most-used?limit=5`

**Response Success (200)**:
```json
{
  "products": [
    {
      "productId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "productName": "Camiseta Logo",
      "productImageUrl": "https://example.com/camiseta.jpg",
      "category": "tshirt",
      "totalGenerations": 67,
      "successfulGenerations": 62,
      "lastUsed": "2026-03-12T16:30:00.000Z"
    },
    {
      "productId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "productName": "Hoodie Premium",
      "productImageUrl": "https://example.com/hoodie.jpg",
      "category": "hoodie",
      "totalGenerations": 48,
      "successfulGenerations": 43,
      "lastUsed": "2026-03-12T15:45:00.000Z"
    }
  ],
  "count": 2
}
```

---

## Probador Virtual (Público)

### Obtener Configuración de Marca

Obtiene la configuración visual y productos de una marca para el probador público.

**Endpoint**: `GET /api/pruebalo/:brandSlug`

**Autenticación**: No requerida (público)

**URL Parameters**:
- `brandSlug`: Slug único de la marca (ej: "mi-marca")

**Ejemplo**: `GET /api/pruebalo/mi-marca`

**Response Success (200)**:
```json
{
  "brand": {
    "name": "Mi Marca",
    "logo": "https://example.com/logo.png",
    "primaryColor": "#FF5733",
    "secondaryColor": "#FFFFFF"
  },
  "products": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Camiseta Logo",
      "imageUrl": "https://example.com/camiseta.jpg",
      "category": "tshirt"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Hoodie Premium",
      "imageUrl": "https://example.com/hoodie.jpg",
      "category": "hoodie"
    }
  ]
}
```

**Response Error (404)**:
```json
{
  "error": "BRAND_NOT_FOUND",
  "message": "Marca no encontrada"
}
```

---

### Generar Try-On

Genera una imagen de try-on virtual usando IA.

**Endpoint**: `POST /api/pruebalo/:brandSlug/generate`

**Autenticación**: No requerida (público)

**Content-Type**: `multipart/form-data`

**URL Parameters**:
- `brandSlug`: Slug único de la marca

**Form Data**:
- `productId`: UUID del producto (string)
- `selfie`: Archivo de imagen (File)

**Validaciones**:
- Archivo: JPG, PNG o WEBP
- Tamaño máximo: 5MB
- Marca debe existir
- Producto debe existir y pertenecer a la marca
- No debe exceder límite mensual de generaciones

**Ejemplo con cURL**:
```bash
curl -X POST \
  http://localhost:3001/api/pruebalo/mi-marca/generate \
  -F "productId=a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -F "selfie=@/path/to/selfie.jpg"
```

**Response Success (200)**:
```json
{
  "success": true,
  "generationId": "d4e5f6a7-b8c9-0123-def1-234567890123",
  "imageUrl": "https://example.com/results/generated-image.jpg",
  "processingTime": 8500
}
```

**Response Error (400) - Archivo Inválido**:
```json
{
  "error": "INVALID_FILE_TYPE",
  "message": "Solo se permiten archivos JPG, PNG o WEBP"
}
```

**Response Error (400) - Archivo Muy Grande**:
```json
{
  "error": "FILE_TOO_LARGE",
  "message": "El archivo no debe superar 5MB"
}
```

**Response Error (404) - Producto No Encontrado**:
```json
{
  "error": "PRODUCT_NOT_FOUND",
  "message": "Producto no encontrado"
}
```

**Response Error (429) - Límite Excedido**:
```json
{
  "error": "LIMIT_EXCEEDED",
  "message": "Has excedido el límite de 400 generaciones mensuales",
  "usage": {
    "used": 400,
    "limit": 400
  }
}
```

**Response Error (502) - Error de Generación**:
```json
{
  "error": "GENERATION_FAILED",
  "message": "Error al generar la imagen. Por favor intenta de nuevo."
}
```

---

## Códigos de Error

### Códigos HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Error de validación |
| 401 | Unauthorized - No autenticado o token inválido |
| 403 | Forbidden - No autorizado o límite excedido |
| 404 | Not Found - Recurso no encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |
| 502 | Bad Gateway - Error en servicio externo (n8n) |

### Códigos de Error Personalizados

| Código | Descripción |
|--------|-------------|
| `VALIDATION_ERROR` | Error de validación de datos |
| `UNAUTHORIZED` | No autenticado o credenciales inválidas |
| `FORBIDDEN` | Operación no permitida |
| `NOT_FOUND` | Recurso no encontrado |
| `BRAND_NOT_FOUND` | Marca no encontrada |
| `PRODUCT_NOT_FOUND` | Producto no encontrado |
| `LIMIT_EXCEEDED` | Límite de plan excedido |
| `INVALID_FILE_TYPE` | Tipo de archivo no permitido |
| `FILE_TOO_LARGE` | Archivo excede tamaño máximo |
| `MISSING_FILE` | Archivo requerido no proporcionado |
| `GENERATION_FAILED` | Error al generar imagen con IA |
| `INTERNAL_ERROR` | Error interno del servidor |

---

## Rate Limiting

La API implementa rate limiting para proteger contra abuso:

- **Endpoints públicos**: 100 requests por 15 minutos por IP
- **Endpoints protegidos**: Sin límite (protegidos por autenticación)

**Response cuando se excede el límite (429)**:
```json
{
  "error": "TOO_MANY_REQUESTS",
  "message": "Demasiadas solicitudes. Por favor intenta de nuevo más tarde.",
  "retryAfter": 900
}
```

---

## Ejemplos de Uso

### Flujo Completo: Registro → Crear Producto → Generar Try-On

#### 1. Registrar Marca

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marca@example.com",
    "password": "password123",
    "name": "Mi Marca",
    "slug": "mi-marca"
  }'
```

Guardar el `token` de la respuesta.

#### 2. Crear Producto

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "name": "Camiseta Logo",
    "description": "Camiseta con logo frontal",
    "image_url": "https://example.com/camiseta.jpg",
    "category": "tshirt"
  }'
```

Guardar el `id` del producto.

#### 3. Generar Try-On (como cliente final)

```bash
curl -X POST http://localhost:3001/api/pruebalo/mi-marca/generate \
  -F "productId={PRODUCT_ID}" \
  -F "selfie=@/path/to/selfie.jpg"
```

---

## Notas Adicionales

- Todos los timestamps están en formato ISO 8601 (UTC)
- Los UUIDs son v4
- Las URLs de imágenes deben ser accesibles públicamente
- El token JWT expira en 7 días
- Los contadores de generaciones se resetean el día 1 de cada mes a las 00:00 UTC



============================================================
# END SECTION -- BEGIN: AUDITORIA_ARQUITECTURA_SEGURIDAD.md
============================================================

# Arquitectura Técnica — Lookitry (Virtual Try-On SaaS)

**Última actualización:** 21 Marzo 2026  
**Estado del build:** ✅ Backend `tsc` — EXIT 0 | ✅ Frontend `next build` — EXIT 0 (61 páginas)

---

## 🏗️ 1. Stack Técnico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express, TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT propio (no Supabase Auth) |
| Almacenamiento | MinIO (`minio.wilkiedevs.com`) |
| Pagos | Wompi (Colombia) + PayPal (USD internacional) |
| IA / Try-On | n8n + OpenRouter (flujo `wPLypk7KhBcFLicX`) |
| Antispam | Cloudflare Turnstile |
| Email | SMTP Hostinger (`smtp.hostinger.com:465`) |
| Deploy | Docker Compose en VPS Hostinger |
| CI/CD | Script Python `scripts/_deploy_now.py` + GitHub |

---

## 🗂️ 2. Estructura de Directorios

```
Mostrador_wilkiedevs/
├── frontend/                    # Next.js 14 App Router
│   ├── src/app/                 # Páginas y API Routes
│   │   ├── (public)/            # Landing, planes, registro, login
│   │   ├── dashboard/           # Área privada de la marca (JWT)
│   │   ├── admin/               # Panel administrativo (Admin JWT)
│   │   ├── pruebalo/[slug]/     # Widget público de try-on
│   │   ├── sitio/[slug]/        # Mini-landing pública (ruta oficial)
│   │   ├── marca/[slug]/        # Variante de mini-landing
│   │   └── embed/[slug]/        # Embed iFrame del widget
│   ├── src/components/
│   │   ├── tryon/               # TryOnWidget, SelfieUploader, ResultDisplay
│   │   ├── mini-landing/        # Templates: Classic, Editorial, Probador, Moderno
│   │   ├── dashboard/           # UpgradeModal, ProductForm, stats
│   │   ├── payments/            # WompiButton
│   │   └── ui/                  # Spinner, componentes base
│   ├── src/services/            # api.ts, auth.service.ts, subscription.service.ts
│   ├── src/hooks/               # useAuth (JWT decode + brand data)
│   ├── src/types/               # index.ts — types globales
│   └── src/utils/               # currency.ts, formatters
│
├── backend/                     # Express API (TypeScript)
│   ├── src/controllers/         # Lógica HTTP por dominio
│   ├── src/routes/              # Definición de rutas Express
│   ├── src/middleware/          # auth.ts, adminAuth.ts, rateLimiter.ts
│   ├── src/config/              # supabase.ts (anon + admin clients)
│   ├── src/services/            # SubscriptionService, WompiService, PaypalService, n8n, MinIO, Email
│   └── src/jobs/                # Cron jobs (cleanup, subscription check)
│
└── scripts/                     # Deploy Python: _deploy_now.py
```

---

## 🔄 3. Flujo de Datos — Backend a Frontend

### 3.1 Autenticación
```
[Browser] POST /api/auth/login
   → auth.controller → AuthService.login()
   → Supabase query brands → bcrypt compare
   → JWT sign (7 días)
   ← { token, brand }

[Frontend] localStorage.setItem('token', ...)
   → useAuth hook (JWT decode en cliente)
   → authMiddleware en cada request (Authorization: Bearer)
```

### 3.2 Flujo de Try-On (Widget Público)
```
[Widget /pruebalo/:slug]
   GET /api/pruebalo/:slug
   → brands + products (solo activos, is_active=true)
   ← { brand: {...}, products: [{id, name, imageUrl, category}] }

[Usuario sube selfie]
   POST /api/pruebalo/:slug/generate (multipart/form-data)
   → Valida límites de plan/trial
   → Sube selfie a MinIO: /temp/selfie-{uuid}.jpg
   → POST n8n webhook (Authorization: Bearer Travis2305**)
      { brand_id, product_id, selfie_url, product_image_url, prompt }
   → n8n: Gemini procesa → resultado MinIO: /results/tryon-{uuid}.jpg
   → n8n responde { success, imageUrl }
   → Guarda en tabla generations (status: SUCCESS)
   ← { generationId, imageUrl, processingTime }
```

### 3.3 Flujo de Pago Wompi
```
[/checkout o /dashboard/checkout]
   GET /api/payments/wompi/checkout-url?plan=PRO&months=1
   → WompiService.generateCheckoutUrl()
   → Construye URL: https://checkout.wompi.co/p/?...
      (public-key, amount-in-cents, currency, reference, integrity-hash)
   ← { checkoutUrl }

[Usuario paga en Wompi]
   POST /api/payments/wompi/webhook
   → Verifica HMAC SHA256 (x-event-checksum header + express.raw)
   → wompi.controller → SubscriptionService.renewSubscription()
   → Actualiza brands: plan, subscription_status, subscription_end_date
   → Inserta subscription_payments
```

### 3.4 Flujo de Pago PayPal
```
[/checkout o /dashboard/checkout]
   GET /api/payments/paypal/checkout-url?amount=150000&plan=BASIC&trm=3900
   → PaypalService.getAccessToken() (OAuth2 PayPal)
   → PaypalService.createOrder() → POST PayPal /v2/checkout/orders
      { amount: { currency_code: 'USD', value: '39' } }
   ← { checkoutUrl } → link "approve" de PayPal

[Usuario aprueba en PayPal]
   POST /api/payments/paypal/capture { orderId }
   → PaypalService.captureOrder(orderId)
   → POST PayPal /v2/checkout/orders/:id/capture
   → SubscriptionService.renewSubscription(brandId, CreatePaymentDto, months, plan)
   → Inserta subscription_payments (currency: 'USD')
```

### 3.5 Flujo de Upgrade con Prorrateo (BASIC → PRO)
```
[/dashboard/checkout?upgrade=true]
   GET /api/payments/wompi/upgrade-preview
   → pricePerDay = precioTotalPagado / díasTotales
   → creditAmount = pricePerDay × díasRestantes
   → amountToPay = max(0, precioNuevoPlan - creditAmount)
   ← { creditAmount, amountToPay, newEndDate }

SI amountToPay = 0:
   POST /api/payments/wompi/apply-free-upgrade
   → Activa PRO inmediatamente
   → subscription_payments: amount=0, payment_method='credit_proration'

SI amountToPay > 0:
   → URL Wompi con monto prorateado → flujo normal
```

---

## 💳 4. Checkouts — Cobertura Wompi + PayPal

| Página | Ruta | Wompi | PayPal | Características |
|--------|------|-------|--------|-----------------|
| Checkout público | `/checkout` | ✅ | ✅ | Cupones, promociones, email visitante, plan selector |
| Checkout dashboard | `/dashboard/checkout` | ✅ | ✅ | Prorrateo upgrade, free-upgrade automático |
| Checkout landing | `/dashboard/checkout-landing` | ✅ | ✅ | Pago único por mini-landing, requiere plan activo |

---

## 🖥️ 5. Mini-Landings — Templates Disponibles

| Template | Slug | Descripción |
|----------|------|-------------|
| `classic` | `TemplateClassic` | Hero + sección pasos + catálogo | 
| `editorial` | `TemplateEditorial` | Estilo revista dark, fullscreen, grayscale hover |
| `probador` | `TemplateProbador` | Enfocado en el widget, sin catálogo adicional |
| `moderno` | `TemplateModerno` | Cards redondas, fondo claro, header sticky |

**Rutas:** `/sitio/[slug]` (oficial) · `/marca/[slug]` · `/pruebalo/[slug]` (legacy)

**Widget en templates:** `<TryOnWidget brandSlug={slug} isEmbed={true} />` — sin prop `initialProduct` (no existe en el componente)

---

## 🗄️ 6. Base de Datos — Tablas Principales

| Tabla | Registros aprox. | Descripción |
|-------|-----------------|-------------|
| `brands` | 54 | Marcas (clientes del SaaS) |
| `products` | 174 | Catálogo de productos por marca |
| `generations` | 14 | Historial de try-ons generados |
| `generation_feedback` | 0 | Feedback de calidad |
| `subscription_payments` | 1+ | Historial de pagos |
| `pricing_config` | 6 | Precios dinámicos (BASIC, PRO, descuentos, landing) |
| `payment_settings` | 1 | Config Wompi + PayPal (keys, sandbox mode) |
| `coupons` | 0 | Cupones de descuento |
| `promotions` | 0 | Promociones activas |
| `admins` | 2 | Panel admin |
| `admin_notifications` | 16 | Notificaciones sistema |
| `trial_campaigns` | 1 | Configuración de trials |
| `trial_registrations` | 3 | Anti-abuso por IP/fingerprint |

### Campos clave en `brands`
- `plan`: `TRIAL` / `BASIC` / `PRO`
- `subscription_status`: `active` / `expiring_soon` / `expired` / `suspended`
- `has_landing_page`: bool — si tiene mini-landing
- `landing_suspended_at`: timestamptz — si está suspendida
- `widget_template`: `minimal` / `modern` / `bold`
- `landing_template`: `classic` / `editorial` / `probador` / `moderno`

---

## 🔌 7. API Backend — Endpoints Completos

### Auth
| Método | Ruta | Auth |
|--------|------|------|
| POST | `/api/auth/register` | Público + Turnstile |
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/logout` | JWT |
| POST | `/api/auth/forgot-password` | Público |
| POST | `/api/auth/reset-password` | Público |
| GET | `/api/auth/verify-email` | Público |

### Brands & Products
| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/brands/me` | JWT marca |
| PUT | `/api/brands/me` | JWT marca |
| GET | `/api/brands/:slug` | Público |
| GET/POST | `/api/products` | JWT marca |
| PUT/DELETE | `/api/products/:id` | JWT marca |
| POST | `/api/upload` | JWT marca |

### Pagos — Wompi
| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/payments/wompi/checkout-url` | JWT/Público |
| GET | `/api/payments/wompi/upgrade-preview` | JWT |
| POST | `/api/payments/wompi/apply-free-upgrade` | JWT |
| POST | `/api/payments/wompi/webhook` | HMAC Wompi |
| GET | `/api/payment-settings/public` | Público |

### Pagos — PayPal
| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/payments/paypal/checkout-url` | JWT/Público |
| POST | `/api/payments/paypal/capture` | Público |

### Widget Público
| Método | Ruta |
|--------|------|
| GET | `/api/pruebalo/:slug` |
| POST | `/api/pruebalo/:slug/generate` |

### Admin
| Método | Ruta |
|--------|------|
| GET | `/api/admin/stats` |
| GET | `/api/admin/stats/conversion` |
| GET | `/api/admin/brands` |
| GET | `/api/admin/revenue` |
| GET/POST/PUT/DELETE | `/api/admin/coupons` |
| GET/POST/PATCH | `/api/admin/trial-campaign` |
| POST | `/api/admin/auth/login` |

---

## 🔒 8. Seguridad

### Autenticación JWT
- Tokens Bearer verificados en `authMiddleware` (backend)
- Validación contra BD en cada request (marca sigue existiendo)
- Frontend: JWT en `localStorage` — leído por `useAuth` hook en cliente
- Punto de mejora: migrar a HTTP-Only Cookies para prevención XSS nativa

### Webhooks Wompi
- Firma HMAC SHA-256 verificada (`x-event-checksum`)
- `express.raw` para parseo sin alterar el body
- Monto de $100 COP de tokenización ignorado (no activa plan)

### PayPal
- OAuth2 con Client ID + Secret (almacenados en `payment_settings.paypal_client_id/secret`)
- Sandbox mode configurable desde panel admin
- `getOrder()` permite verificar estado antes de capturar

### Rate Limiting
| Tipo | Límite |
|------|--------|
| Global | 1000 req / 15 min |
| Auth | 10 req / 15 min (anti brute-force) |
| Generation | 20 req / 15 min (protege costo IA) |
| Trial | Bloqueo por IP + fingerprint + dominio descartable |

---

## ⚡ 9. ESLint — Qué Significa y Estado Actual

### ¿Qué es ESLint?
ESLint es un **analizador estático de código** (linter) que revisa el código TypeScript/JavaScript en busca de:
- Errores de estilo y convenciones
- Patrones que pueden generar bugs (variables no usadas, `any` implícito, etc.)
- Reglas específicas de React/Next.js (hooks mal usados, imágenes sin `alt`, etc.)

### ¿Qué significa "ESLint failed"?
Cuando el build de Next.js muestra `ESLint failed`, significa que algunas reglas del linter no se cumplen en el código. **No siempre es un error de TypeScript** — puede ser solo una advertencia de estilo. En algunos proyectos, el build falla si ESLint detecta errores; en otros, solo imprime advertencias.

### Error encontrado y corregido: `Failed to load config "next/typescript"`
**Causa:** El `.eslintrc.json` extendía `"next/typescript"`, una configuración que **solo existe en `eslint-config-next` v15+**. Este proyecto usa Next.js 14, donde esa config no está disponible.

**Fix aplicado:**
```diff
- "extends": ["next/core-web-vitals", "next/typescript"]
+ "extends": ["next/core-web-vitals"]
```

`"next/core-web-vitals"` incluye las reglas esenciales de React, accesibilidad y performance para Next.js 14. La validación de TypeScript la hace directamente el compilador `tsc` — ESLint no es estrictamente necesario para eso.

---

## 🚀 10. Deploy

### Script recomendado
```bash
python scripts/_deploy_now.py              # detecta cambios, usa caché Docker
python scripts/_deploy_now.py --no-cache   # rebuild completo
python scripts/_deploy_now.py --backend    # solo backend
python scripts/_deploy_now.py --frontend   # solo frontend
```

### Estructura en VPS
```
/root/virtual-tryon/
├── docker-compose.backend.yml    ← API Express en puerto 3001
├── docker-compose.frontend.yml   ← Next.js en puerto 3000
├── backend/
└── frontend/
```

### Contenedores
- `virtual-tryon-backend` — Express API
- `virtual-tryon-frontend` — Next.js

> ⚠️ NUNCA hacer `docker compose down` en `/root/` — bajaría n8n y MinIO

---

## 📋 11. Estado de Correcciones Aplicadas (21/03/2026)

| Archivo | Error | Fix |
|---------|-------|-----|
| `paypal.routes.ts` | `captureOrder` no existía en controller | → `capturePayment` |
| `payments.routes.ts` | `brandAuthMiddleware` no exportado | → `authMiddleware` |
| `paypal.controller.ts` | `renewSubscription` con 6 args posicionales | → `(brandId, CreatePaymentDto, months, plan)` |
| `paypal.service.ts` | Método `getOrder()` faltaba | → Añadido con GET PayPal `/v2/checkout/orders/:id` |
| `admin/analytics/page.tsx` | `api.get()` devuelve `{data, status}` no el raw | → `const { data } = await api.get<T>(...)` |
| `admin/conversion/page.tsx` | Mismo problema | → Mismo fix |
| `TemplateModerno.tsx` | Prop `initialProduct` no existe en `TryOnWidget` | → Prop eliminada |
| `TemplateEditorial.tsx` | Mismo problema | → Prop eliminada |
| `.eslintrc.json` | `"next/typescript"` no válido en Next.js 14 | → Config removida |



============================================================
# END SECTION -- BEGIN: AUDITORIA_FRONTEND.md
============================================================

# Auditoría Frontend — Lookitry
**Fecha:** 2025-07-07  
**Alcance:** `frontend/src/app/` — páginas públicas, dashboard y panel admin  
**Tipo:** Solo lectura — sin cambios al código

---

## Resumen ejecutivo

| Área                          | OK      | Problemas | Faltantes |
|------|----|-----------|-----------|
| Páginas públicas (existencia) | 13      | 0 | 0 (rutas usan `[brandSlug]` no `[slug]`) |
| Páginas públicas (branding)   | Todas   | 0 | — |
| Dashboard (auth + límites)    | Parcial | 2 | 0 |
| Panel admin (existencia)      | 15      | 0 | 2 |
| Panel admin (variables CSS)   | Parcial | 8 archivos | — |
| Sistema de temas light/dark   | Parcial | 2 | — |

---

## 62.1 — Páginas Públicas

### Existencia de archivos

| Ruta esperada | Ruta real | Estado |
|---------------|-----------|--------|
| `/pruebalo/[slug]/page.tsx` | `/pruebalo/[brandSlug]/page.tsx` | OK (nombre de param distinto) |
| `/marca/[slug]/page.tsx` | `/marca/[brandSlug]/page.tsx` | OK (nombre de param distinto) |
| `/sitio/[slug]/page.tsx` | `/sitio/[brandSlug]/page.tsx` | OK (nombre de param distinto) |
| `/embed/[slug]/page.tsx` | `/embed/[brandSlug]/page.tsx` | OK (nombre de param distinto) |
| Resto de páginas | Coinciden exactamente | OK |

> Nota: El parámetro dinámico se llama `[brandSlug]` en lugar de `[slug]`. No es un problema funcional, pero la tarea de auditoría lo listaba como `[slug]`. Todas las páginas existen.

### Logo (logo.svg vs logo.png)

**Estado: OK**  
No se encontró ninguna referencia a `logo.png` en ninguna página del frontend. Todas usan `/logo.svg`.

### Nombre de marca

**Estado: OK**  
No se encontraron referencias a "VirtualTryOn", "Virtual Try On" ni "Mostrador" en ninguna página.

### Colores hardcodeados en páginas públicas

**Estado: OK**  
No se auditaron colores hardcodeados en páginas públicas (la tarea indica que esto aplica solo a páginas admin).

---

## 62.2 — Dashboard (rutas privadas)

### Protección de autenticación

**Estado: OK**  
El archivo `frontend/src/app/dashboard/layout.tsx` implementa protección correcta:
- Usa `useAuth()` hook
- Si `!isAuthenticated && !isLoading` → `router.push('/login')`
- Todas las páginas del dashboard heredan esta protección del layout

### Precios hardcodeados en checkout

**Estado: PROBLEMA PARCIAL**

#### `dashboard/checkout/page.tsx` — OK con fallback correcto
- Tiene `PLAN_INFO_FALLBACK` con precios hardcodeados (150000 / 250000) como fallback estático
- Carga precios dinámicos desde `pricing_config` de Supabase en `useEffect`
- Si la carga falla, usa el fallback — comportamiento correcto según arquitectura

#### `dashboard/subscription/page.tsx` — PROBLEMA
- **Archivo:** `frontend/src/app/dashboard/subscription/page.tsx`
- **Líneas:** 16-31
- **Problema:** Precios hardcodeados (`price: 150000`, `price: 250000`) en constante `PLAN_INFO` sin carga dinámica desde `pricing_config`
- **Impacto:** Si el admin cambia precios desde `/admin/pricing`, la página de suscripción del dashboard mostrará precios desactualizados
- **Corrección:** Agregar carga dinámica desde Supabase igual que en `dashboard/checkout/page.tsx`

```tsx
// Líneas 15-31 — precios hardcodeados sin carga dinámica
const PLAN_INFO = {
  BASIC: { name: 'Plan Básico', price: 150000, ... },
  PRO:   { name: 'Plan Pro',    price: 250000, ... },
};
```

### Límites de plan

**Estado: OK**  
Los límites correctos están presentes en los componentes relevantes:
- `UpgradeModal.tsx`: "Hasta 5 productos activos", "400 generaciones por mes", "Hasta 15 productos activos", "1.200 generaciones por mes"
- `dashboard/subscription/page.tsx`: Límites correctos en features de cada plan
- `dashboard/checkout/page.tsx`: Límites correctos en `PLAN_INFO_FALLBACK`

---

## 62.3 — Panel Admin

### Existencia de archivos

| Página | Estado |
|--------|--------|
| `admin/dashboard/page.tsx` | OK |
| `admin/brands/page.tsx` | OK |
| `admin/subscriptions/page.tsx` | OK |
| `admin/payments/page.tsx` | OK |
| `admin/revenue/page.tsx` | OK |
| `admin/pricing/page.tsx` | OK |
| `admin/payment-settings/page.tsx` | OK |
| `admin/marketing/promotions/page.tsx` | OK |
| `admin/mini-landings/page.tsx` | OK |
| `admin/analytics/page.tsx` | **FALTANTE** |
| `admin/feedback/page.tsx` | OK |
| `admin/notifications/page.tsx` | OK |
| `admin/health/page.tsx` | OK |
| `admin/configuracion/page.tsx` | OK |
| `admin/admins/page.tsx` | OK |
| `admin/conversion/page.tsx` | **FALTANTE** (carpeta existe pero vacía) |
| `admin/profile/page.tsx` | OK |

### Colores hardcodeados en páginas admin

A continuación se listan los archivos con colores Tailwind hardcodeados que deberían usar variables CSS del sistema de temas.

---

#### `admin/brands/page.tsx` — PROBLEMA GRAVE
Modal "Nueva Marca" (líneas ~778-790) usa clases completamente hardcodeadas sin variables CSS:

```tsx
// Línea 779 — modal con bg-white hardcodeado (rompe modo dark)
<div className="bg-white rounded-lg p-6 max-w-lg ...">

// Línea 781 — texto hardcodeado
<h2 className="text-xl font-bold text-gray-900">Nueva Marca</h2>

// Línea 782 — botón hardcodeado
<button className="text-gray-400 hover:text-gray-600">

// Línea 786 — texto hardcodeado
<p className="text-sm text-gray-600 mb-4">
```

Modal "Ver Detalles" (líneas ~652-660) también usa clases hardcodeadas:
```tsx
// Línea 653 — labels y valores con colores hardcodeados
<p className="text-sm text-gray-600">{label}</p>
<p className="text-sm font-medium text-gray-900">{value}</p>

// Línea 657 — label hardcodeado
<p className="text-sm text-gray-600">Estado de prueba</p>
```

Botón "Cerrar" en modal de productos (línea 770):
```tsx
<button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cerrar</button>
```

**Corrección:** Reemplazar con `style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}` y `style={{ color: 'var(--text-secondary)' }}`.

---

#### `admin/payment-settings/page.tsx` — PROBLEMA
Botón "Guardar" usa `bg-blue-600` en lugar del color de acento del sistema:

```tsx
// Línea 145 — botón con bg-blue-600 hardcodeado
className="... bg-blue-600 text-white ... hover:bg-blue-700 ..."
```

Toggle switch (línea 352) usa `bg-blue-600` activo en lugar de `bg-[#FF5C3A]`:
```tsx
enabled ? 'bg-blue-600' : 'bg-gray-400'
```

**Corrección:** Cambiar `bg-blue-600` → `bg-[#FF5C3A]` y `hover:bg-blue-700` → `hover:bg-[#e04e30]`.

---

#### `admin/subscriptions/page.tsx` — PROBLEMA MENOR
Badges de estado usan clases Tailwind light (`bg-gray-100 text-gray-700`) que no respetan el tema dark:

```tsx
// Línea 93 — badge "suspended" con colores light hardcodeados
suspended: 'bg-gray-100 text-gray-700',

// Línea 99 — fallback con colores light hardcodeados
${map[status] ?? 'bg-gray-100 text-gray-700'}
```

**Nota:** Los badges de estado (active, expiring_soon, expired) también usan `bg-amber-100 text-amber-800` y `bg-red-100 text-red-800` que son colores light. En modo dark se verán con fondo claro sobre fondo oscuro.

---

#### `admin/payments/page.tsx` — PROBLEMA MENOR
Badge "Reembolsado" usa colores light hardcodeados:

```tsx
// Línea 52 — badge con colores light
refunded: { cls: 'bg-gray-100 text-gray-700', ... }

// Línea 226 — fallback con colores light
cls: 'bg-gray-100 text-gray-700'
```

---

#### `admin/health/page.tsx` — PROBLEMA MENOR
Badge "loading" usa colores light hardcodeados:

```tsx
// Línea 28 — estado loading con colores light
loading: 'bg-gray-100 text-gray-500 border-gray-200',
```

---

#### `admin/configuracion/page.tsx` — PROBLEMA MENOR
Badge de campaña usa colores light hardcodeados:

```tsx
// Línea 105 — badge inactiva con colores light
active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
```

---

#### `admin/mini-landings/page.tsx` — PROBLEMA MENOR
Punto de estado "inactiva" usa `bg-gray-400` hardcodeado:

```tsx
// Línea 333 — punto de estado hardcodeado
<span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
```

---

#### `admin/layout.tsx` — PROBLEMA MENOR
El sidebar usa `text-white` hardcodeado en el nombre del usuario y el logo, en lugar de `var(--text-sidebar-active)`:

```tsx
// Línea 113 — nombre de marca en sidebar
<span className="... text-white ...">Look<span>itry</span></span>

// Línea 119 — botón cerrar menú móvil
className="lg:hidden p-1 rounded text-gray-400 hover:text-white"

// Línea 191 — nombre del admin en sidebar
className="block text-sm font-medium text-white truncate ..."
```

> Nota: El sidebar siempre tiene fondo oscuro (`var(--bg-sidebar)` = `#0a0a0a` en ambos temas), por lo que `text-white` es técnicamente correcto aquí. Sin embargo, debería usar `var(--text-sidebar-active)` para consistencia con el sistema de diseño.

---

## 62.4 — Sistema de Temas Light/Dark

### Layout admin (`admin/layout.tsx`)

**Estado: OK**  
- Importa y renderiza `<ThemeToggle />` en el header
- El layout usa `var(--bg-base)`, `var(--bg-header)`, `var(--border-color)`, `var(--shadow-header)` correctamente
- El toggle está disponible en todos los paneles admin

### Variables CSS en `globals.css`

**Estado: PROBLEMA CRÍTICO**

Las variables `--bg-hover` y `--bg-input` se usan en múltiples páginas admin pero **NO están definidas** en `globals.css`:

```css
/* globals.css — variables FALTANTES */
/* --bg-hover  → usada en: subscriptions, payments, notifications, marketing/promotions, health, profile */
/* --bg-input  → usada en: admin/profile/page.tsx */
```

Páginas que usan `var(--bg-hover)`:
- `admin/subscriptions/page.tsx` (líneas 230, 322, 521, 560)
- `admin/payments/page.tsx` (línea 213)
- `admin/notifications/page.tsx` (líneas 417, 466, 477, 529)
- `admin/marketing/promotions/page.tsx` (líneas 174, 291, 486, 569)
- `admin/health/page.tsx` (línea 209)

Páginas que usan `var(--bg-input)`:
- `admin/profile/page.tsx` (línea 58): `background: 'var(--bg-input, var(--bg-hover))'` — tiene fallback a `--bg-hover` pero ambas están sin definir

**Corrección:** Agregar en `globals.css`:

```css
:root {
  /* ... variables existentes ... */
  --bg-hover: #ede9e4;   /* light mode */
  --bg-input: #ffffff;   /* light mode */
}

.dark {
  /* ... variables existentes ... */
  --bg-hover: #1a1a1a;   /* dark mode */
  --bg-input: #0f0f0f;   /* dark mode */
}
```

### ThemeToggle (`components/ui/ThemeToggle.tsx`)

**Estado: OK**  
- Persiste preferencia en `localStorage` con clave `'theme'`
- Aplica/quita clase `dark` en `document.documentElement`
- Funciona correctamente con el sistema de variables CSS de `globals.css`

### Páginas admin que NO respetan el tema (colores hardcodeados críticos)

| Archivo | Problema | Impacto en modo light |
|---------|----------|----------------------|
| `admin/brands/page.tsx` | Modal "Nueva Marca" con `bg-white`, `text-gray-900`, `text-gray-600` | Modal se ve correcto en light pero roto en dark |
| `admin/payment-settings/page.tsx` | Botón guardar `bg-blue-600`, toggle `bg-blue-600` | Color de acento incorrecto en ambos temas |
| `admin/subscriptions/page.tsx` | Badges con `bg-gray-100 text-gray-700` | Fondo claro visible sobre card oscuro en dark |
| `admin/payments/page.tsx` | Badge "Reembolsado" con `bg-gray-100 text-gray-700` | Igual que arriba |
| `admin/health/page.tsx` | Badge "loading" con `bg-gray-100 text-gray-500` | Igual que arriba |
| `admin/configuracion/page.tsx` | Badge inactiva con `bg-gray-100 text-gray-500` | Igual que arriba |

---

## Resumen de acciones requeridas (por prioridad)

### Prioridad ALTA

1. **`globals.css`** — Agregar variables `--bg-hover` y `--bg-input` para ambos temas. Sin esto, múltiples páginas admin tienen fondos `undefined` (se renderizan como transparente).

2. **`admin/brands/page.tsx`** — Modal "Nueva Marca" (línea ~779) usa `bg-white` hardcodeado. En modo dark el modal aparece con fondo blanco sobre overlay oscuro — completamente roto visualmente.

### Prioridad MEDIA

3. **`dashboard/subscription/page.tsx`** — Precios hardcodeados sin carga dinámica desde `pricing_config`. Si el admin cambia precios, esta página no se actualiza.

4. **`admin/payment-settings/page.tsx`** — Botón guardar y toggle usan `bg-blue-600` en lugar del color de acento `#FF5C3A`.

5. **`admin/conversion/page.tsx`** — Página faltante. La carpeta existe pero está vacía.

6. **`admin/analytics/page.tsx`** — Página faltante. No existe la carpeta ni el archivo.

### Prioridad BAJA

7. **Badges de estado** en `subscriptions`, `payments`, `health`, `configuracion` — Usan clases Tailwind light (`bg-gray-100`, `bg-amber-100`, `bg-red-100`) que se ven con fondo claro en modo dark. Reemplazar con variantes con opacidad: `bg-gray-500/15 text-gray-400`, `bg-amber-500/15 text-amber-400`, etc.

8. **`admin/layout.tsx`** — `text-gray-400` en botón cerrar menú móvil. Reemplazar con `style={{ color: 'var(--text-muted)' }}`.

---

## Lo que está bien (no requiere acción)

- Todas las páginas públicas existen y usan `logo.svg`
- No hay referencias a "VirtualTryOn" ni nombres de marca incorrectos
- El nombre de marca `Look<span>itry</span>` se usa correctamente
- El layout del dashboard tiene protección de auth correcta
- `dashboard/checkout/page.tsx` carga precios dinámicos correctamente con fallback
- `UpgradeModal.tsx` carga precios dinámicos correctamente con fallback
- Los límites de plan (BASIC=5/400, PRO=15/1200) son correctos en todos los componentes
- El `ThemeToggle` funciona correctamente
- El layout admin tiene el toggle de tema disponible en todos los paneles
- La mayoría de páginas admin usan variables CSS correctamente para fondos y textos principales



============================================================
# END SECTION -- BEGIN: AUDITORIA_PAGOS_MARZO_2026.md
============================================================

# Auditoría del Sistema de Pagos y Suscripciones — Lookitry
**Fecha:** 19 de marzo de 2026
**Estado:** Crítico / Requiere Acción Inmediata

---

## 1. Resumen de Hallazgos

Se ha detectado que el sistema de pagos presenta fallos estructurales y de configuración que impiden el registro correcto de transacciones, la activación automática de planes y el registro de nuevos usuarios en producción.

### Problemas Críticos Identificados:
1. **Endpoint de Verificación Hardcodeado:** El servicio de Wompi consulta transacciones exclusivamente en el entorno de Sandbox, rompiendo el flujo en Producción.
2. **Invisibilidad de Pagos en Admin:** El backend no expone las transacciones de la tabla `subscription_payments` al panel de administración.
3. **Bloqueo en Registro Post-Pago:** Usuarios existentes que pagan sin estar logueados no pueden activar su plan mediante el flujo `/registro-pro` debido a conflictos de duplicidad de cuenta.
4. **Dependencia del Prorrateo:** La lógica de upgrades depende de registros históricos de pagos que no se están visualizando/verificando correctamente.

---

## 2. Análisis Detallado

### A. Fallo en el Registro del Panel de Administrador
*   **Causa:** El `AdminService` carece de métodos para consultar la tabla `subscription_payments`. Los endpoints actuales (`/api/admin/stats`) solo cuentan el número de marcas por plan, pero no extraen montos ni estados de pago reales.
*   **Consecuencia:** El administrador no puede ver quién ha pagado, cuánto, ni por qué medio.

### B. Fallo en Transición Trial → Básico/Pro (Producción)
*   **Causa:** El método `wompiService.getTransactionByReference` apunta a `https://sandbox.wompi.co`. 
*   **Ubicación:** `backend/src/services/wompi.service.ts`, línea 148.
*   **Consecuencia:** Cuando un usuario paga en producción y llega a `/registro-pro`, el backend intenta verificar el pago en Sandbox. Como el pago no existe allí, devuelve `PAYMENT_REQUIRED` (402), impidiendo que el usuario cree su cuenta a pesar de haber pagado.

### C. Fallo en Upgrades y Prorrateo
*   **Causa:** `SubscriptionService.calculateUpgradeProration` busca el último pago exitoso en la base de datos. Si el pago inicial (Trial → Básico) no se registró correctamente en la tabla `subscription_payments` (debido a fallos en el webhook), el sistema no tiene base para calcular el crédito por días restantes.
*   **Consecuencia:** El usuario termina pagando el precio total del nuevo plan sin recibir el descuento por el tiempo no usado de su plan anterior.

### D. Conflicto de Usuarios "Visitor" vs Existentes
*   **Causa:** Si un usuario con cuenta Trial paga desde la landing pública (sin sesión activa), el sistema le asigna una referencia `visitor_`. Al redirigirlo a `/registro-pro`, el formulario intenta crear una cuenta nueva. 
*   **Consecuencia:** Si el usuario usa su email de siempre, el sistema responde `CONFLICT` (409) porque la cuenta ya existe. El pago queda "huérfano" y la cuenta sigue en Trial.

---

## 3. Hoja de Ruta de Correcciones Recomendadas

### 1. Corregir Entorno de Wompi (Urgente)
Modificar `getTransactionByReference` para usar la URL dinámica según el modo (`testMode`) configurado en `payment_settings`.

### 2. Crear API de Pagos para Admin
Implementar `GET /api/admin/revenue/payments` en el backend que devuelva el contenido de `subscription_payments` con filtros por fecha, marca y estado.

### 3. Mejorar el Webhook de Wompi
Asegurar que `renewSubscription` sea infalible y que, en caso de error, se genere una notificación interna para el administrador en la tabla `admin_notifications` para acción manual.

### 4. Flujo de Activación para Usuarios Logueados
Modificar el checkout para que, si hay una sesión activa, se use siempre el `brandId` real y el webhook active la cuenta inmediatamente sin pasar por `/registro-pro`.

### 5. Resolver Conflicto de Registro Post-Pago
En `registerPostPayment`, si el email ya existe, el sistema debería permitir "vincular" el pago a la cuenta existente tras una verificación de contraseña, en lugar de simplemente fallar por conflicto.

---
**Auditoría realizada por:** Gemini CLI (Senior Frontend/Fullstack Specialist)



============================================================
# END SECTION -- BEGIN: AUDITORIA_SEGURIDAD.md
============================================================

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



============================================================
# END SECTION -- BEGIN: AUDIT_TASKS.md
============================================================

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



============================================================
# END SECTION -- BEGIN: PRICING_ROI_TASKS.md
============================================================

# Plan de Tareas — Dashboard ROI + Precios Dinámicos

> Proyecto: Lookitry (pruebalo.wilkiedevs.com)
> Fecha: 2026-03-18
> Stack: Next.js App Router · TypeScript · Supabase · Tailwind

---

## Contexto y decisiones de diseño

### ¿Dashboard ROI separado o integrado en /admin/revenue?

**Decisión: INTEGRAR en `/admin/revenue` (ampliar la página existente).**

Razones:
- Ya existe `/admin/revenue/page.tsx` con estructura base (ingresos por plan, proyección, gráfico mensual)
- Crear una página nueva duplicaría lógica y navegación
- La página actual le falta: costos operativos, churn, ARPU, margen bruto, % meta, punto de equilibrio
- Se agrega una pestaña "ROI / Metas" dentro de la misma página

### ¿Precios en archivo JSON o en Supabase?

**Decisión: Tabla Supabase `pricing_config` + API route Next.js + caché ISR.**

Razones:
- Ya usamos Supabase para todo lo demás
- El panel admin ya existe — solo agregar una sección nueva
- ISR (revalidate: 3600) garantiza que la landing refleje cambios sin rebuild
- No rompe SEO (los precios se renderizan en servidor)

---

## PARTE 1 — Dashboard ROI y Metas (ampliar /admin/revenue)

### Tabla modelo — columnas exactas

| Columna | Tipo | Fórmula / Fuente |
|---|---|---|
| Mes | string | `YYYY-MM` |
| Clientes Básico | int | Supabase `subscriptions` WHERE plan=BASIC AND status=active |
| Clientes Pro | int | Supabase `subscriptions` WHERE plan=PRO AND status=active |
| Mini-landings vendidas | int | Supabase `payments` WHERE plan=LANDING AND mes=X |
| Ingresos Básico | COP | clientes_basic × 150.000 |
| Ingresos Pro | COP | clientes_pro × 250.000 |
| Ingresos Landing | COP | landings × 650.000 |
| Ingresos Totales | COP | sum de los 3 anteriores |
| Costo OpenRouter | COP | generaciones_mes × costo_por_gen (editable) |
| Costo VPS | COP | fijo mensual (editable, ~$37.000 COP aprox) |
| Costo Dominio | COP | anual / 12 (editable) |
| Costos Totales | COP | OpenRouter + VPS + Dominio |
| Margen Bruto | COP | Ingresos Totales − Costos Totales |
| Margen Bruto % | % | (Margen / Ingresos) × 100 |
| ROI Mensual | % | (Ingresos − Costos) / Costos × 100 |
| ARPU | COP | Ingresos Totales / (clientes_basic + clientes_pro) |
| Nuevos clientes | int | clientes que entraron ese mes |
| Churn | int | clientes que cancelaron ese mes |
| % Meta cumplida | % | Ingresos Totales / 1.400.000 × 100 |

### Fórmulas clave

```
ROI mensual        = (Ingresos - Costos) / Costos × 100
Punto equilibrio   = Costos Totales / precio_plan
ARPU               = Ingresos / (clientes_basic + clientes_pro)
Margen bruto %     = (Ingresos - Costos) / Ingresos × 100
% meta             = Ingresos / 1.400.000 × 100
Proyección 3 meses = promedio últimos 3 meses × (1 + tasa_crecimiento)
```

### Ejemplo ficticio — 4 Básico + 4 Pro + 1 mini-landing

| Concepto | Valor |
|---|---|
| Ingresos Básico | 4 × $150.000 = $600.000 |
| Ingresos Pro | 4 × $250.000 = $1.000.000 |
| Ingresos Landing | 1 × $650.000 = $650.000 |
| **Ingresos Totales** | **$2.250.000** |
| Costo OpenRouter (est.) | $120.000 (4.800 gen × $25/gen) |
| Costo VPS | $37.000 |
| Costo Dominio | $5.000 |
| **Costos Totales** | **$162.000** |
| **Margen Bruto** | **$2.088.000** |
| Margen Bruto % | 92,8% |
| ROI Mensual | 1.288% |
| ARPU | $2.250.000 / 8 = $281.250 |
| % Meta (1.4M) | 160,7% — META SUPERADA |
| Punto equilibrio Básico | $162.000 / $150.000 = 1,08 → 2 clientes |
| Punto equilibrio Pro | $162.000 / $250.000 = 0,65 → 1 cliente |

---

## PARTE 2 — Precios Dinámicos

### Estructura tabla Supabase `pricing_config`

```sql
CREATE TABLE pricing_config (
  id            text PRIMARY KEY,          -- 'basic', 'pro', 'mini_landing', 'meta', 'costs'
  data          jsonb NOT NULL,
  updated_at    timestamptz DEFAULT now()
);
```

Filas iniciales:
- `basic` → precio, límites, features, subtítulo, botón
- `pro` → ídem
- `mini_landing` → precio único, precio original, descuento %, features
- `meta` → meta_mensual_cop, trm_referencia
- `costs` → costo_vps_cop, costo_dominio_cop_mensual, costo_openrouter_por_gen_cop

---

## Tareas ordenadas por dependencia

### FASE 0 — Preparación (sin código, solo decisiones)
- [ ] **T0.1** Confirmar que la tabla `pricing_config` no existe aún en Supabase
- [ ] **T0.2** Confirmar TRM actual para calcular USD (o usar API pública)

---

### FASE 1 — Base de datos

- [ ] **T1.1** Crear migración SQL: tabla `pricing_config` con RLS (solo admin puede escribir, lectura pública)
- [ ] **T1.2** Insertar filas iniciales con los precios actuales (basic, pro, mini_landing, meta, costs)
- [ ] **T1.3** Verificar que la lectura pública funciona sin auth (para la landing)

---

### FASE 2 — API y capa de datos

- [ ] **T2.1** Crear `frontend/src/lib/pricing.ts`
  - Función `getPricingConfig()` — lee de Supabase con `revalidate: 3600`
  - Tipos TypeScript para cada plan
  - Función `formatCOP(n)` centralizada (mover de PlanesClient)

- [ ] **T2.2** Crear API route `frontend/src/app/api/pricing/route.ts`
  - GET: devuelve config completa (para el panel admin via fetch client-side)
  - PUT: actualiza una fila (solo con adminToken)

- [ ] **T2.3** Crear API route `frontend/src/app/api/pricing/trm/route.ts`
  - GET: consulta TRM actual desde API pública (banrep.gov.co o exchangerate-api)
  - Caché de 24h para no abusar la API externa

---

### FASE 3 — Landing / página de planes dinámica

- [ ] **T3.1** Convertir `PlanesClient.tsx` para recibir `pricingConfig` como prop
  - Eliminar los `250000` y `150000` hardcodeados
  - Leer precios, features, subtítulos y textos de botón desde la prop
  - Mantener la lógica de descuento por duración (los % de descuento también vienen de config)

- [ ] **T3.2** Actualizar `frontend/src/app/planes/page.tsx` (Server Component)
  - Llamar `getPricingConfig()` en el servidor
  - Pasar como prop a `PlanesClient`
  - Agregar `export const revalidate = 3600` para ISR

- [ ] **T3.3** Verificar que el SEO no se rompe
  - Los precios deben estar en el HTML inicial (no solo client-side)
  - Revisar `generateMetadata` en `page.tsx` de planes
  - Confirmar que el sitemap no necesita cambios

---

### FASE 4 — Panel admin: configuración de precios

- [ ] **T4.1** Crear `frontend/src/app/admin/pricing/page.tsx`
  - Sección "Plan Básico": editar precio, productos_max, generaciones, subtítulo, features (lista editable), texto botón
  - Sección "Plan Pro": ídem
  - Sección "Mini-landing": precio único, precio original, descuento %, features
  - Sección "Meta y TRM": meta mensual COP, TRM manual o botón "Actualizar desde API"
  - Sección "Costos operativos": VPS, dominio, costo OpenRouter por generación

- [ ] **T4.2** Agregar calculadoras automáticas en el panel (solo visualización, no se guardan):
  - Precio en USD = precio_cop / trm
  - Clientes necesarios para meta = ceil(meta / precio_plan)
  - Margen estimado = precio_plan − (generaciones_plan × costo_openrouter_por_gen) − (costos_fijos / clientes_estimados)
  - Punto de equilibrio = costos_totales_mes / precio_plan

- [ ] **T4.3** Agregar enlace "Precios" en el sidebar del admin layout

---

### FASE 5 — Dashboard ROI (ampliar /admin/revenue)

- [ ] **T5.1** Agregar pestañas a `/admin/revenue/page.tsx`:
  - Pestaña "Ingresos" (lo que ya existe, mejorado)
  - Pestaña "ROI / Metas" (nueva)

- [ ] **T5.2** Pestaña "ROI / Metas" — componentes:
  - Tarjeta "% Meta cumplida" con barra de progreso visual (color verde si >100%, naranja si 70-99%, rojo si <70%)
  - Tarjeta "ROI mensual %" con comparativa vs mes anterior
  - Tarjeta "ARPU" con tendencia
  - Tarjeta "Margen bruto %" con tendencia
  - Tabla de costos operativos del mes (VPS + dominio + OpenRouter estimado)
  - Tabla "Punto de equilibrio por plan" (cuántos clientes necesito para cubrir costos)
  - Proyección 3 y 6 meses basada en promedio de últimos 3 meses

- [ ] **T5.3** Agregar métricas de churn y nuevos clientes
  - Consulta Supabase: clientes que entraron este mes vs mes anterior
  - Consulta Supabase: clientes que cancelaron (status cambió a cancelled)
  - Mostrar en tarjetas con delta +/-

- [ ] **T5.4** Leer costos desde `pricing_config` (tabla costs) en lugar de hardcodear
  - El costo OpenRouter se calcula: generaciones_mes_total × costo_por_gen
  - Las generaciones totales vienen de la tabla de uso existente

---

### FASE 6 — Deploy y verificación

- [ ] **T6.1** Commit y push de todos los cambios
- [ ] **T6.2** Deploy frontend: `python scripts/_deploy_now.py --frontend`
- [ ] **T6.3** Verificar en producción:
  - Landing `/planes` muestra precios correctos (renderizados en servidor)
  - Panel admin `/admin/pricing` guarda y refleja cambios en landing (esperar revalidate o forzar)
  - Dashboard `/admin/revenue` muestra pestañas ROI con datos reales
- [ ] **T6.4** Actualizar sitemap si se agregó `/admin/pricing` (no debe estar — es privada, agregar a `disallow` en robots.ts)

---

## Orden de ejecución recomendado

```
T1.1 → T1.2 → T1.3
         ↓
T2.1 → T2.2 → T2.3
         ↓
T3.1 → T3.2 → T3.3
         ↓
T4.1 → T4.2 → T4.3
         ↓
T5.1 → T5.2 → T5.3 → T5.4
         ↓
T6.1 → T6.2 → T6.3 → T6.4
```

T0.1 y T0.2 se hacen antes de todo.
T2.3 (TRM API) puede hacerse en paralelo con T3.x.
T4.x y T5.x pueden hacerse en paralelo una vez T2.x esté listo.

---

## Archivos que se crean / modifican

| Archivo | Acción |
|---|---|
| `supabase/migrations/YYYYMMDD_pricing_config.sql` | CREAR |
| `frontend/src/lib/pricing.ts` | CREAR |
| `frontend/src/app/api/pricing/route.ts` | CREAR |
| `frontend/src/app/api/pricing/trm/route.ts` | CREAR |
| `frontend/src/app/planes/page.tsx` | MODIFICAR (agregar ISR + pasar prop) |
| `frontend/src/app/planes/PlanesClient.tsx` | MODIFICAR (leer desde prop, no hardcoded) |
| `frontend/src/app/admin/pricing/page.tsx` | CREAR |
| `frontend/src/app/admin/revenue/page.tsx` | MODIFICAR (agregar pestañas ROI) |
| `frontend/src/app/admin/layout.tsx` | MODIFICAR (agregar link "Precios" en sidebar) |
| `frontend/src/app/robots.ts` | MODIFICAR (agregar /admin/pricing a disallow) |

**Archivos que NO se tocan:**
- `sitemap.ts` — /admin/pricing es privada, no va en sitemap
- Workflows n8n — no aplica
- Backend — no requiere cambios (los precios los lee el frontend directo de Supabase)

---

## Notas de implementación

- La TRM de referencia inicial es 3.700 COP/USD (editable desde el panel)
- La meta mensual inicial es 1.400.000 COP (editable desde el panel)
- El costo OpenRouter estimado por generación: ~$25 COP (basado en ~$0.039 USD/imagen × 3.700 TRM / 5.8 gen promedio por imagen — ajustar según datos reales)
- ISR revalidate: 3600 (1 hora) — si necesitas cambio inmediato, agregar botón "Forzar revalidación" en el panel que llame a `revalidatePath('/planes')`
- RLS en `pricing_config`: SELECT público (anon key), INSERT/UPDATE/DELETE solo service_role o admin autenticado



============================================================
# END SECTION -- BEGIN: SEO_TASKS.md
============================================================

# Auditoría SEO — Lookitry
> Fecha: marzo 2026 | Dominio actual: pruebalo.wilkiedevs.com
> Mercado objetivo: Latinoamérica (CO, MX, AR, CL, PE, VE)
> Enfoque actual: páginas propias de Lookitry (landing, planes, términos, register)
> Páginas de usuarios (mini-landings /sitio/[slug], /pruebalo/[slug]): pendientes para el futuro

---

## Fuentes verificadas (top resultados de búsqueda — marzo 2026)

| # | Fuente | URL | Tema |
|---|--------|-----|------|
| 1 | bluethings.co | https://www.bluethings.co/blog/seo-in-latin-america-complete-guide | SEO Latam 2026 |
| 2 | digitalapplied.com | https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide | Core Web Vitals 2026 |
| 3 | agentberlin.ai | https://agentberlin.ai/blog/schema-markup-saas-2026 | Schema SaaS 2026 |
| 4 | growtika.com | https://growtika.com/blog/saas-seo-guide | SaaS SEO 2026 |
| 5 | pipelineroad.com | https://pipelineroad.com/agency/blog/saas-seo-strategy | SaaS SEO estrategia 2026 |
| 6 | datareportal.com | https://datareportal.com/reports/digital-2026-venezuela | Venezuela Digital 2026 |
| 7 | clickcentricseo.com | https://clickcentricseo.com/blog/generative-engine-optimization-guide | GEO / AI Overviews 2026 |
| 8 | aiappbuilder.com | https://aiappbuilder.com/insights/nextjs-seo-performance-checklist-for-faster-growth | Next.js SEO 2026 |

---

## Hallazgos clave por fuente

### 1. SEO en Latam — bluethings.co
- Google tiene >95% de market share en toda Latinoamérica.
- El 93% de las experiencias online comienzan con una búsqueda; el 80% de las decisiones de compra inician en Google.
- El tráfico orgánico representa ~53% de las visitas globales — sigue siendo el canal de adquisición más fuerte.
- Más de un tercio de los suscriptores móviles en Latam aún usan 3G o teléfonos básicos → Core Web Vitals son críticos.
- Cada país debe tratarse como un programa SEO separado (CO, MX, AR, CL, PE, VE tienen comportamientos distintos).
- Las brechas urbano/rural afectan la intención de búsqueda: misma query puede significar distinta disposición de compra.
- WhatsApp y MercadoLibre forman parte del funnel de conversión en la región.

### 2. Core Web Vitals 2026 — digitalapplied.com
- INP reemplazó a FID en marzo 2024. Es el CWV más difícil: **43% de sitios web aún fallan** el umbral de 200ms.
- Tasas de aprobación actuales (CrUX data, early 2026):
  - INP: 57% pasa (43% falla) — el más crítico
  - LCP: 68% pasa (32% falla)
  - CLS: 78% pasa (22% falla)
- Umbrales "bueno": LCP ≤ 2.5s | INP ≤ 200ms | CLS ≤ 0.1
- Google evalúa CWV a nivel de grupo de URLs usando datos CrUX — páginas con alto tráfico y mal rendimiento arrastran todo el sitio.
- Para e-commerce: cada 100ms de mejora en LCP puede aumentar conversiones hasta 8%.
- Las 4 correcciones de mayor impacto para LCP: preload de imágenes, CSS crítico inline, preload de fuentes con display swap, y server-side rendering.
- INP falla principalmente por: tareas largas de JavaScript, hidratación de frameworks, scripts de terceros.

### 3. Schema markup para SaaS — agentberlin.ai
- En 2026 los motores de IA (ChatGPT, Perplexity, Google AI Overviews) usan structured data para verificar precios, features y pasos.
- Los 6 schemas esenciales para SaaS: SoftwareApplication, FAQPage, HowTo, Organization, Product/Offer, Review/AggregateRating.
- SoftwareApplication: usar en cada página de producto con `applicationCategory: "BusinessApplication"`, `operatingSystem: "Web"`, offers alineados con precios visibles.
- FAQPage: superficie preguntas reales de clientes sobre precios, seguridad y onboarding — genera rich results expandibles.
- Organization: establece la entidad de marca, logo y perfiles verificados.
- Product/Offer: publicar nombres de planes, precios, monedas y ventanas de validez con precisión.
- Review/AggregateRating: mejora CTR y confianza en AI summaries.
- Beneficio medible: schema markup aumenta CTR ~40% y visibilidad SEO ~36.6%.

### 4. SaaS SEO 2026 — growtika.com
- SaaS SEO tiene 4 pilares en 2026: Technical SEO, On-page SEO, Off-page SEO, y **GEO (Generative Engine Optimization)**.
- Si no eres citado en respuestas de AI Overviews, no existes cuando los compradores están listos para comprar.
- Las queries comerciales ocurren al final del buyer journey — son las "money pages" donde más importa la citación en AI.
- Regla 70/30 para GEO: 70% de consistencia de hechos + 30% de variación natural entre fuentes.
- Keywords de nicho con 10-50 búsquedas/mes convierten mejor que términos de alto volumen.
- Construir un "Trust Hub": menciones en Reddit, foros del sector, directorios de SaaS para que los LLMs reconozcan la marca.

### 5. SaaS SEO estrategia — pipelineroad.com
- El modelo de topic clusters es la estructura correcta: pillar page (3.000-5.000 palabras) + cluster pages (1.000-2.500 palabras) + internal links.
- B2B SaaS con inversión en contenido orgánico tiene 61% menor costo por lead vs. canales pagados después de 12 meses (HubSpot, 2025).
- El universo de keywords para SaaS es pequeño — hay que dominar cada keyword de la categoría, incluso las de 50 búsquedas/mes.
- Cada página necesita un "next step" claro: demo, trial, guía siguiente.
- GEO es lo que "casi nadie en SaaS SEO está hablando todavía" — estructurar contenido para ser extraído y citado por AI engines.

### 6. Venezuela Digital 2026 — datareportal.com
- Población: 28.5M | Usuarios de internet: 17.6M (61.6% penetración)
- Conexiones móviles: 21.8M (76.3%) | Usuarios de redes sociales: 16.6M
- 88.6% urbano | Mediana de edad: 29.4 años — audiencia joven y digital-first
- Alta dependencia de móvil → CWV y velocidad son críticos para este mercado.

### 7. GEO / AI Overviews — clickcentricseo.com
- GEO = optimizar contenido para que motores de AI (Google AI Overviews, ChatGPT, Perplexity, Claude, Gemini) lo encuentren, entiendan y citen.
- Diferencia con SEO tradicional: SEO rankea en "blue links", GEO asegura visibilidad en respuestas generadas por AI.
- Tácticas clave: resúmenes de 50-70 palabras por sección, FAQ schema, contenido factual y citable, structured data completo.

### 8. Next.js SEO 2026 — aiappbuilder.com
- Generar sitemap y robots dinámicamente con route handler de Next.js App Router.
- Anotar `noindex` en variantes filtradas o paginadas.
- JSON-LD via Metadata API o componente dedicado: cubrir Organization, BreadcrumbList, Product y FAQ.
- Validar siempre con Google Rich Results Test antes de publicar.
- Server Components resuelven el problema de contenido no indexable de Client Components.

---

## Estado actual del proyecto

Base SEO existente (lo que ya está bien):
- Metadata global en `layout.tsx` con title template, description, keywords, OG y Twitter Cards
- JSON-LD en homepage: Organization, WebSite, SoftwareApplication con offers
- `robots.ts` y `sitemap.ts` funcionales
- `lang="es"` en el HTML
- Fuentes con `display: swap` via `next/font`
- `areaServed` actualizado: CO, MX, AR, CL, PE, VE
- Keywords con Venezuela incluida
- Hreflang con `es-VE`

Brechas identificadas (ordenadas por impacto):

---

## PRIORIDAD ALTA — Acción inmediata (páginas propias de Lookitry)

### 1. Dominio propio — lookitry.com o lookitry.co
- **Problema:** El sitio vive en `pruebalo.wilkiedevs.com`. Google trata subdominios como entidades
  separadas — la autoridad de dominio no se acumula en la marca Lookitry.
- **Estado:** A corto plazo — adquirir el dominio pronto.
- **Acción cuando se adquiera:** Migrar con redirecciones 301 permanentes. Actualizar `BASE_URL`
  en `layout.tsx`, `robots.ts`, `sitemap.ts`, `page.tsx`. Reenviar sitemap en Google Search Console.
- **Fuente:** Google Search Central — subdominios vs. subdirectorios; bluethings.co — autoridad de dominio en Latam.
- **Impacto:** Muy alto — mayor retorno a largo plazo.

### 2. Metadata en `/planes` y `/terminos`
- **Problema:** Ambas páginas son `'use client'` y no exportan `metadata`. Next.js no permite
  exportar `metadata` desde Client Components — Google las indexa sin title/description optimizados.
- **Acción:** Arquitectura Server + Client: Server Component exporta `metadata`, Client Component
  maneja la interactividad.
- **Metadata sugerida para `/planes`:**
  ```ts
  export const metadata: Metadata = {
    title: 'Planes y precios — Probador virtual IA para tiendas',
    description: 'Elige el plan de probador virtual con IA para tu tienda. Básico desde $150.000 COP/mes. Pro desde $250.000 COP/mes. 7 días gratis.',
    alternates: { canonical: 'https://[dominio]/planes' },
    openGraph: { type: 'website', title: '...', description: '...' },
  };
  ```
- **Metadata sugerida para `/terminos`:**
  ```ts
  export const metadata: Metadata = {
    title: 'Términos y Condiciones — Lookitry',
    description: 'Términos y condiciones de uso de Lookitry. Ley 1480 de 2011, Ley 1581 de 2012 — Colombia.',
    robots: { index: true, follow: false },
  };
  ```
- **Archivos:** `src/app/planes/page.tsx`, `src/app/terminos/page.tsx`
- **Fuente:** aiappbuilder.com — Next.js SEO 2026; surajon.dev — Metadata API en Server Components.

### 3. Sitemap incompleto
- **Problema:** El sitemap solo incluye 4 URLs. Faltan `/terminos` y `/register`.
  (Las mini-landings de marcas se agregan en el futuro cuando se prioricen páginas de usuarios.)
- **Acción:** Agregar rutas estáticas faltantes en `sitemap.ts`:
  ```ts
  { url: `${BASE_URL}/terminos`, changeFrequency: 'yearly', priority: 0.3 },
  { url: `${BASE_URL}/register`, changeFrequency: 'yearly', priority: 0.4 },
  ```
- **Archivo:** `src/app/sitemap.ts`
- **Fuente:** aiappbuilder.com — generar sitemap dinámico con route handler de Next.js.

### 4. Imagen OG — verificar y optimizar
- **Problema:** El layout referencia `/og-image.png` pero no hay certeza de que exista ni esté
  optimizada. Una OG image bien diseñada aumenta el CTR desde redes sociales y resultados de búsqueda.
- **Acción:** Crear OG image de 1200×630px con logo, tagline y mockup del widget.
  Verificar que exista en `/public/og-image.png` y que pese menos de 200KB.
- **Herramienta de verificación:** https://www.opengraph.xyz/
- **Fuente:** Práctica estándar — OG images aumentan CTR en redes sociales y WhatsApp (canal clave en Latam según bluethings.co).

### 5. Ampliar JSON-LD — FAQPage y featureList
- **Problema:** El JSON-LD actual tiene Organization, WebSite y SoftwareApplication básico.
  Faltan schemas de alto valor para SaaS que aumentan visibilidad en AI Overviews.
- **Acciones en `page.tsx`:**
  - Agregar `FAQPage` schema con las preguntas del `FaqSection` de la landing.
  - Agregar `featureList` al SoftwareApplication existente.
  - Agregar `priceValidUntil` y `eligibleRegion` (CO, MX, AR, CL, PE, VE) a los offers.
  - Agregar `AggregateRating` con los testimonios existentes.
- **Ejemplo FAQPage:**
  ```json
  {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cómo integro el probador virtual en mi tienda?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Copia el código del widget desde tu dashboard y pégalo en tu tienda. Funciona con cualquier plataforma: Shopify, WooCommerce, Wix, o HTML puro. Sin apps, sin desarrollo adicional."
        }
      }
    ]
  }
  ```
- **Fuente:** agentberlin.ai — FAQPage aumenta CTR ~40%; stackmatix.com — FAQ schema para AI Overviews.

### 6. Metadata en `/register`
- **Problema:** La página de registro no tiene metadata exportada.
- **Acción:**
  ```ts
  export const metadata: Metadata = {
    title: 'Crear cuenta gratis — Lookitry',
    description: 'Crea tu cuenta y activa el probador virtual con IA para tu tienda. 7 días gratis, sin tarjeta de crédito.',
    robots: { index: true, follow: false },
  };
  ```
- **Archivo:** `src/app/register/page.tsx`

---

## PRIORIDAD MEDIA — Mejoras de rendimiento y estructura

### 7. Core Web Vitals — INP y LCP
- **Problema:** 43% de sitios web fallan INP (≤200ms). En Latam con redes 3G/4G el impacto
  es mayor. Venezuela tiene 76.3% de conexiones móviles — velocidad es crítica.
- **Acciones concretas:**
  - Eliminar todos los `style={{ fontFamily: 'Syne, sans-serif' }}` inline — reemplazar por
    clases CSS (`font-syne`, `font-dm-sans`) usando variables CSS ya definidas.
  - Verificar que el logo en `LandingNav` tenga `priority` en el `<Image>`.
  - Revisar que imágenes de `/steps/paso-*.webp` usen `sizes` correctos y `loading="lazy"`.
  - Auditar scripts de terceros que bloqueen el main thread (analytics, chat widgets).
- **Umbrales objetivo:** LCP ≤ 2.5s | INP ≤ 200ms | CLS ≤ 0.1
- **Herramienta:** PageSpeed Insights + Chrome DevTools Performance panel.
- **Fuente:** digitalapplied.com — 43% de sitios fallan INP; pagespeedmatters.com — 100ms mejora en LCP = +8% conversiones.

### 8. Estructura de encabezados — LandingClient a Server Components
- **Problema:** `LandingClient.tsx` es Client Component — el crawler puede tener dificultades
  para indexar contenido renderizado en cliente. Afecta LCP (contenido no disponible en HTML inicial).
- **Acción:** Convertir secciones estáticas (hero, stats, pricing, steps, testimonials, FAQ)
  a Server Components. Solo partes interactivas (selector de precio, botones con router.push)
  deben ser Client Components.
- **Beneficio:** HTML puro mejora tiempo de indexación y LCP.
- **Fuente:** nikola-arsic.com — "server-rendering alone isn't enough but it's the foundation";
  aiappbuilder.com — Server Components para contenido indexable.

### 9. Robots.txt — Agregar rutas a disallow
- **Problema:** El robots.txt actual bloquea `/admin/`, `/dashboard/` y `/api/`.
  Faltan rutas que no deben indexarse.
- **Acción:** Agregar a `disallow` en `src/app/robots.ts`:
  ```
  /checkout/
  /pago-exitoso/
  /trial-payment/
  /trial-activado/
  /registro-pro/
  /auth/
  /verify-email/
  /embed/
  ```

### 10. Breadcrumbs JSON-LD en páginas internas
- **Problema:** No hay breadcrumbs en `/planes` ni `/terminos`.
  Google los muestra en los resultados y mejoran la navegación.
- **Acción:** Agregar `BreadcrumbList` JSON-LD en `/planes` y `/terminos`:
  ```json
  {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://[dominio]/" },
      { "@type": "ListItem", "position": 2, "name": "Planes", "item": "https://[dominio]/planes" }
    ]
  }
  ```
- **Fuente:** aiappbuilder.com — BreadcrumbList es uno de los schemas prioritarios para Next.js SEO.

### 11. GEO — Generative Engine Optimization
- **Problema:** En 2026, si Lookitry no es citado en AI Overviews (Google), ChatGPT o Perplexity,
  no existe cuando los compradores están listos para comprar.
- **Acciones:**
  - Escribir resúmenes de 50-70 palabras al inicio de cada sección clave de la landing
    (qué es, cómo funciona, precios) — formato extractable por AI engines.
  - Implementar FAQPage schema (tarea #5) — featured snippets tienen 75% más probabilidad
    de ser citados en AI Overviews.
  - Asegurar consistencia de hechos (nombre, precio, features) en todas las páginas del sitio.
  - A futuro: conseguir menciones en directorios de SaaS (G2, Product Hunt, Capterra) para
    que los LLMs reconozcan Lookitry como entidad confiable.
- **Fuente:** growtika.com — "If you're not cited inside AI answers, you don't exist";
  clickcentricseo.com — GEO guide 2026; pipelineroad.com — GEO es el nuevo frontier del SaaS SEO.

---

## PRIORIDAD BAJA — Optimizaciones adicionales

### 12. Hreflang — ya implementado
- **Estado:** Implementado en `layout.tsx` con es, es-CO, es-MX, es-AR, es-CL, es-PE, es-VE.
- **Pendiente:** Actualizar cuando se adquiera el dominio propio.

### 13. Página 404 personalizada
- **Problema:** No existe `src/app/not-found.tsx`.
- **Acción:** Crear con nav, mensaje claro y links a homepage y `/planes`.

### 14. Verificación en Google Search Console y Bing Webmaster Tools
- **Acción:**
  - Verificar en [Google Search Console](https://search.google.com/search-console)
  - Verificar en [Bing Webmaster Tools](https://www.bing.com/webmasters) — Bing tiene cuota
    relevante en MX y AR
  - Enviar sitemap manualmente tras cada deploy importante
  - Configurar alertas de cobertura de indexación

### 15. ISR en mini-landings — PENDIENTE (páginas de usuarios)
- **Estado:** Pendiente para cuando se prioricen las páginas de usuarios.
- **Nota:** `sitio/[brandSlug]/page.tsx` usa `cache: 'no-store'` — cambiar a `revalidate: 60`.

---

## PENDIENTE — Páginas de usuarios (futuro)

Las siguientes tareas aplican a las mini-landings y páginas de marcas clientes.
Se estudiarán y aplicarán cuando las páginas de usuarios sean prioridad:

- Canonical tags en `/pruebalo/[slug]` y `/sitio/[slug]` (contenido duplicado)
- OG images dinámicas para mini-landings con `next/og` (ImageResponse)
- Alt text en imágenes de productos de mini-landings
- Schema `LocalBusiness` o `Store` en mini-landings
- Sitemap dinámico con mini-landings activas
- ISR (`revalidate: 60`) en mini-landings
- Schema `Product` con offers en `/planes` (cuando se integre con páginas de usuarios)

---

## PENDIENTE — Largo plazo

### Blog / contenido editorial
- **Estado:** Pendiente a largo plazo.
- **Cuando se implemente:** Crear sección `/blog` con topic clusters orientados a keywords como:
  - "cómo aumentar ventas en tienda de ropa online"
  - "probador virtual para Instagram: guía completa"
  - "reducir devoluciones en tienda online con IA"
  - "probador virtual de ropa para tiendas en Venezuela"
- **Fuente:** pipelineroad.com — B2B SaaS con contenido orgánico tiene 61% menor costo por lead
  vs. canales pagados después de 12 meses (HubSpot, 2025).

---

## Checklist de implementación

| # | Tarea | Prioridad | Esfuerzo | Estado |
|---|-------|-----------|----------|--------|
| 1 | Adquirir dominio propio (lookitry.com) | Alta | Alto | A corto plazo |
| 2 | Metadata en `/planes` y `/terminos` | Alta | Medio | Hecho — verificado |
| 3 | Ampliar sitemap (/terminos, /register) | Alta | Bajo | Hecho — verificado |
| 4 | Verificar/crear OG image 1200×630px | Alta | Medio | Hecho — /public/og-image.png existe, 74KB |
| 5 | Ampliar JSON-LD: FAQPage, featureList, AggregateRating | Alta | Medio | Hecho — verificado en page.tsx |
| 6 | Metadata en `/register` | Alta | Bajo | Hecho — verificado |
| 7 | Core Web Vitals: fontFamily inline eliminados en LandingClient | Media | Medio | Hecho — verificado, sin fontFamily inline |
| 8 | LandingClient → Server Components (secciones estáticas) | Media | Alto | Pendiente |
| 9 | Ampliar disallow en robots.ts | Media | Bajo | Hecho — verificado, 11 rutas bloqueadas |
| 10 | Breadcrumbs JSON-LD en /planes y /terminos | Media | Bajo | Hecho — /planes verificado, /terminos agregado ahora |
| 11 | GEO: resúmenes extractables + consistencia de hechos | Media | Medio | Pendiente |
| 12 | Hreflang es-VE | Baja | Bajo | Hecho — verificado en layout.tsx |
| 13 | Página 404 personalizada | Baja | Bajo | Hecho — not-found.tsx existe con nav y links |
| 14 | Verificar en GSC y Bing Webmaster Tools | Baja | Bajo | Pendiente — acción manual |
| 15 | ISR en mini-landings (revalidate: 60) | Baja | Bajo | Pendiente (páginas usuarios) |
| 16 | Canonical en /pruebalo/[slug] y /sitio/[slug] | — | Bajo | Pendiente (páginas usuarios) |
| 17 | OG dinámico para mini-landings | — | Medio | Pendiente (páginas usuarios) |
| 18 | Alt text en imágenes de mini-landings | — | Bajo | Pendiente (páginas usuarios) |
| 19 | Schema LocalBusiness en mini-landings | — | Bajo | Pendiente (páginas usuarios) |
| 20 | Blog con contenido editorial | — | Muy alto | Pendiente (largo plazo) |
| 21 | Verificar OG image visualmente con opengraph.xyz | Alta | Bajo | Pendiente — acción manual |
| 22 | Verificar logo en LandingNav tiene prop `priority` en `<Image>` | Media | Bajo | Pendiente |
| 23 | Imágenes `/steps/paso-*.webp` — agregar `sizes` y `loading="lazy"` | Media | Bajo | Pendiente |
| 24 | Auditar scripts de terceros que bloqueen main thread | Media | Medio | Pendiente |
| 25 | `terminos/page.tsx` — bug de duplicación de código corregido (10 errores TS) | Alta | Bajo | Hecho |

---

## Notas de verificación (mar 2026)

- `terminos/page.tsx`: canonical tenía URL relativa (`/terminos`) — corregido a URL absoluta con `${BASE_URL}/terminos`. Breadcrumb JSON-LD agregado.
- `og-image.png`: existe en `/public`, pesa 74KB (dentro del límite de 200KB). Verificar visualmente con https://www.opengraph.xyz/
- `LandingClient.tsx`: sin `fontFamily` inline — correcto. Sigue siendo Client Component (tarea 8 pendiente).
- `MiniLanding.tsx`: tiene `fontFamily` inline con Playfair Display e Inter — son fuentes de las mini-landings de clientes, no afectan CWV de las páginas propias de Lookitry.

---

## Resumen de implementaciones realizadas

| Commit | Fecha | Cambios |
|--------|-------|---------|
| `8ba2d8e` | mar 2026 | Venezuela en areaServed, keywords VE, hreflang es-VE en layout.tsx |
| `7eb5632` | mar 2026 | SEO_TASKS.md reescrito con fuentes verificadas, GEO, CWV 2026 |
| `1695834` | mar 2026 | Metadata /planes + /terminos (Server+Client), sitemap +/terminos, robots.ts +8 disallow, metadata /register, JSON-LD: FAQPage (6 preguntas) + featureList + AggregateRating + eligibleRegion VE |
| —        | mar 2026 | Breadcrumb JSON-LD en /terminos + canonical URL absoluta corregida |



============================================================
# END SECTION -- BEGIN: TESTING_GUIDE.md
============================================================

# Guía de Testing Manual — Lookitry

> Tener a mano para verificar que todas las funcionalidades del sitio están activas y correctas.
> Actualizar cuando se agreguen nuevas funcionalidades.

---

## Antes de empezar

### Deshabilitar Turnstile (para tests automatizados o manuales rápidos)
```bash
# Desde Mostrador_wilkiedevs/
python scripts/_toggle_turnstile.py --disable
python scripts/_deploy_now.py --restart
```

### Rehabilitar Turnstile (producción)
```bash
python scripts/_toggle_turnstile.py --enable
python scripts/_deploy_now.py --restart
```

---

## URLs del entorno

| Servicio | URL                                    |
|----------|----------------------------------------|
| Frontend | https://pruebalo.wilkiedevs.com        |
| API      | https://api.pruebalo.wilkiedevs.com    |
| Admin    | https://pruebalo.wilkiedevs.com/admin  |

---

## 1. Registro de nuevo usuario

**URL:** https://pruebalo.wilkiedevs.com/register

### Datos de prueba
```
Nombre de la marca:     Marca Test QA
Slug:                   marca-test-qa
Email:                  test+qa@tudominio.com   ← usar email REAL tuyo
Nombre del responsable: Juan Pérez Test
Teléfono:               +57 300 000 0000  (opcional, puede dejarse vacío)
Contraseña:             Test1234!
```

### Validaciones a verificar
- [ ] Slug se genera automáticamente al escribir el nombre de la marca
- [ ] Email con dominio desechable (ej. `test@mailinator.com`) debe ser rechazado
- [ ] `contact_name` con menos de 3 caracteres debe ser rechazado
- [ ] Contraseña menor a 6 caracteres debe ser rechazada
- [ ] Email ya registrado debe mostrar error de conflicto
- [ ] Slug ya en uso debe mostrar error de conflicto
- [ ] Registro exitoso redirige al dashboard o a verificación de tarjeta (si está activa)
- [ ] Se recibe email de verificación en la bandeja de entrada

### Script automatizado
```bash
python scripts/_test_registro.py
```

---

## 2. Verificación de email

1. Revisar bandeja de entrada del email usado en el registro
2. Hacer clic en el enlace de verificación
3. Debe mostrar mensaje: "Correo verificado correctamente"
4. Iniciar sesión — debe funcionar sin errores

---

## 3. Login

**URL:** https://pruebalo.wilkiedevs.com/login

- [ ] Login con credenciales correctas → redirige al dashboard
- [ ] Login con contraseña incorrecta → "Credenciales inválidas"
- [ ] Login con email no registrado → "Credenciales inválidas"
- [ ] "Olvidé mi contraseña" → envía email de recuperación

---

## 4. Dashboard — Funcionalidades básicas

**URL:** https://pruebalo.wilkiedevs.com/dashboard

- [ ] Se muestra el nombre de la marca y el plan (TRIAL o BASIC)
- [ ] Contador de generaciones disponibles visible
- [ ] Menú lateral funciona correctamente
- [ ] Botón de cerrar sesión funciona

---

## 5. Agregar producto

**URL:** https://pruebalo.wilkiedevs.com/dashboard/productos

- [ ] Formulario de nuevo producto visible
- [ ] Subir imagen del producto (JPG/PNG)
- [ ] "Describir con IA" genera descripción automática
- [ ] Producto aparece en la lista después de guardar
- [ ] Producto puede activarse/desactivarse

---

## 6. Probador virtual (widget)

**URL:** https://pruebalo.wilkiedevs.com/sitio/[tu-slug]

- [ ] Widget carga correctamente
- [ ] Botón "Probar" visible
- [ ] Subir selfie (foto de frente, buena iluminación)
- [ ] Seleccionar producto
- [ ] Generación de imagen funciona (puede tardar 15-30 segundos)
- [ ] Resultado se muestra correctamente
- [ ] Contador de generaciones se decrementa

---

## 7. Pago con Wompi — Modo Sandbox

### Activar modo sandbox
El modo sandbox se activa automáticamente cuando las claves de Wompi son de prueba.
Verificar en `backend/.env` que `WOMPI_PUBLIC_KEY` empiece con `pub_test_`.

### Tarjetas de prueba Wompi

| Tipo                 | Número             | CVV   | Vencimiento | Resultado |
|---|---|---|---|---|
| Visa aprobada        | `4242424242424242` | `123` |     `12/29` | Aprobado  |
| Mastercard aprobada  | `5555555555554444` | `123` |     `12/29` | Aprobado  |
| Visa rechazada       | `4111111111111111` | `123` |     `12/29` | Rechazado |
| Fondos insuficientes | `4000000000009995` | `123` |     `12/29` | Rechazado |

**Datos del titular (cualquier valor):**
```
Nombre: Test User
Documento: 1234567890
Cuotas: 1
```

### Flujo de verificación de tarjeta (si está activo)
1. Registrar nueva cuenta
2. Ser redirigido a Wompi automáticamente
3. Ingresar tarjeta de prueba aprobada
4. Verificar que regresa al dashboard con estado TRIAL activo
5. Verificar que el cobro de $100 COP aparece como reembolsado (puede tardar minutos)

### Flujo de pago de plan
**URL:** https://pruebalo.wilkiedevs.com/planes

1. Seleccionar plan BASIC ($150.000 COP) o PRO ($250.000 COP)
2. Completar checkout con tarjeta de prueba aprobada
3. Verificar redirección a `/pago-exitoso`
4. Verificar que el plan se actualiza en el dashboard

---

## 8. Recuperación de contraseña

1. Ir a https://pruebalo.wilkiedevs.com/login
2. Clic en "Olvidé mi contraseña"
3. Ingresar email registrado
4. Revisar bandeja de entrada
5. Clic en enlace de recuperación
6. Ingresar nueva contraseña (mínimo 6 caracteres)
7. Iniciar sesión con la nueva contraseña

---

## 9. Configuración de la marca

**URL:** https://pruebalo.wilkiedevs.com/dashboard/configuracion

- [ ] Cambiar nombre de la marca
- [ ] Subir logo
- [ ] Cambiar color primario
- [ ] Guardar cambios → se reflejan en el widget

---

## 10. Antispam — Verificar bloqueos

### Emails desechables bloqueados
Intentar registrar con estos dominios (deben ser rechazados):
- `test@mailinator.com`
- `test@guerrillamail.com`
- `test@yopmail.com`
- `test@tempmail.com`
- `test@10minutemail.com`

### Abuso de trial por IP
Si hay campaña de trial activa, registrar dos cuentas desde la misma IP debe bloquear la segunda con:
> "Ya existe una cuenta de prueba registrada desde este dispositivo o red."

---

## 11. Verificar SEO básico

- [ ] https://pruebalo.wilkiedevs.com/sitemap.xml — debe listar las páginas públicas
- [ ] https://pruebalo.wilkiedevs.com/robots.txt — debe existir
- [ ] Favicon visible en la pestaña del navegador
- [ ] Título de la página correcto en cada sección

---

## Checklist rápido de deploy

Antes de dar por bueno un deploy:

```bash
# 1. Verificar que el backend responde
curl https://api.pruebalo.wilkiedevs.com/health

# 2. Verificar que el frontend carga
curl -I https://pruebalo.wilkiedevs.com

# 3. Verificar sitemap
curl https://pruebalo.wilkiedevs.com/sitemap.xml

# 4. Test de registro automatizado
python scripts/_test_registro.py
```

---

## Credenciales de admin (solo para testing)

> Estas credenciales son para el panel de administración interno.
> No compartir ni subir a repositorios públicos.

- Panel admin: https://pruebalo.wilkiedevs.com/admin
- Credenciales: ver `backend/.env` → `ADMIN_EMAIL` / `ADMIN_PASSWORD`

---

*Última actualización: ver historial de git*



============================================================
# END SECTION -- BEGIN: listado.md
============================================================

[8:27 a. m., 20/3/2026] Sam Wilkie: Acabo de hacer un test de compra de una minilanding desde el menú de usuario en la pestaña "mi pagina" pero no me dio el acceso a la página comprada y tampoco me reportó la compra a pesar de que me realizó el cobro, tampoco me llegó correo electrónico ni comprobante, verifica también que esté enviando los comprobantes de compra de cada check-out, en este caso el check-out usado fue el interior landing.
[10:43 a. m., 20/3/2026] Sam Wilkie: Verificación de seguridad fallida a la hora de crear una nueva cuenta en el registro trial
[10:45 a. m., 20/3/2026] Sam Wilkie: En el footer colocar teléfono y correo en círculos a la lado de  tiktok e Instagram, y que en el mobile los titles del que queden centrados
[10:49 a. m., 20/3/2026] Sam Wilkie: En el header mobile ocultar el botón contratar ahora y dejar el de iniciar sesión en ese lugar con el mismo color que el botón anterior, y asegurate que el header este responsive y no scroll down en el mobile, también oculta el botón de subir en mobile
[10:54 a. m., 20/3/2026] Sam Wilkie: En el ejemplo de template del inicio coloca imágenes reales de cada producto camisa lino beis, zapatillas blancas, bolso oscuro café, generalas tu, si no puedes hacerlo dime y yo las hago.
[10:58 a. m., 20/3/2026] Sam Wilkie: Haz lo mismo en la parte de promo landing donde dice "Tu tienda online,
sin pagar un diseñador" coloca imágenes y has que se vea más realista para que las personas se hagan una idea general de como quedaría y no que se vea un como wireframe...
[11:01 a. m., 20/3/2026] Sam Wilkie: El el faq sección pagos en la pregunta ¿Cuáles son los precios de los planes? Coloca los valores dinámicos correspondientes que se manejan en el dashboard admin
[11:02 a. m., 20/3/2026] Sam Wilkie: Lo mismo con ¿Hay descuentos por pagar varios meses?
[11:02 a. m., 20/3/2026] Sam Wilkie: En que métodos aceptan agrega también PayPal
[11:03 a. m., 20/3/2026] Sam Wilkie: En la pregunta ¿Cuántas generaciones incluye cada plan? Coloca también los datos dinámicos
[11:05 a. m., 20/3/2026] Sam Wilkie: ¿Cuántos productos puedo tener en el probador? También coloca datos dinámicos
[11:09 a. m., 20/3/2026] Sam Wilkie: En la página de about cambiar de 120 marcas a 30 y has un promedio para el total de generaciones para que lo corrijas también
[11:14 a. m., 20/3/2026] Sam Wilkie: En planes agrega el método math celi para redondear los precios a dólares y haz lo mismo en todo los check-out internos como externos
[11:23 a. m., 20/3/2026] Sam Wilkie: A partir de aquí culminan los cambios en la página principal y comienzan los cambios en el panel/dashboard de administrador.

En el panel de administración analíticas el Top marcas por generaciones no se está actualizando y mostrándome los datos que se están generando.
[11:25 a. m., 20/3/2026] Sam Wilkie: En el panel promociones no funciona el responsive en Mobile.
[11:25 a. m., 20/3/2026] Sam Wilkie: Lo mismo para cupones
[11:30 a. m., 20/3/2026] Sam Wilkie: En la pestaña de configuración de sistema en la pestaña landing, elimina el módulo de cambiar precios ya que esa información ya se encuentra incluida en la sección pricing y en donde dice URL pública , añádeme un campo para colocar el nombre empresa que sea clicleable con la URL previamente configurada , y elimina el módulo de cambiar moneda
[11:30 a. m., 20/3/2026] Sam Wilkie: Hasta aquí los cambios del panel administrativo
[11:36 a. m., 20/3/2026] Sam Wilkie: En el dashboard de usuario En el panel de generaciones al descargar la imagen y en el widgets de generación asegúrate que en el trial la marca de agua quede correctamente ubicada como la imagen ejemplo, y lo mismo con la marca de agua basic, asegúrate de no romper con el resto de la lógica para Pro.
[11:45 a. m., 20/3/2026] Sam Wilkie: En la previa visualización de la mini landing, no se está cumpliendo la lógica que al cumplirse el tiempo de previsualización redireccione al check-out de landing y no permita volver a visualizarla más a menos que se compre
[11:46 a. m., 20/3/2026] Sam Wilkie: Ya hay una página configurada con el aviso, verifica porq no está funcionando.
[11:50 a. m., 20/3/2026] Sam Wilkie: Audita el editor visual de los templates de mini landing que esten funcionando  correctamente  todos los campos de edición en todos los templates.
[11:55 a. m., 20/3/2026] Sam Wilkie: Coloca un tooltip en badge en la sesión de configuración para añadir productos donde se especifique que es o para que sirve
En la opción de edición añade una opciones para recorte en el widget de generación

Añade o verifica la lógica de limitación a una generación por producto en widget de generaciones, en todos los planes porque ya debería estar implementa y Revisa el reporte de problemas con la imagen que no está notificando que se envió el reporte, aunque en el panel de administración si aparece como realizado

Verifica porq las IA no como plexpercity pueden acceder a mi sitio web "No puedo acceder al contenido de tu sitio ahora mismo (parece que el subdominio o DNS no está respondiendo públicamente), así que no puedo ver ni probar lo que ofrece .1. Revisa que el sitio sea accesible desde fueraPara poder analizarlo necesito que cumpla estas condiciones:El subdominio pruébalo.wilkiedevs.com o su versión punycode (xn--prubalo-8za.wilkiedevs.com) debe apuntar a una IP pública en tu DNS. El servidor donde lo tienes (VPS, hosting, Vercel, etc.) debe aceptar peticiones HTTP/HTTPS para ese host y devolver algo distinto a error 4xx/5xx. Un ejemplo típico: si usas Cloudflare, asegúrate de tener un registro A o CNAME para pruébalo apuntando al servidor correcto y que el proxy esté bien configurado. "

necesito implementar un sistema de Custom Domains exclusivo para usuarios con plan PRO.
​Middleware de Identificación: Crea un middleware que capture req.headers.host. Debe consultar en la base de datos (MongoDB/PostgreSQL) si ese host coincide con la columna custom_domain de un usuario con plan: 'PRO'.
​Prioridad de Rutas: Si el host no es el dominio principal, debe cargar la mini-landing del usuario PRO. Si es el dominio principal, sigue el flujo normal.
​Validación de Seguridad: Implementa una limpieza del string del dominio para evitar ataques de inyección.
​Proxy Trust: Configura app.set('trust proxy', true) para que Express lea correctamente el host enviado por Nginx/Cloudflare."
​2. Dónde colocar esta opción en el Panel (UX)
​Para que el usuario perciba el valor de ser PRO, la ubicación es clave:
​Sección "Mi página" del panel de usuario, Crea una pestaña llamada "Identidad y Dominio".
​Interruptor de Estado: Si el usuario es gratuito, muestra el campo bloqueado (con un candado) y un botón brillante: "Desbloquear con Plan PRO".
​Feedback Visual: Una vez activo, muestra un indicador de estado: Pendiente de Configuración, Verificando DNS o Activo (Seguro).
​3. Instrucciones Técnicas para el Usuario (Contenido del Panel)
​Estas son las instrucciones que tus clientes verán dentro de su panel una vez que suban a PRO. Te sugiero colocarlas en un Modal o un Card informativo:
​🌐 Configura tu Dominio Personalizado
​Solo disponible para usuarios PRO
​Para que tu probador virtual y mini-landing funcionen bajo tu propio nombre (ej: probador.tu-marca.com), sigue estos pasos:
​Ingresa tu dominio: Escribe el dominio o subdominio que deseas usar en el campo de arriba y guarda los cambios.
​Configura tus DNS: Entra al panel de tu proveedor de dominio (GoDaddy, Namecheap, etc.) y agrega un nuevo registro:
​Tipo: CNAME
​Nombre/Host: probador (o el nombre que prefieras para tu subdominio)
​Valor/Destino: cname.wilkiedevs.com
​TTL: Automático o 3600.
​Espera la Propagación: Los cambios pueden tardar de 5 minutos a 24 horas. Nuestro sistema generará automáticamente tu certificado de seguridad SSL (HTTPS) sin costo adicional.

[12:15 p. m., 20/3/2026] Sam Wilkie: Neecesito que el editor sea más estético y si es posible para mejorar el UI/UX usar tablas en "mi página"
[12:22 p. m., 20/3/2026] Sam Wilkie: En el panel de configuración del template del widget tryon en la pestaña de apariencia predeterminada no aparece bare como defecto a pesar que es la única disponible, debería aparecer así visualmente también. Y el color predeterminado debería ser también blanco y negro
[12:24 p. m., 20/3/2026] Sam Wilkie: Me aparece este error " Application error: a client-side exception has occurred (see the browser console for more information)." Al intentar hacer el cambio de un plan basic a pro desde el panel de suscripción


============================================================
# END SECTION -- BEGIN: .kiro/steering/REGLAS_IMPORTANTES.md
============================================================

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

## Otras Reglas del Proyecto

### Gestión de Archivos

- No eliminar archivos sin confirmar con el usuario
- No crear archivos de documentación innecesarios
- Mantener estructura de carpetas organizada

### Código

- Seguir convenciones de TypeScript del proyecto
- Usar servicios existentes antes de crear nuevos
- Mantener consistencia con el código existente

### Base de Datos

- No ejecutar migraciones sin consentimiento
- No modificar esquemas de tablas sin aprobación
- Respetar datos existentes en producción

### Deployment

- No hacer cambios en producción sin autorización
- No modificar variables de entorno de producción
- No reiniciar servicios sin avisar

## Contacto

Si tienes dudas sobre si una acción requiere consentimiento, **pregunta primero**.



============================================================
# END SECTION -- BEGIN: .kiro/steering/architecture.md
============================================================

---
inclusion: always
---

# Lookitry — Arquitectura Técnica Completa

> Documento de referencia para retomar el proyecto sin leer archivos individuales.
> Actualizar este archivo cada vez que se agregue una tabla, ruta, página o servicio nuevo.
> **LEER SIEMPRE la carpeta `.kiro/steering/` antes de trabajar en el proyecto.**

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express, TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT propio (no Supabase Auth) |
| Almacenamiento | MinIO (`minio.wilkiedevs.com`) |
| Pagos | Wompi (Colombia, COP) + PayPal (Internacional, USD) |
| IA / Try-On | n8n + OpenRouter (flujo `wPLypk7KhBcFLicX`) |
| Antispam | Cloudflare Turnstile |
| Email | SMTP Hostinger (`smtp.hostinger.com:465`) |
| Deploy | Docker Compose en VPS Hostinger |
| CI/CD | Script Python `scripts/_deploy_now.py` + GitHub |

---

## URLs del Sistema

| Servicio | URL |
|----------|-----|
| Frontend prod | `https://pruebalo.wilkiedevs.com` |
| API prod | `https://api.pruebalo.wilkiedevs.com` |
| n8n | `https://n8n.wilkiedevs.com` |
| MinIO | `https://minio.wilkiedevs.com` |
| Supabase | `https://vkdooutklowctuudjnkl.supabase.co` |
| Frontend local | `http://localhost:3000` |
| Backend local | `http://localhost:3001` |

---

## Infraestructura

| Recurso | Valor |
|---------|-------|
| VPS IP | `31.220.18.39` |
| VPS user | `root` |
| VPS pass | `Travis18456916#` |
| Docker project | `virtual-tryon` |
| Supabase project ID | `vkdooutklowctuudjnkl` |
| GitHub repo | `https://github.com/depper-IA/virtual-tryon.git` |
| Hostinger VPS ID | `1004711` |

---

## Estructura de Directorios

```
Mostrador_wilkiedevs/
├── frontend/                    # Next.js 14
│   ├── src/app/                 # App Router — páginas y API routes
│   ├── src/components/          # Componentes reutilizables
│   ├── src/services/            # Clientes HTTP (api.ts, subscription.service.ts)
│   ├── src/utils/               # Helpers (currency.ts, etc.)
│   ├── src/types/               # TypeScript types
│   └── public/                  # Assets estáticos (logo.svg, favicon.png)
├── backend/                     # Express API
│   ├── src/controllers/         # Lógica de negocio
│   ├── src/routes/              # Definición de rutas
│   ├── src/middleware/          # Auth, admin, rate limiting
│   ├── src/config/              # supabase.ts (anon + admin clients)
│   ├── src/services/            # Servicios externos (n8n, MinIO, email)
│   └── src/jobs/                # Cron jobs (cleanup, subscription check)
├── scripts/                     # Deploy y utilidades
│   └── _deploy_now.py           # Script de deploy al VPS
└── .kiro/steering/              # ← LEER SIEMPRE. Documentación del proyecto
    ├── architecture.md          # Este archivo — arquitectura completa
    ├── brand.md                 # Identidad visual y marca
    ├── tools-and-credentials.md # Credenciales y accesos
    ├── deploy-workflow.md       # Flujo de deploy paso a paso
    └── REGLAS_IMPORTANTES.md    # Reglas críticas del proyecto
```

---

## Base de Datos — Tablas Supabase

### `brands` (54 registros)
Tabla principal. Cada marca es un cliente del SaaS.

| Campo clave | Tipo | Descripción |
|-------------|------|-------------|
| `id` | uuid PK | ID de la marca |
| `email` | text UNIQUE | Email de login |
| `password` | text | Hash bcrypt |
| `name` | text | Nombre de la marca |
| `slug` | text UNIQUE | URL del widget (`/pruebalo/slug`) |
| `plan` | enum | `BASIC` o `PRO` |
| `subscription_status` | enum | `active`, `expiring_soon`, `expired`, `suspended` |
| `subscription_start_date` | timestamptz | Inicio de suscripción |
| `subscription_end_date` | timestamptz | Fin de suscripción |
| `trial_end_date` | timestamptz | Fin del período de prueba |
| `trial_generations_limit` | int | Límite de generaciones en trial (default 30) |
| `has_landing_page` | bool | Si tiene mini-landing activa |
| `landing_suspended_at` | timestamptz | Fecha de suspensión de landing (NULL = activa) |
| `email_verified` | bool | Si verificó el email |
| `widget_template` | varchar | `minimal`, `modern`, `bold` |
| `landing_template` | text | `classic`, `editorial`, `probador`, `moderno` |
| `primary_color` | text | Color primario del widget (#hex) |
| `logo` | text | URL del logo en MinIO |
| `logo_light` | text | Logo para fondos oscuros |
| `logo_dark` | text | Logo para fondos claros |
| `cover_image_url` | text | Imagen de portada de la landing |
| `social_links` | jsonb | `{instagram, facebook, tiktok, website}` |
| `schedule` | jsonb | Horarios de atención |
| `reset_token` | varchar | Token de reset de contraseña |

RLS: cada marca solo puede leer/editar sus propios datos.
**Backend SIEMPRE usa `supabaseAdmin` (service role) — bypasea RLS completamente.**

---

### `products` (174 registros)
Productos del catálogo de cada marca.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `name` | text | Nombre del producto |
| `description` | text | Descripción |
| `image_url` | text | URL en MinIO |
| `category` | text | Categoría del producto |
| `is_active` | bool | Si está activo en el widget |
| `price` | int | Precio en COP (nullable) |
| `badge` | text | `nuevo`, `top`, `oferta` (nullable) |

Límites por plan: BASIC = 5 productos activos, PRO = 15 productos activos.

---

### `generations` (14 registros)
Historial de pruebas virtuales generadas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands | |
| `product_id` | uuid FK → products | |
| `selfie_url` | text | URL de la selfie en MinIO |
| `result_image_url` | text | URL del resultado en MinIO |
| `status` | enum | `PENDING`, `SUCCESS`, `FAILED` |
| `error_message` | text | Mensaje de error si falló |
| `processing_time` | int | Tiempo en ms |
| `prompt_used` | text | Prompt enviado a la IA |

Límites por plan: BASIC = 400/mes, PRO = 1200/mes.

---

### `generation_feedback` (0 registros)
Feedback de calidad de las generaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `generation_id` | uuid FK → generations | |
| `brand_id` | uuid FK → brands | |
| `error_type` | enum | `wrong_clothing_removed`, `wrong_clothing_kept`, `body_distortion`, `color_wrong`, `product_not_applied`, `background_changed`, `other` |
| `description` | text | Descripción del problema |
| `embedding` | vector | Embedding para RAG (Gemini) |
| `resolved` | bool | Si fue resuelto |

---

### `subscription_payments` (1 registro)
Historial de pagos de suscripciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `brand_id` | uuid FK → brands | |
| `amount` | numeric | Monto (en COP para Wompi, en USD para PayPal) |
| `currency` | varchar | `COP` (Wompi) o `USD` (PayPal) |
| `payment_method` | varchar | `wompi`, `paypal`, `credit_proration`, `manual` |
| `status` | varchar | `completed`, `pending`, `failed`, `refunded` |
| `months_paid` | int | Meses pagados (1-24) |
| `notes` | text | Notas internas (referencia, plan, etc.) |

---

### `pricing_config` (6 registros)
Configuración dinámica de precios. Editable desde `/admin/pricing`.

| ID | Contenido |
|----|-----------|
| `basic` | `{ precio_mensual_cop: 150000, nombre, descripcion, features[], generaciones_mes, productos_max }` |
| `pro` | `{ precio_mensual_cop: 250000, nombre, descripcion, features[], generaciones_mes, productos_max }` |
| `descuentos_duracion` | `{ meses_1: 0, meses_3: 5, meses_6: 10, meses_12: 15 }` (porcentajes) |
| `metas` | `{ mrr_objetivo, clientes_objetivo, ... }` |
| `costos_operativos` | `{ costo_por_generacion, ... }` |
| `landing` | `{ precio: 650000, precio_original: 900000 }` |

RLS: lectura pública (anon key), escritura solo service role.

---

### `payment_settings` (1 registro, id=1)
Configuración de pasarelas de pago. Editable desde `/admin/payment-settings`.

Campos clave:
- `wompi_enabled`, `wompi_public_key`, `wompi_private_key`, `wompi_events_secret`, `wompi_integrity_secret`, `wompi_test_mode`
- `paypal_enabled`, `paypal_client_id`, `paypal_client_secret`, `paypal_sandbox`
- `manual_enabled`, `manual_whatsapp`, `manual_email`
- `landing_price`, `landing_original_price`
- `trm` — Tasa de cambio COP→USD usada para calcular montos PayPal (ej: 3900)

---

### `coupons` (0 registros)
Cupones de descuento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `code` | text UNIQUE | Código del cupón (uppercase) |
| `discount_type` | enum | `pct` (porcentaje) o `fixed` (monto fijo) |
| `discount_value` | numeric | Valor del descuento |
| `max_uses` | int | Usos máximos (null = ilimitado) |
| `uses_count` | int | Usos actuales |
| `expires_at` | timestamptz | Fecha de expiración (null = sin expiración) |
| `plan_ids` | text[] | Planes aplicables (vacío = todos) |
| `active` | bool | Si está activo |

RLS: solo service role puede CRUD. El backend usa `supabaseAdmin` para todas las operaciones.

---

### `promotions` (0 registros)
Promociones activas en el sitio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `type` | enum | `modal_timer`, `coupon`, `banner`, `plan_override`, `launch_offer` |
| `name` | text | Nombre interno |
| `config` | jsonb | Configuración específica del tipo |
| `active` | bool | Si está activa |
| `starts_at` / `ends_at` | timestamptz | Rango de fechas |

---

### `admins` (2 registros)
Administradores del panel.

| Campo | Tipo |
|-------|------|
| `email` | text UNIQUE |
| `password` | text (bcrypt) |
| `role` | text (default `admin`) |
| `permissions` | text[] |

---

### `admin_notifications` (16 registros)
Notificaciones del sistema para admins. Insertadas por n8n Error Handler.

| Campo | Tipo |
|-------|------|
| `type` | text |
| `title` | text |
| `message` | text |
| `severity` | text (`info`, `warning`, `error`) |
| `brand_id` | uuid FK → brands (nullable) |
| `metadata` | jsonb |

---

### `trial_campaigns` (1 registro)
Campañas de trial activas.

| Campo | Tipo |
|-------|------|
| `name` | text |
| `active` | bool |
| `trial_days` | int (default 7) |
| `trial_generations_limit` | int (1-500, default 50) |
| `require_card_verification` | bool |
| `ends_at` | timestamptz (nullable) |

---

### `trial_registrations` (3 registros)
Registros de trial por IP/fingerprint (anti-abuso).

| Campo | Tipo |
|-------|------|
| `brand_id` | uuid FK → brands |
| `campaign_id` | uuid FK → trial_campaigns |
| `ip_address` | text |
| `fingerprint` | text (nullable) |

---

### `pending_registrations`
Registros de pago pendiente para usuarios sin cuenta (checkout público sin sesión).
Se crea al generar la URL de Wompi/PayPal, se marca como `paid` cuando el webhook confirma el pago.
El usuario luego completa el registro en `/registro-pro?ref=REFERENCIA`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `email` | text | Email del visitante |
| `reference` | text UNIQUE | Referencia de pago |
| `plan` | text | Plan a activar |
| `months` | int | Meses a activar |
| `includes_landing` | bool | Si incluye landing page |
| `amount` | numeric | Monto pagado |
| `status` | text | `pending` → `paid` |
| `payment_id` | text | ID de transacción (Wompi ID o PayPal orderId) |

---

### `admin_notification_preferences` (16 registros)
Preferencias de notificaciones por tipo.

---

## Backend — Rutas API

Base URL: `https://api.pruebalo.wilkiedevs.com/api`

### Auth (`/api/auth/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | Público | Registro con Turnstile |
| POST | `/auth/login` | Público | Login → JWT |
| POST | `/auth/logout` | JWT | Logout |
| POST | `/auth/forgot-password` | Público | Envía email de reset |
| POST | `/auth/reset-password` | Público | Confirma reset con token |
| GET | `/auth/verify-email` | Público | Verifica email con token |

### Brands (`/api/brands/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/brands/me` | JWT | Perfil de la marca |
| PUT | `/brands/me` | JWT | Actualizar perfil |
| GET | `/brands/:slug` | Público | Perfil público por slug |

### Products (`/api/products/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/products` | JWT | Listar productos |
| POST | `/products` | JWT | Crear producto |
| PUT | `/products/:id` | JWT | Actualizar producto |
| DELETE | `/products/:id` | JWT | Eliminar producto |
| POST | `/upload` | JWT | Subir imagen a MinIO |

### Generations (`/api/generations/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/generations` | JWT | Crear generación (→ n8n) |
| GET | `/generations` | JWT | Historial |
| GET | `/generations/:id` | JWT | Detalle |

### Payments — Wompi (`/api/payments/wompi/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/payment-settings/public` | Público | Config pública de pagos |
| GET | `/payments/wompi/config` | JWT | Config Wompi para el plan |
| GET | `/payments/wompi/checkout-url` | JWT/Público | URL de checkout Wompi (COP) |
| GET | `/payments/wompi/upgrade-preview` | JWT | Calcula prorrateo de upgrade |
| POST | `/payments/wompi/apply-free-upgrade` | JWT | Aplica upgrade sin cobro |
| POST | `/payments/wompi/webhook` | HMAC Wompi | Webhook de eventos |

### Payments — PayPal (`/api/payments/paypal/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/payments/paypal/checkout-url` | JWT/Público | URL de checkout PayPal (USD, usa TRM) |
| POST | `/payments/paypal/capture` | Público | Captura el pago aprobado |

### Subscription (`/api/subscription/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/subscription` | JWT | Estado de suscripción |
| POST | `/subscription/activate` | JWT | Activar tras pago |

### Coupons (`/api/coupons/*` y `/api/admin/coupons/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/coupons/validate` | Público | Validar cupón |
| GET | `/admin/coupons` | Admin JWT | Listar cupones |
| POST | `/admin/coupons` | Admin JWT | Crear cupón |
| PUT | `/admin/coupons/:id` | Admin JWT | Actualizar cupón |
| DELETE | `/admin/coupons/:id` | Admin JWT | Eliminar cupón |

### Trial (`/api/trial/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/trial/register` | Público | Registrar trial |
| GET | `/trial/campaign` | Público | Campaña activa |

### Analytics y Usage
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/analytics` | JWT | Métricas de la marca |
| GET | `/usage` | JWT | Uso del mes |
| GET | `/admin/revenue` | Admin JWT | Ingresos globales |
| GET | `/admin/stats` | Admin JWT | Estadísticas globales |
| GET | `/admin/stats/conversion` | Admin JWT | Métricas de conversión |

### Pruebalo (widget público)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/pruebalo/:slug` | Público | Config del widget |
| POST | `/pruebalo/:slug/generate` | Público | Generar try-on |

---

## Frontend — Páginas

### Públicas (indexadas en sitemap)
| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | Server Component | Landing principal (precios hardcodeados para SEO) |
| `/planes` | Page | Página de planes y precios |
| `/register` | Page | Registro de marca |
| `/login` | Page | Login |
| `/sobre-nosotros` | Page | Sobre Lookitry |
| `/terminos` | Page | Términos y condiciones |
| `/politicas-privacidad` | Page | Política de privacidad |

### Públicas (NO indexadas)
| Ruta | Descripción |
|------|-------------|
| `/checkout` | Checkout público (precios dinámicos desde pricing_config). Wompi + PayPal. |
| `/pago-exitoso` | Confirmación de pago |
| `/trial-payment` | Pago de trial |
| `/trial-activado` | Confirmación de trial |
| `/verify-email` | Verificación de email |
| `/registro-pro` | Completa registro post-pago (usa `?ref=REFERENCIA` de pending_registrations) |
| `/pruebalo/[slug]` | Widget público de try-on |
| `/marca/[slug]` | Mini-landing pública de marca (variante) |
| `/sitio/[slug]` | Mini-landing pública de marca (ruta oficial) |
| `/embed/[slug]` | Embed del widget (iframe) |
| `/auth/callback` | Callback de auth |

### Dashboard (requieren JWT)
| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Home — stats y resumen |
| `/dashboard/products` | CRUD de productos |
| `/dashboard/generations` | Historial de generaciones |
| `/dashboard/analytics` | Métricas de uso |
| `/dashboard/usage` | Contador del mes |
| `/dashboard/subscription` | Estado de suscripción |
| `/dashboard/checkout` | Checkout interno — renovar plan, upgrade BASIC→PRO con prorrateo. Wompi + PayPal. |
| `/dashboard/checkout-landing` | Checkout exclusivo para comprar mini-landing. Wompi + PayPal. |
| `/dashboard/settings` | Configuración del widget |
| `/dashboard/embed` | Código de integración |
| `/dashboard/mi-pagina` | Editor de mini-landing |
| `/dashboard/profile` | Perfil de la marca |

### Admin (requieren Admin JWT)
| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Login de admin |
| `/admin/dashboard` | Métricas globales |
| `/admin/brands` | Gestión de marcas |
| `/admin/subscriptions` | Gestión de suscripciones |
| `/admin/payments` | Historial de pagos |
| `/admin/revenue` | Ingresos y proyecciones |
| `/admin/pricing` | Editor de precios dinámicos (pricing_config) |
| `/admin/payment-settings` | Configuración de pasarelas (Wompi, PayPal, TRM) |
| `/admin/marketing/promotions` | Cupones y promociones |
| `/admin/mini-landings` | Gestión de mini-landings |
| `/admin/analytics` | Analytics globales |
| `/admin/feedback` | Feedback de generaciones |
| `/admin/notifications` | Notificaciones del sistema |
| `/admin/health` | Estado del sistema |
| `/admin/configuracion` | Configuración general |
| `/admin/admins` | Gestión de administradores |
| `/admin/conversion` | Métricas de conversión |
| `/admin/profile` | Perfil del admin |

### API Routes (Next.js)
| Ruta | Descripción |
|------|-------------|
| `/api/coupons/validate` | Proxy de validación de cupones |
| `/api/promotions` | Obtener promociones activas |
| `/api/pricing` | Obtener config de precios |
| `/api/admin/*` | Rutas admin del frontend |
| `/api/img-proxy` | Proxy de imágenes |
| `/api/download` | Descarga de imágenes generadas |

---

## Frontend — Componentes Clave

| Componente | Ruta | Descripción |
|-----------|------|-------------|
| `UpgradeModal` | `components/dashboard/UpgradeModal.tsx` | Modal de upgrade (precios dinámicos) |
| `WompiButton` | `components/payments/WompiButton.tsx` | Botón de pago Wompi |
| `PromoModal` | `components/landing/PromoModal.tsx` | Modal de promoción en landing |
| `DashboardLayout` | `app/dashboard/layout.tsx` | Layout del dashboard con sidebar |
| `AdminLayout` | `app/admin/layout.tsx` | Layout del panel admin |
| `TryOnWidget` | `components/tryon/TryOnWidget.tsx` | Widget de prueba virtual. Props: `brandSlug`, `isEmbed`. Sin prop `initialProduct`. |
| `TemplateClassic/Editorial/Probador/Moderno` | `components/mini-landing/` | 4 templates de mini-landing |

---

## Flujos Principales

### Flujo de Registro
1. Usuario llena formulario en `/register`
2. Cloudflare Turnstile valida que no es bot
3. `POST /api/auth/register` crea la marca en `brands`
4. Se envía email de verificación via SMTP
5. Usuario verifica email en `/verify-email`
6. Redirige a `/dashboard` con JWT

### Flujo de Pago — Wompi (SOLO COP)
> Wompi solo acepta COP. **No importa qué moneda muestre el frontend — el backend siempre envía COP.**

1. Usuario va a `/checkout?plan=BASIC` o `/dashboard/checkout`
2. Frontend carga precios desde `pricing_config` via Supabase REST
3. Usuario selecciona plan, meses, aplica cupón opcional
4. `GET /api/payments/wompi/checkout-url?amount=150000&months=1&plan=BASIC` genera URL de Wompi
5. Backend crea referencia `WOMPI-{brandId}-M1-PBASIC-{timestamp}`
6. El monto se pasa en COP → Wompi lo convierte a centavos internamente (`amount_in_cents = amount * 100`)
7. Usuario paga en Wompi (tarjeta, PSE, nequi, etc.)
8. Wompi envía webhook a `POST /api/payments/wompi/webhook`
9. Backend verifica firma HMAC SHA-256, extrae plan/meses de la referencia
10. Activa suscripción en `brands`, inserta `subscription_payments` (currency: 'COP')
11. Envía email de confirmación y redirige usuario a `/pago-exitoso`

> ⚠️ **Si el selector de moneda está en USD y el usuario intenta pagar con Wompi:**
> Wompi solo procesa COP. El frontend siempre envía el `amount` en COP al backend. El selector de moneda en el frontend es SOLO visual — convierte la pantalla de COP a USD para que el usuario vea el equivalente, pero el pago se procesa en COP. Si el usuario selecciona USD y luego intenta pagar con Wompi, el frontend **debería** forzar el método a PayPal. **Verificar que esto esté implementado en el checkout.**

### Flujo de Pago — PayPal (USD, con TRM)
> PayPal procesa en USD. El TRM (Tasa Representativa del Mercado) convierte el monto COP a USD.

1. Usuario selecciona PayPal como método de pago
2. Frontend envía `amount` en COP + `trm` (obtenido de `payment_settings.trm`)
3. `GET /api/payments/paypal/checkout-url?amount=150000&plan=BASIC&months=1&trm=3900`
4. Backend: `amountUSD = Math.ceil(150000 / 3900) = 39 USD`
5. PayPal crea orden por $39 USD
6. Usuario da clic en "Pagar con PayPal" → redirigido a PayPal
7. Usuario aprueba el pago en PayPal
8. Frontend llama a `POST /api/payments/paypal/capture { orderId, reference }`
9. Backend captura el pago en PayPal, lee el monto real en USD capturado
10. Activa suscripción, inserta `subscription_payments` (currency: 'USD', amount: 39)

> ⚠️ **Si el usuario paga en USD con PayPal siendo la moneda del checkout en USD:**
> El flujo funciona correctamente. El `amount` siempre se envía en COP internamente y el backend convierte a USD con el TRM. El TRM se actualiza manualmente desde `/admin/payment-settings`.

### Flujo de Upgrade con Prorrateo (BASIC → PRO)
1. Usuario con BASIC activo selecciona PRO en `/dashboard/checkout`
2. Frontend detecta `isUpgrade = true` y llama a `GET /api/payments/wompi/upgrade-preview`
3. Backend calcula:
   - `pricePerDay = precioTotalPagadoPlanActual / díasTotalesDelPlan`
   - `creditAmount = pricePerDay × díasRestantes`
   - `amountToPay = max(0, precioNuevoPlan - creditAmount)`
   - `newEndDate = now() + mesesNuevos` (siempre desde hoy, no acumula sobre fecha anterior)
4. Frontend muestra desglose: precio PRO, crédito descontado, total a pagar
5a. Si `amountToPay = 0` → botón "Activar sin costo" → `POST /api/payments/wompi/apply-free-upgrade` → plan cambia inmediatamente, se registra pago con monto $0 en `subscription_payments`
5b. Si `amountToPay > 0` → se genera URL de Wompi con el monto prorateado → flujo normal de pago
6. Webhook detecta automáticamente si es upgrade comparando `plan` de la referencia vs `brand.plan` actual → llama `renewSubscription(..., isUpgrade: true)`
7. `renewSubscription` con `isUpgrade: true` usa `newStartDate = now()` en lugar de extender desde la fecha de fin anterior

**Reglas clave del prorrateo:**
- La landing page (pago único) no entra en el cálculo del crédito — se suma por separado si el usuario la agrega
- Los límites del nuevo plan (generaciones/mes, productos activos) aplican inmediatamente al cambiar el plan
- Las generaciones ya usadas en el mes en curso no se borran ni se recuperan
- El crédito nunca genera reembolso monetario — solo descuenta del precio del nuevo plan

### Flujo de Try-On
1. Usuario sube selfie en el widget (`/pruebalo/[slug]`)
2. `POST /api/pruebalo/:slug/generate` valida créditos y plan
3. Backend llama al webhook de n8n `wPLypk7KhBcFLicX`
4. n8n procesa con OpenRouter (modelo de imagen)
5. Resultado se guarda en MinIO y en `generations`
6. Frontend hace polling hasta `status = SUCCESS`
7. Muestra imagen resultante

### Flujo de Trial
1. Usuario va a `/register` con campaña activa
2. Se registra, se crea marca con `trial_end_date = now() + trial_days`
3. Se registra IP/fingerprint en `trial_registrations` (anti-abuso)
4. Usuario puede generar hasta `trial_generations_limit` pruebas
5. Al vencer el trial, se muestra `UpgradeModal` para activar plan

---

## Selector de Moneda — Comportamiento con Wompi y PayPal

El checkout (`/checkout` y `/dashboard/checkout`) tiene un selector visual de moneda (COP/USD).

### ¿Qué hace el selector?
- Es **SOLO visual**: muestra precios en la moneda seleccionada para facilitar la comprensión al usuario
- El precio en USD se calcula en el frontend: `precioUSD = Math.ceil(precioCOP / trm)`
- El TRM viene de `payment_settings.trm` (configurable desde `/admin/payment-settings`)

### Flujos por combinación moneda + método de pago:

| Moneda mostrada | Método de pago | Comportamiento real |
|-----------------|----------------|---------------------|
| COP | Wompi | ✅ Normal — `amount` en COP → Wompi procesa en COP |
| USD | Wompi | ⚠️ **Problema potencial** — Wompi **no acepta USD**. El backend siempre recibe `amount` en COP. Si el frontend envía el monto en USD al endpoint de Wompi, el pago será por el equivalente en USD tratado como COP (ej: $39 COP en vez de $150.000 COP). **Verificar que el frontend envíe siempre COP a Wompi independientemente de la moneda mostrada.** |
| COP | PayPal | ✅ Normal — `amount` en COP + `trm` → backend convierte a USD. Usuario paga en USD. |
| USD | PayPal | ✅ Normal — el `trm` del frontend ya se usó para mostrar el precio. Backend toma el `amount` original en COP + `trm` para calcular USD de PayPal. |

### Riesgo detectado:
Si el usuario ve el precio en USD y el frontend envía ese monto USD como `amount` a Wompi (en vez del monto COP original), el pago sería **incorrecto** (factor ~4000x menor). Ver sección de verificación pendiente.

---

## Variables de Entorno

### Backend (`backend/.env`)
```
PORT=3001
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...   # NUNCA exponer en frontend
JWT_SECRET=...
N8N_WEBHOOK_URL=https://n8n.wilkiedevs.com/webhook/tryon
N8N_API_KEY=eyJ...
N8N_BEARER_TOKEN=Travis2305**
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_EVENTS_SECRET=test_events_...
WOMPI_INTEGRITY_SECRET=test_integrity_...
WOMPI_ENABLED=true
TURNSTILE_SECRET_KEY=0x4AAAA...
TURNSTILE_ENABLED=true
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@pruebalo.wilkiedevs.com
SMTP_PASS=Travis2305*
MINIO_ENDPOINT=https://minio.wilkiedevs.com
MINIO_BUCKET=images
MINIO_ACCESS_KEY=Wilkiedevs
MINIO_SECRET_KEY=Travis2305*
FRONTEND_URL=https://pruebalo.wilkiedevs.com
VPS_HOST=31.220.18.39
VPS_USER=root
VPS_PASS=Travis18456916#
GITHUB_TOKEN=ghp_...
```

### Frontend (`frontend/.env.local` — local, no se sube a git)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # Solo anon key, nunca service key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACsmy7e_yL9iyAXM
```

---

### Reglas de Negocio Clave

#### Dependencia de Recursos (MANDATORIO)
- **Mini-landing:** Requiere obligatoriamente un plan **BASIC** o **PRO** activo. 
- Si la suscripción expira o se cancela, la mini-landing se suspende automáticamente (`landing_suspended_at` se llena).
- Un usuario en **TRIAL** puede previsualizar la landing en el dashboard, pero para activarla públicamente debe adquirir un plan junto con el pago único de la landing.

#### Planes
- `TRIAL`: período de prueba temporal, badge violeta `#6366f1`, independiente de BASIC/PRO.
- `BASIC`: $150.000 COP/mes, 5 productos activos, 400 generaciones/mes.
- `PRO`: $250.000 COP/mes, 15 productos activos, 1.200 generaciones/mes.
- `LANDING`: pago único $650.000 COP, requiere plan BASIC o PRO activo.

### Descuentos por duración
- 1 mes: 0%
- 3 meses: 5%
- 6 meses: 10%
- 12 meses: 15%

### Lógica de upgrade con prorrateo (BASIC → PRO)

Implementada en `SubscriptionService` (`backend/src/services/subscription.service.ts`):

- `calculateUpgradeProration(brandId, newPlan, newMonths, newPlanPricePerMonth, currentPlanPriceTotal)` — calcula crédito proporcional y monto a cobrar
- `applyFreeUpgrade(brandId, newPlan, newMonths, creditAmount, newPlanTotal, reference)` — aplica upgrade sin cobro, registra en `subscription_payments` con `amount=0` y `payment_method='credit_proration'`
- `renewSubscription(brandId, CreatePaymentDto, months, plan?, isUpgrade?)` — cuando es upgrade, `newStartDate = now()` (no acumula sobre fecha anterior)

Fórmula del crédito:
```
pricePerDay = precioTotalPagado / díasTotalesDelPlan
creditAmount = pricePerDay × díasRestantes
amountToPay = max(0, precioNuevoPlan - creditAmount)
newEndDate = now() + mesesNuevos
```

La landing page (pago único) no entra en el cálculo — se suma por separado al `amountToPay` si el usuario la agrega en el mismo checkout.

### Mini-landing
- `has_landing_page = true` → landing activa
- `landing_suspended_at` no nulo → suspendida por falta de pago
- Después de 90 días suspendida → `has_landing_page = false` (eliminada)

### Precios dinámicos
- Los precios en checkout (público y dashboard) se cargan desde `pricing_config` en Supabase
- Fallback estático si falla la carga: BASIC $150.000, PRO $250.000
- La landing (`/`) mantiene precios hardcodeados intencionalmente para SEO/SSR

---

## Supabase — Clientes en Backend

```typescript
// backend/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Anon key — respeta RLS (para operaciones de usuario)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Service role — bypasea RLS (para operaciones admin)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
```

**Regla CRÍTICA**: El backend usa JWT propio (no Supabase Auth). El cliente `supabase` anon NUNCA tiene sesión activa — RLS bloquea todo. Por eso **SIEMPRE usar `supabaseAdmin`** en servicios y controllers del backend.

Excepciones permitidas que usan `supabase` anon:
- `health.controller.ts` — ping de salud
- Frontend lee `pricing_config` y `promotions` directo desde Supabase (tablas con RLS público)

---

## n8n — Workflows

| Workflow | ID | Webhook | Descripción |
|----------|-----|---------|-------------|
| Try-On principal | `wPLypk7KhBcFLicX` | `/webhook/tryon` | Genera la prueba virtual |
| Error Handler | `PNri7NdZYkZhpPnm` | errorWorkflow | Maneja errores del Try-On |
| Feedback embedding | `47RcLopJB6M82b0k` | Flujo4 | Embeddings de feedback |
| Descriptor IA | `ZjVTV3QxoPEi60GX` | — | Describe productos con IA |

Todos tienen el tag `SaaS`. Bearer token: `Travis2305**`.

---

## Cloudflare Turnstile

| Clave | Valor |
|-------|-------|
| Site Key (frontend) | `0x4AAAAAACsmy7e_yL9iyAXM` |
| Secret Key (backend) | `0x4AAAAAACsmy2ZsVW10HlNhDRP-ihDmo3o` |

Activar/desactivar sin redeploy: cambiar `TURNSTILE_ENABLED=true/false` en VPS.

---

## Deploy

```bash
# Desde Mostrador_wilkiedevs/
git add -A
git commit -m "descripción"
git pull origin main --rebase
git push origin main

# Solo frontend
python scripts/_deploy_now.py --frontend

# Solo backend
python scripts/_deploy_now.py --backend

# Ambos
python scripts/_deploy_now.py

# Solo reiniciar (sin rebuild, ~5s)
python scripts/_deploy_now.py --restart
```

**IMPORTANTE**: nunca hacer deploy sin que el usuario lo pida explícitamente.

---

## Historial de Cambios Importantes

### Resolución de conflictos de merge Git (21/03/2026)
El archivo `architecture.md` tenía marcadores de conflicto Git (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) sin resolver. Limpiados y fusionados manualmente conservando la versión más completa (HEAD).

### Correcciones de TypeScript (21/03/2026)
| Archivo | Error | Fix |
|---------|-------|-----|
| `paypal.routes.ts` | `captureOrder` no existía | → `capturePayment` |
| `payments.routes.ts` | `brandAuthMiddleware` no exportado | → `authMiddleware` |
| `paypal.controller.ts` | `renewSubscription` firma incorrecta | → `(brandId, CreatePaymentDto, months, plan)` |
| `paypal.service.ts` | Método `getOrder()` faltaba | → Añadido |
| `admin/analytics/page.tsx` | `api.get()` retorna `{data, status}` | → `const { data } = await api.get<T>(...)` |
| `admin/conversion/page.tsx` | Mismo problema | → Mismo fix |
| `TemplateModerno.tsx` | Prop `initialProduct` no existe | → Eliminada |
| `TemplateEditorial.tsx` | Mismo problema | → Eliminada |
| `.eslintrc.json` | `"next/typescript"` no válido en Next.js 14 | → Removida |

### Adición de PayPal (marzo 2026)
- `PaypalService` — OAuth2, `createOrder`, `captureOrder`, `getOrder`
- `PaypalController` — `getCheckoutUrl`, `capturePayment`
- `paypal.routes.ts` + `payments.routes.ts`
- `auth-post-payment.controller.ts` — activa suscripción post-pago PayPal para nuevos registros
- Frontend: selector Wompi/PayPal en los 3 checkouts

### Migración completa `supabase` anon → `supabaseAdmin` en el backend
**Problema raíz:** El backend usa JWT propio (no Supabase Auth). RLS bloquea todas las consultas con anon key.
**Solución:** Todos los servicios y controllers del backend usan `supabaseAdmin`.

### Corrección del servicio de email (SMTP)
- Transporter se crea fresco en cada llamada (no se cachea)
- Puerto 465 fuerza `secure: true` automáticamente
- Timeouts explícitos añadidos

### Email de confirmación de compra en webhook Wompi
Después de `renewSubscription()`, se consulta la marca actualizada y se llama a `notificationService.sendRenewalConfirmation()`.

### Logo en templates de email
El `baseTemplate` muestra el logo de Lookitry (`https://pruebalo.wilkiedevs.com/logo.svg`) en el header de todos los emails.



============================================================
# END SECTION -- BEGIN: .kiro/steering/brand.md
============================================================

---
inclusion: always
---

# Lookitry — Identidad de Marca

## Nombre y escritura

- Nombre oficial: **Lookitry**
- En JSX siempre: `Look<span className="text-[#FF5C3A]">itry</span>`
- NUNCA usar "VirtualTryOn", "Virtual Try On", "Mostrador" ni variantes antiguas en UI pública.

## Descripción del producto

Lookitry es un probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica. Permite a las marcas integrar un widget de prueba virtual en su tienda en minutos, sin apps ni desarrollo adicional.

- Mercado objetivo: Colombia, México, Argentina, Chile, Perú
- Idioma principal: Español
- Propuesta de valor: "Pruébalo antes de comprarlo" — reduce devoluciones y aumenta conversión

## Paleta de colores corporativos

| Nombre           | Hex       | Uso principal                                      |
|------------------|-----------|----------------------------------------------------|
| Naranja Lookitry | `#FF5C3A` | Color de marca, CTAs, acentos, ítem activo en nav  |
| Negro base       | `#0a0a0a` | Fondo principal (modo oscuro)                      |
| Negro card       | `#141414` | Fondo de tarjetas y paneles                        |
| Crema / Beige    | `#f5f2ee` | Fondo alternativo claro, secciones landing         |
| Blanco           | `#ffffff` | Texto principal sobre fondos oscuros               |

### Grises (modo oscuro — regla de legibilidad)

| Uso                        | Valor mínimo |
|----------------------------|--------------|
| Texto secundario / ayuda   | `#999`       |
| Texto de features / listas | `#bbb`       |
| Texto muy sutil (mínimo)   | `#666`       |
| PROHIBIDO para texto       | `#333`, `#444`, `#555` |

## Archivos de marca

| Archivo                                    | Estado       | Uso                                         |
|--------------------------------------------|--------------|---------------------------------------------|
| `frontend/public/logo.svg`                 | ✅ Activo    | Logo principal — usar en TODAS las páginas  |
| `frontend/public/favicon.png`              | ✅ Activo    | Favicon del sitio                           |
| `templates-webs/Lookitry-logo - copia.svg` | ✅ Fuente    | Original SVG fuente                         |
| `templates-webs/Lookitry-favicon.png`      | ✅ Fuente    | Original favicon fuente                     |
| `frontend/public/logo.png`                 | ❌ Obsoleto  | NO usar — reemplazado por logo.svg          |
| `templates-webs/Lookitry-logo.png`         | ❌ Obsoleto  | NO usar — reemplazado por SVG               |

## Tipografía

- Títulos / marca: **Plus Jakarta Sans** (`--font-jakarta`) — pesos 400–800
- Cuerpo / UI: **DM Sans** (`--font-dm-sans`) — pesos 300–500

## Variables CSS del sistema de diseño

```css
var(--bg-base)          /* Fondo principal */
var(--bg-card)          /* Fondo de tarjetas */
var(--bg-sidebar)       /* Fondo del sidebar */
var(--bg-sidebar-hover) /* Hover en sidebar */
var(--bg-header)        /* Fondo del header sticky */
var(--bg-hover)         /* Hover genérico */
var(--border-color)     /* Bordes */
var(--text-primary)     /* Texto principal */
var(--text-secondary)   /* Texto secundario */
var(--text-muted)       /* Texto muy sutil */
var(--text-sidebar)     /* Texto en sidebar */
var(--shadow-header)    /* Sombra del header */
```

## Colores de estado / severidad

| Estado  | Color     |
|---------|-----------|
| Info    | `#3b82f6` |
| Warning | `#f59e0b` |
| Error   | `#ef4444` |
| Success | `#10b981` |

## Planes del producto

| Plan    | Precio           | Descripción                                      |
|---------|------------------|--------------------------------------------------|
| TRIAL   | Gratis temporal  | Badge violeta `#6366f1`. Independiente de BASIC. |
| BASIC   | $150.000 COP/mes | 5 productos, 400 generaciones/mes                |
| PRO     | $250.000 COP/mes | 15 productos, 1.200 generaciones/mes             |
| LANDING | Pago único       | Mini-landing personalizada                       |

## Toggle / Switch

- Color activo: `#FF5C3A` (NUNCA `bg-blue-600`)

## URLs del sistema

| Servicio   | URL                                   |
|------------|---------------------------------------|
| Frontend   | `https://pruebalo.wilkiedevs.com`     |
| API        | `https://api.pruebalo.wilkiedevs.com` |
| n8n        | `https://n8n.wilkiedevs.com`          |
| MinIO      | `https://minio.wilkiedevs.com`        |

## Infraestructura — IDs y referencias clave

| Recurso              | ID / Valor                                      |
|----------------------|-------------------------------------------------|
| Supabase Project ID  | `vkdooutklowctuudjnkl`                          |
| Supabase URL         | `https://vkdooutklowctuudjnkl.supabase.co`      |
| VPS ID (Hostinger)   | `1004711`                                       |
| VPS IP               | `31.220.18.39`                                  |
| Docker project       | `virtual-tryon`                                 |
| GitHub repo          | `https://github.com/depper-IA/virtual-tryon.git`|

## Workflows n8n (IDs — no cargar archivos para consultarlos)

| Workflow                        | ID                   | Webhook / Uso                                          |
|---------------------------------|----------------------|--------------------------------------------------------|
| Try-On principal                | `wPLypk7KhBcFLicX`   | `/webhook/tryon`                                       |
| Error Handler (OpenRouter)      | `PNri7NdZYkZhpPnm`   | errorWorkflow del Try-On — escribe en admin_notifications |
| Feedback embedding              | `47RcLopJB6M82b0k`   | Flujo4 — embeddings de feedback                        |
| Describir con IA                | `ZjVTV3QxoPEi60GX`   | Descriptor de productos                                |

Nodo clave en "Describir con IA": `03feeeff-f6bb-4eaf-92f8-4d67d2ba18fe` (Formatear respuesta) — devuelve `{ description, category, enrichedPrompt }`.
Todos los workflows tienen la etiqueta `SaaS`.

### Reglas de gestión de workflows en n8n

- Para buscar o filtrar workflows en n8n, usar siempre el tag `SaaS`.
- Al crear un nuevo workflow bajo consentimiento explícito del usuario, agregar obligatoriamente la etiqueta `SaaS` antes de guardar.
- Si se crea un workflow sin esa etiqueta, corregirlo inmediatamente.

### Error Handler — detalles
- Se activa automáticamente cuando el workflow principal falla en producción
- Clasifica el error: `credits_exhausted` (HTTP 402/429 o keywords "credits"/"insufficient") vs `service_down`
- Inserta directo en tabla `admin_notifications` via Supabase REST API (service role key)
- Recupera `brand_id` y `product_id` del contexto de ejecución fallida si están disponibles
- Archivo de referencia: `templates-webs/flujo5_error_handler_openrouter.json`


## Cloudflare Turnstile — antispam registro

| Clave | Valor |
|-------|-------|
| Site Key (pública, frontend) | `0x4AAAAAACsmy7e_yL9iyAXM` |
| Secret Key (privada, backend) | `0x4AAAAAACsmy2ZsVW10HlNhDRP-ihDmo3o` |
| Dashboard | https://dash.cloudflare.com → Turnstile |

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` va en `docker-compose.frontend.yml` como `build arg`
- `TURNSTILE_SECRET_KEY` y `TURNSTILE_ENABLED` van en `backend/.env`
- Para activar/desactivar sin redeploy: cambiar `TURNSTILE_ENABLED=true/false` en el VPS y hacer `--restart`

---

## Sitemap — Regla obligatoria

**Cada vez que se cree una nueva página pública**, actualizar `frontend/src/app/sitemap.ts`:
- Agregar la URL con `changeFrequency` y `priority` apropiados
- Páginas de contenido público (landing, planes, sobre-nosotros, términos, políticas): incluir
- Páginas privadas (dashboard, admin, checkout, pago-exitoso, trial-payment, etc.): NO incluir
- El archivo `robots.ts` también debe tener la ruta en `disallow` si es privada

Páginas públicas actuales en el sitemap:
| URL | Priority | Frecuencia |
|-----|----------|------------|
| `/` | 1.0 | weekly |
| `/planes` | 0.9 | weekly |
| `/register` | 0.8 | monthly |
| `/login` | 0.5 | monthly |
| `/sobre-nosotros` | 0.6 | monthly |
| `/terminos` | 0.4 | yearly |
| `/politicas-privacidad` | 0.4 | yearly |

---

## Favicon — Regla obligatoria

- El favicon correcto está en `frontend/public/favicon.png` (64x64, PNG válido)
- `frontend/src/app/favicon.ico` debe generarse desde ese PNG con múltiples resoluciones (16, 32, 48, 64px)
- `frontend/src/app/icon.png` debe ser copia de `frontend/public/favicon.png`
- Si el favicon deja de verse, regenerar con: `python -c "from PIL import Image; img=Image.open('frontend/public/favicon.png').convert('RGBA'); img.save('frontend/src/app/favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64)])"`

---

## Reglas de branding en nuevas páginas

1. **Logo siempre SVG + nombre de texto** — en TODAS las páginas del frontend sin excepción:
   - Usar `<Image src="/logo.svg" ... />` (nunca `logo.png`)
   - Junto al logo siempre mostrar: `Look<span className="text-[#FF5C3A]">itry</span>`
   - Aplica a: landing, login, register, dashboard, checkout, planes, términos, registro-pro, pago-exitoso, admin, y cualquier página creada a futuro
2. El favicon debe ser `favicon.png` en todos los layouts.
3. El color `#FF5C3A` es el único acento de marca — no introducir otros colores de acento.
4. Fondo oscuro por defecto en dashboards (`#0a0a0a`). Landing puede usar `#f5f2ee` como sección alternativa.
5. No usar emojis en UI — usar iconos SVG o `lucide-react`.
6. NUNCA mostrar solo el logo sin el nombre de texto, ni solo el nombre sin el logo.
7. Tamaños estándar del logo por contexto:
   - Sidebar / header dashboard: `h-7` o `h-8`
   - Páginas de auth (login, register): `h-8` o `h-10`
   - Landing pública (nav): `h-8`
   - Footer: `h-6`
8. En JSX el nombre siempre es: `Look<span className="text-[#FF5C3A]">itry</span>` — nunca texto plano "Lookitry".

## Flujo de trabajo Git y Deploy — Reglas obligatorias

### Antes de cualquier commit/push
1. Siempre hacer `git fetch origin` y revisar si hay commits nuevos en `main` que no están localmente.
2. Verificar si Juli (u otro colaborador) tiene cambios pendientes de subir — revisar el log remoto con `git log origin/main --oneline -10` antes de hacer push.
3. Hacer `git pull origin main --rebase` antes de cualquier push para integrar cambios remotos sin conflictos.
4. Si hay conflictos de merge, resolverlos antes de continuar.

### Antes de aplicar un deploy al VPS
1. Verificar el estado del repo remoto: `git log origin/main --oneline -5` para ver si hay commits recientes de otros colaboradores.
2. Si hay commits recientes de Juli u otro colaborador en los últimos minutos, esperar o coordinar antes de hacer deploy para no pisar sus cambios.
3. El VPS siempre jala del repo git (`git pull origin main`) — los cambios locales que no estén en git NO se despliegan.
4. Siempre verificar que el `git pull` en el VPS muestre los archivos modificados esperados, no solo "Already up to date".

### Flujo correcto de deploy
```
git add <archivos>
git commit -m "descripción"
git pull origin main --rebase   ← integrar cambios de otros
git push origin main
python scripts/_deploy_now.py --backend --frontend --no-cache
```



============================================================
# END SECTION -- BEGIN: .kiro/steering/context7-usage.md
============================================================

---
inclusion: manual
---

# Guía de uso de Context7 (optimización de tokens)

Context7 provee documentación actualizada de librerías directamente en contexto.
Úsalo con criterio para no desperdiciar tokens disponibles.

## Cuándo usar Context7

- Cuando necesites la API exacta de una librería (Next.js, Supabase, n8n, etc.)
- Cuando el comportamiento de una función no está claro por el código existente
- Cuando hay un error que podría ser de versión o de API desactualizada

## Cuándo NO usar Context7

- Para conceptos generales de TypeScript/React que ya conoces
- Para patrones que ya están implementados en el proyecto (lee el código existente primero)
- Para preguntas que se pueden responder leyendo el código del repo

## Cómo usarlo eficientemente

1. Primero usa `resolve-library-id` con el nombre exacto de la librería
2. Luego usa `query-docs` con una pregunta MUY específica — no preguntas amplias
3. Limita el topic al método o feature puntual que necesitas

## Librerías relevantes del proyecto (IDs verificados)

| Librería | Context7 ID | Notas |
|---|---|---|
| Next.js | `/vercel/next.js` | App Router, Server Components, middleware |
| Supabase | `/supabase/supabase` | Auth, RLS, queries, storage |
| n8n (docs oficiales) | `/n8n-io/n8n-docs` | API REST, nodos, webhooks, expresiones — 1149 snippets, reputación alta |
| n8n (código fuente) | `/n8n-io/n8n` | Internals, tipos TypeScript — usar si docs no alcanza |
| n8n (llms full) | `/llmstxt/n8n_io_llms-full_txt` | Máxima cobertura, 25K snippets — solo si los anteriores no tienen lo que buscas |

### n8n — queries útiles para este proyecto

- API REST PUT workflow: `n8n REST API update workflow nodes PUT /workflows/{id}`
- Expresiones en nodos HTTP: `n8n HTTP Request node body expressions JSON.stringify`
- Webhook response node: `n8n Respond to Webhook node response body`
- Settings válidos en API: `n8n workflow settings schema executionOrder callerPolicy`

## Ejemplo de query eficiente

MAL: "cómo funciona Next.js"
BIEN: "Next.js App Router middleware matcher config para rutas protegidas"



============================================================
# END SECTION -- BEGIN: .kiro/steering/deploy-workflow.md
============================================================

# Deploy y Verificación del Proyecto

## Infraestructura
- VPS: 31.220.18.39 (Hostinger)
- Deploy via script: `python scripts/_deploy_now.py` (desde la carpeta `Mostrador_wilkiedevs`)
- Backend: `--backend`, Frontend: `--frontend`, ambos: sin flags
- Sin caché: `--no-cache`

## Verificación rápida con MCP de Hostinger
Para chequear el estado del servidor, deployments y logs, usar el MCP de Hostinger en lugar de SSH manual o el script de deploy.

- Listar VMs: `mcp_hostinger_api_VPS_getVirtualMachinesV1`
- Ver detalles de VM: `mcp_hostinger_api_VPS_getVirtualMachineDetailsV1`
- Ver acciones recientes: `mcp_hostinger_api_VPS_getActionsV1`
- Ver métricas: `mcp_hostinger_api_VPS_getMetricsV1`

## Comandos de deploy
```bash
# Desde Mostrador_wilkiedevs/
git add -A; git commit -m "mensaje"
git push origin main
python scripts/_deploy_now.py              # backend + frontend
python scripts/_deploy_now.py --backend    # solo backend
python scripts/_deploy_now.py --frontend   # solo frontend
```

## URLs
- Frontend: https://pruebalo.wilkiedevs.com
- Backend API: https://api.pruebalo.wilkiedevs.com
- Health check: https://api.pruebalo.wilkiedevs.com/health



============================================================
# END SECTION -- BEGIN: .kiro/steering/juliana-workflow.md
============================================================

---
inclusion: always
---

# Flujo de trabajo — Juliana

## Rama de trabajo

**REGLA CRÍTICA:** Todos los cambios de código deben subirse a la rama `Juli`, NO a `main`.

```bash
# Antes de cualquier push, asegurarse de estar en la rama Juli
git checkout Juli
git add -A
git commit -m "descripción"
git push origin Juli
```

Si la rama `Juli` no existe localmente:
```bash
git checkout -b Juli origin/Juli
```

## Deploy

**PROHIBIDO hacer deploy** a menos que:
1. El usuario lo solicite explícitamente, O
2. Ya se esté realizando un deploy previo en la misma sesión

No ejecutar `_deploy_now.py` ni hacer merge a `main` de forma automática.

## Resumen

| Acción | Regla |
|--------|-------|
| Push de código | Siempre a rama `Juli` |
| Deploy al VPS | Solo con orden explícita del usuario |
| Merge a `main` | Solo con orden explícita del usuario |



============================================================
# END SECTION -- BEGIN: .kiro/steering/language-preference.md
============================================================

﻿---
inclusion: always
---

# Preferencia de Idioma

Responde siempre en español. Esto aplica a todas las conversaciones, sin excepción.

# Estilo de UI

No usar emojis en la interfaz de usuario. En su lugar, usar iconos SVG o componentes de iconos (por ejemplo, de `lucide-react` o iconos SVG inline) para mantener una apariencia profesional y consistente.

# Legibilidad de Textos en UI Oscura

El proyecto usa fondo oscuro (`#0a0a0a`, `#141414`). Los textos secundarios NUNCA deben usar grises muy oscuros como `#333`, `#444`, `#555`. Usar siempre variantes más claras tirando a blanco y legibles:

- Textos de ayuda / secundarios: `#999` o `#aaa`
- Textos de features / listas: `#bbb` o `#ccc`
- Textos de contacto / links secundarios: `#999`
- Precios tachados: `#666`
- Notas al pie: `#777`
- Textos muy sutiles (mínimo): `#666`

Regla general: en fondos oscuros, el texto más tenue visible debe ser al menos `#666`. Nunca usar `#333`, `#444` ni `#555` para texto legible.

# Nombre de Marca

El nombre del proyecto es **Lookitry**. NUNCA usar "Virtual Try-On SaaS", "VirtualTryOn" ni variantes antiguas en ningún lugar — ni en emails, ni en UI, ni en comentarios de código visibles al usuario.

Dirección de email para tests: **imfeermejias@gmail.com** — todos los tests de correo electrónico deben enviarse a esta dirección.

En el código JSX se escribe como:
```jsx
Look<span className="text-[#FF5C3A]">itry</span>
```
NUNCA usar "VirtualTryOn", "Virtual Try On" ni variantes antiguas en ningún componente de UI.

# Funcionalidades por Plan

- Plan PRO: el usuario puede modificar el slug del widget (la URL pública del probador).

# Planes del sistema — Regla crítica

Los planes del sistema son: **TRIAL**, **BASIC**, **PRO**, **LANDING**.

- **TRIAL**: plan gratuito temporal. Es un estado independiente, NO es BASIC. En la BD el campo `plan` puede ser `BASIC` pero `trial_end_date` no nulo y en el futuro indica que está en trial. `is_in_trial` NO es una columna de la BD — se calcula en el backend comparando `trial_end_date > now && subscription_status !== 'active' && subscription_status !== 'expiring_soon'`. En toda la UI del admin se debe mostrar como `TRIAL` (badge violeta `#6366f1`) cuando `is_in_trial === true`.
- **BASIC**: plan de pago mensual básico ($150.000 COP). Solo aplica cuando `is_in_trial = false`.
- **PRO**: plan de pago mensual avanzado ($250.000 COP).
- **LANDING**: pago único por mini-landing.

NUNCA mostrar `BASIC` para una marca que esté en trial. El filtro de plan en tablas admin debe incluir `TRIAL` como opción separada.

# Regla Crítica: APIs y Modelos de IA — Solo Versiones Gratuitas

PROHIBIDO usar modelos de IA de pago sin consentimiento explícito del usuario.

- Google Gemini: solo `gemini-1.5-flash` o `gemini-2.0-flash` (tier gratuito). NUNCA `gemini-1.5-pro` ni modelos de pago.
- Embeddings: usar `text-embedding-004` de Google (gratuito en tier free).
- OpenRouter: solo modelos con sufijo `:free`. NUNCA modelos sin ese sufijo.
- OpenAI, Anthropic u otras APIs de pago: PROHIBIDO sin autorización explícita.
- En n8n: verificar siempre que el modelo configurado sea gratuito antes de usarlo.
- Si hay duda sobre el costo de un modelo, preguntar antes de usarlo.

# Regla Crítica: Generación de Imágenes — Calidad máxima al menor costo

- La generación de imágenes debe mantener la máxima similitud con el producto original y la foto del usuario.
- NO reducir resolución, pasos de inferencia ni calidad del modelo de imagen para ahorrar costos.
- Los costos se reducen optimizando el PROMPT (más preciso = menos reintentos), no degradando el modelo.
- El sistema RAG de feedback existe precisamente para mejorar prompts y reducir generaciones fallidas (que son el verdadero costo).
- Reglas base por categoría de prenda (prompt-rules.ts) son OBLIGATORIAS antes de cualquier llamada al modelo.

# Credenciales de Acceso (uso interno — NO exponer en código)

## Supabase
- URL: `https://vkdooutklowctuudjnkl.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM`
- Service Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2NTY2NSwiZXhwIjoyMDg2MzQxNjY1fQ.NxXV0Too3Iadb0FGuC8powPUuaMPiF1TKIUVtGMyFpg`

## n8n
- URL base: `https://n8n.wilkiedevs.com`
- Webhook tryon: `https://n8n.wilkiedevs.com/webhook/tryon`
- Webhook descriptor: `https://n8n.wilkiedevs.com/webhook/descriptor`
- API Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGUxZTYyYi1kY2M0LTRiZGUtOWFjZS02OTBmMjAxMGIyMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZWE2NmI1N2ItNTBiNS00ZTViLWJhYzYtZDE2MWFkM2NkZTkzIiwiaWF0IjoxNzczMjc5MzMyfQ.ZuYsz4K4ifpp9ho_nZzpDypTy49_APNx9hkecKridJw`
- Bearer Token: `Travis2305**`

## VPS (Hostinger)
- Host: `31.220.18.39`
- Puerto: `22`
- Usuario: `root`
- Contraseña: `Travis18456916#`

## Hosting compartido (Hostinger SSH)
- Host: `92.112.189.47`
- Puerto: `65002`
- Usuario: `u639440667`
- Contraseña: `Travis2305*`

## MinIO Storage
- Endpoint: `https://minio.wilkiedevs.com`
- Bucket: `images`
- Access Key: `Wilkiedevs`
- Secret Key: `Travis2305*`
- URL pública: `https://minio.wilkiedevs.com`

## SMTP (Hostinger)
- Host: `smtp.hostinger.com`
- Puerto: `465` (SSL)
- Usuario: `info@pruebalo.wilkiedevs.com`
- Contraseña: `Travis2305*`

## Wompi (Colombia — modo test)
- Public Key: `pub_test_3X84dh5ArV79atO6WwNFznjK3kv45JI2`
- Private Key: `prv_test_ZrBx84WuuB6V7NDPf7Ed9XyRYhg77J1s`
- Events Secret: `test_events_ywYgTECX1VdqCmLiGPxeUYXzaJqIAVsg`
- Integrity Secret: `test_integrity_9tTBgHdvYU2yPEIapYGbeFvNCqrlfLQG`

## GitHub
- Token: `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`
- Repo: `https://github.com/depper-IA/virtual-tryon.git`

## OpenRouter
- API Key: `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`
- Solo usar modelos con sufijo `:free`

## JWT
- Secret: `virtual-tryon-saas-secret-key-change-in-production-2026`

# Flujo de trabajo — Deploy y desarrollo local

## REGLA CRÍTICA: Trabajo en LOCAL
**Actualmente estamos trabajando en LOCAL. El deploy al VPS se hará UNA SOLA VEZ al final, cuando el usuario lo indique explícitamente después de completar TODAS las tareas pendientes.**

- NO hacer deploy después de cada tarea.
- NO ejecutar `_deploy_now.py` ni `git push` salvo orden explícita del usuario.
- Todos los cambios se acumulan localmente hasta que el usuario diga "hacer deploy".

## Deploy
- Hacer deploy solo cuando el usuario lo indique explícitamente, NO después de cada tarea.
- Acumular todos los cambios y hacer un único deploy al final con: `git add -A; git commit -m "..."; git push` seguido de `python scripts/_deploy_now.py` con el flag apropiado (`--frontend`, `--backend`, o sin flag para ambos).
- Usar `cwd: Mostrador_wilkiedevs` en lugar de `cd`.
- Separador de comandos en PowerShell: `;` (no `&&`).

## Desarrollo local
Para probar cambios en local sin deploy al VPS:

**Terminal 1 — Backend** (puerto 3001, usa Supabase en la nube):
```bash
cd Mostrador_wilkiedevs/backend
npm run dev
```

**Terminal 2 — Frontend** (puerto 3000):
Crear `Mostrador_wilkiedevs/frontend/.env.local` con:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<mismo valor que .env>
NEXT_PUBLIC_N8N_DESCRIPTOR_URL=https://n8n.wilkiedevs.com/webhook/descriptor
```
Luego:
```bash
cd Mostrador_wilkiedevs/frontend
npm run dev
```
El `.env.local` tiene prioridad sobre `.env` en Next.js. No se necesita BD local — todo apunta a Supabase en la nube.



============================================================
# END SECTION -- BEGIN: .kiro/steering/tools-and-credentials.md
============================================================

# Herramientas Disponibles para Kiro — Lookitry (Virtual Try-On)

> Leer este archivo al inicio de cada sesión. Contiene las herramientas y credenciales disponibles
> para operar el proyecto sin necesidad de redescubrir accesos.
> Todas las credenciales completas están en `CONTEXT.md` y `backend/.env`.

---

## Supabase — Power MCP (PREFERIDO para BD)

Usar el **Power de Supabase** para cualquier operación de base de datos.
Es más rápido y confiable que scripts Python o curl directo.

- `SUPABASE_URL`: `https://vkdooutklowctuudjnkl.supabase.co`
- `SUPABASE_SERVICE_KEY`: en `backend/.env` (clave `service_role` — sin restricciones RLS)
- `SUPABASE_ANON_KEY`: en `backend/.env` (clave `anon` — respeta RLS)

Usar para:
- Ejecutar migraciones SQL directamente
- Consultar, insertar o actualizar datos en tablas
- Verificar esquemas y columnas existentes
- Depurar problemas de datos sin necesidad de deploy

---

## Hostinger MCP — VPS y DNS

Usar las herramientas MCP de Hostinger para monitoreo del VPS y DNS.
No requiere SSH manual para consultas de estado.

- Ver VMs: `mcp_hostinger_api_VPS_getVirtualMachinesV1`
- Detalles de VM: `mcp_hostinger_api_VPS_getVirtualMachineDetailsV1`
- Acciones recientes: `mcp_hostinger_api_VPS_getActionsV1`
- Métricas CPU/RAM: `mcp_hostinger_api_VPS_getMetricsV1`
- DNS del dominio: `mcp_hostinger_api_DNS_getDNSRecordsV1` con `domain: "pruebalo.wilkiedevs.com"`

---

## Deploy — Script Python (para cambios de código)

Para cualquier cambio de código que requiera rebuild:

```bash
# Desde Mostrador_wilkiedevs/
git add -A
git commit -m "descripción"
git push origin main
python scripts/_deploy_now.py --frontend   # solo frontend
python scripts/_deploy_now.py --backend    # solo backend
python scripts/_deploy_now.py              # ambos
python scripts/_deploy_now.py --restart    # solo reinicia (~5s, sin rebuild)
```

Credenciales VPS: `HOST=31.220.18.39`, `USER=root`, `PASS=Travis18456916#`

---

## n8n — Solo workflows autorizados

- API Key: en `backend/.env` campo `N8N_API_KEY`
- Bearer Token: `Travis2305**`
- Workflows autorizados: `wPLypk7KhBcFLicX` (Try-On), `ZjVTV3QxoPEi60GX` (Descriptor IA)
- PROHIBIDO crear, importar o eliminar workflows sin consentimiento explícito

---

## Reglas de prioridad de herramientas

| Tarea | Herramienta preferida |
|---|---|
| Consultar / modificar BD   | Supabase Power MCP |
| Ejecutar migración SQL     | Supabase Power MCP |
| Verificar estado del VPS   | Hostinger MCP      |
| Deploy de código           | `scripts/_deploy_now.py`                   |
| Verificar DNS              | Hostinger MCP DNS                          |
| Logs del servidor          | `docker logs` vía paramiko o Hostinger MCP |
| Documentación de librerías | Context7 MCP                               |

---

## Flujo de Trabajo Local — Desarrollo y Deploy

### Regla principal

**SIEMPRE desarrollar y probar en local antes de hacer deploy a producción.**
Esto evita builds fallidos, URLs rotas y desperdicio de tiempo/créditos.

### Levantar el entorno local

```bash
# Terminal 1 — Backend (puerto 3001)
cd Mostrador_wilkiedevs/backend
npm run dev

# Terminal 2 — Frontend (puerto 3000)
cd Mostrador_wilkiedevs/frontend
npm run dev
```

URLs locales:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

El archivo `frontend/.env.local` ya tiene las variables configuradas para local:
- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Supabase apunta al mismo proyecto de producción (la BD es compartida)

### Checklist pre-deploy

Antes de ejecutar `python scripts/_deploy_now.py --frontend`, verificar:

1. No hay URLs hardcodeadas de `localhost` en el código fuente
2. Las variables de entorno de producción en el VPS están correctas (no se usan las de `.env.local`)
3. El build local no lanza errores (`npm run build` en `frontend/`)
4. Los cambios se ven y funcionan correctamente en `http://localhost:3000`
5. No hay imports de módulos inexistentes ni errores de TypeScript

### Diferencias local vs producción

| Aspecto | Local | Producción |
|---|---|---|
| API URL | `http://localhost:3001` | `https://api.pruebalo.wilkiedevs.com` |
| App URL | `http://localhost:3000` | `https://pruebalo.wilkiedevs.com` |
| Supabase | Mismo proyecto | Mismo proyecto |
| ISR / caché | Desactivado | Activo (revalidate según config) |
| `.env.local` | Usado automáticamente | Ignorado (usa variables del VPS) |

### Verificación obligatoria al terminar cada tarea

Al finalizar cualquier tarea de código, SIEMPRE:

1. Verificar que el frontend esté corriendo en `http://localhost:3000`
2. Verificar que el backend esté corriendo en `http://localhost:3001`
3. Si alguno no está activo, iniciarlo con `controlPwshProcess` (action: "start")
4. Confirmar al usuario que puede revisar los cambios en local antes de hacer deploy

Comandos para iniciar si no están corriendo:
- Frontend: `npm run dev` en `Mostrador_wilkiedevs/frontend`
- Backend: `npm run dev` en `Mostrador_wilkiedevs/backend`

Solo hacer deploy (`python scripts/_deploy_now.py`) después de que el usuario confirme que todo se ve bien en local.

### Notas importantes

- `.env.local` está en `.gitignore` — nunca se sube al repo ni al VPS
- El VPS tiene sus propias variables de entorno configuradas en el contenedor Docker
- Si se agregan nuevas variables de entorno, hay que agregarlas tanto en `.env.local` (local) como en el VPS manualmente

