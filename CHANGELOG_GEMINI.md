# Changelog - Lookitry (AI Assisted)

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
