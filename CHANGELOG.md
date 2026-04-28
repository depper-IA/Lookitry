# CHANGELOG — Lookitry

## 28 de Abril 2026 — Sistema de Captura de Leads Orgánicos (Partes 3 y 4)

### Lead Magnet en Blog
- Nuevo componente `LeadMagnetBanner.tsx` con diseño horizontal
- Icono de descarga (lucide Download), campos: email + nombre opcional
- CTA: "Descargar guia"
- Payload: `source: 'blog_lead_magnet'`
- Integración en `BlogPostContent.tsx` despues del articulo

### Exit-Intent Popup
- Nuevo componente `ExitIntentPopup.tsx` con backdrop blur premium
- Trigger: mouse cursor hacia arriba del navegador (clientY <= 0)
- Restricción: solo una vez por sesión (localStorage: exit_intent_captured)
- Campos: solo email
- CTA: "Mantenerme informado"
- Payload: `source: 'exit_intent'`

### ExitIntentProvider
- Nuevo componente `ExitIntentProvider.tsx` que envuelve toda la app
- Detecta intent de salida en cualquier pagina
- Integración en `layout.tsx`

### Archivos
- `frontend/src/components/blog/LeadMagnetBanner.tsx` (nuevo - 215 líneas)
- `frontend/src/components/landing/ExitIntentPopup.tsx` (nuevo - 198 líneas)
- `frontend/src/components/landing/ExitIntentProvider.tsx` (nuevo - 42 líneas)
- `frontend/src/components/blog/BlogPostContent.tsx` (actualizado - import + uso)
- `frontend/src/app/layout.tsx` (actualizado - ExitIntentProvider)

---

## 28 de Abril 2026 — Sistema Completo de Captura de Leads Orgánicos + Regla Anti-Duplicación

### Nueva Regla: Anti-Duplicación de Código (Regla 13)

**AGENTES:** Code Sync Checker ahora es obligatorio para TODOS los agentes.

**Protocolo:**
1. ANTES de crear cualquier función/componente/endpoint → BUSCAR si ya existe
2. Si existe código similar → Comparar y quedarse con la MEJOR implementación
3. Si la nueva es mejor → BORRAR el código antiguo y dejar la nueva
4. Commit: "refactor: replace [old] with improved [new]"

**Skill creada:** `Lookitry_Brain_Vault/Cerebro/Skills/code-sync-checker.md`
**Indexada en:** `Lookitry_Brain_Vault/Cerebro/Agentes/Skills.md`

**Archivos actualizados:**
- `REGLAS_IMPORTANTES.md` — Nueva sección 13 (Anti-Duplicación)
- `Cerebro/Skills/code-sync-checker.md` — Nueva skill
- `Cerebro/Agentes/Skills.md` — Índice actualizado

---

### Problema
Lookitry tenía infraestructura CRM sólida pero carecía de puntos de captación en el frontend. El 90% de leads venía solo de Google Places API.

### Solución
Implementación de 4 puntos de captura premium en el frontend:

#### 1. Formulario de Contacto (`/contacto`)
- Componente `ContactoClient.tsx` con diseño Double-Bezel glass architecture
- 6 campos: nombre, email, teléfono, nombre negocio, tipo negocio, mensaje
- Validación en tiempo real (on blur)
- Estados: idle → submitting → success → error con WhatsApp fallback
- Endpoint: `POST /api/leads/public` con `source: 'organic_contact'`

#### 2. Modal Post-Demo Email Capture
- Componente `PostDemoModal.tsx` con backdrop blur premium
- Trigger: 2 segundos después de ver resultado del try-on
- Restricción: solo una vez por sesión (localStorage)
- Campos: email + nombre marca (opcional)
- Endpoint: `POST /api/leads/public` con `source: 'post_demo_capture'`

#### 3. Lead Magnets en Blog
- Componente `LeadMagnetBanner.tsx` al final de cada artículo
- Campos: email (required) + nombre (optional)
- CTA: "Descargar guía"
- Endpoint: `POST /api/leads/public` con `source: 'blog_lead_magnet'`
- Integración en `BlogPostContent.tsx`

#### 4. Exit-Intent Popup
- Componente `ExitIntentPopup.tsx` con detección de mouse leaving viewport
- Provider global `ExitIntentProvider.tsx` que envuelve toda la app
- Trigger: cuando el cursor sale por la parte superior del navegador
- Restricción: solo una vez por sesión (localStorage)
- Campos: email (solo 1)
- Endpoint: `POST /api/leads/public` con `source: 'exit_intent'`

#### Backend API
- Endpoint `POST /api/leads/public` (Nadia)
- Endpoint `GET /api/leads/public/check?email=xxx`
- Validación completa, rate limiting, lógica de enriquecimiento automático

### Archivos Frontend
- `frontend/src/app/contacto/ContactoClient.tsx` (nuevo)
- `frontend/src/components/landing/PostDemoModal.tsx` (nuevo)
- `frontend/src/components/blog/LeadMagnetBanner.tsx` (nuevo)
- `frontend/src/components/landing/ExitIntentPopup.tsx` (nuevo)
- `frontend/src/components/landing/ExitIntentProvider.tsx` (nuevo)
- `frontend/src/app/contacto/page.tsx` (actualizado)
- `frontend/src/app/layout.tsx` (actualizado con ExitIntentProvider)
- `frontend/src/components/landing/LandingHero.tsx` (actualizado)
- `frontend/src/components/blog/BlogPostContent.tsx` (actualizado)

### Archivos Backend
- `backend/src/routes/leadsPublic.routes.ts` (nuevo - 312 líneas)
- `backend/src/app.ts` (actualizado con nuevas rutas)

### Diseño Premium
- Double-Bezel architecture (glass cards anidados)
- Custom cubic-bezier transiciones `cubic-bezier(0.32,0.72,0,1)` (no linear)
- Framer Motion animaciones con spring physics
- Double-Bezel input fields con `ring-1 ring-white/10`
- Micro-interacciones hover (scale, translate)
- Sin emojis — solo SVG/lucide-react
- Brand colors: #FF5C3A, #0a0a0a, #141414

---

## 27 de Abril 2026 — Fix WhatsApp Input + Selector de País

### Problema
El campo WhatsApp en `/dashboard/settings` no guardaba correctamente el número — al refrescar aparecía vacío.

### Solución
- Nuevo componente `PhoneInput` con selector de país (América + España)
- 11 países soportados: Colombia, México, Argentina, España, Chile, Perú, Ecuador, Venezuela, Costa Rica, Rep. Dominicana, USA/Canadá
- Input separado para prefijo y número local
- Concatenación automática: `prefijonumero` ej: `573105436281`

