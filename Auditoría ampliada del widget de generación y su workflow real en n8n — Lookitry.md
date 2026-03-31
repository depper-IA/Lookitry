# Auditoría ampliada del widget de generación y su workflow real en n8n — Lookitry

## Alcance y conclusión ejecutiva

Esta versión amplía la auditoría anterior incorporando el **workflow real de n8n** del widget try-on adjuntado por el usuario. Con este nuevo insumo ya no solo se puede evaluar el frontend y el backend de integración, sino también el **pipeline operativo completo** desde que el backend llama al webhook hasta que la imagen final se devuelve al cliente.

> **Conclusión principal:** el flujo completo está bien concebido para un producto funcional en producción, pero todavía presenta debilidades importantes en **latencia**, **resiliencia**, **seguridad operativa**, **manejo de fallos**, **observabilidad** y **experiencia de usuario bajo error o demora**. La arquitectura actual funciona, pero sigue siendo demasiado **síncrona y frágil** para una experiencia premium consistente a escala.

| Dimensión | Evaluación | Nivel |
|---|---|---:|
| UX del widget | Buena base, con fricciones claras | 7/10 |
| Backend de orquestación | Sólido conceptualmente | 7/10 |
| Workflow real de n8n | Funcional, pero delicado | 6/10 |
| Robustez end-to-end | Mejorable | 5.5/10 |
| Seguridad operativa | Aceptable con riesgos | 5/10 |
| Mantenibilidad | Media | 6/10 |

## Archivos y artefactos considerados

| Elemento | Rol en la auditoría |
|---|---|
| `frontend/src/components/tryon/TryOnWidget.tsx` | Estado principal del widget |
| `frontend/src/components/tryon/SelfieUploader.tsx` | Flujo de carga de selfie |
| `frontend/src/components/tryon/templates/TemplateBare.tsx` | Recorrido visual del usuario |
| `frontend/src/components/tryon/ResultDisplay.tsx` | Descarga, compartir y feedback |
| `frontend/public/widget.js` | Embed en sitios externos |
| `frontend/src/services/tryon.service.ts` | Cliente frontend hacia API pública |
| `backend/src/controllers/pruebalo.controller.ts` | Validación, créditos, prompt y disparo de generación |
| `backend/src/services/n8n.client.ts` | Conector real desde backend hacia n8n |
| `/home/ubuntu/upload/VirtualTry-On-FlujoCompleto.json` | Workflow real del widget en n8n |

## Qué revela ahora el workflow real de n8n

Con el archivo adjunto ya se ve claramente que el flujo actual de generación del widget funciona así:

| Paso | Componente | Qué hace |
|---|---|---|
| 1 | Backend `pruebalo.controller.ts` | Valida marca, producto, selfie, créditos y crea generación `PENDING` |
| 2 | `n8n.client.ts` | Envía `brand_id`, `product_id`, `selfie_url`, `product_image_url` y `prompt` al webhook `/webhook/tryon` |
| 3 | Nodo `Validar Input` | Valida campos obligatorios y formato básico de URLs |
| 4 | Nodo `Preparar Prompt Gemini` | Reorganiza payload y deja el prompt listo |
| 5 | Nodo `Generar con Gemini` | Llama a OpenRouter usando `google/gemini-2.5-flash-image` |
| 6 | Nodo `Extraer Imagen Base64` | Intenta localizar la imagen generada dentro de la respuesta |
| 7 | Nodo `Convert to File` | Convierte base64 a binario |
| 8 | Nodo `Subir Imagen Final` | Sube la imagen final a la API de Lookitry |
| 9 | Nodo `Preparar Respuesta` | Toma la URL resultante |
| 10 | `Responder Exito` | Devuelve `{ success: true, imageUrl }` al backend |

Esto confirma que la generación del widget depende de una **cadena síncrona larga** con varias etapas críticas consecutivas. El usuario solo ve “generando”, pero por detrás ocurren múltiples saltos donde cada uno puede introducir latencia o fallo.

## Hallazgos nuevos gracias al workflow real

## 1. La arquitectura actual es más lenta y frágil de lo que parecía

Antes ya se intuía que el flujo era síncrono, pero el workflow confirma que en realidad hay **varios tiempos acumulados**:

