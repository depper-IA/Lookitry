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
| Consultar / modificar BD | Supabase Power MCP |
| Ejecutar migración SQL | Supabase Power MCP |
| Verificar estado del VPS | Hostinger MCP |
| Deploy de código | `scripts/_deploy_now.py` |
| Verificar DNS | Hostinger MCP DNS |
| Logs del servidor | `docker logs` vía paramiko o Hostinger MCP |
| Documentación de librerías | Context7 MCP |