### Archivos
- `frontend/src/components/ui/PhoneInput.tsx` (nuevo)
- `frontend/src/components/dashboard/SettingsForm.tsx` (actualizado)

---

## 27 de Abril 2026 — Actualización de Repositorio y Arquitectura

### Sincronización y Mantenimiento

| Acción | Detalle |
|--------|---------|
| **Git Sync** | Pull de `origin/main` con stash/pop para preservar scripts locales |
| **VPS Deploy** | Verificación de estado en VPS (HEAD sincronizado en `002735d`) |
| **Documentación** | Creación de `.kiro/steering/LOOKITRY_ARCH.md` con módulos actualizados |
| **Tech Stack** | Actualización de `TECH_STACK.md` con tablas de Tickets y Whitelist de IPs |

### Módulos Auditados e Indexados
- **CRM & Leads**: Gestión de prospectos con Google Places.
- **Tickets de Soporte**: Sistema de gestión de incidencias para marcas.
- **Email Marketing**: Campañas automatizadas vía Brevo.
- **Seguridad**: Whitelist de IPs para control de acceso al widget.
- **RAG**: Base de conocimiento del proyecto indexada para agentes.

---

## 27 de Abril 2026 — Auditoría Mini-Landing Templates (Completa)

### Auditoría Completa de 3 Templates (Classic, Editorial, Moderno)

| Dimensión | Score Antes | Score Después |
|-----------|------------|--------------|
| Accessibility | 2/4 | 3.5/4 |
| Performance | 2/4 | 2.5/4 |
| Theming | 2/4 | 3.5/4 |
| Responsive | 2/4 | 2/4 |
| Anti-Patterns | 3/4 | 4.5/4 |
| **TOTAL** | **11/20** | **17.5/20** |

### Issues Corregidos

| Prioridad | Issue | Archivo |
|-----------|-------|---------|
| **P0** | Product loading state roto en Classic (skeleton no aparecía con array vacío) | `TemplateClassic.tsx` |
| **P0** | Widget pre-select product when lockProductSelection=true sin initialProductId | `TryOnWidget.tsx` |
| **P1** | Color inheritance roto (Editorial accentColor ignoraba brand.secondary_color) | `TemplateEditorial.tsx` |
| **P1** | FriendlyProductSelector accessibility (listbox/option/aria-selected) | `templates/shared.tsx` |
| **P2** | TrustBar fake metrics eliminadas (+500 reviews, ~12s, IA, 96%) | `TemplateClassic.tsx`, `TemplateModerno.tsx` |
| **P2** | Spinner hardcodeado #FF5C3A ahora usa brand.primary_color dinámico | `MiniLanding.tsx` |
| **P2** | WhatsAppFAB sin aria-label | `shared.tsx` |
| **P2** | Skeleton counts incorrectos (3 cards vs 6 que muestra la grilla) | `TemplateEditorial.tsx`, `TemplateModerno.tsx` |
| **P2** | useLandingTheme missing social_links color deps | `shared.tsx` |
| **P3** | EditorialHero sin gradient overlay cuando no hay cover_image | `TemplateEditorial.tsx` |
| **P3** | landing_font no disponible en API response | `pruebalo.controller.ts` |
| **P3** | Templates recalculaban primary manualmente en vez de usar theme.primary | `TemplateClassic.tsx`, `TemplateEditorial.tsx`, `TemplateModerno.tsx` |

### Commits Realizados (Sesión)

- `335ccce` fix: TemplateEditorial and Moderno color/skeleton/aria fixes
- `4a3aaf6` fix: TryOnWidget pre-select product when locked with no initialProductId
- `bbea313` fix: TemplateClassic product loading and TrustBar cleanup
- `4de4d31` fix: TemplateModerno TrustBar remove fake metrics
- `61d2141` polish: EditorialHero gradient overlay and landing_font documentation
- `87b89c8` polish: useLandingTheme returns primary/secondary colors
- `d4e62eb` fix: remove duplicate aria-label in shared.tsx
- `5869d72` refactor: use theme.primary instead of manual color calculation in all templates
- `9c52a2e` fix: remove duplicate theme definition in ProbadorTrustBar
- `0ce6267` feat: add landing_font to pruebalo brand config API
- `44d3cd2` fix: add missing useLandingTheme hook in ProbadorTrustBar

---

## 26 de Abril 2026 — Auditoría y Correcciones Widget Try-On (UI/UX/Responsive)

### Auditoría Completa Realizada

| Dimensión | Score Antes | Score Después |
|-----------|------------|--------------|
| Accessibility | 2/4 | ~3/4 |
| Performance | 2/4 | ~3/4 |
| Responsive | 2/4 | ~3/4 |
| Theming | 1/4 | ~3/4 |
| Anti-Patterns | 1/4 | ~3/4 |
| **TOTAL** | **8/20** | **~14/20** |

### Issues Corregidos (P0-P3)

| Prioridad | Issue | Archivo |
|-----------|-------|---------|
| **P0** | PriceTag hardcoded `#FF5C3A` ahora acepta `primaryColor` | `shared.tsx` |
| **P0** | AI aesthetic eliminada de TemplateBoldProStudio (blur-3xl, glassmorphism, ambient orbs) | `TemplateBoldProStudio.tsx` |
| **P1** | Creado hook compartido `useDeviceSize.ts` para eliminar ResizeObserver duplicado | Nuevo archivo |
| **P1** | Removido `whileHover` de grids de productos (performance) | `ProductGridEditorial.tsx`, `MobileProductGrid.tsx` |
| **P1** | Fix contraste modo claro (textMuted) | `TemplateModernSidebar.tsx` |
| **P1** | Fix `max-h-[65vh]` overflow en SelfieUploader mobile | `SelfieUploader.tsx` |
| **P1** | Fix safe area insets en TemplateBoldProStudio (iOS) | `TemplateBoldProStudio.tsx` |
| **P1** | Reducido tamaño de botones en mobile (py-5 → py-4) | `TemplateBoldProStudio.tsx` |
| **P2** | Agregado `focus-visible:ring` para navegación por teclado | `ResultDisplay.tsx`, `ProductGridEditorial.tsx` |
| **P3** | Centralizado `getBadgeColor()` para badges | `shared.tsx`, `MobileProductGrid.tsx` |

### Nuevos Archivos
- `frontend/src/components/tryon/templates/hooks/useDeviceSize.ts` — Hook compartido para device detection

### Commits
- `f71c6e6` — fix: P0-P1 Widget Try-On corrections
- `7d6d65c` — fix(tryon): add focus-visible rings for keyboard nav and centralize badge colors
- `48752ef` — fix(widget): correct syntax errors and improve accessibility in try-on templates

