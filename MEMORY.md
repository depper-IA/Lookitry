# MEMORY.md - Lookitry Session Memory

## VPS Credentials (CRÍTICO)

| Campo | Valor |
|-------|-------|
| SSH Key | `C:\Users\Matt\.ssh\lookitry_key` |
| Host | `root@31.220.18.39` |
| ID VPS | 1004711 |

**Siempre usar `-i "C:\Users\Matt\.ssh\lookitry_key"` para SSH**

## Proyecto

- **Repo**: https://github.com/depper-IA/Lookitry
- **VPS**: Hostinger Ubuntu con Docker
- **Dominios**: lookitry.com, api.lookitry.com, n8n.wilkiedevs.com, minio.wilkiedevs.com

## Servicios

| Servicio | URL | Contenedor |
|----------|-----|------------|
| Frontend | https://lookitry.com | lookitry-frontend |
| Backend API | https://api.lookitry.com | lookitry-backend |
| n8n | https://n8n.wilkiedevs.com | root-n8n-1 |
| Redis | redis://root-redis-1:6379 | root-redis-1 |

**Sammy**: Agente IA genérico, NO relacionado con el chat de la web. Ubicación: `./sammy/`. No desplegado en VPS.

**Rebecca**: Agente de chat WEB y WHATSAPP. Es el único agente de conversación.
- Backend: `backend/src/services/rebecca-chat.service.ts`
- WhatsApp: `supabase/functions/whatsapp-agent/`
- Web chat widget: `frontend/src/components/chat-widget/`
- Rate limit: `backend/src/middleware/rebecca-rate-limit.ts`
- Admin controller: `backend/src/controllers/admin/rebecca.admin.controller.ts`

## Recientes

- **Deploy VPS**: Usar siempre `python scripts/_deploy_now.py` (NO GitHub Actions)
- **GitHub Actions**: Solo para sync del plugin WordPress (`sync-plugin.yml`)
- **Workflows activos**: `.github/workflows/sync-plugin.yml` (WordPress only)

## Recientes

- **2026-04-22**: Auditoría de login completada
  - COOKIE_DOMAIN configurado en producción
  - Account lockout implementado (5 intentos = 15 min)
  - Login audit logging agregado
  - Admin rate limit más estricto
  - Session TTL reducido a 7 días
  - Columnas `failed_login_attempts` y `locked_until` agregadas a brands
