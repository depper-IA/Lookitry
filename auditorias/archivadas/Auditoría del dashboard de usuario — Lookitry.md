# Auditoría del dashboard de usuario — Lookitry

> **AUDITADA ✓ — 1 de abril de 2026**

## Resumen ejecutivo

Esta auditoría evalúa el **dashboard de usuario** de Lookitry teniendo en cuenta las reglas del proyecto y las auditorías previas de **registro**, **pago** y **widget de generación**. El objetivo no es solo valorar si el panel “se ve bien”, sino determinar si realmente ayuda al cliente a entender su estado, activar su cuenta, instalar su probador, controlar su consumo y tomar la siguiente mejor decisión sin fricción.

> **Conclusión principal:** el dashboard tiene una base visual fuerte, una identidad premium clara y varias capas útiles de activación, onboarding y retención. Sin embargo, todavía presenta un problema importante de **priorización de información**. Hoy el panel comunica muchas cosas, pero no siempre comunica **lo más importante primero**. Como resultado, un usuario nuevo puede entrar y ver un panel bonito, pero no necesariamente entender con rapidez cuál es su siguiente paso crítico para obtener valor.

| Área | Evaluación | Nivel |
|---|---|---:|
| Identidad visual | Muy buena | 8.5/10 |
| Claridad de navegación | Buena, con solapamientos | 7/10 |
| Jerarquía de prioridades | Mejorable | 6/10 |
| Continuidad con registro y pago | Aceptable, pero inconsistente | 6.5/10 |
| Comprensión del consumo y límites | Buena visualmente, regular conceptualmente | 6.5/10 |
| Capacidad de activar al usuario nuevo | Buena intención, ejecución dispersa | 7/10 |
| Confianza operacional | Correcta, pero todavía superficial | 6/10 |

## Archivos auditados

| Archivo | Rol en la experiencia |
|---|---|
| `/mnt/desktop/Lookitry/frontend/src/app/dashboard/page.tsx` | Home principal del dashboard |
| `/mnt/desktop/Lookitry/frontend/src/components/dashboard/DashboardLayout.tsx` | Navegación global, sidebar, cabecera y banners transversales |
| `/mnt/desktop/Lookitry/frontend/src/app/dashboard/DashboardRouteShell.tsx` | Validación de sesión, estado de suscripción, suspensión y modales contextuales |
| `/mnt/desktop/Lookitry/frontend/src/components/dashboard/UsageStats.tsx` | Presentación de límites, consumo y sugerencia de upgrade |
| `/mnt/desktop/Lookitry/frontend/src/services/usage.service.ts` | Fuente de datos de uso |
| `/mnt/desktop/Lookitry/frontend/src/services/analytics.service.ts` | Fuente de datos de analytics resumidos |
| `/mnt/desktop/Lookitry/frontend/src/app/dashboard/subscription/page.tsx` | Continuidad del pago y gestión del plan desde el panel |
| `/mnt/desktop/Lookitry/frontend/src/components/dashboard/DashboardNotifications.tsx` | Comunicación de alertas de uso y vencimiento |

## Lo que el dashboard hace bien

El panel ya transmite una sensación de producto premium. La combinación de tipografía, contraste, volumetría de cards, iconografía y espaciado está bastante por encima de un panel SaaS genérico. No parece improvisado. Eso es importante porque Lookitry vende una experiencia tecnológica y aspiracional, y el dashboard sí acompaña esa promesa.

También hay una virtud estructural clara: el sistema ya contempla distintos momentos del cliente. Hay elementos para **onboarding**, para **notificaciones urgentes**, para **trial**, para **mejora a PRO**, para **verificación de correo** y para **suspensión**. Eso demuestra que el panel no fue pensado solo como un contenedor de datos, sino como una superficie de acompañamiento comercial y operacional.

