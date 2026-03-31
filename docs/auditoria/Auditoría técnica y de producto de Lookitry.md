# Auditoría técnica y de producto de Lookitry

**Autor:** Manus AI  
**Fecha:** 2026-03-31

## Resumen ejecutivo

Tras revisar la estructura del repositorio, varios archivos críticos del `frontend`, `backend` y plugin de WooCommerce, además de la experiencia visible en la web pública, la conclusión general es que **Lookitry tiene una base de producto convincente, una propuesta comercial clara y una arquitectura suficientemente seria para seguir creciendo**, pero hoy convive con varias tensiones típicas de una startup en expansión: **complejidad centralizada, políticas de seguridad demasiado permisivas en puntos clave, deuda de higiene operativa dentro del repositorio y una primera experiencia comercial que todavía puede afinarse para convertir mejor y transmitir más confianza** [1] [2] [3] [4] [5] [6].

El proyecto destaca especialmente por su claridad estratégica. No es un prototipo desordenado sin norte; por el contrario, se percibe una intención sólida de construir una plataforma SaaS B2B para e-commerce latinoamericano con integración embebible, pagos regionales, automatización con IA y canales comerciales bien definidos. Esa coherencia es valiosa y reduce riesgo de producto. Sin embargo, el siguiente salto no depende solo de añadir funcionalidades, sino de **hacer el sistema más mantenible, más seguro y más creíble en su capa de presentación** [1] [2] [3] [4] [6].

## Diagnóstico general

| Área | Evaluación | Lectura ejecutiva |
| --- | --- | --- |
| Propuesta de valor | Fuerte | El sitio y la documentación explican bien el problema, el público objetivo y el beneficio comercial. |
| Arquitectura de solución | Buena, con señales de saturación | La separación frontend/backend/workflows/plugin existe, pero hay puntos de acoplamiento y centralización. |
| Seguridad | Aceptable, pero mejorable con prioridad alta | Existen decisiones permisivas que probablemente resolvieron compatibilidad, pero abren superficie de riesgo. |
| Calidad de código | Buena base | TypeScript, tests y estructura modular existen, aunque el control de calidad del build está debilitado. |
| Higiene operativa | Media-baja | El repositorio mezcla código productivo con artefactos temporales y utilitarios operativos. |
| UX y conversión | Buena | El mensaje es claro, pero el primer pantallazo compite con demasiados estímulos y podría convertir mejor. |
| Escalabilidad organizacional | Media | El proyecto aún parece depender de conocimiento implícito y archivos “todopoderosos”. |

## Lo que estás haciendo bien

La primera fortaleza es la **claridad del posicionamiento**. El README define con precisión el mercado, el problema y la solución: probador virtual con IA para e-commerce B2B en Latinoamérica, con integración rápida y foco en reducir devoluciones y aumentar conversión. Esa claridad también se traslada a la web pública, donde el hero y el pricing comunican bien el beneficio principal y el tipo de cliente al que apuntas [1] [4] [6].

La segunda fortaleza es que la arquitectura no está improvisada. En la documentación se ve una separación explícita entre **frontend en Next.js**, **backend en Express/TypeScript**, **persistencia en Supabase**, **almacenamiento**, **orquestación por workflows** y un **plugin para WooCommerce**. Además, el backend real confirma que la aplicación ya opera con autenticación, limitación de tasa, middlewares, rutas diferenciadas y varios módulos de negocio, lo que demuestra madurez operativa superior a la de un MVP básico [1] [2].

La tercera fortaleza es la existencia de una cultura inicial de calidad. Tanto el frontend como el backend usan TypeScript; además, el repositorio incluye pruebas automatizadas en ambas capas. Esto no garantiza cobertura suficiente, pero sí indica que ya existe una base sobre la cual se puede endurecer el pipeline sin empezar desde cero [2] [4].

## Principales problemas detectados

### 1. El backend central está creciendo demasiado en un solo punto