1. llamada backend → n8n,
2. llamada n8n → OpenRouter,
3. generación del modelo de imagen,
4. extracción de base64,
5. conversión a archivo,
6. subida final a la API de Lookitry,
7. respuesta de vuelta al backend,
8. respuesta final al frontend.

Eso significa que el usuario no espera solo una inferencia; espera toda una cadena de procesamiento. En una demo funciona bien. En producción real, con picos, imágenes grandes, variabilidad del proveedor o red inestable, esta arquitectura tiende a producir más demoras y más puntos de abandono.

> **Impacto de producto:** la experiencia visual del loader transmite simplicidad, pero el pipeline real es bastante más complejo y, por tanto, más propenso a inconsistencias de tiempo percibido.

## 2. Hay un desacople peligroso entre timeouts del sistema

El cliente backend hacia n8n usa timeout de **90 segundos**. El frontend usa **95 segundos**. Pero el nodo `Generar con Gemini` dentro de n8n tiene timeout configurado en **120 segundos**. Eso crea una inconsistencia muy importante.

| Capa | Timeout observado |
|---|---:|
| Frontend `tryon.service.ts` | 95 s |
| Backend `n8n.client.ts` | 90 s |
| Nodo n8n `Generar con Gemini` | 120 s |

Esto genera varios escenarios malos:

| Escenario | Qué pasa | Qué siente el usuario |
|---|---|---|
| Gemini tarda 100 s | n8n sigue trabajando, pero backend ya cortó | “Falló”, aunque el proveedor seguía procesando |
| Backend corta a 90 s | frontend aún espera 5 s más | Inconsistencia temporal |
| n8n termina tarde | el resultado ya no llega al cliente original | Se desperdicia cómputo y puede dejar dudas operativas |

**Recomendación crítica:** alinear todos los timeouts o, mejor todavía, abandonar el patrón síncrono largo y pasar a **job asíncrono con polling**.

## 3. El workflow depende de extracción frágil de la respuesta del modelo

El nodo `Extraer Imagen Base64` intenta recuperar la imagen buscando múltiples estructuras posibles dentro de la respuesta de Gemini/OpenRouter:

- `msg.images[0].image_url.url`,
- bloques `content` con `image_url`,
- bloques `image.source.data`,
- bloques `inline_data`,
- incluso texto plano con `data:image/...;base64,...`.

Esto muestra una buena intención defensiva, pero también revela una verdad operativa importante:

> El flujo depende de un formato de respuesta que no está completamente estabilizado ni simplificado antes de llegar a producción.

Es decir, el nodo está preparado para varias formas de respuesta porque el proveedor puede devolver la imagen de maneras distintas. Eso aumenta robustez táctica, pero también evidencia una **fragilidad estructural** del pipeline.

**Riesgo:** un cambio menor del proveedor puede romper la extracción sin romper necesariamente la llamada HTTP, generando fallos difíciles de detectar por el usuario y molestos de depurar.

## 4. La fase de subida final añade otro punto de fallo evitable

Después de generar la imagen, n8n no responde directamente con un artefacto definitivo ya disponible desde el mismo proveedor, sino que:

1. extrae base64,
2. convierte a archivo,
3. sube ese archivo a `https://api.lookitry.com/api/upload/selfie`,
4. usa la URL devuelta para responder.

Ese paso adicional añade complejidad y riesgo operativo.

| Punto adicional | Riesgo asociado |
|---|---|
| Conversión base64 → binario | corrupción o formato incorrecto |
| Subida por HTTP a API Lookitry | timeout o error de autenticación |
| Dependencia de endpoint de upload | caída parcial aunque Gemini sí haya generado |
| Respuesta final dependiente de upload | pérdida de resultado útil |

Desde la perspectiva del usuario, esto es especialmente delicado: puede ocurrir que la IA genere correctamente la imagen, pero el cliente vea un error porque falló la subida final.

**Recomendación:** desacoplar la persistencia del resultado del request síncrono principal. Lo ideal sería que n8n guardara el resultado y marcara el job como `SUCCESS` aunque el frontend ya no esté esperando en línea.

## 5. El nodo “Eliminar Selfie Temporal” actualmente no elimina nada