Además, el dashboard conecta razonablemente bien con los grandes dominios del producto: catálogo, generaciones, página pública, integraciones, uso, suscripción, analytics y perfil. A nivel de cobertura funcional, el usuario tiene acceso a casi todo lo que necesita.

## Problema central: el panel es bonito, pero todavía no es suficientemente obvio

El principal hallazgo de esta auditoría es el siguiente:

> El dashboard muestra mucha información útil, pero no siempre ayuda al usuario a identificar **qué es lo más importante hacer ahora**.

Esta falta de foco se vuelve más evidente cuando se cruza el panel con las auditorías previas. En registro y pago ya aparecía una fricción de continuidad: el usuario puede completar pasos técnicos, pero aún necesita más guía para comprender su estado real y su siguiente acción. En el widget también se detectó que el producto funciona, pero no siempre explica bien lo que está ocurriendo. El dashboard repite ese patrón: ofrece módulos correctos, pero la narrativa del estado del cliente todavía está fragmentada.

## Hallazgos principales

## 1. La home del dashboard mezcla estado, vanity metrics y activación sin una prioridad inequívoca

En `dashboard/page.tsx` el usuario ve:

- saludo de bienvenida,
- accesos rápidos,
- consumo del mes,
- tasa de éxito,
- pruebas totales,
- top 3 productos,
- estado del sistema,
- límites del plan,
- CTA de instalación,
- consejo de optimización.

Todo esto tiene valor, pero el problema es el orden. Para muchos usuarios, especialmente nuevos, la pregunta principal no es “¿cuál es mi tasa de éxito?” sino algo más básico:

- ¿ya terminé de configurar mi cuenta?,
- ¿mi probador está realmente activo?,
- ¿qué me falta para empezar a vender?,
- ¿estoy cerca de un límite importante?,
- ¿qué hago ahora?

La home actual dedica mucho espacio a métricas que lucen bien, pero que a veces llegan **antes** de que el usuario tenga claro su madurez dentro del producto.

| Tipo de módulo | Valor actual | Problema |
|---|---|---|
| Métricas rápidas | Alto impacto visual | No siempre son la prioridad número uno |
| Top productos | Bueno para usuarios con tracción | Poco útil para cuentas nuevas |
| Estado del sistema | Relevante | Se queda corto en profundidad |
| CTA instalación | Muy importante | Compite con otros elementos visuales |

**Recomendación:** convertir la home en un dashboard más orientado a **estado y acción** que a solo resumen visual.

## 2. La navegación tiene buena cobertura, pero hay naming y agrupación mejorables

En `DashboardLayout.tsx` la navegación lateral incluye once entradas. La cobertura funcional es buena, pero hay cierta superposición conceptual que puede generar duda, especialmente en usuarios no técnicos.

| Entrada | Posible duda del usuario |
|---|---|
| `Mi página` | ¿Es mi landing, mi perfil público o mi tienda? |
| `Widget Probador` | ¿Configura el widget, el branding, o la experiencia completa del try-on? |
| `Integraciones` | ¿Es para instalar el widget, conectar WooCommerce o ambas cosas? |
| `Uso` y `Analytics` | ¿Qué diferencia práctica hay entre ambas? |

El panel sí funciona, pero exige un pequeño esfuerzo de interpretación. En un producto B2B con clientes de perfiles mixtos, esa carga cognitiva importa.

**Recomendación:** reagrupar y renombrar pensando en objetivos de usuario. Por ejemplo, separar mentalmente:

| Grupo recomendado | Pantallas |
|---|---|
| Operación | Inicio, Productos, Generaciones |
| Presencia y ventas | Mi página, Widget, Integraciones |
| Cuenta | Uso, Suscripción, Perfil |
| Inteligencia | Analytics |

## 3. La home no convierte suficientemente bien el estado del cliente en una “siguiente mejor acción”

La auditoría de registro y pago mostró que Lookitry necesita reducir fricción en continuidad. El dashboard debería compensar eso con una capa muy clara de orientación. Sin embargo, la home actual solo lo hace parcialmente.