### Issues Pendientes Resueltos
- Fix `--bg` variable no definida en gradient TemplateShowcase
- StepBar `whileTap` simplificado (0.95 → 0.9)
- FriendlyProductSelector aria-label mejorado
- SidebarProductList feedback táctil con CSS
- globals.css: regla `.active\:scale-95:active` añadida

---

## 26 de Abril 2026 — Fix Widget Banner Principal

### Problema
El widget del banner principal (LandingHero) solo tenía opción de "Tomar foto" con cámara. Faltaba la opción de "Subir foto" desde la galería.

### Solución Implementada

| Ubicación | Antes | Después |
|-----------|-------|---------|
| STEP select | 1 botón "Sube tu foto" (solo cámara) | 2 botones: "Tomar foto" (cámara frontal) + "Subir foto" (galería) |
| STEP selfie | 1 botón "Cambiar" (solo cámara) | 2 botones: "Tomar otra" (cámara frontal) + "Cambiar" (galería) |

### Detalles Técnicos

| Feature | Implementación |
|---------|---------------|
| **Tomar foto** | `capture="user"` → abre cámara frontal |
| **Subir foto** | `accept="image/*"` sin capture → abre selector de galería |
| **Iconos** | Camera + Image (lucide-react, sin emojis) |

**Archivo modificado:**
- `frontend/src/components/landing/LandingHero.tsx`

---

## 25 de Abril 2026 — Optimización Performance (PageSpeed)

### Diagnóstico PageSpeed

| Métrica | Antes | Después | Objetivo |
|---------|-------|--------|----------|
| Performance Móvil | 37 | TBD | 80+ |
| LCP | 6.5s | TBD | <2.5s |
| TBT | 16.3s | TBD | <200ms |
| JS No Utilizado | 234 KiB | TBD | <100 KiB |
| First Load JS (/) | N/A | 85.2 kB | <100 kB |

### Código Splitting Implementado

**Archivo:** `frontend/src/components/landing/PremiumLanding.tsx`

| Componente | Tipo de Carga | SSR |
|------------|--------------|-----|
| LandingNav | Immediate | Yes |
| LandingHero | Immediate | Yes |
| LandingStats | Immediate | Yes |
| LandingSteps | Immediate | Yes |
| LandingMiniLanding | Immediate | Yes |
| LandingPlugin | Immediate | Yes |
| PromoBanner | Immediate | Yes |
| **LandingPricing** | **Lazy** | Yes |
| **LandingPayments** | **Lazy** | Yes |
| **ReviewsSlider** | **Lazy** | Yes |
| **LandingFaq** | **Lazy** | Yes |
| **LandingFooter** | **Lazy** | Yes |
| **ActiveCouponsBanner** | **Lazy** | Yes |
| **PromoModal** | **Lazy** | **No** (localStorage) |

### Hallazgos

- **GSAP:** NO está en uso — 0 KiB de impacto
- **Framer Motion:** Imports CORRECTOS con desestructuración (tree-shaking OK)
- **Problema Principal:** Todos los componentes se cargaban upfront

### Pendiente

- [ ] Verificar impacto real en PageSpeed post-deploy
- [ ] Optimizar imágenes con next/image (lazy loading nativo)
- [ ] Revisar Lighthouse opportunities para más mejoras

---

## 25 de Abril 2026 — Animaciones Motion (Sprint 1-3)

### Overview

Implementación de animaciones premium en toda la plataforma usando Framer Motion. El sitio ahora se siente **vivo y dinámico** sin perder profesionalidad.

### SPRINT 1: Landing Page

| Componente | Animación Implementada |
|------------|----------------------|
| **LandingHero** | Parallax blobs con `useParallax()` hook, scroll reveal con stagger, micro-interacciones en botones (scale + shimmer) |
| **LandingNav** | Mega menu con stagger items (50ms delay), magnetic CTA button, currency selector slide animation |
| **LandingPricing** | Cards con scroll reveal + hover depth (`y: -8`), Pro badge bounce-in, feature list stagger |
| **LandingFooter** | Social icons scale+rotate hover, footer links underline animation, logo glow hover |
| **ReviewsSlider** | Cards con hover elevation, rating stars stagger, avatar pulse |
| **LandingFaq** | Accordion expand/collapse con height animation, chevron rotate |
| **LandingSteps** | Steps con stagger reveal, step numbers bounce-in, icons hover scale |
| **LandingPlugin** | Browser mockup hover parallax, feature icons scale+rotate |

### SPRINT 2: User Dashboard

| Componente | Animación Implementada |
|------------|----------------------|
| **DashboardLayout** | Sidebar hover con `x: 5`, active nav indicator con `layoutId` (spring physics) |
| **Dashboard Main** | Stats cards stagger reveal, activity timeline con pulse dots |
| **ProductList** | Product cards hover depth (`y: -5`, shadow elevation), stagger grid |
| **UsageStats** | Progress bars animados con `whileInView`, usage alert pulse glow cuando >80% |
| **CheckoutStepper** | Step indicators con progress line animation, connector `scaleX` |
| **PlanSelection** | Plan cards con selected glow, price count-up animation |
| **UserDataStep** | Floating labels con CSS peer, input focus scale, error shake, success check |
| **PaymentMethod** | Payment cards hover, loading spinner (rotate 360°), processing state |
| **OrderSummary** | Items slide-in, price emphasis animation |

### SPRINT 3: Admin Dashboard

| Componente | Animación Implementada |
|------------|----------------------|
| **Admin Dashboard** | Metric cards stagger reveal, critical pulse indicator, count-up values |
| **BrandTable** | Table rows stagger (30ms delay), hover `x: 3`, status badges bounce-in |
| **BrandDetailsModal** | Modal entry con spring physics (`scale: 0.9→1`), backdrop fade |
| **Admin Forms** | Input focus scale, toggle slides, save button loading states |
| **Leads** | Lead cards hover elevation, status filter pills, outreach ripple |
| **AdminNotifications** | Slide-in/out with AnimatePresence, dismiss animation |
| **Email Campaigns** | Campaign cards hover, stats pulse |

### Global CSS Improvements

| Mejora | Descripción |
|-------|-------------|
| `prefers-reduced-motion` | Media query que desactiva todas las animaciones para usuarios con preferencia de movimiento reducido |
| Focus ring premium | `outline: 2px solid #FF5C3A` + `box-shadow: 0 0 0 6px rgba(255,92,58,0.2)` |
| Animation utilities | `fadeInUp`, `fadeInLeft`, `fadeInRight`, `scaleIn`, `float`, `blobMorph`, `shimmer`, `pulseGlow` + stagger delays |

