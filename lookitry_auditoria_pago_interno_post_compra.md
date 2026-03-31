# Auditoría del sistema de pago interno post-compra de Lookitry

**Proyecto:** Lookitry  
**Alcance:** experiencia interna posterior a la compra para usuarios con plan **Trial**, **Basic** y **Pro**, incluyendo renovación, upgrade, gestión del cobro, claridad del flujo y seguridad operativa.  
**Método:** revisión técnica y UX del código de frontend y backend que gobierna la gestión interna de suscripción y pagos dentro del dashboard.

## Resumen ejecutivo

El sistema de pago interno de Lookitry está, en términos generales, **bien encaminado a nivel de seguridad transaccional y separación de responsabilidades**, especialmente en los flujos con **Wompi** y **PayPal**. La lógica sensible de firma, referencias, validación y activación final se conserva en backend, mientras que el frontend actúa principalmente como capa de orquestación y comunicación. Esto reduce el riesgo de exposición de secretos y demuestra una arquitectura más madura que la de un checkout superficial.

Sin embargo, desde la perspectiva de producto SaaS y experiencia de un usuario ya suscrito, el sistema todavía presenta **vacíos importantes de claridad operativa, confianza percibida y trazabilidad visible**. El mayor problema no parece ser un fallo grave de seguridad, sino una combinación de **ambigüedad en estados intermedios**, **mensajes poco concluyentes**, **falta de historial y explicación de cobro más transparente**, y una dependencia excesiva de que el usuario “confíe” en que la actualización llegará sola.

En otras palabras, la base técnica del sistema es razonablemente sólida, pero la experiencia posterior a la compra todavía no transmite por completo una sensación de **control**, **certeza**, **auditoría visible** ni **autogestión madura**. Para un SaaS que quiere crecer, el usuario suscrito debe sentir que entiende qué está pagando, qué cambió, cuándo vence, qué pasa si el cobro queda pendiente y qué soporte existe si algo falla.

## Diagnóstico general

| Área | Evaluación | Lectura ejecutiva |
|---|---|---|
| **Seguridad del cobro** | **Alta** | La firma y validación viven en backend; el frontend no expone llaves privadas ni lógica crítica. |
| **Consistencia entre pasarelas** | **Media-Alta** | Wompi y PayPal tienen controles sólidos, pero la experiencia visible no siempre refleja con claridad sus diferencias. |
| **Claridad del flujo interno** | **Media** | El usuario puede pagar y renovar, pero no siempre entiende con precisión qué está ocurriendo ni qué ocurrirá después. |
| **Gestión de estados** | **Media** | Existen estados de éxito, verificación y error, pero algunos mensajes siguen siendo ambiguos o demasiado genéricos. |
| **Autogestión de suscripción** | **Media** | Hay mecanismos para renovar, upgrade y downgrade, pero falta visibilidad de reglas, impactos y evidencias del cambio. |
| **Confianza percibida** | **Media-Baja** | Falta una capa más explícita de certeza: comprobantes, historial, explicación de cobro, siguiente paso y SLA visible. |
| **Madurez SaaS post-compra** | **Media** | La lógica existe, pero la interfaz todavía no funciona como un verdadero centro de facturación autoservicio. |

## Lo que está bien resuelto

El primer punto positivo es que el frontend interno no parece encargarse de tareas que no debería manejar. El botón de Wompi carga el script externo y solicita la configuración firmada desde backend; si el script falla o no está disponible, usa un fallback hacia checkout hospedado. Esto es una buena práctica porque evita bloquear por completo el flujo de pago y mantiene la integridad de la operación sin trasladar lógica sensible al navegador.

También es una señal positiva que el sistema contemple distintos estados del pago, incluyendo **APPROVED**, **PENDING** y errores o rechazos. Aunque la comunicación al usuario todavía puede mejorar, la existencia de este modelado demuestra que el flujo no fue pensado como una confirmación ingenua e instantánea, sino como un proceso transaccional real con verificación posterior.

