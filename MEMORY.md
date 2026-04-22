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

**Nota**: Sammy (agente IA) no está desplegado en VPS.

## Recientes

- **2026-04-22**: Auditoría de login completada
  - COOKIE_DOMAIN configurado en producción
  - Account lockout implementado (5 intentos = 15 min)
  - Login audit logging agregado
  - Admin rate limit más estricto
  - Session TTL reducido a 7 días
  - Columnas `failed_login_attempts` y `locked_until` agregadas a brands