El nodo llamado `Eliminar Selfie Temporal` es un `noOp`. Es decir, no hace ninguna eliminación real. Esto no es solo un detalle técnico de naming; tiene impacto en orden operativo y potencialmente en costos o privacidad si se asume que la selfie temporal se elimina desde ahí.

> **Hallazgo importante:** el workflow da la impresión de limpiar recursos temporales, pero en la práctica no ejecuta ninguna limpieza real en ese punto.

Si la limpieza ya ocurre por otro lado del sistema, conviene dejarlo explícito. Si no ocurre, hay una mejora pendiente.

## 6. El workflow no muestra manejo explícito de errores por rama

El flujo comparte una señal positiva: existe `errorWorkflow` configurado en los ajustes de n8n. Eso es bueno porque al menos hay un canal central para fallos. Sin embargo, dentro del workflow principal no se ven ramas explícitas de recuperación o clasificación de error.

Eso implica que ante distintos tipos de fallo —input inválido, timeout del proveedor, respuesta mal formada, error de upload final— la experiencia puede terminar siendo demasiado uniforme desde fuera.

**Problema de producto:** distintos errores necesitan distintos mensajes y distintas acciones sugeridas para el usuario. Hoy la cadena técnica parece más preparada para “fallar” que para “explicar bien el fallo”.

## 7. Hay un riesgo de seguridad operativa en el artefacto compartido

El workflow adjunto muestra datos sensibles de ejemplo en `pinData` y en la configuración del nodo de subida, incluyendo valores de autorización visibles dentro del archivo exportado. Aunque no debo reproducirlos aquí, sí debo señalar que esto representa un riesgo operativo.

| Riesgo | Consecuencia |
|---|---|
| Exportar workflows con datos pineados | exposición de payloads reales |
| Headers de autorización visibles en export | fuga de secretos o credenciales |
| URLs temporales de imágenes en ejemplos | exposición innecesaria de recursos |

**Recomendación urgente:** sanear exports antes de compartirlos o versionarlos. En especial:

- desactivar `pinData` en exports compartidos,
- sustituir secretos por placeholders,
- usar credenciales de n8n sin hardcode visible en parámetros exportables,
- revisar si el endpoint de upload merece token específico de alcance mínimo.

## 8. El prompt está muy cargado y eso puede afectar latencia y consistencia

El prompt incluido en el ejemplo es largo, rígido y muy detallado. Eso puede mejorar fidelidad en algunos casos, pero también tiene costos:

| Ventaja | Riesgo |
|---|---|
| Más instrucciones para prendas complejas | Más tokens y más latencia |
| Mayor control sobre reemplazo de ropa | Mayor fragilidad ante contradicciones o redundancias |
| Mejor protección contra errores clásicos | Menor consistencia si el modelo interpreta demasiadas prioridades |

En el ejemplo auditado se repiten varias reglas críticas con un tono muy imperativo. Eso puede ser útil para problemas difíciles como vestidos o prendas de pieza única, pero conviene evaluar si una parte del control debería pasar de prompt largo a **plantillas por categoría más compactas y testeadas**.

## 9. La respuesta al backend es mínima; falta más telemetría útil

El workflow responde solo con:

```json
{ "success": true, "imageUrl": "..." }
```

Eso es suficiente para el camino feliz, pero deja poco contexto para análisis, soporte y observabilidad. Sería valioso incluir, al menos internamente:

- duración real del nodo de generación,
- modelo usado,
- si hubo reintento,
- tamaño final de imagen,
- etapa donde falló en caso de error,
- identificador de ejecución de n8n.

No necesariamente para exponerlo al usuario, sino para tener trazabilidad operativa fuerte entre backend, n8n y soporte.

## Implicaciones concretas sobre la experiencia del cliente

La principal mejora que surge tras ver el workflow real es que ahora queda claro que el problema no es solo de copy o de interfaz. El problema es **de arquitectura percibida**.

El usuario vive un flujo aparentemente simple, pero la operación real tiene suficiente complejidad como para que el producto necesite un diseño más explícito de confianza.

| Momento del usuario | Lo que realmente pasa por detrás | Qué debería comunicar la UI |
|---|---|---|
| “Generar” | Se dispara una cadena larga con proveedor externo y subida final | “Esto puede tardar un poco” |
| Espera > 30 s | Puede seguir procesando normalmente | “Seguimos trabajando en tu imagen” |
| Timeout | Puede haber fallado backend antes que n8n | “No pudimos confirmar el resultado a tiempo” |
| Error final | Puede haberse generado pero no haberse subido | “Hubo un problema técnico al finalizar” |