En backend, tanto **PayPal** como **Wompi** muestran varias defensas razonables. PayPal valida orden rastreada, referencia y monto esperado con tolerancia. Wompi valida la firma del webhook antes de activar suscripciones. Además, las referencias incluyen metadatos útiles para identificar plan, duración, visitante o marca autenticada, lo que reduce ambigüedades y ayuda a reconstruir el contexto del pago.

Otro acierto importante es la lógica de renovación y prorrateo. El sistema ya distingue entre **renovación**, **upgrade** y **downgrade**, y en el caso del upgrade desde Basic hacia Pro intenta usar un cálculo de crédito restante en vez de cobrar de nuevo a ciegas. Eso es valioso desde el punto de vista comercial y reduce sensación de injusticia en el cobro.

## Hallazgos principales

### 1. La base de seguridad es buena, pero la confianza del usuario no está suficientemente visible

Desde el punto de vista técnico, el sistema protege bien varios puntos críticos. Sin embargo, la **seguridad percibida** por el usuario no depende solo de que internamente el sistema esté bien hecho, sino de que la interfaz le explique por qué puede confiar.

Hoy el flujo comunica que el pago es seguro con mensajes cortos como “Paga de forma segura” o indicando la pasarela, pero todavía falta una capa más robusta de certeza dentro del dashboard. Un usuario que ya pagó o que va a renovar espera ver con claridad el método elegido, el monto exacto, el período que está comprando, si se está aplicando crédito por prorrateo, qué ocurrirá con su fecha de vencimiento y qué comprobante o evidencia quedará disponible después.

| Problema visible | Riesgo para negocio | Mejora recomendada |
|---|---|---|
| El usuario ve poca evidencia documental del cobro | Aumentan dudas, tickets y sensación de informalidad | Mostrar resumen de compra antes de pagar y comprobante posterior al cobro |
| El mensaje de seguridad es genérico | La confianza depende demasiado de la reputación de la pasarela | Añadir señales explícitas de validación, cifrado, confirmación y soporte |
| La post-compra no deja un rastro claro en UI | Baja trazabilidad percibida | Incorporar historial detallado de pagos, cambios de plan y estado de cada transacción |

### 2. Los estados de “verificación” están bien pensados técnicamente, pero son débiles en UX

El sistema tiene un estado intermedio de verificación cuando el pago fue aprobado o potencialmente aprobado pero todavía no se confirma del todo en la suscripción. Esa lógica es razonable. El problema es que, para el usuario, “te actualizaremos automáticamente en los próximos minutos” sigue siendo un mensaje demasiado abierto.

El flujo actual parece apoyarse en una verificación periódica del estado de la suscripción. Si la actualización no se refleja tras varios intentos, se informa que el pago quedó en verificación y que aparecerá pronto. Esto evita falsas confirmaciones, pero deja una sensación de incertidumbre. El usuario no sabe si debe esperar treinta segundos, cinco minutos o una hora, ni si tiene que hacer algo más.

> Un sistema de facturación interno no solo debe ser correcto; debe ser **legible** para el usuario en los momentos de mayor ansiedad: cuando acaba de pagar y todavía no ve reflejado el cambio.

La recomendación aquí no es eliminar el estado de verificación, sino **hacerlo mucho más explícito y orientado a resolución**. Debe mostrar tiempo estimado, referencia de pago, método utilizado, acciones de respaldo y una instrucción clara de qué hacer si no se actualiza.

### 3. La lógica de upgrade y prorrateo es valiosa, pero todavía necesita mejor explicación visible

El sistema ya contempla prorrateo en upgrades y eso es un acierto. No obstante, el usuario promedio no va a confiar automáticamente en un cálculo de crédito si no entiende con claridad cómo se obtuvo.

Actualmente, la experiencia parece explicar que el crédito se calcula con base en el valor restante del ciclo actual, pero para convertir esto en una experiencia premium falta un bloque de transparencia más fuerte. El usuario debería ver claramente el plan actual, días restantes, crédito aplicado, valor bruto del nuevo plan, valor descontado y total final a pagar. Si eso ya existe parcialmente, debería mostrarse con más protagonismo y lenguaje más pedagógico.

