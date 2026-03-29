# Handoff Temporal - n8n Blog Automation

Fecha: `2026-03-29`
Workspace: `C:\Users\Juli\Lookitry`
Workflow activo: `Lookitry Blog Automation v3 FIXED`
Workflow ID: `VMAu93Zx4k5qgzdm`

## Lo que ya se logro
- Se confirmo acceso operativo al workflow de `n8n` via API.
- Se respaldo la definicion del workflow en un archivo local, pero ese backup no debe versionarse porque contiene secretos embebidos.
- Se revisaron ejecuciones recientes y se confirmo que el bug original de parseo en `Preparar Loop Temas` ya estaba corregido en el workflow activo.
- Se aislo el bloqueo real del flujo: el proceso quedaba cortado en `Loop Temas Pendientes` aunque la ejecucion salia como `success`.
- Se actualizo el workflow remoto para que el flujo tematico continuara por la rama que realmente estaba emitiendo datos.
- Se actualizo el modelo de `Generar Prompts Imagenes` a `models/gemini-2.5-flash` porque el modelo anterior ya no resolvia.
- Se dispararon pruebas reales del workflow por webhook productivo.

## Evidencia de pruebas hechas
- Webhook de prueba usado: `GET https://n8n.wilkiedevs.com/webhook/lookitry-blog-trigger`
- Ejecucion `13643`: `success`, pero el flujo seguia cortandose en `Loop Temas Pendientes`.
- Ejecucion `13645`: ya avanzo hasta `Generar Prompts Imagenes`; el error fue de modelo no encontrado.
- Ejecucion `13646`: ya avanzo hasta generacion/subida de imagen y fallo en `Consolidar URLs Imagenes` con el error `Se esperaban 3 imagenes subidas, se recibieron 1`.

## Estado actual del workflow remoto
- `Loop Temas Pendientes` ya esta conectado para continuar hacia:
  - `Generar Prompts Imagenes`
  - `GET Blogs Existentes`
- `Generar Prompts Imagenes` esta configurado con el modelo `models/gemini-2.5-flash`.
- `Extraer Prompts` actualmente apunta directo a `Switch Proveedor Imagen`.
- `Loop Imagenes` sigue existiendo en el workflow y la rama de imagenes quedo a medio refactor.
- El siguiente bloqueo real pendiente esta en la consolidacion de imagenes, no en el loop de temas.

## Lo que falta para terminarlo
1. Revisar o terminar el refactor de la rama de imagenes.
2. Actualizar las referencias internas que aun dependan de `Loop Imagenes` para que tomen el item desde `Extraer Prompts`, o rehacer correctamente ese loop.
3. Volver a disparar el webhook de prueba.
4. Confirmar que la ejecucion pase por estos nodos:
   - `Publicar en Lookitry`
   - `PATCH status published`
   - `Log Exito`
5. Verificar que el articulo quede realmente publicado en Lookitry.

## Conexion MCP / conectores

### n8n
- Base URL: `https://n8n.wilkiedevs.com`
- API route base: `https://n8n.wilkiedevs.com/api/v1`
- Webhook productivo usado para pruebas: `https://n8n.wilkiedevs.com/webhook/lookitry-blog-trigger`
- Header auth: `X-N8N-API-KEY`
- Credencial: mover al `.env` como `N8N_API_KEY`

Ejemplo de configuracion:

```json
{
  "name": "n8n",
  "baseUrl": "https://n8n.wilkiedevs.com/api/v1",
  "headers": {
    "X-N8N-API-KEY": "${N8N_API_KEY}"
  }
}
```

### Supabase
- Project URL: `https://vkdooutklowctuudjnkl.supabase.co`
- REST base: `https://vkdooutklowctuudjnkl.supabase.co/rest/v1`
- Credenciales: mover al `.env` como `SUPABASE_ANON_KEY` y, si aplica, `SUPABASE_SERVICE_ROLE_KEY`

Ejemplo de configuracion:

```json
{
  "name": "supabase",
  "baseUrl": "https://vkdooutklowctuudjnkl.supabase.co/rest/v1",
  "headers": {
    "apikey": "${SUPABASE_ANON_KEY}",
    "Authorization": "Bearer ${SUPABASE_ANON_KEY}",
    "Content-Type": "application/json"
  }
}
```

## Nota critica para la siguiente persona
- Antes de continuar, actualiza el repo local con los ultimos cambios remotos.
- Guarda las credenciales reales en el `.env` o en el gestor de secretos del proyecto.
- No vuelvas a dejar llaves reales en este archivo ni en backups exportados de `n8n`.
- El backup crudo del workflow debe mantenerse solo de forma local o regenerarse sanitizado antes de cualquier commit.

## Rutas y archivos utiles
- `REGLAS_IMPORTANTES.md`
- `backend/.env`
- `docs/HANDOFF_N8N_BLOG_2026-03-29.md`

## Resumen ejecutivo
Se logro sacar el workflow del falso `success` donde no hacia nada y se avanzo hasta la fase real de generacion y subida de imagenes. El bloqueo pendiente ya es concreto y mucho mas pequeno: la rama de imagenes todavia no entrega las 3 imagenes al consolidado. El siguiente paso debe enfocarse solo en esa parte y volver a probar hasta llegar a publicacion.