### Technical Details

- **Biblioteca:** Framer Motion v12.38.0
- **Easing:** Custom cubic-bezier `[0.16, 1, 0.3, 1]` (ease-out-quart)
- **Spring physics:** `stiffness: 300-400`, `damping: 17-20`
- **Scroll reveals:** `viewport={{ once: true, margin: "-100px" }}`
- **Stagger:** `staggerChildren: 0.05-0.12` entre elementos

### Archivos Modificados (26 archivos)

```
frontend/src/app/globals.css
frontend/src/app/dashboard/page.tsx
frontend/src/app/admin/dashboard/page.tsx
frontend/src/app/admin/revenue/page.tsx
frontend/src/app/admin/pricing/page.tsx
frontend/src/app/admin/payment-settings/page.tsx
frontend/src/app/admin/leads/page.tsx
frontend/src/app/admin/leads/components/*.tsx
frontend/src/components/landing/LandingHero.tsx
frontend/src/components/landing/LandingNav.tsx
frontend/src/components/landing/LandingPricing.tsx
frontend/src/components/landing/LandingFooter.tsx
frontend/src/components/landing/LandingFaq.tsx
frontend/src/components/landing/LandingSteps.tsx
frontend/src/components/landing/LandingPlugin.tsx
frontend/src/components/landing/ReviewsSlider.tsx
frontend/src/components/dashboard/DashboardLayout.tsx
frontend/src/components/dashboard/ProductList.tsx
frontend/src/components/dashboard/UsageStats.tsx
frontend/src/components/dashboard/WidgetPreview.tsx
frontend/src/components/checkout/CheckoutStepper.tsx
frontend/src/components/checkout/PlanSelectionStep.tsx
frontend/src/components/checkout/UserDataStep.tsx
frontend/src/components/checkout/PaymentMethodStep.tsx
frontend/src/components/checkout/OrderSummary.tsx
frontend/src/components/admin/brands/BrandTable.tsx
frontend/src/components/admin/brands/BrandDetailsModal.tsx
frontend/src/components/admin/AdminNotifications.tsx
frontend/src/components/admin/blog/PostsTable.tsx
```

---

## 24 de Abril 2026 — Fix Verificación de Email + Logging

### Bug Corregido

**Problema:** Usuarios que confirmaban su email seguían viendo el aviso "Verificación pendiente" en el dashboard, incluso cuando la confirmación aparentemente funcionaba.

**Causa raíz:** 
1. No había logs para diagnosticar qué pasaba en `verifyEmail()`
2. El cache de brand config (Redis) no se invalidaba tras la verificación, por lo que seguía sirviendo datos obsoletos con `email_verified: false`

### Solución Implementada

| Cambio | Descripción |
|--------|-------------|
| Logging extensivo | Console logs en cada paso de `verifyEmail()` para facilitar debugging futuro |
| Manejo de errores | El update ahora verifica si hubo error y retorna mensaje apropiado |
| Invalidación de cache | `invalidateBrandConfigCache()` se llama tras verificar exitosamente |

**Archivos modificados:**
- `backend/src/services/auth.service.ts` — método `verifyEmail()` reescrito con logging y cache invalidation

---

## 24 de Abril 2026 — Mejoras Trial Widget + Premium Modal

### Cambios Implementados

**1. Botón "Ver Probador IA" ahora abre modal premium cuando ya usó su prueba**
- Cuando `hasUsedTrial = true`, el botón abre el `UpgradeModal` en lugar de dejar pasar el flujo
- El texto del botón permanece como "Ver Probador IA" (sin cambios)

**2. Badge "1 generación gratis" visible cuando hay pruebas disponibles**
- Aparece encima del botón cuando el usuario aún no ha usado su prueba

**3. Modal premium rediseñado**
- Icono Crown en lugar de emoji
- Features con iconos lucide-react (Infinity, Palette, Smartphone)
- CTA principal: "Comenzar con Plan Trial" → `/planes?trial=true`
- CTA secundario: "Ver todos los planes y precios" → `/planes`
- Sin emojis en la UI (cumple regla de diseño)

**Archivos modificados:**
- `frontend/src/components/landing/LandingHero.tsx`
- `frontend/src/components/ui/UpgradeModal.tsx`

---

## 24 de Abril 2026 — Fix Sistema de Sesiones en Registro

### Bug Corregido

**Problema:** Cuando un usuario con sesión activa intentaba registrar una cuenta nueva, el sistema redirigía al dashboard de la cuenta vieja en lugar de crear la cuenta nueva.

**Causa raíz:** `auth.controller.ts` detectaba la sesión existente y retornaba 200 con `redirectTo: '/dashboard'` en lugar de proceder con el registro.

### Solución Implementada

| Antes | Después |
|-------|---------|
| Sesión activa = Rechazar registro + redirect | Sesión activa = Logout automático + Registrar cuenta nueva |

**Cambios:**
- Agregada función `clearCookieToken()` en `auth.controller.ts`
- Modificado método `register()` para cerrar sesión existente antes de crear cuenta nueva
- Usuario con sesión activa ahora puede registrarse sin necesidad de logout manual

**Archivo modificado:** `backend/src/controllers/auth.controller.ts` (líneas 34-47, 52-65)

---

## 22 de Abril 2026 — Auditoría Sistema de Leads + Enriquecimiento

### 🔴 Auditoría Crítica Completada

**Problema identificado:** Sistema de leads tenía 0% de datos de contacto (email, phone, website, Instagram, TikTok)

| Métrica | Antes | Después |
|---------|-------|---------|
| Leads totales | 139 | 139 |
| Leads con phone | 0 | ~136 |
| Leads con website | 0 | ~100+ |
| Leads con email | 0 | 0 (Google Places no provee emails) |

### ✅ Correcciones Aplicadas

| Corrección | Archivos | Estado |
|------------|----------|--------|
| Workflow n8n insertaba en tabla `clientes` (inexistente) | `flujo2_prospeccion_colombia.json` | ✅ Corregido |
| Place Details API para obtener phone/website | `lead-generation.service.ts` | ✅ Agregado |
| Campo TikTok en modal de creación | `LeadModal.tsx`, `types.ts` | ✅ Agregado |
| Campo Facebook en modal de creación | `LeadModal.tsx`, `types.ts` | ✅ Agregado |
| Campo facebook_url en backend types | `lead.service.ts` | ✅ Agregado |
| TECH_STACK.md desactualizado | `TECH_STACK.md` | ✅ Corregido |
| Migración SQL preparada | `add_facebook_url_to_leads.sql` | 📋 Pendiente ejecutar |

