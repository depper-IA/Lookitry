# Monetization Go-Live Checklist

## Objetivo
Validar en 10-15 minutos que el flujo comercial principal esta listo antes de un lanzamiento oficial.

## 1. Cobro real o sandbox equivalente
- Crear una marca de prueba nueva.
- Completar el flujo de registro y pago.
- Confirmar que el webhook marque el pago como exitoso.
- Verificar que el plan correcto quede activo en dashboard.

## 2. Acceso despues del pago
- Entrar al dashboard con la cuenta pagada.
- Confirmar acceso a la mini landing, widget y secciones premium esperadas.
- Verificar que no aparezcan bloqueos de trial ya superado.

## 3. Widget publico
- Abrir la pagina publica de la marca.
- Subir una foto o imagen valida.
- Generar con un producto.
- Repetir con la misma foto y el mismo producto.
- Confirmar que el segundo intento reutiliza el resultado y muestra el aviso sin costo adicional.

## 4. Embed y whitelist
- Probar el widget en un dominio permitido.
- Confirmar que carga bien dentro de iframe.
- Probar el mismo embed desde un dominio no permitido.
- Confirmar que el navegador lo bloquee por CSP.

## 5. WooCommerce
- Validar API key en el plugin.
- Sincronizar catalogo.
- Abrir un producto con el boton del widget.
- Generar una prueba desde la ficha del producto.

## 6. Telemetria y observabilidad
- Revisar `plugin_telemetry_events` y confirmar eventos recientes.
- Revisar logs del backend por errores 4xx/5xx inesperados.
- Confirmar que `https://api.lookitry.com/health` responde `200`.

## 7. Comercial
- Verificar CTA principales en home, aplicaciones y pricing.
- Confirmar que las capturas de antes/despues cargan rapido.
- Confirmar que el copy de compra no promete embeds nativos dentro de Instagram o TikTok.

## Criterio de salida
Si las 7 secciones pasan, el lanzamiento queda razonablemente listo para monetizar.
Si falla pago, webhook o acceso post-pago, no lanzar todavia.
