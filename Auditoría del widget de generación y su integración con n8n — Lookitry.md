# Auditoría del widget de generación y su integración con n8n — Lookitry

## Alcance y criterio de revisión

Esta auditoría evalúa el **widget de generación try-on** desde dos ángulos complementarios: la **experiencia real del usuario** en el frontend y la **robustez del flujo técnico** que conecta la generación con n8n. El análisis se hizo teniendo en cuenta las reglas del proyecto en `REGLAS_IMPORTANTES.md`, especialmente el criterio de experiencia premium, claridad operativa y prevención de fallos.

> **Conclusión principal:** el widget tiene una base sólida, una estructura de estados clara y varias decisiones correctas para reducir costo duplicado y proteger la experiencia. Sin embargo, todavía presenta fricciones importantes en **expectativas del usuario**, **manejo de errores**, **confianza durante la espera** y **claridad de la integración con n8n**. La mejora más urgente no es visual sino de producto: hacer que el usuario entienda mejor qué va a pasar, cuánto va a tardar, qué ocurrió si falla y qué puede hacer después.

| Área | Estado actual | Nivel |
|---|---|---:|
| Flujo de selfie | Bueno | 7/10 |
| Flujo de selección y generación | Bueno, pero mejorable | 7/10 |
| Pantalla de resultado | Funcional, con oportunidades claras | 6.5/10 |
| Mensajería de errores | Insuficiente para usuario final | 5.5/10 |
| Integración técnica con n8n | Correcta, pero opaca y frágil de cara al usuario | 6/10 |
| Claridad arquitectónica repo ↔ n8n | Confusa | 5/10 |

## Archivos auditados

Se revisaron como base principal los siguientes archivos:

| Archivo | Función en el flujo |
|---|---|
| `/mnt/desktop/Lookitry/frontend/src/components/tryon/TryOnWidget.tsx` | Orquestación principal del widget, estados, caché y eventos embed |
| `/mnt/desktop/Lookitry/frontend/src/components/tryon/SelfieUploader.tsx` | Subida de selfie, compresión y paso inicial del usuario |
| `/mnt/desktop/Lookitry/frontend/src/components/tryon/templates/TemplateBare.tsx` | Vista principal del flujo upload → select → generating → result |
| `/mnt/desktop/Lookitry/frontend/src/components/tryon/ResultDisplay.tsx` | Resultado, descarga, compartir y feedback |
| `/mnt/desktop/Lookitry/frontend/public/widget.js` | Script de embed del widget en sitios externos |
| `/mnt/desktop/Lookitry/frontend/src/services/tryon.service.ts` | Cliente frontend hacia la API pública de try-on |
| `/mnt/desktop/Lookitry/backend/src/controllers/pruebalo.controller.ts` | Lógica pública de validación, créditos, prompt y generación |
| `/mnt/desktop/Lookitry/backend/src/services/n8n.client.ts` | Cliente backend que realmente conecta la generación con n8n |
| `/mnt/desktop/Lookitry/backend/src/controllers/enterprise.controller.ts` | Confirmación de que el workflow `scripts/n8n` corresponde a sync enterprise, no al try-on |
| `/mnt/desktop/Lookitry/scripts/n8n/enterprise-sync-workflow-manual.md` | Documento de n8n encontrado en repo, pero ajeno al pipeline de generación try-on |

## Hallazgo arquitectónico clave sobre n8n

Aquí hay una distinción muy importante:

> El **archivo que realmente conecta el widget de generación con n8n** no es el workflow dentro de `scripts/n8n`, sino el cliente backend `backend/src/services/n8n.client.ts`.

Ese archivo envía al webhook de n8n los campos `brand_id`, `product_id`, `selfie_url`, `product_image_url` y `prompt`, con timeout de **90 segundos** y autenticación por bearer token. Desde `pruebalo.controller.ts`, la generación pública del widget termina llamando a `n8nClient.callTryOnWebhook(...)`.

En cambio, el workflow documentado en `scripts/n8n/enterprise-sync-workflow-manual.md` y la lógica de `enterprise.controller.ts` pertenecen a otro problema: la **sincronización enterprise de catálogo/productos**, no a la generación visual try-on.

| Elemento | ¿Conecta el widget try-on con n8n? | Observación |
|---|---|---|
| `backend/src/services/n8n.client.ts` | Sí | Es la conexión real del pipeline de generación |
| `backend/src/controllers/pruebalo.controller.ts` | Sí | Dispara el webhook vía el cliente n8n |
| `scripts/n8n/enterprise-sync-workflow-manual.md` | No | Corresponde a sincronización de catálogo enterprise |
| `scripts/n8n/enterprise-sync-workflow.json` | No | También es de sync enterprise |
| `backend/src/controllers/enterprise.controller.ts` | No, para try-on | Confirma otro flujo distinto hacia n8n |

