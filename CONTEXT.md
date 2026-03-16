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

## Migraciones SQL Pendientes

Ejecutar en Supabase SQL Editor (`https://vkdooutklowctuudjnkl.supabase.co`):

| Archivo | Estado | Descripción |
|---|---|---|
| `backend/migrations/create_trial_campaigns_table.sql` | PENDIENTE | Crea tablas trial + agrega campos a brands (email_verified, trial_end_date, etc.) |
| `backend/migrations/add_email_verification_to_brands.sql` | Incluido en el anterior | |
| `backend/migrations/add_trial_payment_status.sql` | Incluido en el anterior | |

> El archivo `create_trial_campaigns_table.sql` incluye todos los ALTER TABLE necesarios en brands.
> Ejecutar solo ese archivo es suficiente.

---

## Infraestructura Docker

- Traefik maneja SSL (certresolver `mytlschallenge`) y reverse proxy
- Red Docker: `proxy`
- El `docker-compose.yml` en `/root/` maneja: Traefik + n8n + redis + minio
- **NUNCA** hacer `docker compose down` en `/root/` — bajaría n8n y minio

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

Para SSH desde Windows usar Python + paramiko (PowerShell no acepta `&&`, usar `;` o `cwd`).