Por ejemplo, el CTA **“Instalar en mi Tienda”** aparece en la columna lateral, pero no necesariamente como la acción dominante del panel, incluso cuando instalar puede ser el paso más importante para capturar valor. Del mismo modo, el banner de verificación de email existe, pero compite con otras piezas del layout.

**Falta una capa tipo “Estado de activación de tu cuenta”** con checklist visible. Algo como:

| Paso | Estado | CTA |
|---|---|---|
| Verificar correo | Pendiente / Listo | Reenviar email |
| Añadir primer producto | Pendiente / Listo | Crear producto |
| Instalar widget | Pendiente / Listo | Ir a integraciones |
| Publicar landing o página | Pendiente / Listo | Configurar |
| Generar primeras pruebas | Pendiente / Listo | Ver probador |

Ese bloque tendría más valor estratégico que varias métricas visuales para usuarios en etapa temprana.

## 4. El dashboard comunica consumo de forma atractiva, pero no siempre de la forma más intuitiva

`UsageStats.tsx` está bien resuelto visualmente. Las barras, porcentajes, alertas y la sugerencia de upgrade son claras. El problema no es gráfico sino conceptual.

Actualmente se usan conceptos como:

- “Créditos de Generación”,
- “Slots de Catálogo”,
- “Próximo Ciclo de Facturación”,
- “Tus créditos se restaurarán al 100%”.

Esto es entendible, pero todavía puede sentirse un poco técnico o de sistema. Para algunos usuarios sería más intuitivo expresar el beneficio o la consecuencia, no solo el contador.

Por ejemplo:

| Texto actual | Texto más intuitivo |
|---|---|
| Créditos de Generación | Pruebas disponibles este mes |
| Slots de Catálogo | Productos activos en tu probador |
| Reinicio | Tu cupo se renueva el... |
| Límite crítico | Te quedan pocas pruebas disponibles |

La auditoría de pago ya mostraba la necesidad de hacer los límites más comprensibles comercialmente. El dashboard todavía puede avanzar bastante en ese frente.

## 5. Hay inconsistencias de continuidad entre alertas del panel y rutas de suscripción

`DashboardNotifications.tsx` envía al usuario a `/dashboard/checkout`, mientras que la navegación principal y la gestión más rica del plan viven en `/dashboard/subscription`.

Esto introduce una fricción innecesaria. Desde el punto de vista del cliente, “renovar mi plan”, “aumentar capacidad” o “resolver vencimiento” deberían sentirse como un mismo dominio de producto, no como rutas distintas según desde dónde haya llegado al problema.

> **Hallazgo importante:** la continuidad interna del panel todavía no está completamente unificada. Algunas urgencias del usuario empujan a una ruta distinta de la que el propio dashboard presenta como centro de suscripción.

**Recomendación:** unificar el destino principal de todas las alertas de plan y consumo hacia una sola pantalla maestra de suscripción, salvo casos muy específicos de checkout directo ya preseleccionado.

## 6. El estado del sistema es demasiado optimista y poco diagnóstico

En la columna lateral de la home aparece “Probador Online”. El problema no es que el mensaje sea positivo, sino que puede ser simplista.

A la luz de la auditoría del widget y n8n, sabemos que la realidad técnica del try-on tiene más matices: disponibilidad aparente, latencia, instalación, publicación, calidad del flujo, etc. Por eso, afirmar simplemente “Online” puede generar una percepción de certeza que el sistema no siempre puede sostener de forma realista.

**Mejor enfoque:** mostrar un estado más accionable y menos absoluto. Por ejemplo:

| Estado sugerido | Significado |
|---|---|
| Probador publicado | La URL pública existe y es accesible |
| Widget instalado | La integración en tienda ya está activa |
| Generación operativa | El flujo está respondiendo correctamente |
| Requiere atención | Falta instalación, verificación o plan |

Esto ayudaría mucho más al usuario que un único estado binario.