## Lo que está bien resuelto en el widget

El widget tiene varias decisiones acertadas que sí aportan valor de negocio y reducen fricción. La primera es la **deduplicación por foto + producto**. En frontend se cachea localmente el resultado por producto y, en backend, se deduplica por `input_fingerprint`, lo cual evita dobles cobros y además refuerza una percepción de sistema “inteligente”. La mensajería de reutilización del resultado es, en general, positiva para el cliente.

También es correcta la secuencia de estados del widget: `upload`, `select`, `generating`, `result`. Esa estructura es fácil de mantener y transmite orden conceptual. Además, el flujo embed contempla mensajes al parent como `TRYON_READY`, `TRYON_COMPLETE`, `TRYON_ERROR` y `TRYON_RESIZE`, lo cual muestra una integración bastante madura para incrustación en terceros.

Por último, el uploader móvil está bien pensado: separar cámara y galería reduce errores, y la compresión previa evita algunos problemas de rendimiento y subida.

## Problemas de experiencia del usuario

### 1. La espera está bien diseñada visualmente, pero no es confiable desde la percepción del usuario

El widget entra en estado `generating` y muestra una experiencia limpia, pero la progresión está desacoplada de la realidad del backend. El frontend aborta a los **95 segundos** en `tryon.service.ts`, mientras que el cliente backend de n8n usa **90 segundos**. Para el usuario, esto genera una situación delicada: la interfaz parece “estar trabajando” con una lógica de avance implícita, pero no comunica si la IA está procesando, si está atascada o si ya falló aguas abajo.

Esto tiene un impacto fuerte en confianza. Cuando una generación tarda mucho, el usuario no distingue entre cuatro escenarios distintos: procesamiento normal, saturación, timeout del webhook o error de proveedor. Todo se siente como “algo pasó”.

**Mejora recomendada:** convertir la pantalla de espera en un estado más honesto. En lugar de simular avance, conviene mostrar:

| Elemento | Recomendación |
|---|---|
| Tiempo estimado | “Esto puede tardar entre 20 y 90 segundos” |
| Estado real | “Estamos procesando tu foto y la prenda” |
| Plan B | “Si tarda demasiado, te mostraremos una opción para reintentar” |
| Persistencia | “No cierres esta ventana” o guardar job para recuperar resultado |

### 2. El usuario no recibe suficiente contexto antes de generar

En `SelfieUploader.tsx` sí se dan tips útiles como “Buena luz”, “Foto frontal” y “Cara visible”. Eso es positivo. Sin embargo, antes de pulsar el botón final de generación no se explican tres cosas esenciales para la conversión y para reducir soporte:

1. **Cuánto suele tardar**.
2. **Qué calidad de resultado esperar**.
3. **Qué hacer si el resultado sale mal**.

Hoy el usuario entra relativamente “a ciegas” al momento de generar. Para un producto IA, eso aumenta frustración cuando el resultado no es perfecto.

**Mejora recomendada:** añadir una microcapa educativa antes del CTA final, con copy muy corto. Por ejemplo:

> “La generación tarda normalmente menos de 1 minuto. Para mejores resultados, usa una foto frontal con buena luz. Si algo sale mal, podrás reportarlo al final.”

### 3. El mensaje de éxito está bien emocionalmente, pero la utilidad posterior todavía es corta

La pantalla de resultado acierta con el tono positivo: “¡Te ves genial!”. También es un buen recurso mostrar antes/después, porque refuerza el valor de la IA. Sin embargo, después del resultado hay margen para volverlo más útil y más orientado a conversión.

Actualmente el usuario puede descargar, compartir en algunos casos, probar otro y reportar problemas. Eso es funcional, pero todavía le falta una **siguiente mejor acción** más clara según contexto.

**Ejemplos de mejora:**

| Contexto | CTA recomendado |
|---|---|
| E-commerce / embed en tienda | “Ver este producto” / “Comprar ahora” |
| Landing de marca | “Hablar por WhatsApp” |
| Marca con catálogo | “Probar otro producto” destacado por categoría |
| Usuario que ya generó | “Comparar otros colores / diseños” |

Hoy el widget termina la experiencia, pero no la capitaliza del todo.

### 4. Algunos fallos se silencian demasiado

En `ResultDisplay.tsx`, si falla el envío de feedback, el modal simplemente se cierra. Eso evita un `alert()`, lo cual está bien, pero desde UX el resultado es ambiguo. El usuario puede creer que el reporte sí se envió cuando no fue así.

Lo mismo ocurre en otros puntos: hay manejo técnico razonable, pero no siempre existe una traducción clara para usuario final.

**Mejora recomendada:** cada fallo visible debe terminar en uno de estos tres patrones:

