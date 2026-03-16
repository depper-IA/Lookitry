# Contexto Operacional — Virtual Try-On (pruebalo.wilkiedevs.com)

> Archivo de referencia rápida para evitar redescubrir rutas, credenciales y comandos en cada sesión.
> Actualizar cuando cambien rutas, credenciales o estructura.

---

## Accesos

| Recurso | Valor |
|---|---|
| VPS IP | `31.220.18.39` |
| VPS usuario | `root` |
| VPS contraseña | `Travis18456916#` |
| SSH método | Python + paramiko |
| GitHub repo | `https://github.com/depper-IA/virtual-tryon` |
| GitHub token | `***REMOVED-SECRET***` |
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

### Backend
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
  -H 'Authorization: Bearer ***REMOVED-SECRET***' -d '{}'
```
Esperado: HTTP 401 — si da 404, el backend no está actualizado

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
