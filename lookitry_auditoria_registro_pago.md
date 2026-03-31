# Auditoría de los métodos de registro y pago de Lookitry

**Autor:** Manus AI  
**Fecha:** 31 de marzo de 2026  
**Base de revisión:** `REGLAS_IMPORTANTES.md` y análisis del frontend/backend del proyecto.

## Alcance y criterio de evaluación

Esta auditoría revisa la experiencia de cliente en los flujos de **registro**, **checkout**, **confirmación de pago** y **activación de cuenta**, con foco en una pregunta práctica: **qué partes hoy generan fricción y cómo podrían volverse más intuitivas para un cliente que llega por primera vez al producto**. El análisis no se centra únicamente en si el código funciona, sino en si el recorrido resulta claro, consistente y confiable desde la percepción del usuario. [1] [2] [5] [6] [7] [8] [9] [10]

> En la documentación del proyecto ya se definen dos recorridos relevantes: un flujo de prueba pagada en `/register` → `/trial-checkout` → webhook → verificación/email, y un flujo de pago dinámico en `/checkout` con activación posterior de la suscripción. Esa base es funcional, pero hoy convive con varias bifurcaciones que hacen que el cliente no siempre entienda con claridad en qué paso exacto está ni qué ocurrirá después de pagar. [1]

| Dimensión evaluada | Observación general | Nivel actual |
|---|---|---:|
| Claridad del recorrido | El sistema funciona, pero el usuario atraviesa flujos distintos según trial, plan pago, sesión existente, landing y método de pago | Medio-bajo |
| Intuición del registro | Hay campos y mensajes correctos, pero el orden de los pasos cambia entre rutas | Medio |
| Intuición del pago | El checkout comunica precio y métodos, pero la continuidad después del pago no siempre se siente lineal | Medio |
| Recuperación ante errores | Existen mecanismos de reintento y recuperación, aunque la comunicación al cliente todavía es técnica | Medio |
| Consistencia de producto | El producto mezcla varios modelos mentales: “crear cuenta antes de pagar”, “pagar antes de crear cuenta” y “vincular compra a sesión existente” | Bajo |

## Diagnóstico ejecutivo

La conclusión principal es que **Lookitry ya tiene la infraestructura para vender y activar correctamente**, pero la experiencia todavía se percibe como un sistema con varios embudos superpuestos, no como un único onboarding coherente. En la práctica, un cliente puede empezar creando cuenta y luego pagar, o puede pagar primero y luego completar la cuenta, o puede comprar con una sesión existente y enlazar la compra automáticamente. Desde negocio esto cubre muchos casos; desde experiencia de usuario, introduce ambigüedad. [2] [5] [6] [7] [9]

El punto más importante a mejorar no es un botón aislado ni un copy puntual, sino la **arquitectura del recorrido**. Hoy el usuario necesita interpretar demasiadas reglas implícitas: cuándo su email solo sirve para vincular un pago, cuándo ya está creando una cuenta real, cuándo el pago activa inmediatamente el plan y cuándo aún falta “crear mi cuenta”. Ese desajuste explica buena parte de la fricción potencial. [2] [5] [7] [9]

| Veredicto global | Evaluación |
|---|---|
| Estado actual | **Funcional pero cognitivamente fragmentado** |
| Riesgo principal | El cliente puede sentir que el proceso “se alarga” o “cambia de lógica” según el caso |
| Mejora con mayor retorno | **Unificar el onboarding de registro y pago en un solo modelo mental visible** |
| Prioridad recomendada | Alta |

## Hallazgos principales

### 1. El producto usa dos lógicas de onboarding distintas y eso reduce la intuición

En el flujo de trial, el usuario entra a `/register`, completa datos de marca, define contraseña y luego es enviado a `/trial-checkout`. En el flujo pago general, el usuario entra a `/checkout`, deja solo el email si no tiene sesión, paga, llega a `/pago-exitoso` y recién después completa la cuenta en `/registro-pro`. Es decir, **unas veces se crea primero la cuenta y luego se paga; otras veces se paga primero y luego se crea la cuenta**. [2] [5] [7] [8] [9]

Para el equipo técnico esto puede ser razonable, pero para el cliente significa que el sistema no tiene una sola narrativa. Una marca pequeña no piensa en “flows”; piensa en preguntas simples: “¿primero me registro o primero pago?”, “¿ya tengo cuenta o todavía no?”, “¿mi pago ya activó todo o aún me falta otro paso?”. Cuando esas respuestas dependen de la ruta, la experiencia pierde naturalidad.