| Tipo de fallo | Qué debe ver el usuario |
|---|---|
| Fallo recuperable | “No pudimos completar esto ahora. Intenta otra vez.” |
| Fallo no recuperable inmediato | “El servicio está temporalmente ocupado.” |
| Acción alternativa | “Puedes volver a intentarlo o probar otra foto.” |

### 5. El copy del widget es usable, pero todavía no alcanza una sensación premium consistente

El flujo usa muchos textos en mayúsculas, etiquetas cortas y llamadas enérgicas. Eso funciona visualmente, pero en algunos tramos el tono queda más cerca de un widget promocional que de una experiencia premium y confiable. En un producto de IA que manipula la imagen del usuario, la confianza pesa más que la energía visual.

Mi recomendación es mantener la identidad fuerte de Lookitry, pero equilibrarla con mensajes más naturales y explicativos en momentos críticos: espera, error, feedback y recuperación.

## Problemas técnicos con impacto directo en UX

### 1. Doble timeout y ausencia de patrón asincrónico real

El frontend corta a los **95 segundos** y el cliente de n8n en backend corta a los **90 segundos**. El problema no es solo el número; el problema es que todo el flujo depende todavía de una **respuesta síncrona larga**, que es delicada para embeds, móviles, redes lentas y proveedores de IA variables.

> Mientras la generación siga esperando una respuesta completa del webhook, el widget seguirá expuesto a errores de percepción, abandonos y reintentos confusos.

**Recomendación prioritaria:** migrar de un flujo síncrono a un flujo tipo **job asíncrono**.

### Propuesta de arquitectura mejorada

| Paso | Flujo recomendado |
|---|---|
| 1 | El usuario sube selfie y el backend crea una generación `PENDING` |
| 2 | El backend dispara n8n y responde inmediatamente con `generationId` |
| 3 | El frontend entra en “procesando” con polling o SSE |
| 4 | n8n termina y actualiza la generación a `SUCCESS` o `FAILED` |
| 5 | El frontend consulta estado y renderiza resultado o error claro |

Esto reduce la fragilidad del embed, evita timeouts frontales absurdos y deja trazabilidad mucho mejor.

### 2. La integración real con n8n existe, pero el workflow del lado n8n no está visible en el repo

`n8n.client.ts` deja claro el contrato de entrada al webhook de generación. Sin embargo, el repositorio no parece incluir el **workflow específico del try-on** que recibe ese payload. El único workflow de n8n documentado en `scripts/n8n` es de sync enterprise.

Esto genera un problema de mantenibilidad:

| Riesgo | Consecuencia |
|---|---|
| No tener el workflow try-on versionado aquí | Difícil auditar extremo a extremo |
| Cambios en n8n fuera del repo | Se rompe el contrato sin trazabilidad clara |
| Equipo nuevo o soporte | Más difícil depurar incidencias reales |

**Recomendación:** versionar también el workflow n8n de try-on o, como mínimo, dejar un archivo de contrato técnico junto a `n8n.client.ts` con:

- payload exacto enviado,
- respuestas esperadas,
- posibles errores por status code,
- timeout objetivo,
- proveedor implicado,
- política de reintentos.

### 3. Mensajes de error internos bien pensados, pero mal traducidos a experiencia de usuario

`pruebalo.controller.ts` distingue correctamente entre:

- créditos insuficientes,
- créditos agotados del proveedor,
- duplicado exitoso por fingerprint,
- fallo genérico de generación,
- límites de uso.

Eso está muy bien a nivel de backend. El problema es que el usuario final no siempre recibe una explicación igualmente buena. Por ejemplo, `SERVICE_CREDITS_EXHAUSTED` termina siendo tratada de forma diferenciada, pero la experiencia debería convertirse en un estado de producto mucho más amable, como:

> “Este probador está temporalmente ocupado. Intenta en unos minutos.”

Si el mensaje que ve el cliente se siente técnico o errático, la culpa recae sobre la marca que embebe Lookitry, no sobre la infraestructura.

### 4. La compartición social es parcial y poco robusta

En `ResultDisplay.tsx`, el compartir nativo depende de `navigator.share`. Si no existe, se muestra un mensaje y se deriva a WhatsApp o Facebook. Sin embargo, el `shareUrl` se basa en `window.location.href`, lo cual en un embed o en entornos complejos puede no ser el recurso ideal para compartir una prueba específica.

Esto debilita la capacidad viral del resultado.

**Recomendación:** generar una URL canónica por generación o una landing corta de resultado. Compartir una prueba concreta da mucho más valor que compartir simplemente la URL actual del contenedor.

### 5. El script de embed es correcto, pero todavía básico en comunicación con el host