### 📊 Enriquecimiento de Leads

**Script ejecutado:** `scripts/enrich-leads.js` y `scripts/enrich-leads-v2.js`
- 136 leads enriquecidos con phone y website usando Place Details API
- Quota consumida: ~136 requests de Google Places (de 500/día disponibles)

### ⚠️ Pendiente de Ejecutar Manualmente

**En Supabase SQL Editor, ejecutar:**

```sql
-- Agregar columna facebook_url a leads
ALTER TABLE leads ADD COLUMN facebook_url VARCHAR(500);
CREATE INDEX IF NOT EXISTS idx_leads_facebook_url ON leads(facebook_url);

-- Verificar que tiktok existe (si no, ejecutar también)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tiktok VARCHAR(255);
```

### 🔴 Limitación: Emails NO disponibles via Google Places

Google Places API **NUNCA devuelve emails** de negocios. Opciones para obtener emails:

1. **Apify Google Maps Scraper** (ya configurado en workflow n8n) - puede extraer más datos
2. **Scraping de websites** de los negocios (ya enriquecidos con website)
3. **LinkedIn Sales Navigator** para emails de contactos

---

## 22 de Abril 2026 — Auditoría y Limpieza del Brain Vault

### 🧹 Limpieza de Documentación Obsoleta

**Resumen:** Auditoría completa del Brain Vault y limpieza de archivos que ya no reflejan la realidad del proyecto.

#### Sistema Mission Control ELIMINADO

| Componente | Estado | Notas |
|------------|--------|-------|
| `MISSION_CONTROL_SPEC.md` | ⚠️ Obsoleto | Marcado como histórico, describe sistema eliminado |
| `frontend/src/app/mission-control/agents/page.tsx` | ❌ Eliminado | Removido del código |
| `frontend/src/app/api/agents/status/route.ts` | ❌ Eliminado | Removido del código |
| `frontend/src/components/admin/agents/` (8 archivos) | ❌ Eliminado | Removido del código |

#### Archivos Archivados (en `Cerebro/Config/Archive/`)

| Archivo | Razón |
|---------|-------|
| 17 × `openclaw_MASTER_*.json` | Backups antiguos de configuración de agentes |

#### Archivos Actualizados

| Archivo | Cambio |
|---------|--------|
| `AGENTS_CONFIG_MASTER.md` | v3.0 — Eliminación de Mission Control, estado actual de agentes |
| `MISSION_CONTROL_SPEC.md` | Convertido a documento histórico/obsoleto |

#### Commits Realizados

```
7ee0317 refactor(admin): remove agents tab from admin and Mission Control system
```

---

### ℹ️ Archivos Dudosos — Recomendación

Los siguientes archivos fueron identificados como dudosos pero **NO se eliminaron** pending revisión de Sam:

| Archivo | Recomendación |
|---------|---------------|
| `PITCH_DECK_LOOKITRY_ES.md` | ¿Todavía relevante para pitch a investors? |
| `PITCH_DECK_LOOKITRY.md` | ¿Versión en inglés del pitch deck? |
| `Docs/Logica/` | ¿Refleja arquitectura actual? (Motor_IA_TryOn.md parece válido) |
| `Docs/audit/` | ¿Auditorías antiguas todavía relevantes? |
| `Docs/design/RUNPOD_*.md` | RunPod ya no se usa (n8n + OpenRouter es el flujo actual) |
| `Docs/SHOPIFY_INTEGRATION.md` | ¿Integración activa o legacy? |
| `Docs/WOOCOMMERCE_QA_E2E.md` | ¿Todavía válido para testing del plugin? |
| `Docs/research/social-verification-api-research.md` | ¿Resultado de research todavía aplica? |

---

## 20 de Abril 2026 (Fixes Críticos Health Check + n8n)

### 🔧 Fix: Health Check de n8n — YA NO hace GET al webhook de producción

**Problema:** El health controller enviaba GET a `https://n8n.wilkiedevs.com/webhook/tryon` cada 30 segundos, causando:
- 404s en logs de n8n
- Logs de spam llenando el terminal de n8n
- Posible impacto en rendimiento

**Solución:**
- Cambiado a usar `/healthz` endpoint público de n8n
- URL hardcodeada: `https://n8n.wilkiedevs.com/healthz`
- Respuesta esperada: `{"status":"ok"}` con HTTP 200

**Archivo Modificado:**
- `backend/src/controllers/health.controller.ts` — checkN8n() ahora usa `/healthz`

### 🔧 Fix: CORS_ORIGIN actualizado en .env.production

**Problema:** `.env.production` tenía placeholder `https://tu-dominio.com`.

**Solución:**
```
CORS_ORIGIN=https://wilkie-devs.lookitry.com,https://lookitry.com,https://www.lookitry.com,https://wilkie-devs.com,https://www.wilkie-devs.com
```

**Nota:** `.env.production` no está trackeado en git (contiene secretos). El cambio se sincroniza via deploy script.

### ✅ Verificación: N8N_API_KEY es válido

- Probado vía API `/api/v1/workflows` con el key actual → **OK**
- `/healthz` de n8n responde `{"status":"ok"}` → **OK**
- Health check post-deploy: n8n status=up, latency_ms=47

---

## 20 de Abril 2026 (Auditoría + Fixes Widget Try-On)

### 🔧 Fix: Sistema de Marca de Agua (Watermark) — CORREGIDO

**Resumen:** Restaurada implementación correcta del watermark usando archivos .webp reales.

#### Corrección

| Problema | Solución |
|----------|----------|
| Watermark usaba SVG genérico "Lookitry AI" | Ahora usa `/watermark-basic.webp` y `/watermark-trial.webp` reales |
| Posición incorrecta | BASIC: esquina inferior izquierda; TRIAL: ancho completo inferior |

#### Lógica Implementada

| Plan | Watermark Visual | Archivo | Posición |
|------|------------------|---------|----------|
| TRIAL | Visible | `/watermark-trial.webp` | Ancho completo inferior |
| BASIC | Visible | `/watermark-basic.webp` | Esquina inferior izquierda |
| PRO | Sin marca | — | Beneficio premium |
| ENTERPRISE | Sin marca | — | Beneficio premium |

#### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/tryon/ResultDisplay.tsx` | Watermark restaurado usando archivos .webp |
| `Lookitry_Brain_Vault/Cerebro/Docs/Guias/WIDGET_GUIDE.md` | Documentación completa del sistema |

### 🐛 Fixes Críticos P0 — Widget Try-On

**Resumen:** Auditoría completa del sistema de generación de imagen con 5 fixes P0 y 6 fixes P1 implementados.