## 7. El panel premia más la estética que la explicación en algunos puntos críticos

Hay varios lugares donde el tono es muy visual, muy energético y muy de marca, pero menos didáctico de lo que conviene. Ejemplos:

- “Probador virtual activo y optimizado” al dar la bienvenida,
- “Optimización IA” como consejo lateral,
- ciertos bloques con tono aspiracional antes que operativo.

Ese lenguaje funciona como capa de branding, pero debería convivir con textos más concretos. En un dashboard, el usuario valora mucho una respuesta inmediata a estas preguntas:

- qué está pasando,
- qué me falta,
- cuál es el riesgo,
- qué gano si hago clic aquí.

**Recomendación:** mantener la energía visual de Lookitry, pero introducir más copy funcional en home, banners y módulos de estado.

## 8. El dashboard está mejor preparado para clientes activos que para clientes recién activados

El bloque “Top #3 del Probador” está bien diseñado, pero es naturalmente más útil para usuarios con cierto volumen. También las tarjetas “Tasa de éxito” y “Pruebas totales” tienen más valor cuando ya existe tracción.

En cambio, para un cliente que acaba de registrarse o pagar, la home debería responder primero a la pregunta: **“¿cómo saco valor rápido de esto?”**.

Aquí es donde las auditorías previas se conectan con claridad:

| Auditoría previa | Hallazgo | Impacto en dashboard |
|---|---|---|
| Registro | Faltaba continuidad clara | El dashboard debería absorber esa guía inicial |
| Pago | Había fricciones de intuición | El panel debería explicar mejor plan, estado y siguiente paso |
| Widget + n8n | La operación real es compleja | El dashboard debería traducir complejidad en confianza y acción |

## 9. El sistema de banners y overlays es potente, pero corre el riesgo de saturar

Entre `DashboardRouteShell.tsx`, `DashboardLayout.tsx` y componentes transversales, el usuario puede encontrarse con:

- modal de suspensión,
- modal de trial expirado o pendiente,
- banner de upgrade a PRO,
- prompt de review,
- onboarding wizard,
- notificaciones del dashboard,
- trial banner,
- banner de verificación de email.

Cada pieza tiene sentido por separado, pero juntas pueden crear una experiencia de capa sobre capa. Esto es especialmente delicado en cuentas nuevas o en móvil.

**Recomendación:** definir una jerarquía estricta de prioridad de mensajes. No todo debería competir al mismo tiempo.

| Prioridad sugerida | Tipo de mensaje |
|---|---|
| 1 | Bloqueos de acceso o suspensión |
| 2 | Pago pendiente / trial expirado |
| 3 | Verificación de email |
| 4 | Checklist de activación |
| 5 | Alertas de uso o vencimiento |
| 6 | Upsells y review prompts |

## 10. La página de suscripción es rica, pero conceptualmente muy densa

La pantalla de suscripción parece querer resolver demasiadas cosas a la vez: estado del plan, historial de pagos, precios dinámicos, gateways, addon de créditos, filtros, upgrade, renovación y explicación de features.

Esto tiene valor, pero también puede fatigar. La auditoría de pago ya mostró que la claridad comercial es crítica. Dentro del panel, el usuario idealmente no debería sentir que “entra a una pantalla compleja para entender cuánto debe o cómo seguir”.

**Recomendación:** dividir mentalmente esa pantalla en tres capas muy claras:

| Capa | Contenido |
|---|---|
| Estado actual | plan, vencimiento, uso, próximo cobro |
| Acción principal | renovar, mejorar o comprar addon |
| Historial y detalle | pagos previos, filtros, trazabilidad |

## Problemas de intuición más importantes

