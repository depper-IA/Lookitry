# Auditoría CSR Build Warnings

Fecha: 2026-04-04

## Resumen

La causa raíz principal de los warnings `deopted into client-side rendering` no está distribuida de forma uniforme por el proyecto: el layout raíz en `frontend/src/app/layout.tsx` monta componentes cliente globales que dependen de `usePathname`, `useSearchParams`, `localStorage` y `window`. Eso empuja a CSR a muchas rutas públicas y privadas aunque su página no lo necesite.

Además, hay un segundo grupo de warnings legítimos en rutas públicas críticas que hoy dependen de componentes cliente grandes o de páginas completas con lógica de navegador. En esos casos el warning no siempre rompe la ruta, pero sí degrada HTML inicial, SEO o conversión.

## Top 5 warnings por impacto

1. `layout.tsx` como origen transversal
   - `frontend/src/app/layout.tsx` renderiza `Analytics`, `MobileBottomNav` y `CookieConsent` en todas las rutas.
   - `frontend/src/components/analytics/Analytics.tsx` usa `usePathname` y `useSearchParams`.
   - `frontend/src/components/ui/MobileBottomNav.tsx` usa `usePathname` y `localStorage`.
   - `frontend/src/components/ui/CookieConsent.tsx` usa `usePathname` y `localStorage`.
   - Impacto: deopt global en páginas públicas, incluidas home, planes, login y legales.

2. Home pública con landing cliente pesada
   - `frontend/src/app/page.tsx` carga `PremiumLanding` con `dynamic(..., { ssr: false })`.
   - Impacto: la home queda fuertemente orientada a CSR; esto afecta SEO, first paint y crawlability de la ruta con más tráfico esperado.

3. Página de planes delegada a cliente
   - `frontend/src/app/planes/page.tsx` entrega el contenido principal a `PlanesClient`.
   - Impacto: la ruta de pricing, que es crítica para conversión, no aprovecha bien SSR aunque sí tiene metadata correcta.

4. Auth y checkout con dependencias reales de navegador
   - `frontend/src/app/login/page.tsx` entrega un `LoginForm` cliente.
   - `frontend/src/app/checkout/page.tsx` y `frontend/src/app/admin/login/page.tsx` ya fueron protegidas con wrappers server + `force-dynamic`, pero siguen siendo rutas que dependen del navegador por diseño.
   - Impacto: aceptable en parte, pero deben mantenerse fuera de prerender roto porque son rutas de conversión/autenticación.

5. Rutas privadas del panel arrastradas a CSR completo
   - `frontend/src/app/admin/*` y gran parte de `frontend/src/app/dashboard/*` dependen de layouts y páginas cliente.
   - Impacto: bajo para SEO, medio para performance. No son el primer objetivo de remediación.

## Clasificación de warnings

### Riesgosos

- `/`
  - Motivo: home pública con `ssr: false` en el bloque principal y layout global cliente.
  - Riesgo: HTML inicial pobre para SEO y campañas.

- `/planes`
  - Motivo: ruta pública de pricing con contenido principal cliente.
  - Riesgo: afecta conversión y visibilidad orgánica de pricing.

- `/login`
  - Motivo: auth pública; depende de `LoginForm` cliente y del layout global.
  - Riesgo: HTML inicial menos útil y mayor dependencia de hidratación en un flujo crítico.

- `/checkout`
  - Motivo: checkout interactivo con estado cliente, `useSearchParams`, `localStorage` y pagos.
  - Riesgo: alto si vuelve a caer en prerender incorrecto. Hoy quedó mitigado con wrapper server y `force-dynamic`.

- `/admin/login`
  - Motivo: login admin con dependencia de navegador.
  - Riesgo: alto si vuelve a servirse como estática incorrecta. Hoy quedó mitigado con wrapper server y `force-dynamic`.

### Optimizables