| Elemento del upgrade | Estado actual | Mejora necesaria |
|---|---|---|
| Cálculo técnico del crédito | **Bueno** | Mantener la lógica actual |
| Explicación al usuario | **Parcial** | Mostrar desglose visible y comprensible |
| Confirmación posterior | **Parcial** | Indicar claramente desde cuándo aplica el nuevo plan |
| Trazabilidad en historial | **Insuficiente** | Registrar visualmente “upgrade con crédito aplicado” |

### 4. El flujo de downgrade parece funcional, pero no lo suficiente como política transparente de suscripción

El sistema comunica que el downgrade aplica al próximo período de facturación, lo cual es correcto y evita cambios bruscos sobre un servicio ya pagado. Aun así, para un SaaS serio no basta con decirlo en una línea descriptiva. El usuario debería poder confirmar con precisión: cuál es su plan actual, cuál será su próximo plan, en qué fecha cambiará, qué conservará hasta ese momento y si puede revertir esa decisión.

Sin esa transparencia, el downgrade funciona técnicamente, pero no alcanza un estándar de autoservicio verdaderamente sólido. En los sistemas maduros de suscripción, los cambios diferidos se sienten casi como una reserva visible, no como una simple intención implícita.

### 5. El sistema está mejor preparado para procesar pagos que para explicarlos

Éste es probablemente el hallazgo más importante. La lógica interna demuestra más madurez en el procesamiento que en la pedagogía del cobro. Se nota que la ingeniería ha trabajado la activación, referencias, validación y actualización de plan; sin embargo, la experiencia del usuario aún no traduce esa complejidad a un lenguaje de negocio claro.

Eso se nota en varias capas: el resumen del cobro, el estado final, la prueba de que el cambio quedó programado, la diferencia entre renovación y ampliación del vencimiento, y la manera en que se comunica la mini-landing o extras incluidos. El usuario puede completar la operación, pero no necesariamente entiende todo lo que compró ni cómo se refleja en su cuenta.

### 6. Falta un verdadero módulo de billing autoservicio dentro del dashboard

La página de suscripción y el checkout interno cumplen su función operativa, pero todavía no equivalen a una consola completa de facturación. Para tener una experiencia SaaS madura, el usuario suscrito debería contar con un panel que reúna de manera inequívoca:

| Componente de billing | Situación observada | Prioridad |
|---|---|---|
| Estado actual del plan | Presente | Mantener y reforzar |
| Fecha de renovación / vencimiento | Presente de forma parcial | Alta |
| Próximo cobro esperado | Necesita mayor visibilidad | Alta |
| Historial de pagos | Insuficiente o no protagonista | Alta |
| Estado de transacciones pendientes | Débil | Alta |
| Método de pago usado | Poco visible | Media-Alta |
| Factura o comprobante descargable | No claramente visible | Alta |
| Gestión de incidentes de cobro | Débil | Alta |
| Cambios programados de plan | Parcial | Alta |
| Soporte contextual de facturación | Parcial | Media |

## Evaluación específica de seguridad

A nivel de seguridad, la auditoría arroja un balance favorable. El backend conserva la responsabilidad de verificar webhooks, validar referencias, contrastar montos y ejecutar la activación real del servicio. Esto es esencial y está alineado con buenas prácticas de arquitectura de pagos.

En Wompi, la validación de firma del webhook es un punto especialmente positivo. En PayPal, la comprobación de orden rastreada, referencia y monto esperado aporta una capa adicional de integridad. También es acertado que el frontend solo consuma configuración pública de pago y no cargue secretos ni firme operaciones localmente.

No obstante, incluso en un sistema técnicamente bien protegido, todavía hay riesgos operativos secundarios que conviene reducir.

| Riesgo | Estado | Recomendación |
|---|---|---|
| Exposición de secretos en frontend | **Bajo** | Mantener el modelo actual |
| Activación por webhook no verificado | **Bajo** | Mantener la validación de firma |
| Inconsistencia de monto en PayPal | **Bajo-Medio** | Mantener y auditar logs de discrepancia |
| Doble activación o duplicidad | **Medio** | Reforzar idempotencia visible en todos los caminos de activación |
| Soporte ante pagos aprobados no reflejados | **Medio** | Crear tooling interno y mensajes de resolución más precisos |
| Trazabilidad administrativa completa | **Media** | Mejorar panel de auditoría y conciliación interna |