El archivo `backend/src/app.ts` actúa como centro de ensamblaje de una gran cantidad de rutas, middlewares, políticas CORS, endpoints sueltos, seguridad, parsers, sitemap y lógica operativa de arranque. Técnicamente funciona, pero a medida que el producto siga creciendo, este patrón volverá más lento cualquier cambio, elevará el riesgo de regresiones y hará más difícil razonar sobre qué rutas son públicas, privadas, embebibles o internas [2].

> En `app.ts` conviven la configuración de Helmet, dos estrategias de CORS, rate limiting, parsers, decenas de rutas y endpoints específicos como uploads, coupons, enterprise y sitemap en un único punto de montaje, lo que es una señal clara de centralización arquitectónica. [2]

Esto no significa que hoy esté “mal hecho”, sino que **ya está cerca del punto en el que la complejidad acumulada empieza a costar velocidad**. Mi recomendación es evolucionar hacia una composición por dominios o por contextos, donde cada módulo registre sus propias rutas, middlewares y políticas asociadas.

### 2. La postura de seguridad parece haber cedido demasiado a la compatibilidad

Hay varias decisiones que probablemente surgieron para facilitar el embed, el widget y flujos externos, pero que conviene revisar con urgencia. En el backend aparecen políticas con `origin: '*'` para rutas públicas, y en Helmet se usan directivas permisivas como `unsafe-inline` y `unsafe-eval`. En el frontend, el `Content-Security-Policy` también permite inline scripts y `img-src *`, mientras que ciertas rutas embebibles usan `frame-ancestors *` [2] [3].

| Señal | Dónde aparece | Riesgo principal |
| --- | --- | --- |
| `unsafe-inline` / `unsafe-eval` | CSP backend y frontend | Aumenta superficie para XSS e inyección de scripts. |
| `img-src *` | `frontend/next.config.js` | Reduce control sobre orígenes y complica endurecer CSP. |
| `frame-ancestors *` | Rutas embebibles del frontend | Facilita integración, pero habilita framing desde cualquier origen. |
| `origin: '*'` en rutas públicas | `backend/src/app.ts` | Requiere que la autenticación y validación interna sean impecables. |

El problema no es usar compatibilidad, sino **usar compatibilidad sin una estrategia de endurecimiento progresivo**. Si el producto va a integrarse en tiendas de terceros, necesitas distinguir con mucha más precisión qué partes deben ser universalmente embebibles y cuáles deberían estar limitadas por firma, allowlists dinámicas o tokens efímeros.

### 3. El plugin de WooCommerce expone información sensible al navegador

En `lookitry-woocommerce/includes/frontend-hooks.php`, el plugin envía al JavaScript del cliente la `api_key` y el `store_domain` mediante `wp_localize_script`. Aunque esa clave pueda no ser equivalente a una credencial maestra, **cualquier dato de autorización expuesto al navegador debe tratarse como potencialmente público**. Si esa API key sirve para identificar o autorizar operaciones del comercio, entonces el diseño merece revisión inmediata [5].

La mejora aquí no es cosmética. El modelo correcto suele consistir en que el cliente nunca reciba secretos persistentes, sino **tokens limitados, firmados y con corta duración**, o bien en que la verificación real ocurra del lado servidor con callbacks controlados. Si hoy dependes de una clave estática visible en el front para proteger recursos del embed, esa protección es débil por definición [5].

### 4. El pipeline de calidad está aflojando justo donde más lo necesitas

El frontend tiene `reactStrictMode: true`, lo cual es positivo, pero también define `eslint.ignoreDuringBuilds = true`. En la práctica, eso significa que el build puede salir aun cuando haya problemas que el linter habría frenado. Para un producto comercial en crecimiento, esto suele volverse costoso porque los errores menores se convierten en deuda acumulada, y la disciplina del equipo se degrada silenciosamente [3].

Si además consideramos que hay cambios sin consolidar en el repositorio y archivos temporales mezclados con código estable, la impresión general es que el proyecto ya entró en una fase donde la velocidad está empezando a ganarle a la higiene. Eso es normal durante una etapa de expansión, pero es precisamente el momento para reinstalar controles antes de que el costo se dispare [3].

### 5. El repositorio necesita una limpieza clara entre producto y operación