#### Cambios Realizados

| # | Problema | Severidad | Solución |
|---|----------|-----------|----------|
| 1 | **No había polling** — generaciones async nunca retornaban resultado | P0 | Implementado polling con exponential backoff en `handleGenerate` |
| 2 | **TemplateLandingEmbed** no renderizaba paso 'select' | P0 | Agregado bloque para `step === 'select'` con ProductSelector |
| 3 | **Cache localStorage** sin hash de selfie | P0 | Key ahora incluye SHA-256 del archivo: `tryon_gen_${brand}_${hash}` |
| 4 | **Cola Redis deshabilitada** — código huérfano | P0 | Eliminado import de `generationQueueService` |
| 5 | **Race condition** en `acquireSlot()` | P0 | Ya estaba arreglado con script Lua atómico |

#### Mejoras de UX — ImageEditor Premium Mobile

| Feature | Descripción |
|---------|-------------|
| **Selector de formatos** | Original, 1:1, 3:4, 16:9 (vertical) |
| **UI Mobile-first** | Toolbar flotante inferior con `pb-safe` para notch |
| **Zoom controls** | Botones +/- y slider con gradient |
| **Rotación** | Botones -90°/+90° más visibles |
| **Touch targets** | Mínimo 44x44px para todos los botones |
| **Animaciones** | Framer-motion con `whileTap: scale` para feedback háptico |

#### Fixes P1 Frontend

| Fix | Descripción |
|-----|-------------|
| **Drag-and-drop** | Implementados handlers `onDragEnter/Leave/Over/Drop` en SelfieUploader |
| **ResizeObserver** | Cleanup correcto en TemplateModernSidebar y TemplateShowcase |
| **EMBED_ORIGIN** | Ahora usa `useMemo` envuelto en try-catch |
| **Focus trap modales** | Implementado `useFocusTrap` hook para feedback y lightbox (WCAG) |
| **aria-labels** | Agregados `aria-label` a todos los botones del SelfieUploader |

#### Fixes Backend

| Fix | Descripción |
|-----|-------------|
| **Retry n8n** | Exponential backoff (2s, 4s, 8s) para errores transitorios |
| **Ruta duplicada** | Eliminada `/session-token` duplicada en pruebalo.routes.ts |
| **Timeout removido** | Eliminado parámetro `timeout` no funcional de `tryon.service.ts` |

#### Endpoint Nuevo

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/pruebalo/:brandSlug/generation/:generationId` | GET | Consulta estado de generación (para polling) |

#### Commits Realizados

```
9a267ef fix: remove unused timeout parameter from tryon.service.ts
7158242 feat: premium mobile ImageEditor with format selector, zoom controls, and improved UX
abb6e54 fix: P1 fixes - drag-drop handlers, ResizeObserver cleanup, EMBED_ORIGIN memoization
7b311c6 fix(tryon): P0/P1 backend fixes - remove orphan queue import, duplicate route, add n8n retry
4c4b1c9 fix: P0-2/P0-3 - TemplateLandingEmbed handle step=select + selfie hash cache
```

---

## 20 de Abril 2026

### 🐛 Fix: Imágenes del Dashboard no cargaban

**Problema:** Las imágenes en el dashboard no cargaban porque MinIO no tenía configuración de Traefik, dejando `minio.wilkiedevs.com` inalcanzable desde el exterior.

**Causa raíz:** El contenedor de MinIO en `vps-docker-compose.yml` no tenía labels de Traefik, por lo que el tráfico a `minio.wilkiedevs.com` no se enrutaba al contenedor.

**Solución aplicada:**
- Añadidos labels de Traefik al servicio `minio` en `vps-docker-compose.yml`:
  - Ruta principal: `Host(minio.wilkiedevs.com)` → puerto 9000
  - Ruta consola: `Host(minio.wilkiedevs.com) && PathPrefix(/ui)` → puerto 9001

**Nota:** El deploy del compose falló porque el contenedor `virtual-tryon-frontend` no existe en el registry (la imagen se genera localmente en VPS). El archivo `vps-docker-compose.yml` fue pusheado a GitHub y necesita ser aplicado manualmente en el VPS, O se necesita hacer rebuild de las imágenes.

**Archivos modificados:**
| Archivo | Cambio |
|---------|--------|
| `vps-docker-compose.yml` | Añadidas labels de Traefik para MinIO |

---

## 18 de Abril 2026

### 🎨 UI Fix + 🤖 GCP Imagen Planning + ⚙️ Model Config

**Resumen:** Corregimos la visualización del Template Showcase, ajustamos la configuración de modelos en OpenCode y documentamos la futura integración de Imagen 3 (GCP).

#### Cambios Realizados

| Cambio | Descripción |
|--------|-------------|
| **UI Fix (Showcase)** | Se añadió `w-full` al grid y tarjetas en `TemplateShowcase.tsx` para evitar que se vean comprimidas en móvil. |
| **Model Config** | Corregida la capitalización de `minimax/MiniMax-M2.7` en `opencode.json` para cumplir con el esquema oficial. |
| **GCP Imagen Documentation** | Creada guía completa en `Protocolos/CONFIGURACION_IMAGEN3_GCP.md` para rotación de 4 cuentas de GCP. |

#### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/tryon/templates/TemplateShowcase.tsx` | Fix en ProductGridEditorial y product buttons. |
| `opencode.json` | Actualización de IDs de modelos y claves de proveedor. |
| `Lookitry_Brain_Vault/Cerebro/Protocolos/CONFIGURACION_IMAGEN3_GCP.md` | **[NUEVO]** Protocolo de integración Imagen 3. |

---


## 16 de Abril 2026 (Noche)

### 🛡️ Blindaje contra Overload de MiniMax + Fix Rebecca-Melissa

**Resumen:** Implementamos protección contra errores 529 overload de MiniMax y arreglamos la comunicación Rebecca-Melissa.

#### Cambios Realizados

| Cambio | Descripción |
|--------|-------------|
| **Retry Logic MiniMax** | Nueva regla 5.5 en REGLAS_IMPORTANTES.md con protocolo de retry exponencial (5s → 15s → 30s) |
| **Rebecca → Melissa** | Rebecca ahora puede recibir mensajes de Melissa (942528796) vía Telegram |
| **Sesión Rebecca** | Sesión reiniciada tras overload que la dejó en estado "done" |

#### Protocolo de Retry Implementado

```
Error 529 overload → Esperar 5s → Retry → Esperar 15s → Retry → Esperar 30s → Último retry
Si todo falla → Reportar a Sammantha inmediatamente
```

#### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` | Agregada regla 5.5 de retry |
| `.openclaw/openclaw.json` | allowFrom de Rebecca incluye Melissa |

---

## 14 de Abril 2026 (Tarde)

### 🚀 MISSION CONTROL — Dashboard Operacional Completo

**Resumen:** Creación del Mission Control, un dashboard cyberpunk/sci-fi para monitorear todos los agentes, métricas y operaciones de Lookitry en tiempo real.

#### Estructura del Proyecto

```
frontend/src/app/mission-control/
├── layout.tsx           # Layout con Google Fonts
├── page.tsx             # Overview principal
├── agents/page.tsx      # Panel de 10 agentes
├── product/page.tsx     # Try-On / Jobs
├── business/page.tsx    # Business metrics
├── security/page.tsx    # Cipher's dashboard
├── growth/page.tsx      # Marlo + Rebecca
├── trading/page.tsx     # Leo
├── autolookitry/page.tsx# Beta module
└── system/page.tsx      # Zephyr + Lina
```

#### Componentes Creados

| Categoría | Componentes |
|-----------|-------------|
| **Atoms** | StatusDot, Badge, StatCard, MonoNumber, LiveClock, ProgressBar, TrendArrow, MetricDelta, GlowButton, IconButton, Separator |
| **Molecules** | AgentCard, QueueBar, WebhookFeed, AlertItem, ServiceTile, KanbanCard, TimelineNode, EmptyState |
| **Organisms** | MCHeader, MCSidebar, MCLayout, Section, GridArea, AgentsGrid, TryOnQueue, SystemStatusGrid, BusinessKPIs, SecurityPanel, GrowthPanel, TradingPanel, AutolookitryPanel, OverviewStats |

#### Características Implementadas

| Feature | Descripción |
|---------|-------------|
| **10 Agent Cards** | Sammantha, Pixel, Kira, Nadia, Cipher, Zephyr, Marlo, Rebecca, Leo, Lina |
| **System Status Grid** | Servicios (API, Supabase, MinIO, Traefik, GROQ, OpenRouter, Wompi, Brevo) |
| **Try-On Queue** | Barra stackeada + webhook feed en tiempo real |
| **Business KPIs** | MRR, ARR, Trial→Paid, Active Users, Revenue por Plan |
| **Security Dashboard** | Login fallidos, IPs bloqueadas, audit score |
| **Trading Panel** | Balance, P&L, posiciones abiertas (Leo) |
| **Autolookitry [BETA]** | Kanban board, roadmap, métricas |
| **Real-time Polling** | Hook para datos actualizados cada X segundos |

#### Diseño Visual

| Elemento | Valor |
|---------|-------|
| **Primary Color** | #FF5C3A (Naranja Lookitry) |
| **Background** | #0a0a0a (Negro) |
| **Card BG** | #111111 |
| **Fonts** | Plus Jakarta Sans, DM Sans, JetBrains Mono |
| **Animations** | Framer Motion (fade-up, pulse, scale) |

#### Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `MISSION_CONTROL_SPEC.md` | Especificación completa del dashboard |
| `lib/mission-control/types.ts` | Types e interfaces para todo el sistema |
| `lib/mission-control/constants.ts` | Mock data, thresholds, formatters |
| `hooks/useMissionControl.ts` | Polling hook + central data hook |
| `app/api/mission-control/agents/route.ts` | API endpoint |
| `app/api/mission-control/tryon-metrics/route.ts` | API endpoint |
| `tailwind.config.ts` | Actualizado con tokens MC |

#### Próximos Pasos

| # | Feature | Prioridad |
|---|---------|-----------|
| 1 | Conectar a Supabase real | ALTA |
| 2 | WebSocket para real-time | ALTA |
| 3 | Notificaciones push | MEDIA |
| 4 | Export CSV | MEDIA |
| 5 | Mobile responsive | MEDIA |

---

## 14 de Abril 2026

### Configuración Completa de Agentes v2.0

**Resumen:** Sistema de 10 agentes completamente configurado con información real del Cerebro.

#### Modelo Default Estandarizado

| Cambio | Detalle |
|--------|---------|
| **Modelo unificado** | `minimax/MiniMax-M2.7` para todos los agentes |
| **Groq removido** | Ya no aparece en ningún systemPromptOverride |
| **DeepSeek removido** | Ya no aparece en ningún systemPromptOverride |
| **Excepciones** | Solo si AGENTS.md lo especifica explícitamente |

#### Agentes Configurados

| Agente | Workspace | Archivos | Status |
|--------|-----------|----------|--------|
| **Nadia** | dataalchemist | 8 archivos | ✅ Completo |
| **Kira** | devguardian | 8 archivos | ✅ Completo |
| **Marlo** | growthpilot | 8 archivos | ✅ Completo |
| **Rebecca v3.0** | rebecca | 11 archivos | ✅ Completo |
| **Cipher** | security-auditor | 8 archivos | ✅ Completo |
| **Pixel** | webwizard | 8 archivos | ✅ Completo |
| **Lina** | docs-writer | 8 archivos | ✅ Completo |
| **Sammantha** | sammy | 8 archivos | ✅ Completo |

#### Rebecca v3.0 — Capacidades de MONEY

| Nueva Capacidad | Descripción |
|-----------------|-------------|
| **Automejora continua** | Monitoreo de tendencias TikTok/IG, A/B testing |
| **Herramientas gratuitas** | CapCut, DaVinci Resolve, Canva, Pexels, ChatGPT |
| **Conseguir clientes** | SEO Fiverr, DM a tiendas, cold outreach |
| **Patrocinio** | Solo grants (Google, AWS) — **PROHIBIDO equity** |
| **Collaboración Leo** | JUNTOS generan ingresos para Lookitry |

#### Documentación Actualizada en Cerebro

| Archivo | Cambios |
|---------|---------|
| `AGENTS_CONFIG_MASTER.md` | Nuevo formato, 10 agentes, modelo default |
| `AGENTS.md` | Roles, invocación, colaboración, personas reales |
| `REGLAS_IMPORTANTES.md` | Sistema de Agentes v2.0, reglas Rebecca |
| `Cerebro/memory/2026-04-14.md` | Registro de sesión |

#### Contenido por Agente (líneas)

| Agente | TOOLS.md | USER.md | HEARTBEAT.md | SOUL.md | MEMORY.md |
|--------|----------|---------|--------------|---------|-----------|
| Nadia | 158 | 158 | 151 | 94 | 155 |
| Kira | 171 | 159 | 174 | 120 | 156 |
| Marlo | 190 | 179 | 200 | 109 | 167 |
| Rebecca | 120 | 126 | 185 | 260 | 85 |
| Cipher | 155 | 133 | 159 | 100 | 140 |
| Pixel | 167 | 154 | 168 | 96 | 180 |
| Lina | 133 | 105 | 73 | 125 | 53 |