La seguridad técnica es suficiente para operar, pero la **seguridad operacional** todavía debe reforzarse con mejor observabilidad, mejor historial y mejores mecanismos de conciliación visibles tanto para usuario como para equipo interno.

## Claridad del flujo para Trial, Basic y Pro

### Trial

El usuario en Trial parece poder avanzar hacia activación paga o hacia compra de capacidades adicionales según reglas del negocio. Sin embargo, este usuario es especialmente sensible a la confusión porque todavía no se siente plenamente “cliente”. Por eso necesita una transición muy clara entre prueba, activación y primera facturación.

La interfaz debería responder sin ambigüedad estas preguntas: qué incluye el Trial, qué se desbloquea al pagar, si la mini-landing puede comprarse en ese momento, cuándo se activará el plan pago y si la fecha del Trial influye sobre el siguiente ciclo.

### Basic

En Basic, la experiencia más crítica es la renovación y el upgrade a Pro. El sistema ya reconoce este caso y aplica lógica de prorrateo. Eso es bueno, pero la UI debe convertirlo en una narrativa clara: “te quedan X días”, “tu crédito es Y”, “pagarás Z hoy”, “tu nuevo plan termina el día N”. Si la interfaz no hace esto con mucha claridad, el usuario siente que el sistema sabe algo que él no sabe.

### Pro

En Pro, el principal reto no es tanto vender el upgrade, sino dar sensación de control sobre renovación, continuidad, facturación y extras incluidos. El usuario Pro es quien más espera una experiencia madura. Si sigue viendo mensajes genéricos o un historial poco claro, percibirá el sistema como menos profesional de lo que realmente es.

## Fricciones de experiencia detectadas

| Fricción | Impacto en usuario | Impacto en negocio |
|---|---|---|
| Mensajes genéricos después del pago | Ansiedad y dudas | Más soporte y menor confianza |
| Falta de evidencia inmediata del cambio solicitado | Sensación de opacidad | Menor percepción de calidad |
| Poca explicación del prorrateo | Desconfianza en el monto | Menor conversión a upgrade |
| Ausencia de billing center robusto | Menor autoservicio | Más dependencia de soporte |
| Estados pendientes poco accionables | Usuario no sabe qué hacer | Tickets duplicados y fricción post-pago |
| Visibilidad limitada de método, ciclo y comprobante | Menor confianza para renovar | Mayor sensibilidad al abandono |

## Recomendaciones priorizadas

### Prioridad crítica

La primera prioridad es transformar la post-compra en una experiencia mucho más explicativa. El estado de verificación debe incluir **referencia de pago**, **método usado**, **monto**, **tiempo estimado**, **mensaje de respaldo** y un CTA de soporte contextual. Si el sistema tarda en reflejar el cambio, el usuario debe saber exactamente qué esperar.

La segunda prioridad es convertir la sección de suscripción en un **centro de facturación**. No basta con mostrar el plan actual. Debe existir una vista clara de ciclo actual, siguiente cobro, método usado, historial de transacciones, cambios programados y comprobantes disponibles.

La tercera prioridad es reforzar la transparencia del upgrade con prorrateo. El cálculo debe mostrarse como un desglose comercial entendible, no solo como una consecuencia matemática del backend.

### Prioridad alta

Es importante añadir una sección de “qué pasa después” antes del pago. En renovación, downgrade y upgrade, el usuario debería leer una explicación específica al caso antes de pagar. Así se reduce incertidumbre y soporte posterior.

También conviene normalizar la comunicación entre pasarelas. Wompi y PayPal pueden seguir teniendo implementaciones distintas, pero la experiencia textual y visual debería sentirse consistente. El usuario no debería percibir comportamientos radicalmente diferentes según la pasarela elegida.

### Prioridad media

Se recomienda mejorar el soporte contextual en la sección de suscripción, incluyendo preguntas frecuentes específicas de billing, recuperación de pagos pendientes, resolución de discrepancias y contacto con soporte con contexto prellenado.

