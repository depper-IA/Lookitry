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