En otras palabras, el workflow real refuerza la recomendación de rediseñar el comportamiento visible del widget para que la promesa de UX sea consistente con la realidad técnica.

## Recomendaciones priorizadas actualizadas

## Prioridad 1 — Arquitectura y estabilidad

### A. Migrar a modelo asíncrono con estado persistente

Esta recomendación ahora pasa de “muy importante” a **crítica**. Con el workflow real visto, queda claro que el flujo actual tiene demasiados pasos para depender de una sola respuesta síncrona.

### B. Unificar y racionalizar timeouts

Todos los timeouts deberían obedecer a una política única. Mientras siga existiendo flujo síncrono, debe haber coherencia entre frontend, backend y n8n.

### C. Añadir estados de error más precisos entre etapas

Conviene diferenciar al menos:

| Tipo de fallo | Mensaje sugerido |
|---|---|
| Timeout del proveedor | “La generación tardó más de lo esperado” |
| Falla de formato de respuesta | “El servicio devolvió un resultado inválido” |
| Falla de almacenamiento final | “La imagen se generó, pero no pudimos guardarla correctamente” |
| Servicio temporalmente indisponible | “El probador está ocupado en este momento” |

## Prioridad 2 — Seguridad y operación

### D. Eliminar secretos y payloads reales de exports

Esto es inmediato. Cualquier workflow exportado para documentación, soporte o repositorio debe ir sanitizado.

### E. Reemplazar el nodo no-op por limpieza real o renombrarlo

Si no limpia, no debería llamarse “Eliminar Selfie Temporal”. Si sí debe limpiar, entonces hay que implementarlo de verdad.

### F. Añadir observabilidad mínima por ejecución

Recomiendo registrar o devolver internamente:

- `executionId` de n8n,
- duración por etapa,
- causa de error clasificada,
- tamaño y formato de imagen final,
- proveedor/modelo realmente usado.

## Prioridad 3 — Calidad de generación y experiencia premium

### G. Revisar estrategia de prompts largos

Conviene probar versiones más compactas, modulares y medibles por categoría de producto.

### H. Rediseñar el loader del widget para reflejar un pipeline real

La pantalla de carga debería contemplar al menos dos estados textuales distintos:

1. “Preparando tu imagen”,  
2. “Generando el resultado final”.

Si el job se vuelve asíncrono, incluso puede mostrarse una espera más honesta y mucho más confiable.

### I. Mejorar la pantalla de error final

La UI debe ofrecer recuperación clara: reintentar, probar otra foto, volver al producto o contactar a la marca.

## Diagnóstico final actualizado

Con el workflow real adjunto, la auditoría se vuelve más contundente: **Lookitry no tiene hoy un problema de idea ni de producto base; tiene un problema de madurez operativa del pipeline visible para el usuario**.

El sistema está suficientemente bien armado para demostrar valor, pero todavía no del todo preparado para dar una experiencia premium consistente cuando aparecen las condiciones difíciles: latencia alta, respuestas variables del proveedor, errores intermedios o picos de uso.

> **Veredicto final actualizado:** el widget y su integración actual con n8n son funcionales y comercialmente prometedores, pero la experiencia sigue dependiendo demasiado de una cadena síncrona larga, de formatos de respuesta frágiles y de un manejo de error todavía más técnico que experiencial. El siguiente salto de calidad no vendrá solo del diseño visual, sino de una mejor arquitectura de ejecución, mayor observabilidad y una UX de espera/error mucho más honesta.

## Próximo paso recomendado

El mejor siguiente paso sería uno de estos tres:

| Opción | Resultado |
|---|---|
| Convertir esta auditoría en backlog técnico priorizado | Lista accionable para desarrollo |
| Diseñar una nueva arquitectura async para try-on | Menos timeouts y mejor UX |
| Reescribir los copies del widget estado por estado | Más claridad e intuición para cliente final |

Si quieres, en el siguiente paso puedo hacerte cualquiera de estas tres cosas directamente sobre tu proyecto.
