# Plugin: WooCommerce Integration

El plugin de WooCommerce es el puente que conecta Lookitry con el ecosistema de comercio electrónico. Este documento detalla su arquitectura y reglas de operación.

## 1. Arquitectura del Plugin
- **EntryPoint**: `lookitry-woocommerce.php` (Inicialización y Hooks).
- **Admin**: `includes/admin-settings.php` (Configuración de API Key y Sincronización).
- **Frontend**: `includes/frontend-hooks.php` (Inyección del botón y Modal).

## 2. Reglas de Negocio del Plugin
- **Exclusividad de Plan**: El probador solo es funcional para marcas con plan **PRO** o **ENTERPRISE**. En planes BASIC/Trial, el plugin muestra un aviso informativo pero no inyecta el botón.
- **Inyección del Botón**: Se inyecta automáticamente después del botón "Añadir al carrito" usando el hook `woocommerce_after_add_to_cart_button`.

## 3. Seguridad y Sesión
Para evitar exponer la `API_KEY` del cliente en el navegador, el plugin sigue este flujo:
1. **Validación S2S**: El servidor de WordPress pide un `session-token` efímero (1h) al backend de Lookitry usando la API Key privada del cliente (`GET /session-token`).
2. **Uso de Token**: Este token se inyecta en el frontend (`wp_localize_script`) y es lo único que el widget usa para comunicarse con la API.

## 4. Proceso de Sincronización (Bulk Sync)
Permite subir el catálogo de WooCommerce a Lookitry masivamente:
- **Validación de Límites**: Antes de sincronizar, se valida en el backend el límite de productos activos del plan actual.
- **Mapeo de Datos**: Se envían: ID externo, Nombre, URL de imagen, Categoría y Precio.
- **Webhook de Actualización**: El plugin escucha cambios en los productos para mantener la sincronización (futura implementación).

## 5. Hooks Principales
| Hook de WP/Woo | Función en Lookitry |
|---------------|---------------------|
| `woocommerce_after_add_to_cart_button` | Inyecta el botón "Pruébatelo". |
| `wp_footer` | Renderiza el contenedor del Modal VTON. |
| `wp_enqueue_scripts` | Carga el `widget-loader.js` y los estilos. |

> [!IMPORTANT]
> **Compatibilidad**: El plugin requiere WooCommerce activo. Si no se detecta la clase `WooCommerce`, el plugin se auto-desactiva para evitar errores fatales.
