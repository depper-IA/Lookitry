# Limpieza VPS — 18 marzo 2026

## Estado del disco

| Momento | Usado | Disponible | % |
|---|---|---|---|
| Antes de limpieza | 96 GB / 96 GB | 0 GB | 100% — LLENO |
| Después limpieza fase 1 | 42 GB | 54 GB | 44% |
| Después limpieza fase 2 | 12 GB | 85 GB | 13% |
| Estado final | 11 GB | 86 GB | 11% |

**Total liberado: ~85 GB**

---

## Qué se eliminó y cuánto pesaba

| Elemento | Ruta | Peso | Motivo |
|---|---|---|---|
| Playwright Chromium (root) | `/root/.cache/ms-playwright/chromium-1187` | 439 MB | Sin uso — instalado por template n8n de Hostinger |
| Playwright headless shell (root) | `/root/.cache/ms-playwright/chromium_headless_shell-1187` | 291 MB | Sin uso |
| Playwright Firefox (root) | `/root/.cache/ms-playwright/firefox-1490` | 156 MB | Sin uso |
| Playwright WebKit (root) | `/root/.cache/ms-playwright/webkit-2203` | 119 MB | Sin uso |
| Playwright Chromium (ubuntu) | `/home/ubuntu/.cache/ms-playwright/chromium-1187` | 439 MB | Duplicado |
| Playwright headless shell (ubuntu) | `/home/ubuntu/.cache/ms-playwright/chromium_headless_shell-1187` | 291 MB | Duplicado |
| Python venv /root | `/root/venv` | 164 MB | Contenía playwright driver (116 MB) |
| superprof_bot completo | `/home/ubuntu/superprof_bot` | ~700 MB | Bot nunca usado — documentado en `docs/superprof-bot-backup.md` |
| Logs journald antiguos | `/var/log/journal/...` | 142 MB | Logs del sistema acumulados |
| Contenedores Docker parados | varios | ~0 MB | 2 contenedores huérfanos |
| Volúmenes Docker huérfanos | varios | ~1 MB | 19 volúmenes sin contenedor |
| Redes Docker huérfanas | `root_default` | — | Red sin uso |
| Logs de contenedores | `/var/lib/docker/containers/*/...json.log` | variable | Truncados a 0 |
| n8n SQLite ejecuciones antiguas | `/var/lib/docker/volumes/n8n_data/_data/database.sqlite` | 2.0 GB → 166 MB | VACUUM + DELETE de ejecuciones anteriores a marzo 2026 |

---

## Qué se instaló

| Paquete | Motivo |
|---|---|
| `sqlite3` (host) | Para poder hacer VACUUM y DELETE en el SQLite de n8n directamente |

---

## Servicios que siguen corriendo (sin cambios)

| Contenedor | Estado |
|---|---|
| `root-n8n-1` | Corriendo — sin cambios |
| `root-redis-1` | Corriendo — sin cambios |
| `root-traefik-1` | Corriendo — sin cambios |
| `minio` | Corriendo — sin cambios |
| `image-converter` | Corriendo — sin cambios |
| `virtual-tryon-backend` | Rebuildeado y corriendo |
| `virtual-tryon-frontend` | Rebuildeado y corriendo |

---

## Cambios de código deployados en esta sesión

| Cambio | Archivo |
|---|---|
| Agregar campos `contact_name` y `phone` al INSERT de registro | `backend/src/services/auth.service.ts` |
| Agregar campos al formulario de registro con nuevo orden | `frontend/src/components/auth/RegisterForm.tsx` |
| Nuevo orden del formulario: nombre/apellido → marca → slug → email → teléfono → contraseña | `frontend/src/components/auth/RegisterForm.tsx` |
| Validación de `contact_name` (mínimo 3 chars) y bloqueo de emails desechables | `backend/src/controllers/auth.controller.ts` |
| Tipos `contact_name` y `phone` en el DTO | `backend/src/types/index.ts` |

---

## Fix de bypass IP

El toggle "Bypass verificación de IP" en el admin no estaba guardando porque el backend
que corría en el VPS era la versión anterior (build fallido por disco lleno).

Solución aplicada: se actualizó directamente en la DB via Supabase MCP:
```sql
UPDATE payment_settings SET bypass_ip_protection = true WHERE id = 1;
```

El toggle en el admin ahora sí funciona con el backend actualizado.

---

## Crontab activo en el VPS

```
0 2 * * * /root/actualizar-n8n.sh >> /root/actualizar-n8n.log 2>&1
```
Actualiza n8n automáticamente todos los días a las 2am.

---

## Recomendaciones para evitar que el disco se llene de nuevo

1. El SQLite de n8n crece con cada ejecución — limpiar cada 2-3 meses con:
   ```bash
   sqlite3 /var/lib/docker/volumes/n8n_data/_data/database.sqlite \
     "DELETE FROM execution_entity WHERE startedAt < date('now','-60 days'); VACUUM;"
   ```
2. Configurar retención automática en n8n: Settings → Executions → "Save executions" → limitar a 30-60 días
3. Monitorear disco con: `df -h /`
4. Script de limpieza disponible en: `scripts/_clean_n8n_sqlite.py`