| Evidencia | Impacto UX | Recomendación |
|---|---|---|
| `/register` crea cuenta y redirige a `/trial-checkout` [2] [3] | El usuario siente que ya terminó el alta, pero todavía no puede usar el servicio | Cambiar el lenguaje para que ese paso sea “datos previos a la activación” o mover la creación real de cuenta para después del pago |
| `/checkout` pide solo email a visitantes y delega la creación de cuenta a `/registro-pro` [5] [7] | El usuario paga sin percibir que aún no ha terminado su alta | Mostrar una barra de progreso visible: **1. Selecciona plan → 2. Paga → 3. Activa tu acceso** |
| `/pago-exitoso` puede mostrar CTA “Crear mi cuenta” después de un pago exitoso [9] | El cliente puede interpretar que el pago no activó nada todavía | Renombrar el estado como “Pago confirmado, falta activar tu acceso” cuando aplique |

### 2. La ruta `/register` comunica “Crear cuenta”, pero en realidad muchas veces es una antesala del pago

El formulario de registro tiene buena base visual y solicita información útil: nombre de marca, responsable, slug, email y contraseña. Sin embargo, el CTA principal en el modo normal dice **“Empezar prueba de X días”**, mientras el encabezado dice **“Crear cuenta”** y el submit finalmente redirige a `/trial-checkout`. Además, si no hay trial activo, la página puede redirigir directamente al checkout de prueba paga. [2]

Eso produce una fricción sutil pero importante: el usuario entra a una pantalla que parece de alta definitiva, pero su acción real es avanzar a otra pantalla de pago. La interfaz mezcla dos promesas distintas en una misma vista. Desde UX, sería más limpio que esta página no se llamara “Crear cuenta” si todavía falta pagar, o que el propio formulario explicara de forma explícita: **“Primero dejas tus datos, luego confirmas el pago y al final se activa tu acceso”**.

| Elemento actual | Problema percibido | Mejora sugerida |
|---|---|---|
| Título: “Crear cuenta” [2] | Promete una cuenta ya lista | Usar “Activa tu prueba” o “Completa tus datos para continuar” |
| Redirección automática a `/trial-checkout` si no hay trial activo [2] | Puede sentirse abrupta y poco explicada | Sustituir la redirección automática por un estado intermedio con explicación clara y CTA explícita |
| Contraseña solicitada antes del pago [2] | El cliente entrega más datos de los necesarios antes de confirmar compra | Pedir solo email y nombre de marca antes del pago, y dejar contraseña para el paso final de activación |

### 3. El checkout principal es potente, pero demasiadas decisiones aparecen juntas

La página `/checkout` resuelve muchos casos en una sola interfaz: plan, subplan para landing, meses, promociones, cupón, moneda, método de pago, sesión activa o visitante, email de vinculación y canales alternativos de pago. Comercialmente esto es flexible; experiencialmente, también puede ser demasiado para un primer usuario. [5]

El mayor riesgo aquí no es visual, sino cognitivo. Cuando una pantalla concentra demasiadas decisiones, el usuario tarda más en construir confianza. Esto afecta especialmente al caso de la mini-landing, donde se comunica “pago único” pero al mismo tiempo se exige un plan activo. Aunque la lógica de negocio esté bien, el mensaje puede sonar contradictorio si no se estructura con más claridad. [5]

| Aspecto del checkout | Evaluación | Mejora prioritaria |
|---|---|---|
| Selección de plan y duración | Correcta, pero muy densa | Mantenerla, pero dividir en pasos visuales o secciones numeradas |
| Mini-landing + plan incluido | Lógica válida, explicación insuficiente | Reetiquetar como **“Complemento Mini-landing”** en lugar de tratarla como un plan al mismo nivel |
| Cupón y promociones | Útil, pero añade ruido en primera compra | Colapsar el bloque de cupón bajo “¿Tienes un código?” |
| Email para visitantes | Correcto, aunque mínimo | Añadir una frase más fuerte: “Con este correo te enviaremos el enlace para activar tu cuenta después del pago” |

### 4. La continuidad después del pago todavía se siente demasiado técnica

