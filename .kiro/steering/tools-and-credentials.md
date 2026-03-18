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