- `/register`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/verify-email`
- `/ayuda`
- `/contacto`
- `/blog`
- `/aviso-legal`
- `/cookies`
- `/politica-de-uso`
- `/politicas-privacidad`
- `/plugin-woocommerce`
- `/mini-landing`

Motivo principal:
- Son rutas públicas o híbridas donde el warning no implica necesariamente una rotura funcional, pero sí empeora SSR, indexación o tiempo hasta contenido útil.
- En la mayoría, el problema viene más del layout global que de la página específica.

### Aceptables

- `/dashboard/*`
- `/admin/*` excepto `/admin/login`
- `/embed/*`
- `/pruebalo/*`
- componentes modales, banners, navegación autenticada y herramientas del probador

Motivo principal:
- Son rutas privadas, embebidas o altamente interactivas.
- El costo de eliminar CSR aquí es mayor que el beneficio comercial inmediato.
- Deben seguir funcionando, pero no son prioridad de remediación SEO/conversión.

## Causas técnicas agrupadas

### 1. Componentes globales en layout

Origen:
- `frontend/src/app/layout.tsx`

Causa:
- Se montan componentes cliente globales en todas las rutas, aunque muchas páginas no los necesitan en el HTML inicial.

Impacto:
- Explican una parte significativa de los warnings repetidos en páginas públicas aparentemente simples.

### 2. Hooks de navegación en componentes transversales

Origen:
- `frontend/src/components/analytics/Analytics.tsx`
- `frontend/src/components/ui/MobileBottomNav.tsx`
- `frontend/src/components/ui/CookieConsent.tsx`

Causa:
- `usePathname` y `useSearchParams` viven demasiado arriba en el árbol.

Impacto:
- Amplifican CSR en rutas que podrían seguir siendo SSR o híbridas.

### 3. Dependencia explícita de navegador

Origen:
- `localStorage`, `window`, `document` en navegación, consentimiento, auth, checkout y widgets.

Causa:
- Parte es legítima; parte puede quedar encapsulada en boundaries cliente más pequeños.

Impacto:
- Correcto en UI interactiva, problemático cuando se usa en contenido principal de rutas públicas.

### 4. Páginas públicas que delegan casi todo al cliente

Origen:
- `frontend/src/app/page.tsx`
- `frontend/src/app/planes/page.tsx`
- `frontend/src/app/login/page.tsx`

Causa:
- La metadata se genera en servidor, pero el contenido principal queda mayormente cliente.

Impacto:
- La página “existe” para SEO, pero pierde mucho valor del SSR real.

## Orden exacto de corrección recomendado

1. Corregir el layout global
   - Mover `Analytics`, `MobileBottomNav` y `CookieConsent` a boundaries cliente más estrechos o condicionales por tipo de ruta.
   - Objetivo: quitar deopt transversal y medir el nuevo baseline real.

2. Corregir rutas públicas de máximo impacto
   - Home `/`
   - Planes `/planes`
   - Login `/login`
   - Objetivo: asegurar HTML útil desde servidor en acquisition y conversión.

3. Mantener rutas críticas ya mitigadas como dinámicas controladas
   - `/checkout`
   - `/admin/login`
   - Objetivo: evitar regresión hacia prerender estático incorrecto.

4. Triage de públicas secundarias
   - legales, ayuda, contacto, blog, register, reset flows
   - Objetivo: optimizar donde el costo sea bajo y el beneficio en SEO/performance sea real.

5. Posponer privadas
   - `dashboard` y `admin` privadas
   - Objetivo: tratarlas como deuda técnica aceptable salvo que aparezca una regresión funcional.

## Plan posterior por fases

### Fase 1. Layout global y componentes transversales

- Sacar del layout raíz cualquier componente que use hooks de navegación si no necesita participar en todas las rutas.
- Encapsular `Analytics` en un boundary cliente aislado y revisar si puede depender menos de `useSearchParams`.
- Hacer que `MobileBottomNav` y `CookieConsent` se monten solo donde aportan valor comercial.

### Fase 2. Rutas públicas SEO y conversión

- Home: recuperar SSR del contenido principal y reducir el uso de `ssr: false` a fragmentos realmente incompatibles con servidor.
- Planes: mantener data y contenido principal en server components, dejando solo interacciones en cliente.
- Login: mantener redirect y contenido base listos desde servidor, dejando la lógica del formulario en un client component pequeño.

### Fase 3. Privadas y deuda aceptable

- Dejar como aceptables las rutas privadas que dependan de sesión, localStorage o navegación compleja.
- Solo refactorizarlas si aparecen problemas de performance o hidratación, no por el warning en sí.

## Validación y estado actual

### Validaciones funcionales confirmadas

- `/checkout` y `/admin/login` ya no deben volver a caer en HTML inicial de `not-found`, porque ambas rutas quedaron con wrapper server y `force-dynamic`.

### Bloqueo actual de build

El build actual no pudo usarse como validación final del warning baseline porque hay un bloqueo ajeno a esta auditoría:

- Falta `frontend/src/app/dashboard/referral/page.tsx`

Error observado:
- `Cannot find module 'C:\\Users\\Matt\\Lookitry\\frontend\\src\\app\\dashboard\\referral\\page.tsx'`

Esto debe corregirse o aclararse antes de repetir una auditoría cuantitativa del total de warnings.

## Conclusión

La remediación no debe perseguir `warning cero`. El mayor retorno está en:

- reducir el efecto transversal del layout raíz
- recuperar SSR útil en home, planes y login
- preservar el tratamiento dinámico explícito en checkout y admin login

Todo lo demás debe tratarse como optimización secundaria o deuda aceptable según impacto comercial.