| Problema | Impacto | Prioridad |
|---|---|---:|
| Falta de un bloque central de activación | El usuario no sabe qué hacer primero | Alta |
| Navegación con naming superpuesto | Más fricción cognitiva | Media |
| Home prioriza métricas antes que estado y acción | Menor claridad | Alta |
| Alertas llevan a rutas inconsistentes | Menor continuidad | Alta |
| Estado “Probador Online” demasiado simplificado | Menor confianza diagnóstica | Media |
| Exceso potencial de banners/modales | Saturación | Alta |
| Consumo expresado con lenguaje algo técnico | Menor intuición para negocio | Media |

## Recomendaciones priorizadas

## Prioridad 1 — Cambios de mayor impacto inmediato

### A. Añadir un bloque superior de “Estado de tu cuenta”

Este bloque debería ir por encima de métricas y resumir en un vistazo:

- estado del plan,
- verificación del correo,
- cantidad de productos activos,
- si el widget está instalado o no,
- si la página pública está lista,
- CTA principal sugerido.

### B. Reordenar la home para que primero se entienda el estado y luego el rendimiento

Orden recomendado:

1. estado de cuenta y activación,  
2. CTA principal,  
3. consumo y límites,  
4. métricas y analytics,  
5. consejos de optimización.

### C. Unificar las rutas de acción de plan y renovación

Todas las alertas relevantes deberían empujar a una experiencia coherente centrada en `/dashboard/subscription` o en una única puerta de entrada definida.

## Prioridad 2 — Mejoras de claridad y confianza

### D. Renombrar o reagrupar elementos de la navegación

El usuario debería entender sin pensar demasiado la diferencia entre “Widget”, “Integraciones”, “Mi página”, “Uso” y “Analytics”.

### E. Reescribir copy de límites y consumo en lenguaje más comercial

Menos lenguaje de sistema, más lenguaje orientado a negocio y capacidad disponible.

### F. Reemplazar el estado binario “Online” por estados más reales y útiles

Esto reforzaría mucho la confianza del cliente, especialmente cuando la infraestructura real es más compleja.

## Prioridad 3 — Madurez del panel

### G. Limitar concurrencia de banners y overlays

Definir una política clara para que el usuario no reciba demasiados impulsos simultáneos.

### H. Adaptar la home según madurez del cliente

Una cuenta nueva no debería ver exactamente la misma prioridad que una cuenta madura con datos, productos y tráfico.

### I. Convertir analytics rápidos en insights accionables

En lugar de solo mostrar “Tasa de éxito” o “Top #3”, el panel debería conectar esos datos con decisiones:

- impulsar producto más probado,
- subir nuevas fotos,
- ampliar plan,
- instalar integración,
- revisar errores recientes.

## Propuesta de home ideal

| Sección | Objetivo |
|---|---|
| Estado de la cuenta | Entender situación actual en 5 segundos |
| Próximo paso recomendado | Reducir fricción y acelerar activación |
| Consumo y plan | Evitar sorpresas y mejorar comprensión |
| Rendimiento comercial | Mostrar valor real del producto |
| Acciones rápidas | Crear producto, instalar, ver probador, mejorar plan |
| Insights y consejos | Optimizar uso sin saturar |

## Veredicto final

El dashboard de usuario de Lookitry **ya tiene una base visual y estructural fuerte**. No parece un panel pobre ni improvisado. El problema no está en la falta de módulos, sino en la **narrativa del producto dentro del panel**.

> **Veredicto final:** el dashboard es visualmente premium y funcionalmente amplio, pero todavía no convierte toda esa capacidad en una experiencia realmente intuitiva. El siguiente salto de calidad no consiste en añadir más tarjetas, sino en hacer que el panel responda mejor a una sola pregunta: “¿qué necesito entender y hacer ahora para que Lookitry me genere valor?”

Si quieres, el siguiente paso puede ser cualquiera de estos tres:

1. convertir esta auditoría en un **backlog priorizado por pantalla y componente**,  
2. proponerte una **nueva estructura ideal de la home del dashboard**, o  
3. escribirte **copies exactos mejorados** para banners, tarjetas, estados y CTAs del panel.
