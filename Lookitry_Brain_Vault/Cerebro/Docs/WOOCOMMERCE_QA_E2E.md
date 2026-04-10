# WooCommerce QA E2E

Checklist guiado para validar la integracion completa del plugin de Lookitry en una tienda WooCommerce.

## Precondiciones

- Backend desplegado con los cambios actuales.
- Tabla `plugin_telemetry_events` creada en la base de datos.
- Plugin `lookitry-woocommerce` instalado en WordPress.
- Marca con `api_key` valida y al menos un producto activo en Lookitry.

## Flujo E2E principal

### 1. Instalar y activar plugin

- Ir a `Plugins > Add New > Upload Plugin`.
- Cargar el ZIP del plugin.
- Activar `Lookitry for WooCommerce`.
- Confirmar que aparezca el submenu `WooCommerce > Lookitry`.

Resultado esperado:
- El plugin carga sin errores fatales.
- La pantalla de configuracion se renderiza correctamente.

### 2. Validar API key

- Abrir `WooCommerce > Lookitry`.
- Pegar una `api_key` valida.
- Pulsar `Validar Conexion`.

Resultado esperado:
- La marca se muestra como conectada.
- Se renderizan nombre, plan y uso del comercio.
- En backend queda un evento exitoso en `plugin_telemetry_events` para `/api/pruebalo/validate-api-key`.

### 3. Cargar catalogo local

- En la pestana de resumen, pulsar `Refrescar productos de WP`.

Resultado esperado:
- Se listan productos de WooCommerce con `external_id`, imagen y estado.
- No hay errores visuales ni de consola bloqueantes.

### 4. Sincronizar productos

- Seleccionar uno o varios productos.
- Pulsar `Sincronizar a Lookitry`.

Resultado esperado:
- Respuesta exitosa del endpoint `/api/pruebalo/sync-woocommerce`.
- Los productos quedan como `Sincronizado`.
- En backend queda telemetria con latencia, retries y estado para `/api/pruebalo/sync-woocommerce`.

### 5. Ver control admin centralizado

- Entrar a `Admin > WooCommerce` en Lookitry.
- Buscar la marca conectada.
- Revisar resumen de productos mapeados, activos, requests, errores y latencia.

Resultado esperado:
- La marca aparece en el listado.
- Los productos sincronizados aparecen con `external_id`.
- El resumen muestra metricas reales del plugin.

### 6. Desactivar y reactivar producto

- En el panel admin de WooCommerce, desactivar un producto sincronizado.
- Entrar a la pagina del producto en WooCommerce e intentar abrir el probador.
- Repetir activando el producto de nuevo.

Resultado esperado:
- Si el producto esta inactivo en Lookitry, el init debe fallar con error controlado.
- Si el producto vuelve a estar activo, el probador debe abrir normalmente.

### 7. Abrir modal de try-on

- Ir a la pagina de producto WooCommerce.
- Pulsar `Probar Virtualmente`.

Resultado esperado:
- Se hace request a `/api/embed/wordpress/init`.
- El modal se abre con iframe valido.
- Se registra telemetria para `/api/embed/wordpress/init`.

### 8. Generacion completa

- Desde el iframe, subir selfie y completar una generacion.

Resultado esperado:
- La generacion finaliza exitosamente.
- No hay errores de mapping por `external_id`.

## Casos negativos minimos

- API key invalida: debe rechazar validacion y no mostrar comercio conectado.
- Producto no sincronizado: el init debe responder error controlado.
- Falla de red simulada: el plugin debe reintentar y registrar telemetria fallida.

## Evidencia recomendada

- Captura del panel WooCommerce conectado.
- Captura del panel admin WooCommerce con metricas.
- Registro en DB de `plugin_telemetry_events`.
- Captura del modal try-on abierto desde un producto WooCommerce.

## Validacion posterior en base de datos

### A. Verificar telemetria del plugin

Ejecutar en Supabase SQL Editor:

```sql
select
  endpoint,
  success,
  retry_count,
  duration_ms,
  created_at
from plugin_telemetry_events
order by created_at desc
limit 20;
```

Resultado esperado:
- Deben aparecer eventos para `/api/pruebalo/validate-api-key`.
- Deben aparecer eventos para `/api/pruebalo/sync-woocommerce`.
- Deben aparecer eventos para `/api/embed/wordpress/init`.

### B. Verificar hardening del sync WooCommerce

Ejecutar el archivo [WOOCOMMERCE_DB_HARDENING_CHECK.sql](/C:/Users/Matt/Lookitry/docs/WOOCOMMERCE_DB_HARDENING_CHECK.sql).

Resultado esperado:
- El indice `products_brand_external_id_unique_idx` existe.
- No hay duplicados por `(brand_id, external_id)`.