La pantalla de `/pago-exitoso` hace varias cosas valiosas, como recuperar referencias, capturar pagos PayPal cuando corresponde y decidir inteligentemente la siguiente CTA. Sin embargo, desde la perspectiva del cliente, sigue existiendo un problema: **el pago exitoso no siempre equivale a acceso listo**. A veces el usuario queda en un estado intermedio en el que debe crear su cuenta, esperar confirmación o verificar el pago. [9]

Esto no es necesariamente un error funcional; es un problema de expectativa. Cuando una pantalla dice “¡Pago confirmado!”, el usuario suele esperar que el siguiente clic lo deje dentro del producto. Si en algunos casos aún necesita completar datos o esperar webhook, conviene expresarlo como un estado guiado de activación, no como una confirmación cerrada.

| Estado actual tras pagar | Riesgo de percepción | Mejora recomendada |
|---|---|---|
| “¡Pago confirmado!” con CTA “Crear mi cuenta” [9] | Puede parecer que el sistema aún no terminó | Cambiar el copy a “Pago confirmado. Ahora activemos tu acceso.” |
| Espera de webhook o captura en segundo plano [6] [9] [10] | El cliente puede dudar de si su pago realmente entró | Mostrar un paso visual de “Confirmando pago” con temporizador y autoactualización, no solo mensajes estáticos |
| Referencia técnica visible al usuario [7] [9] | Útil para soporte, poco humana como señal principal | Mantenerla secundaria, no como elemento central del mensaje |

### 5. `/registro-pro` resuelve bien casos complejos, pero la experiencia sigue siendo de recuperación, no de fluidez

La página post-pago tiene varias fortalezas. Recupera referencias, permite revalidar estado, soporta auto-vinculación con sesión activa y hasta maneja el caso en que el correo del pago ya existe. Técnicamente es una pantalla robusta. Sin embargo, desde el punto de vista del cliente, el hecho de que exista tanta lógica de recuperación revela que el recorrido ya llega con demasiadas bifurcaciones previas. [6] [7]

El cliente no debería sentir que está “rescatando” una compra o “volviendo a verificar” un pago salvo en un caso excepcional. Si ese comportamiento forma parte visible del recorrido normal, la sensación general es de proceso frágil, aunque por detrás sea seguro.

| Elemento de `/registro-pro` | Valor técnico | Problema UX |
|---|---|---|
| Botón “Volver a verificar pago” [7] | Ayuda cuando el webhook tarda | Hace visible una espera que debería resolverse automáticamente |
| Estado mostrado como `paid`, `used`, etc. [7] | Muy útil para depuración | Es lenguaje interno, no lenguaje de cliente |
| Email alternativo cuando el correo ya existe [7] | Evita bloqueo del registro | Puede generar desconfianza si aparece sin suficiente contexto |
| Auto-link con sesión activa [7] | Excelente para reducir pasos | Debe comunicarse explícitamente: “Detectamos tu cuenta, activaremos esta compra allí” |

### 6. El modelo de autenticación mezcla cookie segura y almacenamiento local, lo cual puede generar estados ambiguos

En el backend se emite cookie HTTP-only, pero en frontend también se guardan token y datos de marca en `localStorage`. Además, algunas comprobaciones de sesión se apoyan en la existencia del objeto `brand` guardado localmente. Esto puede funcionar operativamente, pero aumenta la probabilidad de que la UI crea que existe una sesión cuando la sesión real ya cambió, o viceversa. [3] [5]

Desde el punto de vista de experiencia, los estados ambiguos de autenticación son peligrosos porque afectan justo los pasos más sensibles: checkout, vinculación de compra y redirección al dashboard. Un cliente no entiende “desincronización de sesión”; solo ve que el sistema a veces lo trata como logueado y a veces como visitante.

| Observación | Riesgo | Acción recomendada |
|---|---|---|
| La sesión visual depende en parte de `localStorage` [5] | Estados inconsistentes en checkout y activación | Centralizar la verdad de sesión en una verificación backend al cargar pantallas críticas |
| También se almacena token fuera de la cookie [2] [5] | Complejidad innecesaria del flujo | Migrar gradualmente a un solo modelo de sesión para frontend |

### 7. Existen algunos detalles concretos que reducen claridad o accesibilidad

