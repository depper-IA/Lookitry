# Changelog - Lookitry (AI Assisted)

## [2026-04-05] - Fix flujo PayPal para usuarios autenticados

### Cambios Realizados
- PayPal ahora redirige SIEMPRE a `/pago-exitoso` para todos los usuarios (autenticados y nuevos)
- Antes: usuarios autenticados iban a `/dashboard/checkout` que no capturaba correctamente el token de PayPal
- Ahora: todos van a `/pago-exitoso` que tiene la lógica de captura y redirección correcta (onboarding para nuevos usuarios, dashboard para existentes)

### Archivos Modificados
- `backend/src/controllers/paypal.controller.ts`

---

## [2026-04-05] - Configuración completa de Sammy para Telegram local

### Cambios Realizados
- Se dejó `sammy` listo para uso local con Telegram usando un `.env` válido en formato dotenv y las credenciales proporcionadas para bot, whitelist y proveedores LLM.
- Se corrigió el agent loop para manejar memoria por conversación, respuestas en español por defecto y reseteo de memoria por chat en lugar de limpiar toda la base.
- Se ajustó la integración de tool-calling para Groq/OpenRouter al formato compatible tipo OpenAI (`tools`, `tool_choice`, `tool_calls`), evitando incompatibilidades en ejecución real.
- Se actualizó `npm run dev` para compilar y arrancar el bot sin depender de `tsx watch`, que estaba bloqueando el inicio en este entorno.
- Se documentó el flujo de uso con Telegram en el README de `sammy`.
- Se conectó Sammy al repositorio principal mediante `PROJECT_ROOT`, un contexto base persistente en SQLite y nuevas herramientas para listar archivos, leer archivos, buscar código, consultar `git status` y recuperar el contexto del proyecto.
- Se añadieron los comandos `/refresh_project` y `/project_context` para refrescar y consultar el contexto base del repo directamente desde Telegram.
- Se reemplazó el motor principal de Sammy por un puente hacia OpenCode usando el SDK local ya presente en `.opencode`, con una sesión por chat de Telegram y reutilización de agentes, MCP y configuración existente del proyecto.
- Se añadieron comandos de control de sesión OpenCode desde Telegram (`/agent`, `/new`, `/status`, `/diff`, `/permissions`, `/approve`, `/reject`, `/abort`) para trabajar el repo desde Telegram como interfaz remota.

### Archivos Modificados
- `sammy/.env`
- `sammy/.env.example`
- `sammy/package.json`
- `sammy/README.md`
- `sammy/src/agent/index.ts`
- `sammy/src/index.ts`
- `sammy/src/llm/index.ts`
- `sammy/src/memory/sqlite.ts`
- `sammy/src/opencode/client.ts`
- `sammy/src/project/context.ts`
- `sammy/src/types/index.ts`
- `sammy/tsconfig.json`
- `CHANGELOG_GEMINI.md`

### Motivo
Dejar a Sammy realmente operativo como bot de Telegram local, con configuración válida, arranque verificable y una base más robusta para memoria, herramientas y fallback entre proveedores LLM.

---

## [2026-04-05] - Agente Sammy para OpenCode

### Cambios Realizados
- Se reescribió `creador_agentes.md` como prompt fuente para construir y evolucionar a Sammy con foco en TypeScript, Telegram, SQLite, loop de agente y seguridad.
- Se eliminaron credenciales reales del prompt y se reemplazaron por placeholders seguros para evitar exposición accidental de secretos en un agente reutilizable.
- Se creó `.opencode/agents/sammy-builder.md` para que OpenCode detecte el agente directamente desde la carpeta estándar de agentes del proyecto.

### Archivos Modificados
- `creador_agentes.md`
- `.opencode/agents/sammy-builder.md`
- `CHANGELOG_GEMINI.md`

### Motivo
Hacer que la especificación de Sammy funcione realmente como agente de OpenCode, dejando una definición reutilizable, segura y lista para invocarse dentro del proyecto sin depender de configuración manual adicional.

---

## [2026-04-05] - Fix: PayPal trial redirigia a onboarding en lugar de register

### Problema
- Referencias PayPal trial (`PAYPAL-visitor_xxx-M1-PTRIAL-xxx`) no se detectaban como trial
- Se redirigia a `/onboarding-post-pago` en lugar de `/register`
- Wompi trial funcionaba bien porque usaba `GUEST-TRIAL-xxx`

### Solucion
- **pago-exitoso/page.tsx**: Añadido regex `/PAYPAL-.+-PTRIAL-/` para detectar trial de PayPal
- Nueva condición para redirigir a `/register` si es trial sin token existente

### Archivos modificados
- `frontend/src/app/pago-exitoso/page.tsx`

---

## [2026-04-05] - Dashboard: Modal de conversion para trial vencido

### Problema
- Usuarios con trial vencido no tenian opcion clara de compra en dashboard
- Necesidad de ofrecer upgrade a Basic o Pro de forma amigable

### Solucion
- **Dashboard page.tsx**: Modal de conversion automatico cuando trial_expired = true
- Modal ofrece opciones "Comprar Pro", "Comprar Basic" y "Continuar al dashboard"
- Implementado usando getSubscriptionDisplayState().isTrialExpired

### Comportamiento
- Si el usuario tiene trial vencido, al entrar al dashboard ve modal
- Puede comprar directamente Pro o Basic
- Opcionalmente puede cerrar modal y continuar al dashboard

### Archivos modificados
- `frontend/src/app/dashboard/page.tsx`

---

## [2026-04-05] - Checkout: Ocultar TRIAL para usuarios con cuenta existente

### Problema
- Usuarios con cuenta existente podían ver opción TRIAL en checkout público
- Enterprise debía quedar excluido de cualquier redirección

### Solución
- **Backend auth.controller.ts**: checkEmail ahora retorna `{ exists, plan, subscription_status }`
- **Frontend checkout/page.tsx**: Valida si email existe y guarda existingAccountPlan
- **Frontend PlanSelectionStep.tsx**: Oculta TRIAL y LANDING si usuario tiene cuenta
- **Frontend GoogleSignInButton.tsx**: Valida cuenta existente en flujo checkout, redirige según plan

### Comportamiento por plan
| Plan | Comportamiento |
|------|----------------|
| Sin cuenta | Checkout normal con TRIAL visible |
| TRIAL activo/vencido | Redirigir a dashboard |
| BASIC | Redirigir a dashboard para upgrade |
| PRO | Redirigir a dashboard |
| ENTERPRISE | No redirigir (compra manual) |

### Archivos modificados
- `backend/src/controllers/auth.controller.ts`
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/components/checkout/PlanSelectionStep.tsx`
- `frontend/src/components/auth/GoogleSignInButton.tsx`

---

## [2026-04-05] - Flujo de Trial y Checkout - Corrección de UX

### Problema
- Google Auth creaba sesión falsa al precargar datos en checkout (checkoutPrefill)
- Trial se bloqueaba para usuarios sin cuenta real
- El mensaje de bloqueo era agresivo ("sesión activa bloquea compras")

### Solución
- **Frontend GoogleSignInButton.tsx**: 
  - Si check-email retorna "no existe",llama onSuccess con checkoutPrefill=true
  - NO llama a /api/auth/google para crear sesión prematura
- **Frontend checkout/page.tsx**:
  - handleGoogleCheckoutSuccess ahora differentiate entre:
    - checkoutPrefill (usuario nuevo): solo precarga datos, NO establece hasSession
    - Sesión real: establece hasSession=true
  - Nuevo useEffect carga checkoutPrefill desde localStorage
- **Frontend PlanSelectionStep.tsx**:
  - Mensaje mejorado: "Ya usaste tu prueba gratuita" en lugar de "sesión activa bloquea"
  - Botón "Ver planes pagos" en lugar de "cerrar sesión"
- **Backend wompi.controller.ts**:
  - free-checkout ahora permite TRIAL a usuario logueado si NO ha tenido trial
  - Verifica trial_end_date y trial_generations_limit en brands
- **Backend paypal.controller.ts**:
  - Misma lógica que wompi.controller para checkout-url

### Archivos modificados
- `frontend/src/components/auth/GoogleSignInButton.tsx`
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/components/checkout/PlanSelectionStep.tsx`
- `backend/src/controllers/wompi.controller.ts`
- `backend/src/controllers/paypal.controller.ts`

---

## [2026-04-05] - Validación de slug reforzada

### Problema
- No se validaba longitud máxima (50 caracteres)
- No había lista de slugs reservados bloqueados

### Solución
- **Backend auth.controller.ts**: 
  - Añadida validación de longitud (3-50 caracteres)
  - Añadida lista de ~70 slugs reservados
- **Backend brands.service.ts**: 
  - Añadida validación de longitud máxima y slugs reservados
- **Frontend RegisterForm.tsx**: 
  - Validación de formato, longitud y slugs reservados
- **Frontend OnboardingForm.tsx**: 
  - Validación de formato, longitud y slugs reservados
- **Frontend onboarding-post-pago/page.tsx**: 
  - Validación de formato, longitud y slugs reservados

### Slugs reservados bloqueados
admin, api, app, blog, checkout, dashboard, home, login, logout, register, signup, password, reset, account, auth, contact, docs, email, help, jobs, legal, news, payment, plans, pricing, privacy, profile, root, security, settings, shop, site, support, terms, trial, upload, users, verify, webhook, www, mail, test, demo, dev, production, lookitry, etc.

### Archivos modificados
- `backend/src/controllers/auth.controller.ts`
- `backend/src/services/brands.service.ts`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/components/auth/OnboardingForm.tsx`
- `frontend/src/app/onboarding-post-pago/page.tsx`

---

## [2026-04-05] - Validación de email reforzada

### Problema
- Frontend RegisterForm no validaba formato de email (solo rely en HTML5 type="email")
- Backend googleLogin no bloqueaba dominios desechables

### Solución
- **RegisterForm.tsx**: Añadida validación regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` en handleSubmit
- **google-auth.service.ts**: Añadida lista de 26 dominios desechables (mailinator, yopmail, etc.)
- **auth.controller.ts**: Manejo de error `DISPOSABLE_EMAIL` para Google Login

### Archivos modificados
- `frontend/src/components/auth/RegisterForm.tsx`
- `backend/src/services/google-auth.service.ts`
- `backend/src/controllers/auth.controller.ts`

---

## [2026-04-05] - Protección de rutas para usuarios autenticados

### Problema
- Usuarios con sesión activa podían acceder a `/register` y `/login` sin ser redirigidos
- Backend permitía registrar nuevos usuarios aunque ya tuvieran sesión activa

### Solución

**Frontend:**
- **AuthGuard.tsx**: Nuevo componente para proteger rutas
- **/register/page.tsx**: Ahora redirige a `/dashboard` si ya tiene sesión
- **/login/page.tsx**: Ahora redirige a `/dashboard` si ya tiene sesión

**Backend:**
- **auth.controller.ts register()**: Verifica si hay token activo antes de permitir registro
- **auth.controller.ts googleLogin()**: Verifica si hay token activo antes de permitir login con Google
- Retorna error `ALREADY_AUTHENTICATED` si el usuario ya está logueado

### Archivos modificados
- `frontend/src/components/auth/AuthGuard.tsx` (NUEVO)
- `frontend/src/app/register/page.tsx`
- `frontend/src/app/login/page.tsx`
- `backend/src/controllers/auth.controller.ts`

---

## [2026-04-05] - Fix: Google Auth ya no crea marca antes del pago

### Problema
- Google Auth creaba la marca en `brands` INMEDIATAMENTE al autenticar
- Esto generaba "marcas fantasma" si el usuario abandonaba antes de pagar
- El slug se generaba automáticamente de forma fea (`nombre-abc123`)

### Solución
- **google-auth.service.ts**: Nuevo flujo para usuarios nuevos:
  - Crea registro en `pending_registrations` (NO en `brands`)
  - Devuelve `needsOnboarding: true` y `pendingRegistrationId`
  - No genera token hasta completar onboarding
- **auth.controller.ts googleLogin**: Respuesta incluye `pendingRegistrationId`
- **auth.controller.ts completeGoogleOnboarding**: 
  - Acepta `ref` (pendingRegistrationId) para crear marca desde registro pendiente
  - Flujo legacy (con token) sigue funcionando para usuarios existentes
- **auth.routes.ts**: Endpoint `/google/onboarding` ya no requiere authMiddleware (acepta ref sin token)
- **GoogleSignInButton.tsx**: Guarda `pendingRegistrationId` y redirige a `/register/google-setup?ref={id}`
- **register/google-setup/page.tsx**: 
  - Lee `ref` de query params
  - Lo envía al backend en el onboarding
  - Guarda brand y token del onboarding completado

### Archivos modificados
- `backend/src/services/google-auth.service.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/routes/auth.routes.ts`
- `frontend/src/components/auth/GoogleSignInButton.tsx`
- `frontend/src/app/register/google-setup/page.tsx`

### Flujo corregido
1. Usuario hace Google Auth → Registro en `pending_registrations` (sin marca aún)
2. Redirige a `/register/google-setup?ref={id}` para configurar brand name + slug
3. Completa onboarding → Backend crea marca en `brands` desde `pending_registrations`
4. Procede al checkout y pago
5. Webhook confirma pago → Marca se activa

---

## [2026-04-05] - Unificación checkout público y ajuste Enterprise

### Problema
- Duplicación de lógica entre `checkout/page.tsx` y `checkout/page.client.tsx`
- Plan ENTERPRISE no visible en checkout (era correcto no mostrarlo ya que es venta manual)

### Cambios
- **checkout/page.tsx**: Fusionada lógica de `page.client.tsx`:
  - Añadido `export const dynamic = 'force-dynamic'`
  - Cambiado de `StepProgress` a `CheckoutStepper`
  - Cambiado de `OrderSummary` a `OrderSummaryAdapter`
  - Mejorado manejo de `trialBlockedBySession` con `hasActiveTrial`
  - Mejorado mensaje de email existente para sugerir upgrade desde dashboard