La raíz del proyecto contiene directorios y artefactos como `tmp`, herramientas auxiliares, carpetas de asistentes, scripts ad hoc y residuos operativos que no parecen pertenecer al núcleo del producto. Además, el estado del repositorio muestra archivos modificados y nuevos sin consolidar. Esto no solo afecta la estética del repo; **afecta onboarding, revisión de cambios, trazabilidad y confianza en despliegues** [4].

En otras palabras, hoy parece que el repositorio también está funcionando como escritorio operativo. Esa práctica puede servir en una fase temprana, pero luego dificulta distinguir entre activo productivo, script de emergencia, experimento y documentación viva.

## Revisión de UX, conversión y confianza

La home pública comunica muy bien el valor central. El titular es directo, el mercado objetivo está bien enmarcado y los planes son comprensibles. También es acertado que el sitio combine explicación del producto, pricing, FAQs y una oferta complementaria de mini-landing. Desde la óptica comercial, la dirección es buena [6].

Aun así, el primer pantallazo tiene un problema clásico de conversión: **demasiadas cosas compiten por atención al mismo tiempo**. En la parte superior conviven un banner promocional, el código de descuento, el selector de moneda, la navegación, varios CTA y luego el banner de cookies. Todo eso pasa antes de que el usuario procese plenamente la promesa principal del producto [6].

| Hallazgo UX | Impacto probable | Mejora recomendada |
| --- | --- | --- |
| Exceso de estímulos en el primer viewport | Dispersa la atención y reduce claridad del CTA principal | Simplificar la cabecera, reducir banner promocional y dar una jerarquía más estricta al hero. |
| Banner de cookies muy invasivo en primera impresión | Interrumpe la percepción inicial del valor | Hacerlo menos dominante o retrasar su fricción visual sin incumplir normativa. |
| Prueba social poco “demostrable” a primera vista | Puede limitar confianza en clientes B2B fríos | Añadir logos reales, casos, resultados cuantificados y una demo más visible. |
| Dependencia de reseñas de respaldo | Riesgo reputacional si no se perciben como verificables | Evitar mezclar reseñas simuladas con reales en la home pública. |

Hay un punto particularmente delicado: en `frontend/src/app/page.tsx` se observa el uso de `MOCK_REVIEWS` cuando no hay suficientes reseñas reales públicas. Desde una perspectiva técnica eso resuelve un estado vacío, pero desde una perspectiva comercial puede ser contraproducente si el visitante interpreta esas opiniones como testimonios auténticos. En B2B, la confianza vale más que la perfección visual; por eso es preferible mostrar menos reseñas, pero plenamente verificables, que un bloque voluminoso apoyado en datos ficticios o de relleno [4].

## Priorización de mejoras

### Prioridad alta: hacer en las próximas 2 a 4 semanas

| Prioridad | Acción | Justificación |
| --- | --- | --- |
| Alta | Eliminar exposición de credenciales o identificadores sensibles en el plugin | Es el riesgo más claro de seguridad y modelo de confianza. |
| Alta | Endurecer CSP y CORS con una política por contexto | Reduce superficie de ataque sin romper integración si se diseña bien. |
| Alta | Reactivar el bloqueo de lint en build | Mejora disciplina técnica con costo bajo y beneficio inmediato. |
| Alta | Separar scripts temporales y artefactos operativos del repositorio productivo | Mejora mantenibilidad, revisión y confianza en despliegues. |
| Alta | Sustituir reseñas mock por prueba social verificable | Impacta credibilidad comercial de forma directa. |

### Prioridad media: hacer en el próximo trimestre

| Prioridad | Acción | Justificación |
| --- | --- | --- |
| Media | Dividir `app.ts` en módulos de composición por dominio | Reducirá complejidad y facilitará escalar equipo y producto. |
| Media | Implementar observabilidad más explícita por ruta crítica | Útil para pagos, generación de IA, webhooks y embeds. |
| Media | Diseñar un sistema formal de tokens efímeros para widgets y embeds | Mejorará seguridad sin perder facilidad de integración. |
| Media | Refinar la jerarquía visual del hero y cabecera | Puede aumentar claridad y conversión. |
| Media | Consolidar un estándar de documentación técnica por módulo | Reducirá dependencia del conocimiento implícito. |