Además de la arquitectura general del recorrido, hay detalles pequeños que, sumados, afectan la percepción de calidad. En registro y activación, la contraseña solo exige seis caracteres y no pide confirmación; el botón para mostrar contraseña no queda bien preparado para navegación por teclado; y en login no aparece una llamada clara a reenviar la verificación cuando el error es `EMAIL_NOT_VERIFIED`. [2] [3] [4]

No son bloqueadores, pero sí oportunidades de mejora rápida porque impactan confianza, reducción de errores y accesibilidad percibida.

| Detalle | Observación | Prioridad |
|---|---|---:|
| Contraseña mínima de 6 caracteres [2] [3] | Es poco robusta y no comunica calidad premium | Media |
| Sin confirmación de contraseña [2] [7] | Aumenta errores de escritura | Media |
| Botón ver/ocultar con `tabIndex={-1}` [2] [7] | Reduce accesibilidad con teclado | Media |
| Falta CTA visible de reenvío de verificación en login [3] | Puede bloquear a usuarios válidos | Alta |

### 8. Hay una inconsistencia funcional importante en el checkout gratuito que conviene corregir

En el frontend del checkout se contempla explícitamente el caso de un visitante sin sesión cuando el total queda en cero por un cupón del 100%, y se espera una respuesta con `isVisitor` y `reference` para continuar hacia `/registro-pro`. Sin embargo, el endpoint `freeCheckout` en el controlador de Wompi exige usuario autenticado. [5] [10]

Esto es, además de un hallazgo técnico, un problema de experiencia potencialmente severo. Si se activa una promoción o cupón total y el usuario no tiene sesión, el comportamiento esperado por la interfaz no coincide con el comportamiento real del backend. En la práctica, esto puede traducirse en compras gratuitas que no se entienden o en errores difíciles de explicar al cliente.

| Inconsistencia detectada | Riesgo de negocio/UX | Recomendación |
|---|---|---|
| Frontend prevé visitantes en free checkout [5] | El usuario puede ver una promesa que el backend no soporta | Unificar contrato frontend/backend antes de lanzar campañas con cupón 100% |
| Backend exige autenticación en `freeCheckout` [10] | Posible bloqueo silencioso del funnel gratuito | O bien soportar visitantes de verdad, o bien ocultar ese flujo cuando no exista sesión |

## Cómo hacerlo más intuitivo para el cliente

La mejora más efectiva sería rediseñar todo el onboarding comercial bajo un único principio: **el cliente debe entender siempre en qué paso está, qué ya quedó listo y qué falta para empezar a usar Lookitry**. En este momento la lógica técnica ya contempla muchos escenarios; lo que falta es una narración unificada de producto.

### Flujo recomendado de alta prioridad

| Paso propuesto | Qué ve el cliente | Qué debería pasar internamente |
|---|---|---|
| 1. Elegir plan | Selección simple entre prueba, Básico, Pro y complemento Mini-landing | Se crea un registro temporal de intención de compra |
| 2. Datos mínimos | Solo email y nombre de marca, con mensaje de qué se usará después | Se guarda `pending_registration` o equivalente |
| 3. Pago | Resumen claro, método, precio final y siguiente paso visible | Se inicia Wompi o PayPal |
| 4. Confirmación | Pantalla de “Pago confirmado, activando acceso” con progreso automático | Se valida webhook/captura y se prepara activación |
| 5. Activación de cuenta | Solo si falta: contraseña, nombre responsable y URL | Se crea o vincula la cuenta real |
| 6. Entrada al dashboard | CTA único y final | Acceso completo |

La clave no es únicamente mover campos entre pantallas, sino **hacer visible la progresión**. Si el usuario sabe que está en una secuencia de cinco pasos y siempre ve cuál sigue, tolera mucho mejor una espera de webhook o una validación adicional. El problema actual es que varias de esas transiciones existen, pero son implícitas.

### Recomendaciones priorizadas