---

## 13 de Abril 2026 (Continuación)

### Fix: Sistema de Temas para Mini-Landings

**Cambios implementados:**

| # | Componente | Cambio |
|---|-----------|--------|
| 1 | `shared.tsx` | Nuevo hook `useLandingTheme(brand)` con fallbacks por sección |
| 2 | `shared.tsx` | `BrandLogo` ahora usa Next.js Image con blur placeholder |
| 3 | `shared.tsx` | `ProductImage` ahora tiene `onError` handler con SVG fallback |
| 4 | `MiniLanding.tsx` | Eliminado `console.log` de debug |

**Hook `useLandingTheme` disponible:**
- `heroBg`, `productsBg`, `footerBg`, `cardBg`, `infoBg`, `aboutBg` - fondos por sección
- `text`, `muted`, `mutedLight` - textos adaptativos
- `border`, `borderLight` - bordes adaptativos
- `surface`, `surfaceHover` - superficies para cards
- `ctaBg`, `ctaText` - colores de CTA

---

## 13 de Abril 2026

### Fix: Jobs Atascados en Cola Try-On

**Problema identificado:** Un job quedó atascado en `queue:tryon:processing` por ~26 minutos (timeout de n8n) porque:
1. El queue worker no tenía mecanismo para recuperar jobs "huérfanos" (sin timeout real)
2. No había validación de que el webhook de n8n estuviera activo antes de procesar
3. El workflow de n8n puede tardar más de lo esperado en responder

**Soluciones implementadas:**

| # | Componente | Cambio |
|---|-----------|--------|
| 1 | `generation-queue.service.ts` | Nuevo método `recoverStaleJobs()` - recupera jobs en processing > 5 min |
| 2 | `queue.routes.ts` | `recoverStaleJobs()` se ejecuta cada 10s en el interval del queue worker |
| 3 | `queue.routes.ts` | Validación `isWebhookRegistered()` antes de llamar a n8n |
| 4 | `queue.routes.ts` | Interval ajustado de 2s a 10s para evitar sobrecarga |
| 5 | `n8n.client.ts` | Nuevo método `isWebhookRegistered()` - verifica si n8n responde con 404 |

**Parámetros configurados:**
- `STALE_JOB_TIMEOUT_MS`: 300000 (5 minutos)
- Queue worker interval: 10000ms (10 segundos)

---

## 10 de Abril 2026

### Auditoría Web Completa

Se realizó auditoría por 3 agentes especializados (WebWizard + DevGuardian + GrowthPilot):
- **Score SEO:** 6.5/10
- **Score Seguridad:** 7.2/10
- **Score UX:** 6.5/10
- **Score Conversión:** 5.0/10

### Cambios Aplicados

| # | Categoría | Cambio | Archivos |
|---|----------|--------|----------|
| 1 | Seguridad | Secretos hardcodeados en docker-compose → variables de entorno | `docker-compose.frontend.yml`, `frontend/.env.example` |
| 2 | SEO | Redirecciones 301 para URLs 404 | `frontend/next.config.js` |
| 3 | Datos | Precios unificados en /terminos y /planes ($180K BASIC, $350K PRO) | `frontend/src/app/terminos/TerminosClient.tsx` |
| 4 | Conversión | Clarificado trial: $20.000 COP (pago único 7 días) | `LandingNav.tsx`, `PlanesClient.tsx` |
| 5 | Datos | **Precios 100% dinámicos** en todas las páginas | 15 archivos actualizados |

### Detalle de Precios Dinámicos

Todas las páginas ahora leen precios desde `pricing_config` en Supabase via `getPricingConfig()`:

| Archivo | Cambio |
|---------|--------|
| `frontend/src/app/terminos/page.tsx` | Server Component con ISR → pasa `pricing` prop |
| `frontend/src/app/terminos/TerminosClient.tsx` | `buildArticles(pricing)` genera content dinámico |
| `frontend/src/app/page.tsx` | Fallback actualizado a $180K/$350K |
| `frontend/src/app/checkout/page.tsx` | `PLAN_BASE_FALLBACK` dinámico |
| `frontend/src/app/dashboard/checkout/page.tsx` | Fallback actualizado |
| `frontend/src/app/dashboard/checkout-landing/page.tsx` | IDs corregidos (`landing` → `mini_landing`) |
| `frontend/src/components/auth/RegisterForm.tsx` | Fetch dinámico en `useEffect` |
| `frontend/src/app/admin/revenue/page.tsx` | Fallback actualizado |
| `frontend/src/app/admin/subscriptions/page.tsx` | MRR recalculado |
| `frontend/src/components/payments/PaymentSuccessScreen.tsx` | Amount por URL param |

### Pendiente (Issues Known)

| Issue | Severidad | Estado |
|-------|-----------|--------|
| Implementar HSTS en frontend | ALTO | ⚠️ Pendiente |
| Invalidación JWT en logout | ALTO | ⚠️ Pendiente |
| Skeleton loaders | MEDIO | ⚠️ Pendiente |
| Testimoniales reales con foto | MEDIO | ⚠️ Pendiente |
| CSRF Protection | MEDIO | ⚠️ Pendiente |

---

---
## [2.4.1] - 2026-04-19 - Pixel Hotfix

### 🔧 Fixed
- **Frontend Mission Control Agents**: API `/api/agents/status` ahora retorna MOCK_AGENTS como fallback cuando OpenClaw Gateway no está disponible
- **OpenClaw Gateway URL**: Corregido de `localhost:4002` a `localhost:18789` en `frontend/src/lib/openclaw/client.ts`
- **API Route Fallback**: La API ya no retorna 500 cuando hay error, ahora retorna datos mock exitosamente

### 📁 Files Changed
- `frontend/src/lib/openclaw/client.ts` - Corregido URL default
- `frontend/src/app/api/agents/status/route.ts` - Añadido fallback a MOCK_AGENTS

### ✅ Verification
- API `/api/agents/status` returns `success: true` with `mode: mock`
- 10 agents displayed correctly
- Frontend dev server running on port 3000

### 📝 Additional Notes (12:20 GMT-5)
- OpenClaw Gateway bindeado a `127.0.0.1:18789` (loopback only)
- La API de sesiones de OpenClaw no expone endpoint REST público (solo UI web)
- Sistema operando con MOCK_AGENTS hasta que se configure acceso real a sesiones
- Si se necesita integración real con sesiones, requiere modificar OpenClaw Gateway