También sería valioso agregar señales de seguridad y cumplimiento más visibles dentro del dashboard, no para “decorar” la interfaz, sino para reducir miedo en renovaciones y upgrades de mayor ticket.

## Propuesta de estructura ideal para el módulo interno de pagos

| Bloque | Qué debe mostrar |
|---|---|
| **Resumen actual** | Plan activo, estado, fecha de vencimiento, próxima renovación, método preferido |
| **Cambiar plan** | Upgrade/downgrade con explicación exacta del impacto |
| **Resumen de cobro** | Precio base, descuentos, crédito aplicado, add-ons, total final |
| **Estado de transacción** | Pendiente, aprobado, en verificación, fallido, con referencia visible |
| **Historial de pagos** | Fecha, monto, método, concepto, estado y acceso a comprobante |
| **Incidencias** | Pagos en revisión, errores, reintentos y canal de soporte contextual |
| **Seguridad y confianza** | Pasarela usada, validación, soporte y política de resolución |

## Veredicto final

El sistema interno de pago de Lookitry **ya tiene una base técnica suficientemente seria** para operar renovaciones, upgrades y activaciones de suscripción con un nivel razonable de seguridad. No parece un sistema improvisado. Hay separación correcta entre frontend y backend, validaciones útiles y modelado real de eventos de pago.

Pero si la pregunta es si hoy transmite una experiencia de facturación verdaderamente madura, clara y tranquilizadora para un usuario suscrito, la respuesta todavía es **no del todo**. La plataforma está más cerca de un sistema “correcto y funcional” que de un sistema “premium, autoservicio y completamente confiable a ojos del cliente”.

La mejora más importante ya no pasa tanto por agregar más lógica transaccional, sino por hacer visible y comprensible la que ya existe. Cuando el usuario entiende el cobro, el cambio de plan, el crédito aplicado, el estado del pago y el siguiente paso, la confianza sube de forma drástica. Ahí es donde Lookitry puede convertir un sistema técnicamente bueno en una experiencia de billing realmente sobresaliente.

## Checklist ejecutivo de implementación sugerida

| Acción | Prioridad | Impacto esperado |
|---|---|---|
| Añadir estado post-pago con referencia, monto, método y ETA | Crítica | Reduce ansiedad y tickets |
| Crear historial de billing completo y visible | Crítica | Aumenta confianza y autoservicio |
| Mostrar desglose de prorrateo paso a paso | Crítica | Mejora conversión a upgrade |
| Hacer visible el próximo cobro y fecha exacta | Alta | Reduce incertidumbre de renovación |
| Mostrar cambios programados de downgrade | Alta | Mejora control y transparencia |
| Unificar mensajes UX entre Wompi y PayPal | Alta | Mayor coherencia del sistema |
| Añadir comprobantes o referencias descargables | Alta | Mayor legitimidad percibida |
| Mejorar soporte contextual de facturación | Media | Menor fricción post-compra |

## Archivos revisados

Esta auditoría se apoyó principalmente en la revisión de los siguientes archivos del proyecto:

| Capa | Archivo |
|---|---|
| Frontend | `frontend/src/app/dashboard/subscription/page.tsx` |
| Frontend | `frontend/src/app/dashboard/checkout/page.tsx` |
| Frontend | `frontend/src/components/payments/WompiButton.tsx` |
| Frontend | `frontend/src/services/subscription.service.ts` |
| Frontend | `frontend/src/services/payments.service.ts` |
| Backend | `backend/src/controllers/subscription.controller.ts` |
| Backend | `backend/src/controllers/wompi.controller.ts` |
| Backend | `backend/src/controllers/paypal.controller.ts` |
| Backend | `backend/src/services/subscription.service.ts` |

## Conclusión corta

Si tuviera que resumir la auditoría en una sola frase, sería esta:

> **Lookitry ya tiene un motor de cobro interno bastante competente, pero todavía necesita una capa más fuerte de claridad, trazabilidad y autoservicio para que el usuario suscrito sienta control total y confianza total después de pagar.**