| Prioridad | Recomendación | Beneficio esperado |
|---|---|---|
| Alta | Unificar el modelo de onboarding para que pagar y activar cuenta sigan siempre la misma lógica | Reduce confusión y abandono |
| Alta | Sustituir títulos genéricos como “Crear cuenta” por mensajes dependientes del momento real del funnel | Mejora comprensión inmediata |
| Alta | Añadir barra de progreso en `/checkout`, `/pago-exitoso` y `/registro-pro` | Aumenta sensación de control |
| Alta | Reescribir el flujo de mini-landing como complemento de un plan, no como plan paralelo | Evita contradicción entre “pago único” y “requiere plan activo” |
| Alta | Corregir la inconsistencia del checkout gratuito para visitantes | Evita fallos en promociones |
| Media | Pedir contraseña únicamente al final de la activación, o siempre en el mismo momento | Hace el proceso más coherente |
| Media | Reemplazar estados técnicos (`paid`, `used`, etc.) por mensajes humanos | Reduce ansiedad post-pago |
| Media | Autoactualizar el estado del pago en `/registro-pro` en vez de depender del botón de reintento | Hace el sistema parecer más confiable |
| Media | Añadir confirmación y fuerza visual de contraseña | Reduce errores de acceso |
| Media | Añadir CTA de “reenviar verificación” directamente en login | Disminuye soporte y bloqueos |

## Quick wins que pueden aplicarse sin rehacer todo el funnel

Aunque el rediseño ideal es estructural, hay varias mejoras rápidas que ya aumentarían la intuición del sistema sin una reingeniería completa. La primera sería cambiar los copies de las pantallas para que reflejen exactamente el estado real del usuario. La segunda sería mostrar un progreso visual fijo en los recorridos de compra y activación. La tercera sería humanizar más los mensajes técnicos de post-pago, especialmente en espera de webhook o conflictos de email. [2] [5] [7] [9] [10]

| Quick win | Esfuerzo | Impacto |
|---|---:|---:|
| Cambiar “Crear cuenta” por “Completa tus datos para activar tu acceso” en los puntos intermedios | Bajo | Alto |
| Mostrar progreso “Paso 2 de 3” o “Paso 3 de 4” | Bajo | Alto |
| Ocultar estados técnicos y usar mensajes de cliente | Bajo | Medio-alto |
| Añadir texto explícito de qué ocurrirá después de pagar | Bajo | Alto |
| Añadir reenvío de verificación desde login | Bajo | Medio |
| Pedir confirmación de contraseña | Bajo | Medio |

## Conclusión

**Sí, Lookitry puede volverse claramente más intuitivo para el cliente**, y la principal oportunidad no está en sumar más validaciones, sino en **simplificar el relato del proceso**. Hoy la plataforma resuelve muchos casos reales y eso es valioso, pero desde afuera se siente como varios caminos unidos entre sí. El cliente ideal debería percibir una sola historia: elige, paga, activa y entra.

Si tuviera que priorizar una sola decisión de producto, recomendaría esta: **convertir registro y pago en un único onboarding visible, con progreso, lenguaje consistente y una separación muy clara entre “pago confirmado” y “cuenta activada”**. Esa mejora probablemente tendría más impacto en conversión y confianza que cualquier ajuste menor de estilos o textos aislados.

## Referencias

[1]: file:///mnt/desktop/Lookitry/REGLAS_IMPORTANTES.md "REGLAS_IMPORTANTES.md"
[2]: file:///mnt/desktop/Lookitry/frontend/src/components/auth/RegisterForm.tsx "frontend/src/components/auth/RegisterForm.tsx"
[3]: file:///mnt/desktop/Lookitry/backend/src/controllers/auth.controller.ts "backend/src/controllers/auth.controller.ts"
[4]: file:///mnt/desktop/Lookitry/backend/src/services/auth.service.ts "backend/src/services/auth.service.ts"
[5]: file:///mnt/desktop/Lookitry/frontend/src/app/checkout/page.tsx "frontend/src/app/checkout/page.tsx"
[6]: file:///mnt/desktop/Lookitry/backend/src/controllers/auth-post-payment.controller.ts "backend/src/controllers/auth-post-payment.controller.ts"
[7]: file:///mnt/desktop/Lookitry/frontend/src/app/registro-pro/page.tsx "frontend/src/app/registro-pro/page.tsx"
[8]: file:///mnt/desktop/Lookitry/frontend/src/app/trial-checkout/page.tsx "frontend/src/app/trial-checkout/page.tsx"
[9]: file:///mnt/desktop/Lookitry/frontend/src/app/pago-exitoso/page.tsx "frontend/src/app/pago-exitoso/page.tsx"
[10]: file:///mnt/desktop/Lookitry/backend/src/controllers/wompi.controller.ts "backend/src/controllers/wompi.controller.ts"