`frontend/public/widget.js` resuelve slug, intenta detectar `productId`, crea el iframe y escucha `TRYON_RESIZE`. Eso está bien como mínimo viable robusto. Pero todavía falta madurez en tres frentes:

| Falta | Impacto |
|---|---|
| No hay eventos estándar documentados para analítica | Difícil medir drop-off por paso |
| No hay fallback visible si no se detecta producto | El widget puede arrancar sin contexto claro |
| No hay contrato público de integración | Más soporte manual para partners |

**Recomendación:** documentar formalmente eventos como:

- `TRYON_READY`
- `TRYON_UPLOAD_STARTED`
- `TRYON_GENERATION_STARTED`
- `TRYON_COMPLETE`
- `TRYON_ERROR`
- `TRYON_FEEDBACK_SENT`

y permitir que el host los consuma para analítica y personalización.

## Puntos concretos de fricción detectados

| Punto de fricción | Dónde ocurre | Impacto en cliente | Prioridad |
|---|---|---|---:|
| Espera larga sin estado real | Generación | Baja confianza y abandono | Alta |
| Falta de expectativa de tiempo antes de generar | Antes del CTA | Más frustración | Alta |
| Error de feedback silencioso | Resultado | Sensación ambigua | Media |
| Compartición limitada | Resultado | Menor viralidad | Media |
| Sin workflow try-on visible en repo | Integración n8n | Menor mantenibilidad | Alta |
| Arquitectura síncrona al webhook | Backend ↔ n8n | Fragilidad ante timeouts | Alta |
| Copy poco explicativo en momentos críticos | Todo el flujo | Menor intuición | Media |
| Sin CTA final orientado a compra/conversación | Resultado | Menor conversión | Alta |

## Recomendaciones priorizadas

## Prioridad 1 — Cambios de alto impacto inmediato

### A. Pasar la generación a modelo asíncrono por job

Este es el cambio más valioso del conjunto. No solo mejora estabilidad técnica; mejora también la percepción de velocidad y control.

### B. Mejorar la mensajería de espera, error y recuperación

El widget debe decir con más claridad:

- qué está haciendo,
- cuánto puede tardar,
- cuándo conviene reintentar,
- qué hacer si falla.

### C. Añadir CTA posterior a conversión

Después del resultado, la interfaz debería empujar a una acción contextual: comprar, hablar por WhatsApp, probar otro producto o ver catálogo.

## Prioridad 2 — Cambios de producto y confianza

### D. Añadir mini onboarding antes de generar

Un bloque de 2 o 3 líneas puede reducir bastante la frustración por malos resultados.

### E. Hacer visibles errores realmente entendibles para cliente final

Los errores técnicos deben traducirse en lenguaje comercial, humano y accionable.

### F. Versionar o documentar el workflow n8n de try-on

Aunque no sea visible en el repo hoy, debería existir una especificación clara del flujo de generación.

## Prioridad 3 — Madurez y escalabilidad

### G. Exponer eventos de analítica para el host

Esto ayudaría a medir cuántos usuarios:

- abren el widget,
- suben selfie,
- seleccionan producto,
- inician generación,
- terminan con éxito,
- abandonan o fallan.

### H. Crear URL de resultado por generación

Esto mejoraría compartir, soporte, reengagement y potencial viral.

## Propuesta de experiencia ideal del flujo

| Etapa | Experiencia actual | Experiencia recomendada |
|---|---|---|
| Subir selfie | Clara | Clara + expectativa de calidad |
| Elegir producto | Funcional | Funcional + mini guía antes de generar |
| Generando | Visualmente buena, pero incierta | Transparente, con estado honesto y tolerancia a latencia |
| Resultado | Bonito, pero corto | Bonito + accionable + compartible |
| Error | Técnico o ambiguo | Humano, claro, con recuperación |

## Veredicto final

El widget de generación de Lookitry **ya está por encima de un MVP básico**. Tiene estructura, criterio de ahorro de costos, buen manejo de embed y una lógica de backend bastante cuidada. El problema principal ya no es “si funciona”, sino **cómo se siente** cuando el usuario espera, falla, duda o quiere continuar después del resultado.

> **Mi veredicto es que el widget está en un nivel funcional bueno, pero todavía no en un nivel premium intuitivo.** El mayor salto de calidad vendrá de combinar tres cosas: un flujo asíncrono real hacia n8n, una mensajería mucho más honesta durante la espera y una pantalla de resultado más orientada a conversión.

Si quieres, el siguiente paso puede ser cualquiera de estos tres:

1. convertir esta auditoría en una **lista de tareas priorizada para desarrollo**,  
2. proponerte **copy exacto mejorado** para cada estado del widget, o  
3. revisar directamente **tus dashboards de usuario** o el **workflow try-on de n8n** si me compartes su archivo exacto.