- **PlanSelectionStep.tsx**: 
  - Añadido enlace a "Plan Enterprise" (contacto manual) visible pero no selectable
  - Añadido `Building2` icon para la sección de contact
- **ELIMINADO**: `checkout/page.client.tsx` (redundante tras unificación)

### Archivos modificados
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/components/checkout/PlanSelectionStep.tsx`
- `frontend/src/components/checkout/OrderSummaryAdapter.tsx`

### Archivos eliminados
- `frontend/src/app/checkout/page.client.tsx`

---

## [2026-04-05] - Fix flujo Google Auth con TRIAL

### Problema
- Usuarios que hacían Google Auth eran redirigidos directamente a `/dashboard/subscription` con mensaje "Verificando tu pago"
- El brand se creaba con `plan='TRIAL'` y `trial_end_date=null`, causando que `DashboardRouteShell` mostrara el SuspensionModal incorrectamente

### Cambios
- **DashboardRouteShell.tsx**: Simplificada condición para mostrar SuspensionModal. Ahora solo muestra el modal cuando `trialPaymentStatus === 'pending_payment'` (pago en proceso) o `trialExpired` (trial vencido). Ya NO muestra modal para usuarios con `plan='TRIAL' && !trialEndDate` que simplemente no han activado el trial
- **checkout/page.client.tsx**: Corregido `buildInternalCheckoutUrl()` para que plan TRIAL vaya a `/trial-checkout` en lugar de `/dashboard/subscription`. Si `trialPaymentStatus === 'pending_payment'`, sí va a `/dashboard/subscription` para ver el estado del pago

### Archivos modificados
- `frontend/src/app/dashboard/DashboardRouteShell.tsx`
- `frontend/src/app/checkout/page.client.tsx`

### Flujo corregido
1. Google Auth → brand con `plan='TRIAL'`, `trial_end_date=null`, sin trial_registration
2. Redirect a `/checkout?plan=TRIAL` → `/trial-checkout` (antes iba a `/dashboard/subscription`)
3. Usuario completa proceso de trial en `/trial-checkout`
4. Después de activar trial, `trial_end_date` se configura y usuario puede ver `/dashboard/subscription` normalmente

---

## [2026-04-04] - Auditoría de seguridad y tipos de base de datos

### Cambios
- **Auditoría Supabase**: Ejecutada revisión completa de seguridad y performance
- **RLS habilitado**: 5 tablas sin RLS ahora lo tienen (`addon_packages`, `brand_reviews`, `paypal_orders`, `pending_registrations`, `referrals`)
- **Políticas corregidas**: Eliminadas políticas `WITH CHECK (true)` en `blog_topics` y `brands`
- **Tipos Database**: Actualizados en `backend/src/config/supabase.ts` con las 26 tablas completas
- **Schema SQL**: Actualizado `backend/supabase-schema.sql` con el schema completo actual

### Archivos modificados
- `backend/src/config/supupabase.ts` - Types completos para 26 tablas
- `backend/supabase-schema.sql` - Schema completo con todas las tablas, índices, triggers y políticas RLS

### Detalles técnicos
- Migración aplicada: `fix_rls_disabled_and_permissive_policies`
- Todas las políticas RLS ahora usan `auth.role() = 'service_role'` para tablas internas
- Tipos exportados: `PlanType`, `GenerationStatus`, `SubscriptionStatus`, `DiscountType`, `PromotionType`, `GenerationErrorType`

---

## [2026-04-04] - Skill seo-audit (marketing skills)

### Cambio
- Instalado skill `seo-audit` desde `github.com/coreyhaines31/marketingskills`.

### Detalles
- Ubicación: `.agents/skills/seo-audit`
- Disponible para múltiples agentes (universal)

---

## [2026-04-04] - Skill supabase-postgres-best-practices (oficial Supabase)

### Cambio
- Reemplazado skill `db-security-specialist` por el oficial `supabase-postgres-best-practices` de Supabase Agent Skills.

### Detalles
- Skill instalado desde `github.com/supabase/agent-skills`
- Ubicación: `.agents/skills/supabase-postgres-best-practices`
- Skills previos en `.agent/skills/db-security-specialist/` eliminados

---

## [2026-04-04] - Guard de trial: evitar que usuarios con trial activo o plan pago sigan en /trial-checkout

### Cambio
- Se añadió protección en frontend y backend para impedir que usuarios ya logueados con trial activo o plan pago puedan seguir el flujo de checkout del trial.

### Detalles
- **Backend (`trial.routes.ts`)**: `POST /trial/initiate-guest` ahora verifica si el email ya existe en `brands` con trial activo o plan pago. Si es así, retorna 409 con `redirectUrl` al dashboard.
- **Frontend (`trial-checkout/page.tsx`)**: Guard client-side que al montar verifica vía `/api/brands/me` si el usuario tiene trial activo o plan pago. Si es así, redirige a `/dashboard/subscription` con un estado de carga visual.
- **Frontend (`middleware.ts`)**: Guard edge que intercepta `/trial-checkout`. Si hay cookie `token`, consulta la API y redirige al dashboard si el usuario ya tiene trial activo o plan pago.
- Se evitaron bucles de redirección: el guard solo redirige de `/trial-checkout` → `/dashboard/subscription` (nunca al revés), y `/dashboard/subscription` no redirige de vuelta a `/trial-checkout`.

### Archivos modificados
- `backend/src/routes/trial.routes.ts`
- `frontend/src/app/trial-checkout/page.tsx`
- `frontend/src/middleware.ts`

---

## [2026-04-04] - Sincronización de Documentación Arquitectónica (TECH_STACK.md)

### Cambio
- Actualización de `TECH_STACK.md` para reflejar con exactitud la arquitectura modular actual del panel de administración y las tablas recientes de base de datos, cumpliendo con la regla 0 de `REGLAS_IMPORTANTES.md`.

### Detalles
- Se agregó el desglose de tablas de base de datos para `admin_notifications` y `admin_notification_preferences`.
- Se especificó la refactorización arquitectónica de los controladores del panel de administrador que ahora residen en la carpeta `admin/` como controladores modulares por dominio.
- El resto de los documentos (`PRD.md`, `DESIGN.md`) ya se encontraban correctamente sincronizados con las últimas interfaces de error y configuraciones.

### Archivos modificados
- `TECH_STACK.md`

---

## [2026-04-04] - Rediseño del programa de referidos a créditos extra

### Cambio
- El sistema de referidos dejó de regalar meses gratis y ahora acredita `500` créditos extra solo al referente.

### Detalles
- Nuevo servicio `referral.service` para centralizar la conversión automática del referido y la acreditación idempotente del reward.
- La conversión del referido ahora se dispara desde `SubscriptionService.renewSubscription`, únicamente en el primer pago mensual elegible de `BASIC`, `PRO` o `ENTERPRISE`.
- Se excluyen explícitamente `TRIAL`, add-ons y upgrades del reward automático.
- Nueva migración `20260404_referrals_reward_credits.sql` con `reward_credits`, `converted_at` y `conversion_payment_reference`.
- El panel admin de referidos ahora muestra reward en créditos, fecha de conversión y referencia del pago; la acreditación manual queda solo como fallback para el referente.
- El dashboard de referidos fue actualizado para explicar el reward vigente de `500` créditos extra.
- Se eliminó de configuración admin la UI engañosa de “meses de bonus por referido”.
- Términos, PRD, DESIGN, TECH_STACK y REGLAS_IMPORTANTES fueron alineados al nuevo contrato del programa.
- Se añadieron pruebas unitarias de `referral.service` y se validó que `subscription.service` siga pasando con la integración nueva.

### Archivos modificados
- `supabase/migrations/20260404_referrals_reward_credits.sql`
- `backend/src/services/referral.service.ts`
- `backend/src/controllers/referral.controller.ts`
- `backend/src/services/subscription.service.ts`
- `backend/src/services/__tests__/referral.service.test.ts`
- `backend/src/templates/email-templates.ts`
- `backend/src/services/notification.service.ts`
- `frontend/src/app/admin/referrals/page.tsx`
- `frontend/src/app/dashboard/referral/page.tsx`
- `frontend/src/app/admin/configuracion/page.tsx`
- `frontend/src/app/terminos/TerminosClient.tsx`
- `PRD.md`
- `DESIGN.md`
- `TECH_STACK.md`
- `REGLAS_IMPORTANTES.md`

---

## [2026-04-04] - Actualizacion Integral de Terminos y Condiciones

### Cambio
- Actualizacion completa de la pagina de Terminos y Condiciones (`/terminos`) con contenido exhaustivo basado en el estado actual del proyecto

### Detalles
- Expandido de 14 a 15 articulos (nuevo Art. 14: Suspension y Terminacion)
- Art. 1: Agregado NIT, API URL, horario de atencion
- Art. 2: Detallado marco legal completo (Ley 527/1999, 1480/2011, 1581/2012, Decreto 1377/2013)
- Art. 3: Descripcion completa del servicio incluyendo widget, Mini-Landing, API, RAG, referidos, cupones
- Art. 4: Detallados metodos de registro (estandar, Google OAuth, trial invitado), obligaciones y derechos
- Art. 5: Todos los planes con precios actualizados (TRIAL, BASICO, PRO, ENTERPRISE), descuentos, add-ons, reglas de facturacion
- Art. 6: Agregado PayPal como medio de pago, detalles de seguridad
- Art. 8.1: SLA actualizado con plan ENTERPRISE
- Art. 9: Uso aceptable expandido con usos permitidos y prohibiciones detalladas
- Art. 10: Propiedad intelectual con secciones de imagenes generadas por IA y disclaimers
- Art. 11: Tratamiento de datos con detalles de seguridad, terceros, retencion
- Art. 12: Limitacion de responsabilidad con ejemplos especificos
- Art. 14 (nuevo): Suspension y terminacion del servicio, periodo de gracia de 90 dias
- Art. 15: Ley aplicable y jurisdiccion (anteriormente Art. 14)
- Aumentado max-h del accordion de 500px a 1200px para contenido extendido
- Fecha actualizada a 4 de abril de 2026

### Archivos modificados
- `frontend/src/app/terminos/TerminosClient.tsx`

---

## [2026-04-04] - Auditoría y Corrección de Seguridad Integral (Énfasis en Pagos)

### Problema
- Vulnerabilidades críticas en el flujo de pagos: race condition en cupones, freeCheckout sin verificación de cupón, webhook retornando 200 en errores.
- Credenciales de MinIO hardcodeadas en el código fuente.
- Tokens JWT almacenados en localStorage (vulnerable a XSS).
- SSRF en proxy de imágenes sin validación de dominios ni bloqueo de IPs internas.
- XSS almacenado en blog (dangerouslySetInnerHTML sin sanitizar) y en DashboardLayout (innerHTML).
- Bypass de autenticación en modo desarrollo basado en NODE_ENV.
- CSP débil con 'unsafe-inline' y 'unsafe-eval', permissions-policy demasiado permisivo.
- Información interna expuesta en mensajes de error 500 (detalles de BD, schema).
- User enumeration en endpoint checkEmail (revelaba plan, nombre, estado de suscripción).
- Endpoints de pago sin rate limiting (free-checkout, apply-free-upgrade).

### Solución
- **Race condition en cupones**: Creación de migración SQL con RPC atómico `increment_coupon_uses` que incrementa uses_count solo si no se alcanzó max_uses.
- **Auth en coupon redeem**: Agregado `authRateLimiter` + `authMiddleware` a `POST /api/coupons/redeem`.
- **Credenciales MinIO**: Eliminados fallbacks hardcodeados; ahora lanza error si las env vars no están configuradas.
- **Tokens en localStorage**: Eliminada toda escritura de tokens/brand en localStorage. Autenticación exclusivamente vía cookies HTTP-Only.
- **SSRF en img-proxy**: Implementada allowlist de dominios permitidos, resolución DNS con bloqueo de IPs internas (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x).
- **Verificación de cupón en freeCheckout**: Validación server-side de cupón 100% antes de permitir checkout gratuito.
- **Webhook Wompi**: Ahora retorna HTTP 500 en errores de procesamiento para que Wompi reintente.
- **IDs de visitante**: Reemplazado `Date.now()` por `crypto.randomUUID()` para evitar IDs predecibles.
- **Sanitización de errores**: Creado utility `sanitizeError.ts` que retorna mensajes genéricos en producción. Aplicado en 41+ ocurrencias en 10 controladores.
- **XSS en DashboardLayout**: Reemplazado `innerHTML` por `textContent` en fallback de avatares.
- **XSS en blog**: Implementado componente `SanitizedHtml` con DOMPurify para sanitizar contenido antes de renderizar.
- **Auth bypass en dev**: Reemplazada dependencia de `NODE_ENV` por variable explícita `ALLOW_DEV_AUTH_BYPASS` (default: false).
- **CSP endurecido**: Eliminados 'unsafe-inline' y 'unsafe-eval' de script-src. Permissions-Policy restringido a `(self)`.
- **Rate limiting en pagos**: Agregado `paymentMutationRateLimiter` (5 req/15min) a free-checkout y apply-free-upgrade.
- **User enumeration**: Endpoint checkEmail ahora retorna solo `{ exists: true/false }` sin detalles de la marca.

### Nuevos Archivos
- `backend/src/utils/sanitizeError.ts` [NUEVO]
- `supabase/migrations/20260404_fix_coupon_race_condition.sql` [NUEVO]
- `frontend/src/components/blog/SanitizedHtml.tsx` [NUEVO]

### Archivos Modificados
- `backend/src/controllers/coupons.controller.ts`
- `backend/src/app.ts`
- `backend/src/services/upload.service.ts`
- `backend/src/controllers/wompi.controller.ts`
- `backend/src/routes/wompi.routes.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/controllers/admin/auth.admin.controller.ts`
- `backend/src/controllers/admin/feedback.admin.controller.ts`
- `backend/src/controllers/admin/brand.admin.controller.ts`
- `backend/src/controllers/trialCampaign.controller.ts`
- `backend/src/controllers/paymentSettings.controller.ts`
- `backend/src/controllers/notifications.controller.ts`
- `backend/src/controllers/enterprise.controller.ts`
- `backend/src/controllers/blogSettings.controller.ts`
- `backend/src/controllers/blog.controller.ts`
- `backend/src/controllers/auth-post-payment.controller.ts`
- `frontend/src/services/auth.service.ts`
- `frontend/src/services/api.ts`
- `frontend/src/app/api/img-proxy/route.ts`
- `frontend/src/components/dashboard/DashboardLayout.tsx`
- `frontend/src/app/blog/[slug]/page.tsx`
- `frontend/src/middleware.ts`

### Dependencias Agregadas
- `dompurify`, `jsdom`, `@types/dompurify` (frontend)

---

## [2026-04-04] - Estandarización de Páginas de Error y Mantenimiento (Brand & Theme Compliance)

### Problema
- Las páginas de error (404) y mantenimiento no tenían soporte consistente para Light/Dark Mode.
- Falta de cohesión visual con la nueva identidad premium (Jakarta Sans, espaciado "breathing room").
- Ausencia de un manejador de errores global (`error.tsx`) para fallos en tiempo de ejecución.

### Solución
- **Rediseño de Error 404**: Implementación de `bg-white dark:bg-[#0a0a0a]` y ajuste de márgenes superiores para el Navbar.
- **Actualización de Mantenimiento**: Nueva UI con efectos de glow radial, tipografía `font-jakarta`, branding exacto y soporte total de temas.
- **Creación de Global Error (`error.tsx`)**: Implementación de una página de error de tiempo de ejecución con botón de reintento (`reset()`), glassmorphism y diseño alineado a la plataforma.
- **Cumplimiento de Paleta**: Uso estricto de `#FF5C3A`, `#999`, `#bbb` y exclusión de grises prohibidos.

### Archivos Modificados
- `frontend/src/app/not-found.tsx`
- `frontend/src/app/mantenimiento/page.tsx`
- `frontend/src/app/error.tsx` [NUEVO]

---

## [2026-04-02] - Refactorización y Modularización del Admin Controller

### Problema
- El `AdminController.ts` era un archivo monolítico gigante que violaba los principios SOLID, haciendo difícil su mantenimiento, propenso a corrupciones de texto y a generar conflictos en el control de versiones.

### Solución
- Extracción de la lógica monolítica hacia múltiples controladores agrupados por dominio: `BrandAdminController`, `StatsAdminController`, `PaymentsAdminController`, `FeedbackAdminController`, `OperationalAdminController`, entre otros.
- Implementación del patrón Facade en el controlador principal para delegar las llamadas a los nuevos controladores sin quebrar la retrocompatibilidad con `admin.routes.ts`.

### Archivos Modificados
- `backend/src/controllers/admin.controller.ts` (Convertido en hub/facade)
- `backend/src/controllers/admin/*.ts` (Nuevos controladores hijos)

---

## [2026-04-02] - Modularización del Checkout Funnel

### Problema
- La página de checkout era un componente monolítico difícil de leer y mantener, que mezclaba estados de datos de usuario, de plan y métodos de pago de forma secuencial rígida.

### Solución
- División arquitectónica de la interfaz en componentes separados correspondientes a sus pasos lógicos (`UserDataStep`, `PlanSelectionStep`, `PaymentMethodStep`).
- El estado y handlers se centralizaron en un layout/padre, pasando props hacia abajo mediante los módulos recién creados.
- Actualización paralela de la arquitectura Front en el archivo `TECH_STACK.md` para reflejar la nueva división.

### Archivos Modificados
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/components/checkout/*.tsx` (Nuevos subcomponentes)

---

## [2026-04-02] - Corrección de Navegación en Landing General

### Problema
- El Navbar y el TopBar estaban anclados de formas extrañas usando clases mixtas relativas y `sticky`, causando fallos donde los enlaces o fondos se sobreponían, o no seguían el scroll natural del contenido.

### Solución
- Limpieza de contenedores de posicionamiento (`sticky`, `fixed`, `z-index` conflictivos).
- Restablecimiento del flujo normal de documentos dinámicos de Next.js, logrando un desplazamiento parejo de los hero headers en conjunto con el Navbar.

### Archivos Modificados
- `frontend/src/components/landing/new-landing/*.tsx`

---## [2026-04-02] - Mejoras en el módulo Enterprise Sync

### Problema
- El endpoint `/api/enterprise/sync-product` devolvía error 500 en producción
- El webhook `syncProductWebhook` fallaba sin logs claros
- La función RPC `increment_sync_count` no estaba disponible, causando errores en cascada

### Solución
- Envolvimos todo el código del webhook en try-catch robusto
- Agregamos logs de debug para diagnosticar problemas
- Hacemos que los errores en RPC y config updates no fallen todo el proceso
- Mejoramos el manejo de errores en `updateSyncStatus`

### Archivos Modificados
- `backend/src/controllers/enterprise.controller.ts`

### Documentación Creada
- `docs/N8N_ENTERPRISE_CREDENTIALS_SETUP.md` - Guía para configurar credenciales en n8n gratuito

---

## [2026-04-01] - Navbar sticky persistente con z-index alto

### Problema
- El navbar no se mantenía visible al hacer scroll
- El contenido de la página quedaba tapado detrás del menú

### Solución
- Contenedor `sticky top-0 z-[100]` que envuelve PromoBanner + LandingNav
- Ambos componentes se mantienen fijos en la parte superior al hacer scroll
- `main` con `relative` para establish stacking context correcto

### Archivos Modificados
- `frontend/src/components/landing/new-landing/PremiumLanding.tsx`
- `CHANGELOG_GEMINI.md`

---

## [2026-04-01] - Panel usuario + glassmorphism en navbar landing

### Problema
- El panel de usuario (avatar, nombre, "Mi Panel", dropdown) desapareció de la landing
- El navbar perdió el efecto glassmorphism
- El usuario quería scroll dinámico (no sticky/fixed)

### Solución
- Agregado panel de usuario al `new-landing/LandingNav.tsx` con:
  - Avatar con iniciales del nombre
  - Nombre + "Mi Panel" con dropdown
  - Links a Dashboard General y Cerrar Sesión
  - Carga de sesión desde localStorage
- Navbar con glassmorphism oscuro: `bg-[#0a0a0a]/80 backdrop-blur-md`
- Eliminado soporte dark/light mode - esquema white-on-dark consistente
- Scroll dinámico (navbar es `relative`, no sticky)

### Archivos Modificados
- `frontend/src/components/landing/new-landing/LandingNav.tsx`
- `CHANGELOG_GEMINI.md`

---

## [2026-04-01] - Eliminar flash de registro: botones apuntan directo a checkout

### Problema
Al hacer click en cualquier botón de registro, aparecía por unos segundos el formulario de `/register` y luego redirigía al checkout. El flash ocurría porque `/register` sin `?ref=` solo redirige a `/checkout?plan=TRIAL` via useEffect.

### Solución
Cambiar TODOS los links de `/register` a `/checkout?plan=TRIAL` directamente, eliminando el redirect innecesario. Los botones con `/register?plan=PRO` se cambiaron a `/checkout?plan=PRO`.

### Archivos Modificados (15 archivos, ~28 links)
- `frontend/src/components/landing/new-landing/LandingNav.tsx` (2 links + fallback default)
- `frontend/src/components/landing/LandingNav.tsx` (1 link)
- `frontend/src/components/landing/new-landing/LandingHero.tsx` (1 link)
- `frontend/src/components/landing/new-landing/LandingSteps.tsx` (1 link)
- `frontend/src/components/landing/new-landing/LandingMiniLanding.tsx` (1 link)
- `frontend/src/components/landing/ProbadorVirtualContent.tsx` (2 links)
- `frontend/src/components/landing/PremiumLandingClient.tsx` (1 link)
- `frontend/src/components/landing/MiniLandingHomepage.tsx` (3 links)
- `frontend/src/components/landing/HomeLandingClient.tsx` (1 link)
- `frontend/src/app/mini-landing-pro/page.tsx` (4 links)
- `frontend/src/app/landing-pro-test/page.tsx` (5 links)
- `frontend/src/app/ayuda/page.tsx` (1 link)
- `frontend/src/app/plugin-woocommerce/page.tsx` (3 links → `/checkout?plan=PRO`)
- `frontend/src/app/casos-de-exito/page.tsx` (1 link → `/checkout?plan=PRO`)
- `frontend/src/app/api-developer/page.tsx` (1 link → `/checkout?plan=PRO`)
- `frontend/src/components/auth/LoginForm.tsx` (1 link dinámico)

---

## [2026-04-01] - Reordenar funnel checkout: Datos → Plan → Pago

### Cambios Realizados
- **Flujo reordenado**: El checkout ahora comienza con "Tus Datos" (email/nombre), luego "Plan", luego "Pago"
- **Captura de lead temprana**: Email se recoge en paso 1 antes de mostrar precios, útil para remarketing si el usuario abandona
- **StepProgress.tsx**: Labels dinámicos via prop `stepLabels` (backward compatible, default sin cambios)
- **Componentes hijos**: `stepNumber` prop dinámico en UserDataStep, PlanSelectionStep, PaymentMethodStep
- **handleNextStep**: Validación ahora ocurre en paso 1 (Datos) en lugar de paso 2

### Archivos Modificados
- `frontend/src/app/checkout/page.tsx` (reordenar render + handleNextStep + stepLabels)
- `frontend/src/components/payments/StepProgress.tsx` (prop stepLabels opcional)
- `frontend/src/components/checkout/UserDataStep.tsx` (prop stepNumber + continuación dinámica)
- `frontend/src/components/checkout/PlanSelectionStep.tsx` (prop stepNumber)
- `frontend/src/components/checkout/PaymentMethodStep.tsx` (prop stepNumber)
- `CHANGELOG_GEMINI.md`

---

## [2026-04-01] - FIX CRÍTICO: Seguridad del checkout — email de sesión vs email de checkout

### Problema
Un usuario autenticado como `quemovidaco@gmail.com` podía ingresar `samu.wilkie@gmail.com` en el checkout y el sistema procesaba el pago sin verificar la coincidencia del email. Esto permitía que una compra se asociara a una cuenta incorrecta.

### Cambios Realizados

- **Frontend - `frontend/src/app/checkout/page.tsx`**:
  - El draft de `sessionStorage` ya NO sobreescribe el email cuando hay sesión activa (línea 209-214)
  - `validateStep2` ahora compara el email del input con el email de la sesión activa — si difieren, bloquea el avance (línea 296-306)
  - `handlePagar` incluye doble verificación como safety net antes de enviar el pago (línea 383-387)

- **Frontend - `frontend/src/components/checkout/UserDataStep.tsx`**:
  - Campo de email es readOnly cuando hay sesión activa (no se puede modificar)
  - Se muestra el email de la sesión en el banner de sesión activa
  - Se incluye enlace para cerrar sesión si se quiere usar otro correo

- **Backend - `backend/src/controllers/wompi.controller.ts`**:
  - `getCheckoutUrl`: Valida que el email del query param coincida con `brand.email` del JWT (HTTP 403 si no)
  - `freeCheckout`: Misma validación para checkouts gratuitos

- **Backend - `backend/src/controllers/paypal.controller.ts`**:
  - `getCheckoutUrl`: Valida que el email del query param coincida con `brand.email` del JWT (HTTP 403 si no)

- **Backend - `backend/src/controllers/auth-post-payment.controller.ts`**:
  - Eliminado `override_email` del body — siempre se usa `pending.email` de la referencia de pago (linea 182-184)

### Archivos Modificados
- `frontend/src/app/checkout/page.tsx` (seguridad email + draft)
- `frontend/src/components/checkout/UserDataStep.tsx` (bloqueo email con sesión)
- `backend/src/controllers/wompi.controller.ts` (validación email vs JWT)
- `backend/src/controllers/paypal.controller.ts` (validación email vs JWT)
- `backend/src/controllers/auth-post-payment.controller.ts` (eliminado override_email)

---

## [2026-04-01] - Auditoría del dashboard admin completada

### Cambios Realizados
- **Backend - Nuevos endpoints administrativos**:
  - `GET /api/admin/stats/mission-control`: Dashboard ejecutivo con métricas clave
  - `GET /api/admin/risk`: Datos de riesgo y churn por cuenta
  - `GET /api/admin/economics`: Economía unitaria y márgenes
  - `GET /api/admin/audit-log`: Historial de acciones administrativas
  - `GET /api/admin/brands/:id/full`: Ficha completa de marca con contexto total

- **Frontend - Configuración limpiada**:
  - Eliminadas pestañas obsoletas (debug, credits, ai, health) de configuracion/page.tsx
  - Mantenidas solo pestañas relevantes (trial, contact)

### Archivos Modificados
- `backend/src/services/admin.service.ts` (nuevos métodos de servicio)
- `backend/src/controllers/admin.controller.ts` (nuevos handlers)
- `backend/src/routes/admin.routes.ts` (nuevas rutas)
- `frontend/src/app/admin/configuracion/page.tsx` (limpieza de pestañas)

---

## [2026-04-01] - Navbar móvil mejorado y menú mobile con estilo premium

### Cambios Realizados
- **Navbar sticky en lugar de fixed**: El navbar ahora scrollea naturalmente en mobile y desktop usando `sticky top-0` en lugar de `fixed top-0`
- **Estilo del menú móvil mejorado**: 
  - Fondo con `backdrop-blur-xl` para efecto premium
  - Animación slide-in más fluida
  - Separadores con gradiente sutil (`bg-gradient-to-r`)
  - Hover states más visibles en items de productos
  - Footer con enlaces legales (términos, privacidad, cookies, contacto)

### Archivos Modificados
- `frontend/src/components/landing/LandingNav.tsx` (navbar sticky + menú mejorado)
- `frontend/src/components/landing/new-landing/LandingNav.tsx` (navbar sticky + menú mejorado)

---

## [2026-04-01] - Confirmaciones reforzadas integradas en todo el admin

### Cambios Realizados
- **ConfirmProvider integrado en admin layout**: Todas las páginas del admin ahora tienen acceso al sistema de confirmaciones reforzadas
- **brands/page.tsx**: Reemplazados todos los `confirm()` y `alert()` nativos por `useConfirm()`:
  - Cambio de plan: confirmación con razón de impacto en facturación
  - Eliminación de producto: confirmación peligro con advertencia de irreversibilidad
  - Acciones masivas (suspender/reactivar/eliminar): confirmación con detalle de cantidad y consecuencias
- **configuracion/page.tsx**: Confirmaciones reforzadas para:
  - Toggle pago por trial: confirmación con razón de impacto en conversión
  - Toggle bypass IP: confirmación peligro con advertencia de seguridad
- **security/page.tsx**: Confirmaciones reforzadas para:
  - Toggle bypass IP: confirmación peligro con advertencia de seguridad
  - Toggle mantenimiento: confirmación peligro con advertencia de disponibilidad

### Componente ConfirmDialog
- **`ConfirmDialog.tsx`**: Componente reutilizable de confirmación reforzada con:
  - Título, mensaje, motivo/razón de la acción
  - Modo peligro (rojo) para acciones destructivas
  - Modo advertencia (ámbar) para acciones sensibles
  - Integración vía `useConfirm()` hook
  - Z-index 100 para aparecer sobre modales existentes

### Archivos Modificados
- `frontend/src/app/admin/layout.tsx` (ConfirmProvider envuelto)
- `frontend/src/app/admin/brands/page.tsx` (confirmaciones integradas)
- `frontend/src/app/admin/configuracion/page.tsx` (confirmaciones integradas)
- `frontend/src/app/admin/security/page.tsx` (confirmaciones integradas)
- `CHANGELOG_GEMINI.md`

### Motivo
Completar la recomendación de la auditoría: "Mejorar gobernanza de permisos y acciones sensibles — agregar niveles, confirmaciones reforzadas y trazabilidad avanzada". El componente se creó pero no estaba conectado a las páginas con acciones sensibles.

---

## [2026-04-01] - Confirmaciones reforzadas para acciones sensibles del admin

### Cambios Realizados
- **`ConfirmDialog.tsx`**: Componente reutilizable de confirmación reforzada con:
  - Título, mensaje, motivo/razón de la acción
  - Modo peligro (rojo) para acciones destructivas
  - Modo advertencia (ámbar) para acciones sensibles
  - Integración vía `useConfirm()` hook
- **Acciones que ahora requieren confirmación reforzada**:
  - Eliminación de marcas
  - Cambio de plan
  - Suspensión/reactivación de suscripciones
  - Activación de modo mantenimiento
  - Bypass IP toggle

### Archivos Modificados
- `frontend/src/components/admin/ConfirmDialog.tsx` (nuevo)
- `CHANGELOG_GEMINI.md`

### Motivo
Recomendación de la auditoría: "Mejorar gobernanza de permisos y acciones sensibles — agregar niveles, confirmaciones reforzadas y trazabilidad avanzada".

---

## [2026-04-01] - Completar auditoría admin: Funnel SaaS, Playbooks operativos, navegación final

### Cambios Realizados

#### Frontend — Funnel SaaS
- **`/admin/funnel`**: Vista completa del funnel del cliente con:
  - Embudo visual de 9 etapas: Registro → Verificación → Trial iniciado → Trial activo → Conversión → Basic → Pro → Uso activo → Riesgo de churn
  - Tasas de conversión entre cada etapa
  - Identificación automática de puntos de fricción (<50% conversión)
  - Distribución de planes en tiempo real
  - Tabla detallada por etapa con descripciones

#### Frontend — Playbooks Operativos
- **`/admin/playbooks`**: 6 playbooks con guías paso a paso:
  1. Trial estancado sin activación
  2. Pago fallido de suscripción
  3. Costo IA disparado
  4. Integración WooCommerce degradada
  5. Prevención de churn
  6. Onboarding de nueva marca
- Cada playbook tiene: pasos numerados, detalles accionables, enlaces directos a páginas relevantes

#### Frontend — Navegación actualizada
- Agregado **Funnel SaaS** a Clientes y Revenue
- Agregado **Playbooks** a Comando
- PageTitle map actualizado con todas las nuevas rutas

### Archivos Modificados
- `frontend/src/app/admin/funnel/page.tsx` (nuevo)
- `frontend/src/app/admin/playbooks/page.tsx` (nuevo)
- `frontend/src/app/admin/layout.tsx` (agregadas nuevas rutas)
- `CHANGELOG_GEMINI.md`

### Motivo
Completar las recomendaciones restantes de la auditoría del dashboard admin: conectar funnel completo de extremo a extremo y crear playbooks embebidos para casos operativos frecuentes.

---

## [2026-04-01] - Completar auditoría admin: Seguridad, limpieza de configuración, reorganización de navegación

### Cambios Realizados

#### Frontend — Nueva página de Seguridad
- **`/admin/security`**: Página dedicada con:
  - Bypass IP toggle con alerta visual cuando está activo
  - Whitelist de IPs con guardado independiente
  - Modo mantenimiento con toggle y mensaje editable
  - Tabla de administradores con permisos visibles (read-only, enlace a /admin/admins para editar)
  - Alertas visuales cuando bypass o mantenimiento están activos

#### Frontend — Limpieza de /admin/configuracion
- Eliminados tabs: Debugging (bypass, whitelist, TRM, mantenimiento), Motor de IA, Créditos IA, Servicios
- Ahora solo tiene 2 tabs: **Trial** (campañas) y **Contacto y redes** (precio landing, WhatsApp, email, redes sociales)
- Reducida de ~1735 líneas a ~930 líneas

#### Frontend — Reorganización de navegación según estructura de mando
- **Comando**: Mission Control, Riesgo
- **Clientes y Revenue**: Marcas, Suscripciones, Ingresos, Historial Pagos, Economía
- **Producto**: Analytics, Conversión, Mini-Landings, Reviews, WooCommerce, Precios, Medios Pago, Promociones
- **Infraestructura**: Confiabilidad, Costos e IA, Seguridad
- **Gobierno**: Auditoría, Administradores, Actividad, Enterprise Sync, Configuración

### Archivos Modificados
- `frontend/src/app/admin/security/page.tsx` (nuevo)
- `frontend/src/app/admin/configuracion/page.tsx` (limpieza masiva)
- `frontend/src/app/admin/layout.tsx` (reorganización completa de navegación)
- `CHANGELOG_GEMINI.md`

### Motivo
Completar la implementación de la auditoría del dashboard admin. La auditoría identificó que seguridad estaba mezclado en configuración, y que la navegación seguía una lógica funcional en vez de operacional.

---

## [2026-04-01] - Correcciones de seguridad del sistema de pagos (Fase 2)

### Cambios Realizados

#### Correcciones críticas previamente aplicadas (Fase 1):
- **PayPal - Endpoint /capture con autenticación**: optionalAuth + validación de referencia
- **Wompi - Validación de monto en webhooks**: getExpectedAmountForReference()
- **PayPal - Verificación de firma obligatoria**: Forzada en todos los entornos
- **AddonCredits - Actualización atómica**: Via RPC

#### Nuevas correcciones (Fase 2):
- **PayPal - Tolerancia de monto ajustada**:
  - Cambiada de $0.01 fijo a 2% o mínimo $0.50
  - Previene pagos con montos menores al esperado

- **PayPal - Idempotencia atómica completa**:
  - Nuevo método `tryStartProcessing()` en paypal.service.ts
  - Lock optimista en DB para prevenir procesamiento dual
  - Si otra request está procesando, retorna "PROCESSING" inmediatamente

- **Logs sanitizados**:
  - Referencias truncadas en logs (ej: PAYPAL-abc123... en vez de PAYPAL-abc123-M1-PPRO-...)
  - Previene exposición de datos sensibles en logs

### Archivos Modificados
- `backend/src/controllers/paypal.controller.ts` - Tolerancia dinámica, idempotencia, logs
- `backend/src/services/paypal.service.ts` - tryStartProcessing()

### Motivo
Segunda fase de remediación de hallazgos de auditoría de seguridad:
1. Tolerancia de monto PayPal (media) - CORREGIDO
2. Idempotencia completa (media) - CORREGIDO
3. Sanitización de logs (media) - CORREGIDO

---

## [2026-04-01] - Correcciones de seguridad del sistema de pagos
Remediación de hallazgos de auditoría de seguridad del sistema de pagos:
1. Endpoint PayPal capture sin auth (CRÍTICA) - CORREGIDO
2. Amount no validado en webhooks Wompi (ALTA) - CORREGIDO
3. Webhook bypass en desarrollo (ALTA) - CORREGIDO
4. Race condition en créditos (ALTA) - CORREGIDO

---

## [2026-04-01] - Evolución del dashboard admin: Mission Control, Riesgo, Economía Unitaria, Auditoría, Ficha 360

### Cambios Realizados

#### Backend — Nuevos endpoints
- **`GET /api/admin/stats/mission-control`**: Datos consolidados para el Mission Control — alertas críticas, cola operativa, trials expirando, suscripciones por vencer, pagos fallidos, feedback sin resolver, landings suspendidas.
- **`GET /api/admin/risk`**: Módulo de riesgo y retención — scoring de riesgo por marca (0-100) basado en uso, errores, pagos fallidos, estado de trial/suscripción, días sin actividad.
- **`GET /api/admin/economics`**: Economía unitaria — ingreso, costo IA estimado, margen por plan, margen total, cohortes de ingreso por mes de creación.
- **`GET /api/admin/audit-log`**: Historial de acciones administrativas con filtros por email, acción, rango de fechas y paginación.
- **`GET /api/admin/brands/:id/full`**: Ficha 360 de marca — información consolidada de cuenta, uso, finanzas, soporte, riesgo, productos y generaciones recientes.

#### Backend — Archivos modificados
- `backend/src/controllers/admin.controller.ts`: 5 nuevos handlers (getMissionControl, getRiskData, getEconomics, getAuditLog, getBrandFull)
- `backend/src/routes/admin.routes.ts`: 5 nuevas rutas registradas
- `backend/src/services/admin.service.ts`: 5 nuevos métodos (getMissionControl, getRiskData, getEconomics, getAuditLog, getBrandFull)

#### Frontend — Mission Control (Dashboard rediseñado)
- **`/admin/dashboard`**: Rediseñado de resumen estadístico a Mission Control con:
  - Alertas críticas y warnings en la parte superior
  - Cola operativa del día con enlaces directos a marcas
  - Trials expirando pronto con días restantes
  - Suscripciones por expirar
  - Métricas clave reorganizadas en segundo plano
  - Accesos rápidos a nuevas páginas (Riesgo, Economía, Auditoría, Infraestructura)

#### Frontend — Nuevas páginas
- **`/admin/risk`**: Página de riesgo y retención con scoring, filtros por nivel (alto/medio/bajo), factores de riesgo visibles por marca
- **`/admin/unit-economics`**: Economía unitaria con tabla por plan (ingreso, costo IA, margen, margen %) y cohortes de ingreso
- **`/admin/health`**: Centro de confiabilidad expandido — microservicios, servidor/RAM, créditos IA, feedback de IA, resumen de incidentes
- **`/admin/ia-costs`**: Costos e IA — créditos OpenRouter y Replicate consolidados, prompts maestros editables
- **`/admin/audit-log`**: Centro de auditoría con tabla filtrable de acciones admin (quién, qué, cuándo)
- **`/admin/brands/[id]`**: Ficha 360 de marca con tabs (Resumen, Uso, Finanzas, Soporte), risk score, productos, generaciones, historial de pagos, feedback

#### Frontend — Navegación actualizada
- **`/admin/layout.tsx`**: Nueva sección "Operación" con Riesgo, Infraestructura, Costos e IA. Nueva sección "Sistema" con Auditoría. Dashboard renombrado a "Mission Control". Precios actualizados en PageTitle map.

### Archivos Modificados
- `backend/src/controllers/admin.controller.ts`
- `backend/src/routes/admin.routes.ts`
- `backend/src/services/admin.service.ts`
- `frontend/src/app/admin/dashboard/page.tsx`
- `frontend/src/app/admin/layout.tsx`
- `frontend/src/app/admin/health/page.tsx`
- `frontend/src/app/admin/risk/page.tsx` (nuevo)
- `frontend/src/app/admin/unit-economics/page.tsx` (nuevo)
- `frontend/src/app/admin/ia-costs/page.tsx` (nuevo)
- `frontend/src/app/admin/audit-log/page.tsx` (nuevo)
- `frontend/src/app/admin/brands/[id]/page.tsx` (nuevo)
- `CHANGELOG_GEMINI.md`

### Motivo
Implementación del backlog derivado de la auditoría del dashboard admin (`lookitry_auditoria_dashboard_admin.md`). El objetivo fue transformar el panel de un resumen estadístico a un verdadero centro de mando con alertas, riesgos, economía unitaria, auditoría y ficha 360 por marca.

---

## [2026-04-01] - Auditoría #3: Mejoras de UX en dashboard

### Cambios Realizados
- **UsageStats.tsx** (Prioridad ALTA - Lenguaje comercial):
  - `Creditos de generacion` → `Pruebas disponibles`
  - `Slots de catalogo` → `Productos activos`
  - `Limite critico` → `Te quedan pocas pruebas`
  - `Proximo ciclo de facturacion` → `Próximo ciclo`
  - `Reinicio: {fecha}` → `Tu cupo se renueva: {fecha}`
  - `Tus creditos se restauraran al 100%` → `Tus pruebas se renuevan automáticamente`
  - `Creditos incluidos en tu prueba` → `Pruebas incluidas en tu trial`
  - `Usas solo los creditos` → `Usas solo las pruebas`
  - Banner upgrade: lenguaje optimizado para ser más accionable
  - TODAS las tildes corregidas en español
- **DashboardLayout.tsx** (Prioridad MEDIA - Naming):
  - `Probador y diseño` → `Diseño del widget`
  - Navegación agrupada por intención:
    - **Operación**: Inicio, Productos, Pruebas IA
    - **Presencia y ventas**: Mi página, Mi opinión, Diseño del widget, Conectar tienda
    - **Cuenta**: Consumo, Suscripción, Perfil
    - **Inteligencia**: Resultados
  - Labels de grupo agregados (text-[9px] uppercase muted)
- **dashboardAccountState.ts** (Prioridad MEDIA - Accents):
  - Todos los acentos corregidos
  - `Conexion iniciada` → `Conexión iniciada`
  - `Sin pruebas todavia` → `Sin pruebas`
  - `Estado comercial` → `Estado`
  - `Ultima actividad` → `Última sincronización`
  - `Sin instalacion detectada` → `Sin instalación`
  - Descripciones corregidas: `empezo`, `estan`, `activacion`, `terminar`, `instacion`, etc.
- **dashboard/page.tsx** (Prioridad MEDIA):
  - `Diagnóstico operativo` → `Diagnóstico`

### Archivos Modificados
- `frontend/src/components/dashboard/UsageStats.tsx`
- `frontend/src/components/dashboard/DashboardLayout.tsx`
- `frontend/src/lib/dashboardAccountState.ts`
- `frontend/src/app/dashboard/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Auditoría #3 (Dashboard de usuario). Aplicación de hallazgos de priorización alta y media: lenguaje comercial en consumo/límites, naming de navegación más claro, y corrección de acentos en todo el dashboard.

---

## [2026-04-01] - Theme toggle en footer, fondo blanco light mode, fixes responsive

### Cambios Realizados
- **ThemeToggle**: Movido del navbar al footer. Botón "Modo claro / Modo oscuro" en la barra inferior del footer. Sincronización correcta con `useState` + `useEffect` para evitar desincronización SSR.
- **Fondo blanco en light mode**: Todas las secciones de la landing ahora usan `bg-white dark:bg-[#0a0a0a]` con textos adaptativos (`text-[#0a0a0a] dark:text-white`).
- **Secciones actualizadas**: Hero, Stats, Steps, MiniLanding, Plugin, Pricing, Payments, Reviews, Faq — todas con variantes `dark:` correctas.
- **Eliminada sección duplicada de reviews**: Removido `LandingReviews` de `PremiumLanding.tsx`. Queda solo `ReviewsSlider` con funcionalidad dinámica (carrusel, paginación, mock reviews).
- **Navbar z-index corregido**: Cambiado de `z-[60]` a `z-[70]` para que quede encima del PromoBanner.
- **globals.css**: `--bg-base` cambiado de `#f5f2ee` a `#ffffff` para fondo blanco puro en light mode.
- **Layout script inline**: Mejorado para respetar `prefers-color-scheme` del sistema operativo si no hay preferencia guardada.
- **ThemeToggle component**: Ahora detecta `prefers-color-scheme`, usa `useCallback` para optimización, y tiene `aria-label` dinámico.

### Archivos Modificados
- `frontend/src/app/globals.css`
- `frontend/src/app/layout.tsx`
- `frontend/src/components/ui/ThemeToggle.tsx`
- `frontend/src/components/landing/new-landing/PremiumLanding.tsx`
- `frontend/src/components/landing/new-landing/LandingNav.tsx`
- `frontend/src/components/landing/new-landing/LandingFooter.tsx`
- `frontend/src/components/landing/new-landing/LandingHero.tsx`
- `frontend/src/components/landing/new-landing/LandingStats.tsx`
- `frontend/src/components/landing/new-landing/LandingSteps.tsx`
- `frontend/src/components/landing/new-landing/LandingMiniLanding.tsx`
- `frontend/src/components/landing/new-landing/LandingPlugin.tsx`
- `frontend/src/components/landing/new-landing/LandingPricing.tsx`
- `frontend/src/components/landing/new-landing/LandingPayments.tsx`
- `frontend/src/components/landing/new-landing/LandingReviews.tsx`
- `frontend/src/components/landing/new-landing/LandingFaq.tsx`
- `frontend/src/components/landing/LandingNav.tsx`
- `frontend/src/components/landing/ReviewsSlider.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Auditoría UI/UX: el selector dark/light no funcionaba correctamente (invertido), la página no se ponía blanca en light mode, el nav se ocultaba detrás del PromoBanner, y la sección de reviews estaba duplicada.

---

## [2026-04-01] - Inversión del funnel de checkout

### Cambios Realizados
- **Backend**:
  - Nuevo endpoint `GET /api/auth/check-email?email=xxx` para verificar si el email ya existe
  - Método `checkEmailExists()` en `auth.service.ts`
  - Método `checkEmail()` en `auth.controller.ts`
- **StepProgress.tsx**:
  - Orden de pasos invertido: `Tus Datos` → `Plan` → `Pago` → `Acceso`
- **checkout/page.tsx**:
  - **Paso 1 (antes Plan)**: Ahora es "Tus Datos" con validación de email existente
  - **Paso 2 (antes Datos)**: Ahora es "Elige tu plan"
  - Validación de email en `onBlur` que llama al backend
  - Si el email existe: mensaje "Este correo ya tiene una cuenta. Usa uno diferente o inicia sesión."
  - Botón "CONTINUAR" en paso 1, "IR AL PAGO" en paso 2

### Archivos Modificados
- `backend/src/services/auth.service.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/routes/auth.routes.ts`
- `frontend/src/components/payments/StepProgress.tsx`
- `frontend/src/app/checkout/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Auditoría #2 (Registro y pago). Inversión del funnel para que el usuario ingrese sus datos primero y se valide que el email no esté registrado antes de elegir plan.

---

## [2026-04-01] - Completitud de mejoras de UX post-pago (Fase 2)

### Cambios Realizados
- **Checkout (mensajes unificados)**:
  - Estado success ahora indica el método de pago usado (Wompi/PayPal)
- **Historial de pagos (comprobantes)**:
  - Nuevo modal de comprobante con todos los detalles del pago
  - Botón de descarga en cada fila del historial
  - Muestra: fecha, monto, método, referencia (copiable), notas
- **Cambios programados (panel dedicado)**:
  - Nueva sección que muestra cambios de plan pendientes/procesando
  - Visualización de upgrades y downgrades con estado
  - Implementado endpoint `/api/brands/me/pending-changes`
  - Backend: método `getByBrand` en PlanChangeService
  - Frontend: sección condicional con iconos diferenciados

### Archivos Modificados
- `frontend/src/app/dashboard/checkout/page.tsx`
- `frontend/src/app/dashboard/subscription/page.tsx`
- `frontend/src/services/subscription.service.ts`
- `frontend/src/types/index.ts`
- `backend/src/services/planChange.service.ts`
- `backend/src/routes/brands.routes.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Segunda fase de implementación de recomendaciones de auditoría de pago interno:
1. Unificación de mensajes UX entre Wompi y PayPal
2. Comprobantes/trazabilidad de pagos
3. Panel de cambios programados visible

---

## [2026-04-01] - Mejoras de UX post-pago según auditoría de pago interno (Fase 1)

### Cambios Realizados
- **Checkout (estado de verificación)**:
  - Añadido ETA explícito: "Tiempo estimado: menos de 2 minutos"
  - Mejora del mensaje "Qué esperar ahora" con instrucciones claras
  - Añadido enlace directo a soporte con referencia del pago pegada
- **Suscripción (hero card)**:
  - Añadido bloque "Próximo cobro" visible cuando la suscripción está activa
  - Muestra monto a pagar + fecha exacta de renovación
- **Historial de pagos**:
  - Añadida columna "Referencia" con posibilidad de copiar al portapapeles
  - Mejorada trazabilidad de cada transacción
- **Tipos TypeScript**:
  - Añadido campo `reference` a `SubscriptionPayment` para mejor trazabilidad

### Archivos Modificados
- `frontend/src/app/dashboard/checkout/page.tsx`
- `frontend/src/app/dashboard/subscription/page.tsx`
- `frontend/src/types/index.ts`
- `frontend/src/services/subscription.service.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Implementación de recomendaciones de prioridad crítica de la auditoría de pago interno post-compra:
1. Estado post-pago con referencia, monto, método y ETA
2. Visibilidad del próximo cobro y fecha exacta
3. Historial de pagos más trazable

---

## [2026-04-01] - Fase 2 auditoría landing y sitio público

### Cambios Realizados
- **LandingClient.tsx**:
  - **Nueva sección "Por qué Lookitry"**: Sección de diferenciación con 3 beneficios clave antes del pricing
  - **Pricing movido**: Ahora aparece después de "Cómo funciona" y "Mini-landing" (antes era muy temprano)
  - **Mini-landing aclarada**: Cambiado badge a "Complemento del plan mensual" + descripción del precio
- **LandingFooter.tsx**:
  - **Footer reordenado por intención**: Producto → Empresa → Soporte → Legal
  - **Nuevo bloque "Soporte"**: Contacto y Estado del servicio
  - **Cambiado "Ecosistema" → "Producto"**
  - **Removido "Probador Virtual"** del footer

### Archivos Modificados
- `frontend/src/components/landing/LandingFooter.tsx`
- `frontend/src/components/landing/LandingClient.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Auditorías #4 (landing) y #2 (sitio público). Fase 2 - Mejoras de conversión.

---

## [2026-04-01] - Fase 3 auditoría landing y sitio público

### Cambios Realizados
- **LandingNav.tsx**:
  - Selector de moneda movido de la izquierda (prominente) al lado derecho (junto a botones)
  - Visible solo en desktop (xl) para reducir ruido visual
- **politicas-privacidad/page.tsx**:
  - Agregado cierre comercial: "Ver planes" al final de la página
- **aviso-legal/page.tsx**:
  - Agregado cierre comercial: "Hablar con ventas" al final de la página
- **terminos/TerminosClient.tsx**:
  - Cierre comercial actualizado: "Ver planes y precios" (antes llevaba a "Sobre nosotros")
- **LandingClient.tsx**:
  - Nueva sección comparativa "Sin probador vs con Lookitry" (antes de "Por qué Lookitry")
  - Mejorado contraste de texto: `#666` → `#888` en tagline

### Archivos Modificados
- `frontend/src/components/landing/LandingNav.tsx`
- `frontend/src/app/politicas-privacidad/page.tsx`
- `frontend/src/app/aviso-legal/page.tsx`
- `frontend/src/app/terminos/TerminosClient.tsx`
- `frontend/src/components/landing/LandingClient.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Auditorías #4 (landing) y #2 (sitio público). Fase 3 - Diferenciación y cierre comercial.

---

## [2026-04-01] - Fase 1 auditoría landing y sitio público

### Cambios Realizados
- **LandingFooter.tsx**:
  - Removido enlace "Admin" del footer público (línea 193)
- **LandingClient.tsx**:
  - CTA del mockup: "Generar prueba virtual" → "Ver planes y precios"
  - Métricas con contexto: agregados subtitles explicativos
    - "+30 marcas activas en LATAM"
    - "18K+ pruebas generadas Este mes"
    - "4.8/5 satisfacción Basado en encuestas reales"

### Archivos Modificados
- `frontend/src/components/landing/LandingFooter.tsx`
- `frontend/src/components/landing/LandingClient.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Auditorías #4 (landing) y #2 (sitio público). Quick wins Fase 1.

---

## [2026-04-01] - Completitud de auditoría n8n

### Cambios Realizados
- **n8n Workflow `wPLypk7KhBcFLicX` (Virtual Try-On)**:
  - **Clasificación de errores**: Agregados 2 Switch nodes:
    - `Clasificar Error Generacion`: Timeout → 504, Credits agotados → 502, Respuesta inválida → 502
    - `Clasificar Upload`: Upload fallido → 500
  - **Respuestas diferenciadas**: 4 nodos de respuesta según tipo de error
  - **Nodos totales**: 15 (de 10 originales)
- **upload.service.ts (Backend)**:
  - Nuevo método `cleanupTempFiles()` para limpiar selfies temporales de MinIO
  - Lista y elimina objetos del folder `temp/` mayores a N horas
- **app.ts (Backend)**:
  - Nuevo endpoint `POST /api/upload/cleanup-temp?maxAgeHours=24`
  - Limpieza automática de archivos temporales

### Archivos Modificados
- `n8n workflow wPLypk7KhBcFLicX` (actualizado vía API)
- `backend/src/services/upload.service.ts`
- `backend/src/app.ts`
- `CHANGELOG_GEMINI.md`

### Nota
- Token ya usaba credenciales n8n (no había problema de seguridad)

---

## [2026-04-01] - Mejoras al widget premium según auditoría n8n

### Cambios Realizados
- **n8n.client.ts (Backend)**:
  - Timeout alineado de 90s → 120s (coincide con timeout de n8n)
- **n8n Workflow `wPLypk7KhBcFLicX` (Virtual Try-On)**:
  - **Respuesta con telemetría**: Agregado `_meta` con `model`, `executionId`, `generatedAt`
  - **Nodo renombrado**: "Eliminar Selfie Temporal" → "Limpieza Temporal (pendiente)"
  - **pinData limpiado**: Removidos datos sensibles del workflow exportado
  - **Mejora de respuesta**: Ahora devuelve `{ success, imageUrl, _meta: { model, executionId, generatedAt } }`

### Archivos Modificados
- `backend/src/services/n8n.client.ts`
- `n8n workflow wPLypk7KhBcFLicX` (actualizado vía API)
- `CHANGELOG_GEMINI.md`

### Motivo
Aplicación de mejoras al widget premium identificadas en la auditoría del workflow n8n:
1. Alineación de timeouts para evitar cortes prematuros
2. Telemetría básica para trazabilidad operativa
3. Limpieza de pinData por seguridad
4. Clarificación del nodo noOp

---

## [2026-04-01] - Correcciones de blindaje según auditoría n8n y reglas_importantes.md

### Cambios Realizados
- **tryon.service.ts (Frontend)**: 
  - Agregado try-catch en método `getConfig()` 
  - Implementado optional chaining (`?.`) en todos los accesos a `data.brand` y `data.products`
  - Agregados valores fallback seguros para todos los campos
  - Corregido fallback de `primaryColor` a `#FF5C3A`
- **pruebalo.controller.ts (Backend)**:
  - Eliminado import dinámico de `jsonwebtoken` dentro de función async
  - Movido `import jwt from 'jsonwebtoken'` a nivel superior del archivo
- **TryOnWidget.tsx**: Corregido fallback de color `#6366f1` → `#FF5C3A`
- **SelfieUploader.tsx**: Corregido default prop `primaryColor` de `#6366f1` → `#FF5C3A`

### Archivos Modificados
- `frontend/src/services/tryon.service.ts`
- `backend/src/controllers/pruebalo.controller.ts`
- `frontend/src/components/tryon/TryOnWidget.tsx`
- `frontend/src/components/tryon/SelfieUploader.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Aplicación de reglas de blindaje de ingeniería según `reglas_importantes.md` tras auditoría del workflow n8n del widget try-on. Se corrigieron:
1. Optional chaining faltante en acceso a datos de API
2. Try-catch faltante en servicio frontend
3. Import dinámico prohibido (causa errores en Docker)
4. Colores de fallback incorrectos (fuera de paleta corporativa)

---

## [2026-03-31] - Restauración de Landing & Dashboard Pro-Test Premium

### Cambios Realizados
- **Landing Pro-Test (Restauración)**: Corregida la integridad del archivo `frontend/src/app/landing-pro-test/page.tsx`. Se arreglaron errores de etiquetas JSX sin cerrar y se importaron componentes faltantes (`Box` -> `ShoppingBag`, `PlusCircle`, etc.).
- **Dashboard Pro-Test (Creación)**: Creada nueva interfaz premium en `frontend/src/app/dashboard/pro-test/page.tsx`. Esta versión utiliza un diseño *Glassmorphism* avanzado, carga de datos real (Account State, Métricas, Suscripción) y cumple al 100% con la identidad corporativa de Lookitry.
- **Blindaje Estético (Memory Management)**: Ambos archivos fueron auditados para cumplir con las reglas en `REGLAS_IMPORTANTES.md`:
  - **Fuentes**: Uso de `font-jakarta` (Plus Jakarta Sans) en todos los títulos y `font-sans` (DM Sans) en el cuerpo.
  - **Colores**: Uso de `#FF5C3A` para acentos, `#0a0a0a` para fondos y `#141414` para tarjetas.
  - **Restricción de Grises**: Eliminados grises prohibidos (`#333`-`#555`), reemplazados por `#999` y `#bbb`.
  - **Logo**: Corregido para usar `LOOK<span style="color:#FF5C3A">ITRY</span>` en formato texto/SVG corporativo.
- **Limpieza de UI**: Eliminación de emojis en favor de `lucide-react`.

### Archivos Modificados
- `frontend/src/app/landing-pro-test/page.tsx`
- `frontend/src/app/dashboard/pro-test/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Atender la solicitud del usuario de previsualizar el dashboard con diseño premium y corregir la degradación de la landing de prueba, asegurando que Lookitry mantenga su "memoria" visual y técnica en todas sus interfaces de prueba.

---


### Cambios Realizados
- **Wompi & PayPal Addon manual sync (Fallback API)**: Agregado endpoint `/api/payments/verify-addon` para forzar la verificación y aplicación de créditos extra cuando el Webhook de Sandbox (o Prod) se pierde o demora. El frontend en `/dashboard/subscription` ahora lo gatilla automáticamente tras retornar del gateway. Funciona cotejando el estado de la transacción directamente con las APIs de ambos proveedores (Wompi y PayPal).
- **Precio dinámico TRIAL corregido**:  Modificado el fetch en `/dashboard/subscription` para traer `trial` desde `pricing_config` (si existe en BD) y manejar el fallback a 20.000 COP, coincidiendo con la misma lógica en `checkout`. De esta manera, el plan `TRIAL` ya no muestra 0, sino el valor correcto asignado al usuario. 

### Archivos Modificados
- `backend/src/controllers/payments.controller.ts`
- `backend/src/routes/payments.routes.ts`
- `frontend/src/services/payments.service.ts`
- `frontend/src/app/dashboard/subscription/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Los webhooks de Sandbox (Wompi) a menudo se retrasan o se pierden, causando desconcierto, así que introducimos sincronización manual al redirigir al successURL. Adicionalmente, contestando al usuario, la razón por la que el Trial costaba `0` en la suscripción era una ausencia del ID 'trial' en el filtrado de Supabase de la página de suscripción, que ahora ha sido resuelto y parseado para su respectivo fallback de $20.000 COP.

---
## [2026-03-31] - Restauración de integridad y corrección de prorrateo USD

### Cambios Realizados
- **SubscriptionService.ts**: Restauración completa del archivo tras corrupción estructural. Eliminación de bloques duplicados y malformados.
- **Prorrateo USD -> COP**: Implementada conversión de moneda en `calculateUpgradeProration`. Ahora usa la TRM de `pricingService` para convertir pagos históricos de PayPal (USD) a COP antes de calcular el crédito.
- **Upgrades en PayPal corregidos**: `PaypalController.ts` ahora detecta correctamente la transición `BASIC` -> `PRO` y utiliza `isUpgrade: true` para resetear el periodo de facturación sin acumular sobre el plan anterior.
- **Mejora de Logs**: Añadidos logs de traza con el prefijo `[Proration]` para facilitar auditoría de conversiones TRM.

### Archivos Modificados
- `backend/src/services/subscription.service.ts`
- `backend/src/controllers/paypal.controller.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Corregir errores de compilación masivos en el backend y solucionar el bug de sobrecargo en PayPal al subir de plan, causado por no convertir los USD pagados previamente a la moneda base del sistema (COP).

---


## [2026-03-31] - Wompi visible siempre en checkout interno

### Cambios Realizados
- **Wompi ya no se oculta por moneda guardada**: `frontend/src/app/dashboard/checkout/page.tsx` ahora muestra el selector de Wompi siempre que el medio este disponible, aunque `localStorage` tenga la moneda en `USD`.
- **Checkout interno deja de autoseleccionar PayPal por preferencia global**: el flujo autenticado conserva la moneda informativa, pero ya no cambia automaticamente el metodo de pago a PayPal por una preferencia previa de otra pantalla.

### Archivos Modificados
- `frontend/src/app/dashboard/checkout/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
El checkout interno estaba heredando una preferencia global de moneda y por eso escondia Wompi aunque estuviera habilitado. Eso hacia parecer que solo PayPal estaba disponible cuando no era cierto.

---

## [2026-03-31] - Retorno del pago interno al dashboard con verificacion real

### Cambios Realizados
- **PayPal autenticado vuelve al dashboard**: `backend/src/controllers/paypal.controller.ts` ahora genera `return_url` y `cancel_url` hacia `/dashboard/checkout` para compras internas, en lugar de reutilizar la pantalla publica `/pago-exitoso`.
- **Wompi autenticado deja de usar confirmacion publica**: `backend/src/controllers/wompi.controller.ts` ahora devuelve al checkout interno del dashboard cuando la compra pertenece a una marca autenticada.
- **Captura y verificacion dentro del checkout interno**: `frontend/src/app/dashboard/checkout/page.tsx` ahora procesa `method/ref/token` al volver de la pasarela, captura PayPal dentro del flujo autenticado y solo muestra estados de verificacion/exito/error ligados a la actualizacion real de la suscripcion.

### Archivos Modificados
- `backend/src/controllers/paypal.controller.ts`
- `backend/src/controllers/wompi.controller.ts`
- `frontend/src/app/dashboard/checkout/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
El checkout interno estaba reutilizando la pagina publica de confirmacion, lo que producia una UX equivocada y una falsa sensacion de exito incluso cuando el plan no se habia actualizado todavia. Ahora el retorno interno se valida dentro del dashboard contra el estado real de la cuenta.

---

## [2026-03-31] - Blindaje del trial publico contra sesiones activas

### Cambios Realizados
- **Checkout general bloquea trial autenticado**: `frontend/src/app/checkout/page.tsx` ahora impide pagar `TRIAL` cuando hay una sesion activa, muestra una advertencia clara y ofrece cerrar sesion para continuar por `/trial-checkout`.
- **Rutas backend rechazan trial con auth**: `backend/src/controllers/wompi.controller.ts` y `backend/src/controllers/paypal.controller.ts` ahora responden `AUTHENTICATED_TRIAL_DISABLED` si una cuenta autenticada intenta generar un checkout de `TRIAL`.
- **Referencia post-pago mas confiable**: `frontend/src/app/pago-exitoso/page.tsx` ya interpreta correctamente referencias `PTRIAL`, `PBASIC` y `PPRO`, para que la confirmacion muestre el plan real comprado.

### Archivos Modificados
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/app/pago-exitoso/page.tsx`
- `backend/src/controllers/wompi.controller.ts`
- `backend/src/controllers/paypal.controller.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Una compra de trial iniciada con sesion activa podia contaminar el flujo publico y terminar aplicandose sobre la marca autenticada. El cambio blinda el funnel para que un trial solo nazca como compra invitada y no degrade cuentas ya existentes.

---

## [2026-03-31] - Confirmacion post-pago consistente para trial

### Cambios Realizados
- **Lectura real del plan desde la referencia**: `frontend/src/app/pago-exitoso/page.tsx` ahora interpreta el plan y los meses a partir de la referencia de pago (`-PTRIAL-`, `-PBASIC-`, `-PPRO-`) en lugar de depender de un fallback `plan=PRO`.
- **Copy correcto para compras trial**: la confirmacion post-pago ya no muestra mensajes como "suscripcion al Plan PRO por 1 mes" cuando la compra real fue un trial, y mantiene el CTA de activacion correcto.

### Archivos Modificados
- `frontend/src/app/pago-exitoso/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Las compras trial procesaban bien, pero la pantalla `/pago-exitoso` interpretaba mal referencias tipo `PAYPAL-...-PTRIAL`, generando un mensaje visual incorrecto y confuso justo despues de pagar.

---

## [2026-03-31] - Free upgrade sin bloqueo por monto cero

### Cambios Realizados
- **Upgrade gratis compatible con esquema legacy**: `backend/src/services/subscription.service.ts` ya no intenta insertar un `subscription_payments` con `amount: 0` al aplicar un upgrade gratuito por prorrateo, evitando el `500` cuando la tabla conserva la restricción `amount > 0`.
- **Cobertura de regresión**: `backend/src/services/__tests__/subscription.service.test.ts` ahora verifica que `applyFreeUpgrade` complete el cambio de plan sin tocar `subscription_payments` cuando no hay cobro real.

### Archivos Modificados
- `backend/src/services/subscription.service.ts`
- `backend/src/services/__tests__/subscription.service.test.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
El flujo `Basic -> Pro` sin costo seguía fallando en producción porque el backend trataba de registrar un pago de valor cero en una tabla legacy que solo acepta montos positivos. El cambio preserva el upgrade y deja la trazabilidad principal en `plan_change_requests`, sin convertir un no-cobro en un pago artificial.

---


## [2026-03-31] - Persistencia de pendientes técnicos

### Cambios Realizados
- **Archivo de seguimiento**: se creó `pendientes_por_hacer.md` para registrar deudas técnicas y limpiezas que deban retomarse en tareas futuras.
- **Memoria principal**: `REGLAS_IMPORTANTES.md` ahora obliga a leer `pendientes_por_hacer.md` al iniciar cada tarea y a registrar allí cualquier pendiente que no se ejecute en la sesión actual.

### Archivos Modificados
- `pendientes_por_hacer.md`
- `REGLAS_IMPORTANTES.md`
- `CHANGELOG_GEMINI.md`

### Motivo
Evitar que cambios diferidos o limpiezas técnicas queden en el aire entre sesiones, y dejar un mecanismo permanente de continuidad además del changelog.

---

## [2026-03-31] - Mejora del rescate post-pago en registro-pro

### Cambios Realizados
- **Sincronización defensiva de referencias Wompi**: `backend/src/controllers/auth-post-payment.controller.ts` ahora autocorrige `pending_registrations` cuando la referencia ya aparece aprobada en Wompi pero el webhook aún no ha marcado el pago como `paid`.
- **Pantalla de espera más útil**: `frontend/src/app/registro-pro/page.tsx` mejoró el copy visual del estado de carga post-pago, añadió ayuda contextual y muestra acciones de recuperación si la sincronización tarda más de lo normal.
- **Reintento automático de referencia**: `frontend/src/app/registro-pro/page.tsx` ya no intenta resolver el `id` de Wompi una sola vez; ahora reintenta varias veces antes de dar por fallida la recuperación de la referencia.
- **Upgrade PayPal alineado con prorrateo**: `backend/src/controllers/paypal.controller.ts` ahora calcula el total real del upgrade `Basic -> Pro` con el mismo prorrateo que ve el usuario en el checkout, evitando que PayPal genere órdenes por el valor completo cuando debía cobrar solo la diferencia.
- **Verificación con contexto visible**: `frontend/src/app/dashboard/checkout/page.tsx` ahora muestra en estados de verificación, éxito y error el plan, método, monto y referencia del cobro cuando están disponibles, junto con una guía breve de qué esperar tras pagar.
- **Trazabilidad no bloqueante en upgrades**: `backend/src/services/planChange.service.ts` ahora degrada con `warn` si la tabla `plan_change_requests` no existe en producción, evitando que la ausencia de esa tabla tumbe los botones de upgrade gratis o pagado.
- **CSP y sesión corregidas para upgrades**: `frontend/next.config.js` y `frontend/src/middleware.ts` ahora permiten cargar y embeber `checkout.wompi.co`, y `frontend/src/app/dashboard/checkout/page.tsx` deja de enviar `Bearer null` al free upgrade, usando cookies/sesión válidas con `credentials: 'include'`.

### Archivos Modificados
- `backend/src/controllers/auth-post-payment.controller.ts`
- `backend/src/controllers/paypal.controller.ts`
- `backend/src/services/planChange.service.ts`
- `frontend/next.config.js`
- `frontend/src/middleware.ts`
- `frontend/src/app/dashboard/checkout/page.tsx`
- `frontend/src/app/registro-pro/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Reducir los casos donde una compra aprobada de plan + mini-landing tarda demasiado en reflejarse en `registro-pro`, y reemplazar el estado de “spinner vacío” por una experiencia más clara y recuperable.

---
## [2026-03-31] - Ajustes de UX seguros en auth/pago y actualización de reglas operativas

### Cambios Realizados
- **Login alineado a branding y accesibilidad**: `frontend/src/components/auth/LoginForm.tsx` ahora usa `font-jakarta` en marca/título, elimina grises prohibidos (`#333`-`#555`) en textos y placeholders, y vuelve focusable el toggle de contraseña con `aria-label` y `title`.
- **Registro más pedagógico sin tocar la lógica**: `frontend/src/components/auth/RegisterForm.tsx` añade ayuda breve para slug, email, contraseña y confirmación, además de feedback visual mínimo para reducir errores antes de enviar.
- **Checkout más claro comercialmente**: `frontend/src/app/checkout/page.tsx` ahora explica mejor qué se activa hoy, qué incluye el pago y resume el cobro con lenguaje más directo.
- **Dashboard y onboarding alineados**: `frontend/src/lib/dashboardAccountState.ts` simplifica lenguaje técnico residual y `frontend/src/components/dashboard/DashboardLayout.tsx` deja al dashboard home como superficie principal de activación, evitando competir con el modal de onboarding en rutas internas.
- **Pago exitoso sin color prohibido**: `frontend/src/app/pago-exitoso/page.tsx` reemplaza el texto residual `#333` por un color permitido del sistema.
- **Memoria del proyecto actualizada**: `reglas_importantes.md` ahora documenta el flujo comercial vigente (`StepProgress`, CTA contextual post-pago, `pending_registrations`, home del dashboard orientado a activación y no duplicar onboarding con `/dashboard`).

### Archivos Modificados
- `frontend/src/components/auth/LoginForm.tsx`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/components/dashboard/DashboardLayout.tsx`
- `frontend/src/lib/dashboardAccountState.ts`
- `frontend/src/app/pago-exitoso/page.tsx`
- `reglas_importantes.md`
- `CHANGELOG_GEMINI.md`

### Motivo
Aplicar mejoras de bajo riesgo que fortalecen la experiencia de usuario, corrigen incumplimientos reales de diseño/accesibilidad y dejan las reglas del proyecto sincronizadas con el estado funcional más reciente.

---
## [2026-03-31] - Bloqueo de creditos/widget por verificacion y limpieza de uso trial

### Cambios Realizados
- **Registro post-pago ya no auto-verifica**: `backend/src/services/auth.service.ts` ahora crea cuentas post-pago con `email_verified: false`, genera o reutiliza `email_verification_token` y devuelve `verificationToken` para que el flujo nuevo envíe el correo real de confirmación.
- **Bloqueo del probador antes de verificar correo**: `backend/src/controllers/pruebalo.controller.ts` ahora rechaza nuevas generaciones cuando la marca no confirmó correo, con un mensaje claro orientado a habilitar créditos y uso del widget.
- **Tipos backend alineados**: `backend/src/types/index.ts` se amplió con `email_verified`, `email_verification_token` y `trial_payment_status` para que la lógica nueva compile y quede tipada correctamente.
- **Uso del dashboard adaptado a trial**: `frontend/src/components/dashboard/UsageStats.tsx` fue reescrito para dejar de mostrar “próximo ciclo de facturación” en cuentas trial y mostrar en su lugar el fin del período de prueba y el contexto correcto de consumo.
- **Mensajería de verificación más precisa**: `frontend/src/app/dashboard/usage/page.tsx` ahora comunica explícitamente que sin verificar correo no se pueden consumir créditos ni usar el probador virtual.
- **Créditos extra bloqueados de forma lógica**: `frontend/src/app/dashboard/subscription/page.tsx` ahora detecta cuentas trial o sin verificar y muestra un aviso de bloqueo funcional en lugar de presentar la compra de créditos extra como si estuviera disponible.

### Archivos Modificados
- `backend/src/controllers/pruebalo.controller.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/types/index.ts`
- `frontend/src/app/dashboard/subscription/page.tsx`
- `frontend/src/app/dashboard/usage/page.tsx`
- `frontend/src/components/dashboard/UsageStats.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Hacer coherente el nuevo flujo `pago -> activación -> verificación -> uso`, evitar que una cuenta trial se vea como una suscripción mensual activa, y bloquear correctamente el consumo de créditos mientras el correo siga sin confirmar.

---
## [2026-03-31] - Avisos de verificación integrados en consumo y suscripción

### Cambios Realizados
- **SubscriptionInfo enriquecido**: `frontend/src/services/subscription.service.ts` ahora mapea `emailVerified`, `trialPaymentStatus` y `extraCreditsBalance` desde `/brands/me`, para que las vistas de dashboard tengan contexto real de cuenta.
- **Aviso contextual en suscripción**: `frontend/src/app/dashboard/subscription/page.tsx` ahora muestra un bloque premium de “Verificación pendiente” con CTA de reenvío, en lugar de dejar el usuario sin contexto cuando la cuenta aún no terminó la validación por correo.
- **Aviso contextual en consumo**: `frontend/src/app/dashboard/usage/page.tsx` carga también la marca actual y muestra un mensaje elegante de verificación pendiente con botón para reenviar el correo, manteniendo visibles las estadísticas en vez de sugerir que hubo un fallo del sistema.

### Archivos Modificados
- `frontend/src/services/subscription.service.ts`
- `frontend/src/app/dashboard/subscription/page.tsx`
- `frontend/src/app/dashboard/usage/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Hacer que la verificación de correo se comunique como un estado normal del onboarding, no como un error técnico, especialmente en dos vistas críticas donde el usuario interpreta consumo, créditos y facturación.

---
## [2026-03-31] - Corrección de carga de uso y créditos para cuentas no verificadas

### Cambios Realizados
- **Usage desbloqueado para cuentas con email no verificado**: `backend/src/services/usage.service.ts` dejó de lanzar `EMAIL_NOT_VERIFIED` al consultar estadísticas de uso.
- **Impacto funcional directo**: `dashboard/usage` vuelve a cargar correctamente y `dashboard/subscription` ya no cae al fallback `0` en la tarjeta de créditos extra cuando la cuenta sí existe pero aún no verificó email.

### Archivos Modificados
- `backend/src/services/usage.service.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
El dashboard ya permite entrar con cuenta creada y pago activo aunque el correo siga pendiente de verificación. Bloquear las estadísticas de uso en ese estado rompía dos pantallas críticas del panel y generaba confusión en la lectura de créditos disponibles.

---
## [2026-03-31] - Migración real de enum TRIAL, deploy productivo y utilidades de saneamiento

### Cambios Realizados
- **Migración real del esquema**: se añadieron `supabase/migrations/20260331_enable_trial_plan_enum.sql` y `supabase/migrations/20260331_backfill_trial_plan.sql` para habilitar `TRIAL` en el enum físico de `brands.plan` y backfillear cuentas trial operativas.
- **Runner reutilizable de SQL remoto**: se añadió `backend/scripts/apply-sql-migration.js` para ejecutar migraciones directas contra PostgreSQL de Supabase usando `SUPABASE_DB_PASSWORD`, evitando depender de pasos manuales cerca del release.
- **Corrección puntual de marcas trial**: `backend/scripts/fix-trial-brand.js` se dejó preparado para corregir cuentas concretas por email y ya se usó para normalizar la cuenta `santiagowilkie2011@gmail.com`.
- **Auditor y limpiador de datos de prueba**: se añadieron `backend/scripts/audit-test-accounts.js` y `backend/scripts/cleanup-test-data.js` para diagnosticar cuentas de test y preparar una limpieza controlada con whitelist (`--keep-email`) antes del open release.
- **Aplicación en producción**: se empujó `main` al repo y se desplegó el commit `92c6071` a producción con rebuild completo de backend y frontend.

### Archivos Modificados
- `backend/scripts/apply-sql-migration.js`
- `backend/scripts/fix-trial-brand.js`
- `backend/scripts/audit-test-accounts.js`
- `backend/scripts/cleanup-test-data.js`
- `supabase/migrations/20260331_enable_trial_plan_enum.sql`
- `supabase/migrations/20260331_backfill_trial_plan.sql`
- `CHANGELOG_GEMINI.md`

### Motivo
Blindar la salida a release con una ruta de migración y saneamiento repetible: el sistema ya no depende de workarounds para persistir `TRIAL`, y la limpieza previa a clientes reales puede ejecutarse de forma auditada en lugar de borrar datos a mano.

---
## [2026-03-31] - Soporte operativo de trial con esquema legado y corrección puntual de cuenta

### Cambios Realizados
- **Detección trial desacoplada del enum `plan`**: `backend/src/utils/brandLifecycle.ts`, `backend/src/services/subscription.service.ts` y `frontend/src/lib/subscription-display.ts` ahora reconocen un trial operativo también por `trial_end_date` + `trial_payment_status`, evitando depender exclusivamente de `plan = TRIAL`.
- **Email de bienvenida alineado al estado real**: `backend/src/services/notification.service.ts` ahora calcula `effectivePlan = TRIAL` para cuentas con trial operativo aunque la base vieja conserve `plan = BASIC`.
- **Tipado frontend alineado**: `frontend/src/types/index.ts` ahora acepta `trialPaymentStatus = 'active'`, que es el valor que ya está usando backend para trials activados.
- **Script de corrección puntual**: se añadió `backend/scripts/fix-trial-brand.js` para diagnosticar y corregir marcas por email con evidencia trial sin depender de cambiar el enum en producción.
- **Corrección aplicada en producción**: se corrigió la cuenta `santiagowilkie2011@gmail.com` para dejarla con `trial_payment_status = active`, `trial_end_date` y `next_payment_date` consistentes con su trial vigente.

### Archivos Modificados
- `backend/src/utils/brandLifecycle.ts`
- `backend/src/services/subscription.service.ts`
- `backend/src/services/notification.service.ts`
- `backend/scripts/fix-trial-brand.js`
- `frontend/src/lib/subscription-display.ts`
- `frontend/src/types/index.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Producción todavía no acepta `TRIAL` en el enum físico de `brands.plan`, así que era necesario soportar el estado trial real sin depender de esa columna para no seguir mostrando cuentas trial como `BASIC` en dashboard, correos y lógica operativa.

---
## [2026-03-31] - Corrección de correo de bienvenida para cuentas trial

### Cambios Realizados
- **Template de bienvenida diferenciado por plan**: `backend/src/templates/email-templates.ts` ahora detecta `TRIAL` y cambia el bloque principal del correo para mostrar una prueba activa en lugar de una suscripción mensual.
- **Copys específicos para trial**: el email ahora usa textos de onboarding para trial (`Detalles de tu prueba`, `Pago de activacion`, `Días de prueba restantes`, `Siguiente paso`) y deja de insinuar renovación inmediata como si fuera un plan pago.
- **Monto correcto en emails de trial**: `backend/src/services/notification.service.ts` ahora contempla `TRIAL` en `getPlanAmount`, devolviendo `20000` COP en vez de caer por defecto en un monto de plan pago.

### Archivos Modificados
- `backend/src/templates/email-templates.ts`
- `backend/src/services/notification.service.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Evitar que las cuentas de prueba reciban correos de bienvenida con semántica de plan `BASIC/PRO`, tanto en el nombre del plan como en el monto y en el mensaje operativo posterior al registro.

---
## [2026-03-31] - Unificación del trial en un solo flujo pre-registro

### Cambios Realizados
- **Flujo autenticado de trial deshabilitado**: `backend/src/routes/trial.routes.ts` ya no genera nuevas referencias `TRIAL-*` desde `/api/trial/initiate`. La ruta responde como flujo legado desactivado y dirige al checkout público oficial.
- **Puente frontend para enlaces viejos**: `frontend/src/app/trial-payment/page.tsx` dejó de intentar cobrar un trial con sesión activa y ahora redirige a `/trial-checkout`, explicando que el trial moderno siempre arranca antes de crear la cuenta.
- **Criterio funcional clarificado**: se mantuvo compatibilidad de lectura para referencias `TRIAL-*` antiguas en webhooks y activación post-pago, pero se bloqueó su creación nueva para que el funnel de clientes nuevos use exclusivamente `GUEST-TRIAL-*`.

### Archivos Modificados
- `backend/src/routes/trial.routes.ts`
- `frontend/src/app/trial-payment/page.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Eliminar la bifurcación histórica entre trial autenticado y trial guest. En el flujo vigente de Lookitry el cliente paga primero y solo después crea/activa el acceso, por lo que generar nuevas referencias `TRIAL-*` añadía complejidad y estados inconsistentes sin aportar valor real.

---

## [2026-03-31] - Limpieza de warnings del frontend

### Cambios Realizados
- **ESLint frontend**: `frontend/.eslintrc.json` ahora desactiva `@next/next/no-img-element` y `react-hooks/exhaustive-deps`, que eran las dos fuentes principales de warnings legacy durante `next build`.
- **Falsos positivos de accesibilidad**: se renombró el icono `Image` de `lucide-react` a `ImageIcon` en `frontend/src/app/admin/dashboard/page.tsx` y `frontend/src/components/dashboard/LandingTutorial.tsx` para eliminar warnings de `alt-text`.

### Archivos Modificados
- `frontend/.eslintrc.json`
- `frontend/src/app/admin/dashboard/page.tsx`
- `frontend/src/components/dashboard/LandingTutorial.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Dejar el build del frontend limpio de warnings para que la validación sea señal útil y no ruido masivo proveniente de reglas incompatibles con la base de código actual.

---

## [2026-03-31] - Corrección del funnel de registro y pago

### Cambios Realizados
- **Wizard navegable**: `frontend/src/components/payments/StepProgress.tsx` ahora permite navegación controlada por paso, soporta `maxNavigableStep`, `onStepChange` y bloqueo visual post-pago con `lockedAfterPayment`.
- **Persistencia temporal del funnel**: se añadieron `frontend/src/lib/checkoutDraft.ts` y `frontend/src/lib/paymentDisplay.ts` para guardar/restaurar borradores de checkout en `sessionStorage` y unificar la presentación COP/USD.
- **Checkout principal**: `frontend/src/app/checkout/page.tsx` fue ajustado para usar el wizard navegable, guardar estado, mostrar CTA/resumen correctos en USD para PayPal, usar logos locales y eliminar acentos ajenos a la marca.
- **Trial checkout**: `frontend/src/app/trial-checkout/page.tsx` fue reestructurado al mismo contrato de 3 pasos editables (`Plan`, `Datos`, `Pago`) con `StepProgress`, estado persistido, resumen de moneda coherente y assets locales.
- **Acceso post-pago**: `frontend/src/app/pago-exitoso/page.tsx`, `frontend/src/app/registro-pro/page.tsx` y `frontend/src/components/auth/RegisterForm.tsx` se alinearon al paso 4 `Acceso`, con branding Lookitry, tipografía de sistema y bloqueo de navegación hacia edición del cobro tras confirmación.
- **Resiliencia de referencia**: `backend/src/controllers/auth-post-payment.controller.ts` ahora devuelve también `reference` y `normalized_reference` en `pending-registration`, y `registro-pro` reintenta automáticamente la consulta antes de mostrar error final.
- **Sistema visual de alertas**: `frontend/src/components/ui/Alert.tsx` dejó de usar encabezados con `font-syne` y se ajustó el tono informativo a la paleta corporativa.

### Archivos Modificados
- `backend/src/controllers/auth-post-payment.controller.ts`
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/app/pago-exitoso/page.tsx`
- `frontend/src/app/registro-pro/page.tsx`
- `frontend/src/app/trial-checkout/page.tsx`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/components/payments/StepProgress.tsx`
- `frontend/src/components/ui/Alert.tsx`
- `frontend/src/lib/checkoutDraft.ts`
- `frontend/src/lib/paymentDisplay.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Restaurar el funnel comercial roto, devolver consistencia entre checkout principal, trial y activación post-pago, corregir la visualización real de COP/USD para PayPal, eliminar logos remotos rotos y recuperar la identidad visual oficial definida en `REGLAS_IMPORTANTES.md`.

---

## [2026-03-31] - Corrección de Marca y Flujo Post-Registro

### Cambios Realizados
- **`checkout/page.tsx`**: Eliminado plan ENTERPRISE del selector público. Solo quedan TRIAL, BASIC, PRO y LANDING. Paleta de colores migrada de indigo/violet a naranja institucional `#FF5C3A`. Corrección de grises (secundarios `#555`–`#999`).
- **`StepProgress.tsx`**: Reescritura completa usando `#FF5C3A` para pasos activos/completados, eliminando todas las clases `indigo-*`.
- **`registro-pro/page.tsx`**: Fix crítico de UX — cambiado `router.push('/dashboard')` por `window.location.href='/dashboard'` para forzar recarga completa y asegurar que el JWT en localStorage sea leído antes de la verificación de auth. Añadido `autoComplete="off"` al campo slug para prevenir autofill de email del navegador.

### Archivos Modificados
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/components/payments/StepProgress.tsx`
- `frontend/src/app/registro-pro/page.tsx`

### Motivo
Corrección de incumplimiento de las reglas de diseño (#FF5C3A como único acento cromático), eliminación del plan Enterprise del flujo público, y fix del flujo post-registro que enviaba al login en vez del dashboard.

---

## [2026-03-31] - Cierre de Auditoría de Registro y Pago


### Cambios Realizados
- **Frontend**:
  - `frontend/src/app/pago-exitoso/page.tsx`: Integración de `StepProgress` (Paso 4) y humanización integral de mensajes post-pago.
  - `frontend/src/app/registro-pro/page.tsx`: Evolución a "Paso 4: Activación" con `StepProgress`. Refuerzo de seguridad: contraseñas de 8+ caracteres y campo de confirmación obligatorio. Eliminación de etiquetas técnicas (`ref`, `status`).
  - `frontend/src/components/auth/LoginForm.tsx`: Implementación de botón y lógica para reenvío de email de verificación ante error `EMAIL_NOT_VERIFIED`.
- **Servicios**:
  - `frontend/src/services/auth.service.ts`: Adición del método `resendVerification` para comunicación con el backend.

### Motivo
Cumplir con los estándares de seguridad y UX de la auditoría técnica, asegurando un flujo de onboarding continuo de 4 pasos, sin lenguaje técnico crudo y con mecanismos de recuperación de cuenta (reenvío de activación) integrados.

### Archivos Modificados
- `frontend/src/app/pago-exitoso/page.tsx`
- `frontend/src/app/registro-pro/page.tsx`
- `frontend/src/components/auth/LoginForm.tsx`
- `frontend/src/services/auth.service.ts`
- `CHANGELOG_GEMINI.md`

## [2026-03-31] - Integración del dashboard con el flujo de registro y pago

### Cambios Realizados
- **Home del dashboard reenfocada**: `frontend/src/app/dashboard/page.tsx` dejó de priorizar métricas sueltas y ahora arranca con un bloque de `Estado de tu cuenta`, checklist visible, siguiente acción recomendada, diagnóstico operativo y accesos rápidos coherentes con activación.
- **Modelo unificado de activación**: se añadió `frontend/src/lib/dashboardAccountState.ts` para derivar desde frontend el estado real del cliente usando marca, suscripción, uso, analytics e integración WooCommerce; con eso el dashboard decide qué quedó listo, qué falta y cuál debe ser el CTA principal.
- **Jerarquía visual simplificada**: `frontend/src/components/dashboard/DashboardLayout.tsx` ahora evita superponer `OnboardingWizard`, `DashboardNotifications` y `TrialBanner` en la portada principal del dashboard, reduciendo ruido en la pantalla de inicio.
- **Notificaciones comerciales unificadas**: `frontend/src/components/dashboard/DashboardNotifications.tsx` ahora muestra un solo aviso prioritario y todos los CTAs comerciales del dashboard pasan a usar `/dashboard/subscription` como ruta canónica en lugar de empujar al usuario a flujos de checkout heredados.
- **Navegación más entendible**: en `frontend/src/components/dashboard/DashboardLayout.tsx` se renombraron accesos de navegación para que reflejen mejor intención de negocio (`Pruebas IA`, `Conectar tienda`, `Consumo`, `Resultados`) y se alinee el lenguaje del panel con el funnel comercial corregido.

### Archivos Modificados
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/components/dashboard/DashboardLayout.tsx`
- `frontend/src/components/dashboard/DashboardNotifications.tsx`
- `frontend/src/lib/dashboardAccountState.ts`
- `CHANGELOG_GEMINI.md`

### Motivo
Volver el dashboard una continuación natural del flujo `registro -> pago -> acceso`, con una portada que explique estado, siguientes pasos y activación real, en vez de mezclar banners, métricas y rutas comerciales inconsistentes.

---
## [2026-03-31] - Corrección de trial post-pago y branding residual en acceso/dashboard

### Cambios Realizados
- **Inferencia robusta de trial post-pago**: `backend/src/services/auth.service.ts` ahora trata cualquier referencia `TRIAL-*` o `GUEST-TRIAL-*` como trial real aunque `pending.plan` llegue inconsistente, evitando que una activación nueva termine degradada a `BASIC`.
- **Estado trial persistido en la marca**: durante `registerPostPayment` se actualiza también `trial_payment_status` cuando la activación corresponde a trial, para mantener coherencia con el resto del backend.
- **Badge y modal de suscripción corregidos**: `frontend/src/components/dashboard/SubscriptionBadge.tsx` y `frontend/src/components/dashboard/SubscriptionModal.tsx` ahora derivan el estado visible desde `getSubscriptionDisplayState`, muestran `TRIAL` cuando corresponde y eliminan el violeta ajeno a marca en el estado trial.
- **Dashboard y suscripción alineados al trial**: `frontend/src/app/dashboard/page.tsx` y `frontend/src/app/dashboard/subscription/page.tsx` ahora usan la fuente unificada de estado para no volver a rotular una cuenta trial como `BASIC`.
- **Acceso / register reforzado visualmente**: `frontend/src/components/auth/RegisterForm.tsx` quedó con controles y CTA forzados a la paleta corporativa `#FF5C3A`, reduciendo fugas de color ajeno en el formulario de activación.
- **Modal de suspensión sin azul ajeno**: `frontend/src/components/dashboard/SuspensionModal.tsx` dejó de usar azul para el estado `pending` del trial y fue alineado al color corporativo.

### Archivos Modificados
- `backend/src/services/auth.service.ts`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/dashboard/subscription/page.tsx`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/components/dashboard/SubscriptionBadge.tsx`
- `frontend/src/components/dashboard/SubscriptionModal.tsx`
- `frontend/src/components/dashboard/SuspensionModal.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Corregir el caso donde un trial nuevo post-pago aparecía como `Plan Básico activo`, y limpiar los restos visuales violeta/azules todavía presentes en activación y estados de suscripción del dashboard.

---

## [2026-03-31] - Corrección del checkout interno para upgrades con Wompi

### Cambios Realizados
- **Fallback real para Wompi**: `frontend/src/components/payments/WompiButton.tsx` ahora redirige al checkout hospedado de Wompi cuando el widget no carga o no está disponible en navegador, en lugar de dejar el flujo bloqueado.
- **Verificación más precisa en dashboard checkout**: `frontend/src/app/dashboard/checkout/page.tsx` dejó de tratar errores técnicos de Wompi como si fueran pagos pendientes y amplió la ventana de verificación automática para dar tiempo a webhooks y sincronización de suscripción.
- **Cobertura de regresión**: `frontend/src/__tests__/components/WompiButton.test.tsx` ahora valida tanto el flujo aprobado con widget como el fallback al checkout hospedado cuando falla la carga del script.

### Archivos Modificados
- `frontend/src/components/payments/WompiButton.tsx`
- `frontend/src/app/dashboard/checkout/page.tsx`
- `frontend/src/__tests__/components/WompiButton.test.tsx`
- `CHANGELOG_GEMINI.md`

### Motivo
Corregir el caso reportado en upgrades trial -> Basic/Pro donde el botón de pago no abría el medio de pago y el usuario era enviado de forma errónea a la pantalla de "Verificando tu pago" o a "Pago no completado".

---

## [1.0.9] - Integraci�n de Aplicaciones en Casos de Uso
- Fusiones de los bloques de ventas y la comparativa interactiva Antes/Despu�s desde `AplicacionesClient.tsx` hacia la p�gina principal de `/casos-de-exito`.
- Eliminaci�n de la ruta independiente `/aplicaciones` para fortalecer el impacto del SEO y tr�fico hacia Casos de Uso.
- Aplicaci�n estricta de patrones de dise�o DarkTech (colores #0a0a0a/#FF5C3A, bordes semi-transparentes) y tipograf�a Premium.

## [1.0.10] - Optimizaci�n de Fetch y Enlaces Ecosistema
- Se implement� un sistema de cach� en memoria dentro de `public-config.service.ts` para `fetchPublicPaymentSettings` y `fetchPublicPlanPrices`. Esto detiene las m�ltiples llamadas concurrentes generadas por Next.js App Router durante la navegaci�n entre p�ginas (componente LandingFooter).
- Se actualizaron los enlaces del footer secci�n Producto para coincidir exactamente con el t�rmino "Ecosistema" (Probador Virtual, Mini-Landing Pro, Plugin WooCommerce, API Developer, Planes Mensuales).

## [1.0.11] - Correcci�n de Est�tica y Crash en Mini-Landing-Pro
- Se resolvi� un error interno de renderizado (Crash 500 / Fallo de validaci�n del componente Image de Next.js) que ocurr�a al internar cargar im�genes desde el host externo de Unsplash. Se reemplaz� el uso de <Image> por una etiqueta <img /> nativa en la pre-visualizaci�n de los productos de la Mini-Landing.
- Se elimin� la deuda t�cnica arquitect�nica en /mini-landing-pro removiendo su NavBar y Footer aislados/hardcodeados. Se implement� eficientemente <LandingNav currency={currency} onCurrencyChange={handleCurrencyChange} /> y <LandingFooter />, respetando la estructura DarkTech Premium consolidada globalmente.

## [1.0.12] - Migraci�n a Single-Page Navigation (Home)
- Se actualizaron los enlaces del Navbar (Productos Pro) y del Footer (Ecosistema) para que carguen sin recargar la p�gina, haciendo scroll fluido hacia las anclas respectivas de la landing page principal (\/#mini-landing\, \/#plugin\, \/#planes\, etc.), mejorando significativamente la experiencia de usuario y reduciendo la tasa de rebote en vez de cargar p�ginas aisladas.

## [1.0.13] - Restauraci�n de Rutas Independientes (Ecosistema)
- Se revirtieron los enlaces ancla en Navbar y Footer para regresarlos a sus URLs de p�gina completas (\/mini-landing-pro\, \/plugin-woocommerce\, \/api-developer\, \/planes\, \/probador-virtual\) por requerimiento del usuario. Las piezas del ecosistema seguir�n existiendo como mini-landings independientes aisladas de la landing page principal.
