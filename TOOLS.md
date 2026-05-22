# TOOLS.md - VPS Lookitry - Estructura Completa

## SSH Keys

### VPS Lookitry (Hostinger)
```
Key: C:\Users\Matt\.ssh\lookitry_key
Host: root@31.220.18.39
```

**Uso:**
```bash
ssh -i "C:\Users\Matt\.ssh\lookitry_key" root@31.220.18.39
```

## VPS Info

| Campo | Valor |
|-------|-------|
| IP | 31.220.18.39 |
| ID VPS | 1004711 |
| Usuario | root |
| Path Principal | `/root/virtual-tryon` |

---

## Estructura de Carpetas VPS

### Proyectos Activos (DOCKER)

| Proyecto | Path | Descripción |
|----------|------|-------------|
| **Backend** | `/root/virtual-tryon/backend` | API Express.js - Lookitry |
| **Frontend** | `/root/virtual-tryon/frontend` | Next.js 14 App Router |
| **n8n** | `/root/n8n-docker-compose.yml` | Orquestador de IA y automatización |
| **Traefik** | `/docker/traefik-reverse-proxy` | Reverse proxy y SSL |
| **Redis** | Contenedor `root-redis-1` | Cache y cola de trabajos |

### Documentación del Proyecto

| Proyecto | Path | Descripción |
|----------|------|-------------|
| **Lookitry_Brain_Vault** | `/root/virtual-tryon/Lookitry_Brain_Vault` | Cerebro del proyecto - Documentación IA, reglas, agentes, workflows |
| **docs** | `/root/virtual-tryon/docs` | Documentación adicional (superpowers) |

### Marcas y Contenido

| Proyecto | Path | Descripción |
|----------|------|-------------|
| **Brand** | `/root/virtual-tryon/Brand` | Manual de marca, guía de marca Lookitry (`.md` y `.pdf`) |
| **Content** | `/root/virtual-tryon/Content` | Planes de contenido, guías social media |

### Prototipos y APIs

| Proyecto | Path | Descripción |
|----------|------|-------------|
| **idm-vton-api** | `/root/virtual-tryon/idm-vton-api` | Prototipo API para widget de generación de imágenes (CPU/GPU workers) |

### Recursos y Utilidades

| Proyecto | Path | Descripción |
|----------|------|-------------|
| **assets** | `/root/virtual-tryon/assets` | Imágenes estáticas (logos, iconos Sammy) |
| **scripts** | `/root/virtual-tryon/scripts` | Scripts de deployment, diagnóstico, utilidades Python |
| **memory** | `/root/virtual-tryon/memory` | Notas de sesión diario del VPS |

### Plugins y Extensiones

| Proyecto | Path | Descripción |
|----------|------|-------------|
| **lookitry-woocommerce** | `/root/virtual-tryon/lookitry-woocommerce` | Plugin WordPress/WooCommerce para Try-On |

### Datos y Migraciones

| Proyecto | Path | Descripción |
|----------|------|-------------|
| **supabase** | `/root/virtual-tryon/supabase` | Migraciones de base de datos |

### Testing

| Proyecto | Path | Descripción |
|----------|------|-------------|
| **test-reports** | `/root/virtual-tryon/test-reports` | Reportes de tests |
| **test-results** | `/root/virtual-tryon/test-results` | Resultados de tests |
| **testsprite_tests** | `/root/virtual-tryon/testsprite_tests` | Tests de Testsprite |

### Otros

| Proyecto | Path | Descripción |
|----------|------|-------------|
| **brain** | `/root/virtual-tryon/brain` | Carpeta secundaria (posiblemente legacy) |
| **mission-control** | `/root/virtual-tryon/mission-control` | Vacía - antigua documentación |
| **error-pages** | `/root/virtual-tryon/error-pages` | Páginas de error para Docker |

---

## Carpetas ELIMINADAS (no existen)

- ❌ `social-os/` - Eliminada 2026-04-22 (contenido obsoleto)

---

## Archivos Huecos/Eliminables

- ❌ `_activate.py`, `_api_activate.py` - Scripts antiguos de activación
- ❌ `mission-control/` - Vacía, documentación movida a Lookitry_Brain_Vault

---

## Docker Images Limpieza

Para limpiar imágenes Docker huérfanas (builds intermedios):

```bash
ssh -i "C:\Users\Matt\.ssh\lookitry_key" root@31.220.18.39 "docker image prune -af"
```

---

## Comandos Útiles VPS

```bash
# Ver estado contenedores
docker ps

# Ver todos los contenedores (incluidos parados)
docker ps -a

# Reiniciar servicios
docker restart lookitry-backend
docker restart lookitry-frontend

# Ver logs
docker logs lookitry-backend --tail 100
docker logs lookitry-frontend --tail 100

# Health check completo
curl https://api.lookitry.com/health | jq

# Ver uso de disco
du -sh /root/virtual-tryon/*

# Limpiar imágenes huérfanas
docker image prune -af
```

---

## Notas Importantes

1. **NO eliminar** `Lookitry_Brain_Vault/` - Contiene toda la documentación del cerebro
2. **NO eliminar** `backend/` y `frontend/` - Son los proyectos activos
3. **NO eliminar** `scripts/` - Contiene `_deploy_now.py` y otros scripts críticos
4. **NO eliminar** `supabase/` - Contiene migraciones de DB
5. **El contenido de `google/`** son credenciales y archivos temporales de pruebas de redes sociales - revisar periódicamente