### Prioridad estratégica: siguientes 3 a 6 meses

| Prioridad | Acción | Justificación |
| --- | --- | --- |
| Estratégica | Definir límites claros entre producto core, integraciones, automatizaciones y tooling interno | Evita que el sistema crezca de forma amorfa. |
| Estratégica | Formalizar arquitectura de permisos, dominios confiables y modelos de autenticación para terceros | Clave si Lookitry quiere escalar integraciones B2B. |
| Estratégica | Construir un sistema de evidencia comercial verificable | Casos de éxito, métricas auditables y logos autorizados elevan la conversión enterprise. |

## Plan de mejora recomendado

Mi recomendación práctica no es “reescribir el proyecto”, sino ejecutar un plan en tres capas. **Primero, saneamiento y hardening**: retirar exposición de claves, limpiar repo, volver obligatorios ciertos controles de calidad y revisar CSP/CORS. **Segundo, modularización**: descomponer el backend central y ordenar mejor las fronteras entre rutas públicas, privadas y embebibles. **Tercero, optimización comercial**: simplificar la parte superior de la home, reforzar la prueba social real y hacer más visible una demo confiable del producto [2] [3] [4] [5] [6].

Este enfoque tiene una ventaja importante: no exige frenar la evolución del negocio. Puedes seguir lanzando features, pero sobre una base más gobernable.

## Quick wins concretos

| Quick win | Esfuerzo | Impacto |
| --- | --- | --- |
| Quitar `eslint.ignoreDuringBuilds` y corregir lo que rompa | Bajo | Alto |
| Mover `tmp/` y scripts ad hoc fuera del repo principal o excluirlos correctamente | Bajo | Alto |
| Revisar si la `api_key` del plugin puede reemplazarse por token efímero o firma servidor-servidor | Medio | Muy alto |
| Reducir elementos promocionales simultáneos en el hero | Bajo | Medio-alto |
| Reemplazar reseñas mock por un módulo explícitamente basado en testimonios verificados | Bajo | Alto |
| Crear un archivo de arquitectura de integración embebible con reglas de seguridad | Medio | Alto |

## Conclusión

**Lookitry va por buen camino.** Hay producto, hay narrativa comercial, hay señal de arquitectura pensada y ya existe una base técnica bastante más sólida que la de muchos proyectos de la misma etapa. El mayor riesgo que veo no es falta de visión, sino **acumulación de complejidad táctica**: resolver rápido compatibilidades, embeds, pagos, promociones y automatizaciones sin ir consolidando las fronteras del sistema [1] [2] [3] [4] [5] [6].

Si corriges ahora los puntos de seguridad, limpieza del repositorio, disciplina de build y credibilidad comercial en la home, vas a ganar tres cosas a la vez: **más confianza del cliente, más velocidad de desarrollo sostenible y menos riesgo operacional**. En resumen: el proyecto no necesita un giro; necesita una **fase de consolidación técnica y de conversión**.

## Referencias

[1]: file:///mnt/desktop/Lookitry/README.md "README.md — visión, stack y arquitectura general del proyecto"
[2]: file:///mnt/desktop/Lookitry/backend/src/app.ts "backend/src/app.ts — ensamblaje principal del backend, middlewares y rutas"
[3]: file:///mnt/desktop/Lookitry/frontend/next.config.js "frontend/next.config.js — configuración de Next.js, headers y CSP"
[4]: file:///mnt/desktop/Lookitry/frontend/src/app/page.tsx "frontend/src/app/page.tsx — home pública, pricing y manejo de reseñas"
[5]: file:///mnt/desktop/Lookitry/lookitry-woocommerce/includes/frontend-hooks.php "lookitry-woocommerce/includes/frontend-hooks.php — integración frontend del plugin WooCommerce"
[6]: https://lookitry.com/ "Sitio público de Lookitry — revisión visual y de propuesta comercial"
