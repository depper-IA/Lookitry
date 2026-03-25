# Post-Mortem: Intento de Embebido del Widget (X-Frame-Options)

## Objetivo
Permitir que el widget de Lookitry (`/pruebalo/*`, `/embed/*`) se cargue dentro de un iframe en dominios de terceros (ej. WooCommerce de clientes), manteniendo la seguridad estricta (`DENY`) en el resto de la plataforma (`/dashboard`, `/admin`).

## Lo que se intentó
Se realizaron múltiples cambios coordinados en 4 capas de la infraestructura:

1.  **Capa Next.js (headers):** Se configuró `next.config.js` para emitir `Content-Security-Policy: frame-ancestors *` y se intentó limpiar o anular `X-Frame-Options` para rutas públicas.
2.  **Capa Middleware:** Se programó lógica en `middleware.ts` para detectar peticiones a rutas de embebido y eliminar explícitamente el header `X-Frame-Options` antes de que la respuesta saliera del servidor.
3.  **Capa Backend (API):** Se desactivó el `frameguard` de la librería `helmet` en Express para evitar que el API inyectara cabeceras restrictivas por error.
4.  **Capa Infraestructura (Traefik):** Se añadieron etiquetas en `docker-compose.frontend.yml` para que el balanceador de carga Traefik limpiara cualquier cabecera de frames inyectada por el servidor web.

## Resultado y Bloqueo actual
A pesar de las configuraciones permisivas, el navegador (Chrome y Firefox) seguía reportando:
> `Refused to display 'https://lookitry.com/' in a frame because it set 'X-Frame-Options' to 'deny'.`

**Hallazgos técnicos:**
- Una prueba con `Invoke-WebRequest` confirmó que el servidor sigue respondiendo con `X-Frame-Options: DENY` y `X-Powered-By: Next.js`.
- Los cambios en el código (`next.config.js` y `middleware.ts`) no se reflejaron en los headers finales a pesar de realizar despliegues con `--no-cache`.
- **Sospecha principal:** El VPS de Hostinger podría tener una capa de red superior (un proxy Nginx global o un firewall del panel de control) que intercepta el tráfico e inyecta el header `DENY` por seguridad forzada, ignorando lo que diga Docker/Next.js.

## Estado Final (25/03/2026)
- **Acción:** Se han **revertido todos los cambios** a su estado original de máxima seguridad.
- **Seguridad:** El sistema emite `X-Frame-Options: DENY` correctamente para proteger contra ataques de clickjacking.
- **Funcionalidad del Widget:** El embebido a través de `iframe` **no funciona** actualmente en dominios externos. El plugin de WooCommerce queda en modo *stand-by*.

## Recomendaciones para el futuro
1.  **Investigar capa de Hostinger:** Contactar con soporte o revisar si el VPS tiene un Nginx invisible que aplica seguridad global.
2.  **Uso de dominios diferentes:** Considerar servir el widget desde un subdominio específico (ej. `widget.lookitry.com`) con configuraciones de seguridad totalmente independientes del dominio principal.
3.  **Proxy de depuración:** Usar herramientas como `Burp Suite` o logs de Traefik en modo `DEBUG` para ver exactamente en qué punto se está re-inyectando el header `DENY`.
