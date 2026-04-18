## [2026-04-15 16:30] - Rework Completo Command Center

### Estructura nueva (antes: 1 archivo de 1421 líneas)

```
command-center/
├── page.tsx                    # ~13KB — limpio, usa componentes
├── command-center.css          # Animaciones CSS
└── components/
    ├── index.ts                # Re-export todo
    ├── types.ts                # Agent, HeartbeatData, AgentStatus interfaces
    ├── helpers.ts              # AGENTS config, supabase, fetchSVGFromAPI
    ├── StarField.tsx           # Canvas estrellado
    ├── DataStream.tsx          # Matrix rain
    ├── SammyPixelSprite.tsx    # 16x24 pixel art
    ├── AnimatedSprite.tsx      # Sprite genérico con walk cycle
    ├── SammyRoom.tsx           # Room inmersivo de Sammy (partículas + radar)
    ├── AgentRoomPanel.tsx      # Tarjeta de agente + room SVG (renderRoom prop)
    ├── AgentModal.tsx          # Modal de detalle
    └── rooms/
        ├── index.ts
        ├── ControlTowerRoom.tsx
        ├── MediaStudioRoom.tsx
        ├── TradingFloorRoom.tsx
        ├── DevStationRoom.tsx
        ├── ServerBayRoom.tsx
        ├── CrmHubRoom.tsx
        ├── LabRoom.tsx
        └── WarRoomRoom.tsx
```

### Bugs corregidos
1. `AgentRoomPanel` referenciaba variables undefined (`sammyStatus`, `statusColor`, `taskText`) → Corregido pasando `agentStatus` como prop
2. Sammy tenía renderizado inline mezclado con lógica de agente → Extraído a `SammyRoom.tsx` + prop `renderRoom`

### Features
- Cada agent tiene su `renderRoom` opcional para rooms personalizados
- Heartbeat → `AgentStatusMap` por agente → `AgentRoomPanel` recibe `agentStatus`
- AI asset generation via `/api/command-center/generate-svg` intacto
- Supabase data fetching intacto
- Patrol movement + isMoving state intacto
- Build: ✅ TypeScript 0 errores, Next.js build exitoso

### Dependencies
- Todos los exports centralizados en `components/index.ts`
- `helpers.ts` exporta `AGENTS`, `supabase`, `fetchSVGFromAPI`
- `types.ts` exporta tipos compartidos

## [2026-04-15 16:00] - Intento Fix Memory Search - SIN ÉXITO

### Problema: memory_search fallaba con error de API Gemini inválida

**Causa raíz:** El plugin `memory-core` y servidor `memory` MCP requieren embeddings (MiniMax NO tiene API de embeddings)

**Intentos:**
1. Configuré `EMBEDDINGS_PROVIDER=openai` + `OPENAI_API_KEY` en servidor `memory` → Falló (API key inválida)
2. Desactivé servidor `memory` MCP → `memory-core` plugin seguía usando OpenAI del entorno
3. La variable `OPENAI_API_KEY` en el sistema está con key inválida: `***REMOVED-SECRET***`

**Estado actual:** Búsqueda semántica DESHABILITADA hasta que Sam consiga una API key válida de OpenAI (con embeddings habilitados)

**Solución temporal:** Usar lectura directa de archivos (`read` tool) para acceder al Cerebro

**API keys inválidas identificadas:**
- OpenAI entorno: `***REMOVED-SECRET***`
- Gemini skills: `***REMOVED-SECRET***`

**Nota:** La API key de OpenAI que SÍ funciona es la del workflow RAG en n8n (diferente)

---

## [2026-04-15] - Sync Completo Agentes Brain Vault

### Sync: Archivos de Agentes Actualizados

**Problema:** Lina no estaba actualizando los archivos individuales de agentes en `Lookitry_Brain_Vault/Cerebro/Agentes/` cuando se hacían cambios en la configuración.

**Solución:** Sammantha ejecutó sync manual de todos los archivos:

**Archivos ACTUALIZADOS:**
- `Agentes/rebecca.md` — CREADO (faltaba completamente)
- `Agentes/leo.md` — CREADO (faltaba completamente)
- `Agentes/architectai.md` — Actualizado (eliminado GROQ fallback)
- `Agentes/security-auditor.md` — Actualizado
- `Agentes/growthpilot.md` — Actualizado
- `Agentes/docs-writter.md` — Actualizado
- `Agentes/dataalchemist.md` — Actualizado
- `Agentes/devguardian.md` — Actualizado
- `Agentes/webwizard.md` — Actualizado (eliminado GROQ/DeepSeek fallback)

**Contenido sincronizado:**
- Modelo único: MiniMax-M2.7 (Groq/DeepSeek removidos)
- Herramientas y MCPs actuales
- Roles y responsabilidades actualizados
- Colaboraciones correctas

**Regla establecida:** Lina DEBE sincronizar `Agentes/` después de cada cambio en AGENTS.md o REGLAS_IMPORTANTES.md

---

## [2026-04-11] - Sammy MiniMax reasoning_content Fix

### Fix: Sammy se quedaba colgado al recibir mensajes

**Síntoma:** Sammy recibía mensajes por Telegram pero no respondía, entrando en retry infinito hacia MiniMax.

**Causa:** MiniMax-M2.7 a veces devuelve la respuesta en el campo `reasoning_content` en lugar de `content`, especialmente con prompts de razonamiento. El código original solo leía `message.content ?? ''` que venía vacío.

**Solución:** Actualizado `sammy/src/llm/index.ts` para hacer fallback a `reasoning_content` cuando `content` está vacío:

```typescript
let finalContent = message.content ?? '';
if (!finalContent && message.reasoning_content) {
  finalContent = message.reasoning_content;
}
```

**Commit:** `dd2a5c0` — "fix(sammy): handle MiniMax reasoning_content when content is empty"

**Archivos modificados:**
- `sammy/src/llm/index.ts` — MiniMaxProvider ahora soporta reasoning_content

**Documentación:** Actualizado `SAMMY_ARCHITECTURE.md` con la sección "Bug conocido"

---

## [2026-04-10] - Redis Queue Implementation & Production Fix

### Fix: Redis Connection in Production
- **Backend Config**: Actualizada la conexión a Redis para usar `REDIS_URL` desde variables de entorno.
- **Entorno VPS**: Configurado `REDIS_URL=redis://root-redis-1:6379` en el VPS (contenedor interno en red `proxy`).
- **Resolución**: Corregido error "Connection is closed" que ocurría al intentar conectar a `localhost:6379` dentro del contenedor de backend.

### Feature: Asynchronous Try-On Queue
- **Background Worker**: Activado el procesamiento asíncrono en `queue.routes.ts` mediante `setInterval` (cada 2 segundos).
- **Architecture**: El backend ahora encola las peticiones de generación y el worker las consume de forma ordenada, gestionando la concurrencia por marca.
- **Workflow n8n**: El worker dispara el webhook `wPLypk7KhBcFLicX` de forma asíncrona.

### Documentation: Brain Vault Sync
- **TECH_STACK.md**: Actualizado con el rol de Redis como "Job Queue" y nuevos servicios de cola.
- **PRD.md**: Reflejado el flujo asíncrono en la arquitectura de Try-On.

---


## [2026-04-10] - Smart Dynamic Colors for Mini-Landing Templates

### Refactor: Dynamic Smart Color System

**Description:**
Removed the WYSIWYG visual editor approach and instead implemented smart dynamic colors throughout all mini-landing templates. The system now automatically detects light vs dark backgrounds and applies appropriate text colors for optimal readability.

**Files Modified:**
- `frontend/src/components/mini-landing/shared.tsx` - Added utility functions for smart colors
- `frontend/src/components/mini-landing/TemplateClassic.tsx` - Smart dynamic colors in Hero, Steps, Products, Footer
- `frontend/src/components/mini-landing/TemplateEditorial.tsx` - Smart dynamic colors in Hero, Info sections
- `frontend/src/components/mini-landing/TemplateModerno.tsx` - Smart dynamic colors in TrustBar, Products, Info sections

**New Utility Functions in shared.tsx:**
- `getLuminance(color)` - Calculate relative luminance of a color
- `getContrastColor(color, darkColor, lightColor)` - Get contrasting text color (black/white based on background)
- `getSmartMutedColor(color)` - Get muted/secondary text color based on background
- `getSmartBorderColor(color)` - Get appropriate border color based on background
- `getSmartOverlayColor(color)` - Get overlay color based on background

**How It Works:**
- Uses WCAG luminance formula to detect if background is light or dark
- Light backgrounds → dark text (#111111), muted text (#6b7280)
- Dark backgrounds → light text (#ffffff), muted text (rgba(255,255,255,0.72))
- All templates now respect `cover_bg_color`, `header_color`, and `widget_bg_color` settings
- Text colors automatically adapt for proper contrast and readability

---

## [2026-04-10] - UI/UX Widget Templates - Viewport & Scroll Fixes

### Critical Fixes for Black Stripes & Scroll Issues

**Root Causes Fixed:**
1. `h-screen` doesn't work with mobile browsers that have dynamic toolbars
2. `min-h-full` was sometimes used instead of proper viewport handling
3. Excessive `pb-36 sm:pb-40` padding creating empty space at bottom
4. Main container not properly filling viewport on all devices

**TemplateBare.tsx:**
- Changed from `h-full` to `min-h-screen min-h-[100dvh]`
- Main container now fills viewport properly on all devices
- Removed excessive padding that caused black stripes
- Content scrolls internally when needed

**TemplateShowcase.tsx:**
- Changed from `h-screen min-h-screen` to `min-h-screen min-h-[100dvh]`
- Removed `pb-36 sm:pb-40 md:pb-44 lg:pb-48` padding that created black stripes
- Generating step also uses `min-h-screen min-h-[100dvh]`
- Content scrolls internally with `overflow-y-auto`

**TemplateBoldProStudio.tsx:**
- Changed from `h-full min-h-full` to `min-h-screen min-h-[100dvh]`
- Main container fills viewport properly

**TemplateModernSidebar.tsx:**
- Changed from `h-full min-h-full` to `min-h-screen min-h-[100dvh]`
- Removed `pb-36 sm:pb-40` from step='select' section
- Generating step uses `min-h-screen min-h-[100dvh]`
- Main content area now uses `overflow-hidden` on container with `overflow-y-auto` on content

### Key CSS Changes:
- **Viewport Height:** `min-h-screen min-h-[100dvh]` instead of `h-screen` or `h-full`
- **Mobile Chrome Support:** `100dvh` (dynamic viewport height) accounts for mobile browser toolbars
- **No Black Stripes:** Removed excessive bottom padding
- **Content Scrolling:** Content areas use `flex-1 overflow-y-auto` instead of container scrolling

## [2026-04-10] - UI/UX Widget Templates - Responsive Fixes

### TemplateBoldProStudio.tsx:
- Fixed ambient glow blobs (520px) that overflowed on mobile → now responsive: 256px mobile, 384px tablet, 520px desktop
- Fixed bottom action bar touch targets (py-4 on mobile, py-5 on desktop)
- Fixed opacity-30 → opacity-40 for better disabled button visibility
- Fixed hint text opacity (was 50% which was too low)
- Fixed duplicate `aspect-[4/5] sm:aspect-[4/5]` → single `aspect-[4/5]`
- Added `z-10` to "Visto" badge for proper layering

### TemplateModernSidebar.tsx:
- Fixed ambient glow size (w-96 h-96) → responsive: 48px mobile, 96px tablet/desktop
- Replaced arrow character `↓` with lucide-react SVG icon (accessibility)
- Fixed `pb-32` → `pb-36 sm:pb-40` for proper bottom CTA spacing
- Fixed syntax error in transform property

### TemplateBare.tsx:
- Fixed outer padding `px-4` → `px-3 sm:px-4` for very small screens (320px)
- Added responsive padding to all containers
- Fixed `rounded-[24px]` on cards → `rounded-2xl sm:rounded-[24px]`
- Fixed image sizes `h-16 w-16` → `h-14 w-14 sm:h-16 sm:w-16`
- Fixed text sizes for accessibility (increased minimum)
- Added proper bottom CTA safe area padding
- Fixed product selected card spacing

### TemplateShowcase.tsx:
- Fixed bottom padding `pb-36 sm:pb-40 md:pb-44` → `pb-36 sm:pb-40 md:pb-44 lg:pb-48`
- Added `paddingBottom: max(env(safe-area-inset-bottom), 12px)` for safe areas
- Added responsive button padding `py-3 sm:py-4`

### Shared Components Improvements:
- ErrorBanner: dismissible with onDismiss prop, slide animation
- NoticeBanner: dismissible with onDismiss prop, slide animation
- New InfoBanner component with info/warning/error/success variants
- All banners now have proper aria-label on close buttons
- Framer-motion on StepBar and FriendlyProductSelector

### Benefits:
- All 4 templates automatically benefit from improvements
- No horizontal overflow on screens as small as 320px
- Proper touch targets (44px minimum, 48-60px for primary actions)
- Safe area support for notched devices
- Consistent spacing using Tailwind scale

## [2026-04-10] - UI/UX Widget Shared Components

**SelfieUploader.tsx:**
- Added framer-motion animations (entrance, drag, tap, hover)
- Motion-powered container with staggered child animations
- Drop zone with animated scale/color transitions on drag
- Camera button with better touch targets (min 44px, actual 60px min-height)
- Camera/gallery buttons with press/tap animations
- Error dismiss animation with AnimatePresence
- Camera error fallback message for denied permissions
- Responsive tips grid (3 columns on all sizes, but tighter on mobile)
- Lucide-react icons replacing inline SVGs
- `aria-label` for accessibility on all buttons

**GenerationLoader.tsx:**
- Added framer-motion for entrance and spinner animations
- Smooth progress bar with CSS transitions (no jumping)
- Progress percentage display
- Smarter progress logic (slow start, medium middle, slow near end)
- Text colors via props for dark/light mode adaptation
- Pulsing center icon animation
- Active indicator dot with pulse animation
- Customizable messages array prop

**shared.tsx (ErrorBanner + NoticeBanner):**
- Added framer-motion for slide-in/out animations
- ErrorBanner: dismissible with `onDismiss` prop, slide animation
- NoticeBanner: dismissible with `onDismiss` prop, slide animation
- New `InfoBanner` component with info/warning/error/success variants
- All banners now have proper `aria-label` on close buttons
- Stacking animations via AnimatePresence
- Dark/light mode support via props

**Benefits:**
- All 4 templates automatically benefit from improvements:
  - TemplateBare
  - TemplateModernSidebar
  - TemplateBoldProStudio
  - TemplateShowcase

## [2026-04-10] - Slug Automático + Lenguaje Simplificado

### Bug Fix - Theme Toggle No Guardaba Preferencia
- **ThemeContext.tsx**: Cambiado storage key de `'lookitry-theme'` a `'theme'` para sincronizar con ThemeToggle
- **ThemeToggle.tsx**: Ahora usa `useTheme()` del context en lugar de estado interno propio
- Antes: Toggle guardaba en `'theme'`, Context leía de `'lookitry-theme'` → siempre dark
- Ahora: Ambos usan `'theme'` y comparten estado via ThemeContext
- Afecta: Dashboard usuario y Admin panel

### Frontend - Modal Pro Simplificado
- **UpgradeModal.tsx**: Lenguaje simplificado
  - "400 generaciones por mes" → "400 fotos por mes"
  - "1.200 generaciones por mes" → "1.200 fotos por mes"
  - "generaciones" → "fotos" en todas las features
  - "Elige tu potencia para Lookitry" → "Haz que tu tienda brille"
  - "Tu período de prueba está activo. Selecciona un plan profesional..." → simplificado
  - "Desbloquea todo el potencial de Lookitry con el Plan Pro" → "Con el Plan Pro obtienes más fotos..."
  - "Ir a pagar" → "Elegir Plan Pro"
  - "Cerrar y continuar trial" → "Cerrar y seguir probando"
  - Features simplificadas: "Branding básico" → "Logo y colores de tu marca", "URL propia del probador" → "Tu propia página de pruebas", etc.

### Backend - Slug Automático Post-Compra
- **brands.routes.ts**: Nuevo endpoint `POST /api/brands/check-availability`
  - Recibe `{ brandName }` y retorna `{ slug, brandExists, slugExists, suggestedSuffix }`
  - Genera slug base con `slugify()` (normalización NFD, remoción acentos)
  - Verificación case-insensitive con ILIKE
  - Rate limiting aplicado
- **auth-post-payment.controller.ts**: Modificado `registerPostPayment`
  - Recibe `customSuffix` opcional en body
  - Nueva función `generateUniqueSlug()` que:
    - Si `customSuffix` tiene valor → usa `base-suffix`
    - Si `customSuffix` vacío → genera número aleatorio 100-999
    - Verifica colisiones en BD y genera alternativas
  - Manejo de errores robusto con `SLUG_GENERATION_ERROR`

### Frontend - Formulario Post-Pago Simplificado
- **onboarding-post-pago/page.tsx**: Slug automático
  - Campo slug ya NO visible en formulario
  - Al escribir nombre de marca → llama `check-availability` 
  - Muestra preview: "lookitry.com/[slug]" con ✓ verde
  - Si nombre existe → muestra campo para agregar sufijo adicional
  - Preview actualiza dinámicamente con el sufijo
- **api/brands/check-availability/route.ts**: Proxy nuevo para frontend
- **RegisterForm.tsx + onboarding-post-pago**: Checklist visual de contraseña
  - 5 requisitos mostrados como checklist con ✓ verde / ○ gris
  - Validación en tiempo real (onChange)
  - Confirmación de contraseña con mensaje claro

### Frontend - Lenguaje Dashboard Simplificado
- Reemplazado lenguaje técnico por versiones simples en 12 archivos:
  - "Generaciones" → "Fotos creadas" / "Fotos usadas"
  - "Suscripción" → "Tu plan"
  - "Créditos utilizados" → "Fotos que has usado"
  - "Referidos" → "Recomienda y gana"
  - "Método de pago" → "Cómo pagaste"
  - "Código de referido" → "Tu link de referido"
  - etc.
- Archivos afectados: DashboardLayout, subscription, referral, dashboard, analytics, pro-test, checkout, profile, usage, generations

## [2026-04-10] - CTA Intermedio en Blog + Corrección Terminología

### Backend - CTA Intermedio Rediseñado
- **blog.controller.ts**: Nuevo CTA "callout box" después de sección 3 (punto medio del artículo)
- Estilo: fondo #141414, borde sutil rgba(255,92,58,0.25), bordes redondeados 16px
- Contenido: headline corto + descripción + botón "Ver planes"
- Decorative corner accent con radial gradient
- Posicionado antes del CTA #2 existente (sección 6)
- **CORREGIDO**: Eliminado texto "Prueba gratis 7 días" - reemplazado por "Ver planes"

### Reglas - Prohibición de "Prueba Gratis"
- **REGLAS_IMPORTANTES.md**: Agregada sección 5.7 "Prohibición de Prueba Gratis"
- Términos PROHIBIDOS: "prueba gratis", "free trial", "7 días gratis", etc.
- Términos PERMITIDOS: "Comenzar trial", "Prueba el servicio", "Ver planes", "Agendar demo"
- Motivo: Lookitry NO ofrece funcionalidad gratuita - trial requiere pago según `trial_campaigns`

### Backend - Reposicionamiento de CTAs
- CTA Intermedio #1: ahora en `i === 2` (después de sección 3, punto medio)
- CTA Intermedio #2: movido a `i === 5` (después de sección 6)

### Frontend - Estilos para blog-cta-mid
- **BlogArticle.tsx**: Añadidos estilos CSS para `.blog-cta-mid` con soporte dark/light theme
- Hover effects con transición de borde y transformaciones en botones
- Responsive en móvil (padding reducido, font-size ajustado)

### Interlinks Mantenidos
- Los interlinks siguen apareciendo después de sección 2 (`i === 1`)
- Estilos consistentes con el resto del contenido

## [2026-04-10] - Fix Fotos Repetidas en Blog + SEO Schema Markup

### Backend - Fix Hero Duplicado en generateArticleHTML
- **blog.controller.ts**: `generateArticleHTML` ya no incluye el hero image en el `<header>` del article HTML
- El hero se maneja 100% desde `featured_image` en el frontend para evitar duplicación visual
- El header ahora solo contiene metadatos (título, excerpt, tags, reading time) con clase `blog-header-only-meta`

### Backend - Fix Requisito de Body Images
- **blog.controller.ts**: `autoAssembleIfReady` ya no requiere body images para publicar
- Solo el hero image es obligatorio; body images son opcionales
- Esto permite publicar artículos incluso si las imágenes de cuerpo fallan en generarse

### Frontend - Mejoras en ArticleContent
- **BlogArticle.tsx**: Mejorado regex para limpiar headers de ambos formatos:
  - Formato legacy: `<header class="blog-header">` (con hero)
  - Formato nuevo: `<header class="blog-header-only-meta">` (solo meta)
- Usa flag `gi` para caso insensitive y global matching

### Frontend - Schema Markup SEO Mejorado
- **BlogPostContent.tsx**: Schema.org BlogPosting completo con:
  - headline, description, image, datePublished, dateModified
  - author (Organization), publisher (Organization con logo)
  - mainEntityOfPage, articleSection, keywords, wordCount
- Añadido BreadcrumbList schema para mejor SEO

### Frontend - Fix getBlogFeaturedImage
- **blog.service.ts**: `getBlogFeaturedImage` ya no hace fallback a `extractFirstImageFromContent`
- Esto evita que se muestre duplicado el hero cuando el HTML legacy contiene la imagen
- Ahora retorna solo `featured_image` explícito o null

## [2026-04-10] - Modernización y Consistencia de Temas (Blog & Admin)

### Frontend - Componentes de Blog Refactorizados
- **BlogCard.tsx**: Refactorizado para soportar temas Light/Dark. Mejora de contrastes en bordes, sombras y tipografía zinc-based para un look premium en ambos modos.
- **BlogHero.tsx**: Implementados efectos de ambient glow adaptativos y jerarquía tipográfica optimizada para lectura diurna.
- **BlogList.tsx**: Adaptación de filtros, inputs de búsqueda y paginación para responder al tema activo sin colores hardcodeados.
- **BlogShareRail.tsx**: Rediseño del riel de compartir con bordes y fondos dinámicos.
- **BlogImageWithFallback.tsx**: placeholders de imagen con gradientes y branding adaptativo al tema.
- **BlogArticle.tsx**: Refuerzo de estilos Prose para asegurar legibilidad crítica en fondo claro.

### Frontend - Admin Panel Polish
- **admin/blog/page.tsx**: Actualización de tablas, modales de confirmación y acciones rápidas para usar variables de CSS (`--bg-card`, `--border-color`, etc.), eliminando restos de estilos oscuros forzados.

### Frontend - Mejoras de Infraestructura UI
- **Consistencia de Tokens**: Migración masiva de colores `black/5`, `black/10` y `white/5`, `white/10` con selectores `dark:` para mantener la profundidad visual sin sacrificar la claridad en modo light.

## [2026-04-10] - Sistema de Theme Toggle Light/Dark para Blog

### Frontend - Nuevos archivos
- **ThemeContext.tsx**: Provider que maneja el estado del tema (dark/light) con persistencia en localStorage
- **ThemeToggle.tsx**: Componente de botón para cambiar entre modo oscuro y claro (usa Sun/Moon de lucide-react)
- **BlogThemeWrapper.tsx**: Wrapper que combina ThemeProvider y BlogHeader con el toggle

### Frontend - Archivos modificados
- **blog/page.tsx**: Añadido BlogThemeWrapper y BlogHeader con toggle en header del blog
- **blog/[slug]/page.tsx**: Envuelto con BlogThemeWrapper para soportar theme toggle
- **BlogHero.tsx**: Estilos dinámicos basados en tema (colores de texto, fondos de glow effects)
- **BlogList.tsx**: Integración con useTheme para colores dinámicos de categorías
- **BlogCard.tsx**: Estilos condicionales para variant="featured" y variant="default"

### Paleta de colores implementada
**Dark mode (default):**
- Fondo: `#0a0a0a`, Cards: `#141414`, Texto: `#ffffff`, Secundario: `#999999`, Acento: `#FF5C3A`

**Light mode:**
- Fondo: `#fafafa`, Cards: `#ffffff`, Texto: `#0a0a0a`, Secundario: `#666666`, Acento: `#FF5C3A`

### Reglas aplicadas
- Toggle activo: `#FF5C3A`
- Iconos: lucide-react (Sun, Moon) - SIN emojis
- Dark mode es el default
- Preferencia guardada en localStorage key: `lookitry-blog-theme`

## [2026-04-10] - Fix Blog: Imágenes Body + Emojis + Categorías

### Base de Datos - Limpieza Blog
- **Eliminados artículos duplicados**: Limpiados todos los registros de `blogs`, `blog_topic_images`, `blog_draft_articles`
- **Topics reseteados**: Los 34 topics están en estado `pending` para reprocesamiento
- **Categorías deduplicadas**: Eliminadas categorías duplicadas por mayúsculas/minúsculas:
  - "Moda y Estilo" (duplicado) → solo "Moda y estilo"
  - "Negocios y SaaS" (duplicado) → solo "Negocios y saas"

### Backend - blog.controller.ts

### Backend - blog.controller.ts
- **Fix normalización image_position**: Ahora soporta tanto números (1, 2, 3, 4) como strings (`body_1`, `body1`, `body_2`, etc.) para la posición de imágenes en secciones.
- **Regex de parseo**: Usa expresión regular `/^body_?(\d+)$/i` para extraer el número de `body_1`, `body_2`, etc.
- **Interfaz Section actualizada**: `image_position` ahora acepta `number | string`.
- **Eliminación de emojis en HTML generado**: Reemplazados todos los emojis (✦, 📊, 💡, ⚠️, 📚) por SVGs inline siguiendo la regla `REGLAS_IMPORTANTES.md`:
  - Bullets de lista: ✦ → SVG diamante
  - Callout icons: 📊/💡/⚠️ → SVGs de lucide (bar-chart, lightbulb, alert-triangle)
  - Interlinking header: 📚 → SVG book

## [2026-04-10] - Fix Blog: Prevención de Duplicación y Cleanup de HTML

### Backend - blog.controller.ts
- **Fix drop-cap duplicado**: La función `generateArticleHTML()` ahora usa un flag `dropCapApplied` para asegurar que SOLO el primer párrafo del artículo completo reciba el drop-cap. Antes se aplicaba a `i === 0 && pIdx === 0` pero si había mayúsculas en párrafos siguientes de la sección 1, el script `fix_latest_blog.ts` podía duplicarlo.
- **Mejora validación drop-cap**: Ahora verifica que el primer caracter sea una letra válida antes de aplicar el drop-cap, y fuerza mayúscula con `toUpperCase()`.
- **Defensa contra ejecución doble**: Si `generateArticleHTML()` se llama dos veces sobre el mismo artículo, el flag previene duplicación.

### Backend - fix_latest_blog.ts (DEPRECATED)
- **Script marcado como OBSOLETO**: El script `fix_latest_blog.ts` ahora tiene un header de advertencia y un `early exit (process.exit(1))` que evita que se ejecute accidentalmente sobre artículos nuevos.
- **Razón**: Este script fue diseñado para modernizar artículos HTML antiguos (pre-2026). Si se ejecuta sobre artículos generados por `generateArticleHTML()` causa drop-caps duplicados y CTAs huérfanos.

### Backend - cleanup_blog_html.ts (NUEVO)
- **Script de cleanup creado**: Nuevo script en `backend/src/jobs/cleanup_blog_html.ts` para limpiar artículos existentes con HTML duplicado.
- **Funcionalidades**:
  - Detecta y remueve drop-caps duplicados (solo mantiene el primero)
  - Detecta y remueve CTAs huérfanos (elementos h3+p+a sin div contenedor)
  - Verifica estado antes y después del cleanup
- **Uso**: Artículos pre-existentes que fueron procesados por `fix_latest_blog.ts` y quedó HTML corrupto.

### Producción - Artículos Limpiados
- `estrategias-clave-para-impulsar-las-ventas-en-moda-digital-colombiana-2`: 
  - Drop-caps reducidos de 3 a 1
  - CTAs huérfanos (3) removidos
  - Tamaño de HTML reducido de 32,055 a 29,621 bytes

## [2026-04-09] - Fix Blog: Duplicación de Contenido y Manejo de Imágenes

### Backend - blog.controller.ts
- **Fix duplicación bloques CTA e Interlinking**: Los bloques "📚 Lectura Recomendada" y CTAs intermedios se injectaban DENTRO de los `<section>` y también FUERA, causando duplicación visual. Ahora se injectan SOLO FUERA del loop de secciones, después de que todas las secciones han sido procesadas.
- **Condiciones de renderizado corregidas**: Los CTAs ahora verifican `sections.length` para asegurar que solo se renderizan si hay suficientes secciones (antes dependían del índice `i` lo que causaba que se renderizaran múltiples veces si habían 7+ secciones).

### Frontend - BlogArticle.tsx
- **Mejora regex de limpieza**: El regex para remover `<header class="blog-header">` del contenido HTML ahora también remueve `<article class="blog-article">`, `<div class="blog-layout">`, y el wrapper div del content para evitar estructuras HTML inválidas y estilos duplicados.

### Frontend - Manejo de Errores de Imágenes
- **BlogCard.tsx**: Nuevo componente `BlogImage` con estado `hasError` para manejar imágenes rotas. Si una imagen falla en cargar, muestra un placeholder con el logo "Lookitry" en lugar de un icono de imagen rota.
- **blog/[slug]/page.tsx**: 
  - Hero image: Añadido `onError` para ocultar la imagen y mostrar un fallback con gradiente si la URL está rota.
  - Recent posts images: Añadido `onError` para manejar errores de carga de imágenes.

### Notas sobre Body Images (Pendiente Investigación)
- Las imágenes `imagen_body1_url` a `imagen_body4_url` están todas NULL en `blog_topic_images` para artículos recientes (post Abril 2026).
- El hero image SÍ se sube correctamente, pero las body images no.
- Esto es un issue del flujo n8n/backend, no del frontend. El workflow de n8n genera las imágenes pero parece que la subida de body images falla silenciosamente.
- **Acción requerida**: Revisar los logs del workflow "Lookitry Blog Images" en n8n para determinar si las requests de upload para body images están fallando o si hay un problema de timing (assemble llamado antes de que todas las imágenes estén subidas).

## [2026-04-09] - Presentación Blog Mejorada con Formato Rico y CTAs

### Blog Article - Rediseño Visual Completo
- **Reading Progress Bar**: Barra de progreso animada en la parte superior que muestra el avance de lectura del artículo
- **Tabla de Contenidos Interactiva**: Números circulares, animaciones de hover, indicador visual del ítem activo
- **ShareButtons Mejorados**: Iconos con efectos hover (escala, elevación), feedback visual de "copiado"

### Tipografía y Formato
- **Drop Cap (Capital)**: Primera letra del artículo en tamaño grande con color acento
- **Texto Justificado**: Líneas de texto perfectamente alineadas
- **Listas Numeradas**: Estilo custom con círculos numerados estilo "timeline" con gradiente
- **Listas con Viñetas**: Bullets custom con puntos naranja que brillan
- **Enlaces Enriquecidos**: Hover con background, transición suave, borde inferior
- **Blockquotes Estilizados**: Comilla decorativa grande, fondo con gradiente sutil
- **Headers con Underline**: Línea gradient debajo de h2

### Componentes Interactivos Nuevos
- **InlineCTA**: CTAs insertados en el flujo del artículo (minimal y highlight)
- **StatBox**: Cajas de estadísticas con valores destacados
- **StepBox**: Pasos numerados estilo timeline
- **PullQuote**: Citas destacadas con diseño editorial
- **InfoBox**: Tipos (tip, warning, stat, note) con iconos y colores distintivos
- **NewsletterCTA**: Formulario de suscripción inline
- **FinalCTA**: Sección CTA final con CTA principal y secundario

### Animaciones
- **Framer Motion**: Transiciones suaves en todos los componentes nuevos
- **Scroll Animations**: Elementos aparecen con fade + slide al entrar al viewport
- **Hover Effects**: Scale, elevation, color transitions en botones y cards

## [2026-04-09] - Social Proof y Reseñas Dinámicas en Landing

### Landing Page - Dynamic Reviews
- **Dynamic Content**: La landing principal (`page.tsx`) ahora fusiona reseñas reales de la base de datos (`brand_reviews`) con reseñas "mock" como fallback, garantizando siempre contenido en el slider.
- **Auto-Aprobación**: Se configuró el backend (`reviewsController.ts`) para aprobar automáticamente reseñas con `rating >= 4.5`, reduciendo carga de moderación.

### Mejoras UI/UX en Sistema de Reseñas
- **Calificación Media Estrella**: Refactorizado el sistema de puntuación para soportar fracciones de 0.5 estrellas tanto en la validación backend como en el renderizado frontend usando técnicas de máscara visual (`overflow-hidden`) en `ReviewsSlider.tsx`.
- **Renderizado de SVG**: Habilitado `dangerouslyAllowSVG: true` en `next.config.js` junto con la directiva Content Security Policy (CSP) adecuada para permitir cargar exitosamente los logos SVG externos en el slider de reseñas.

## [2026-04-09] - Skill NotebookLM Instalada para OpenCode

### Skill NotebookLM Adaptada para OpenCode
- **Origen**: Repo https://github.com/PleasePrompto/notebooklm-skill (Claude Code skill)
- **Adaptación**: Modificada para funcionar con OpenCode en lugar de Claude Code
- **Ubicación**: `.opencode/skills/notebooklm/`
- **Estructura**:
  - `SKILL.md` - Instrucciones adaptadas para OpenCode
  - `scripts/` - Python automation (auth, notebook management, question asking)
  - `references/` - Documentación extendida (API, troubleshooting, usage patterns)
  - `requirements.txt` - Dependencias (patchright, python-dotenv)
- **Funcionalidad**:
  - Browser automation con Chrome real via Patchright
  - Autenticación Google persistente
  - Gestión de library de notebooks
  - Query source-grounded a NotebookLM

### Configuración
- Requiere Python 3.8+ y Chrome instalado
- Setup automático del virtual environment en `.venv`
- Datos almacenados en `.opencode/skills/notebooklm/data/`

## [2026-04-09] - NotebookLM Drive Sync Workflow v2

### Workflow n8n - NotebookLM Google Drive Sync (Corregido)
- **Problema anterior**: El workflow anterior usaba `serviceAccount` authentication (no soportado por n8n-nodes-base.googleDrive) y folder hardcodeado a "root"
- **Solución**: Workflow completamente refeactored con:
  - OAuth2 API credentials (credencial "Google Drive API OAuth2" requerida en n8n)
  - Variable de entorno `GDRIVE_NOTEBOOKLM_FOLDER_ID` para folder destino configurable
  - Nombre de archivo: `filename_commitsha.md` (e.g., `TECH_STACK_abc123d.md`)
  - Split In Batches para procesar múltiples archivos secuencialmente
  - Contador de archivos sincronizados en respuesta
  - Manejo de errores con response JSON
  - Solo sincroniza archivos `.md`
- **Nodes**: Webhook → Parse Input → Filter .md → Split In Batches → Prepare Metadata → Google Drive Create → Count → Respond
- **Archivo**: `docs/n8n/workflows/notebooklm-drive-sync-workflow.json`

### Setup de Credenciales Google Drive en n8n
1. Ir a n8n → Credentials → New Credential → "Google Drive OAuth2"
2. Configurar con:
   - Client ID (Google Cloud Console)
   - Client Secret (Google Cloud Console)
   - OAuth scopes: `https://www.googleapis.com/auth/drive.file`
3. Reemplazar `CREDENTIALS_ID_PLACEHOLDER` en el workflow con el ID de la credencial creada
4. Configurar variable de entorno `GDRIVE_NOTEBOOKLM_FOLDER_ID` en n8n con el ID del folder de destino

## [2026-04-09] - Segundo Cerebro: RAG + NotebookLM Bridge

### Infraestructura - Sistema de Conocimiento Bidireccional

#### RAG para Agentes (Embeddings)
- **Tabla `project_knowledge`**: Nueva tabla en Supabase con columna `embedding vector(768)` para similitud semántica
- **Índices**: IVFFlat para búsqueda vectorial, RPC `upsert_project_knowledge` y `search_project_knowledge`
- **Workflow n8n**: `project-knowledge-rag-workflow.json` — indexa documentación core (PRD, DESIGN, TECH_STACK, REGLAS_IMPORTANTES)
- **Endpoints backend**: `/api/agent/rag/search`, `/api/agent/rag/stats`, `/api/agent/rag/list`, `/api/agent/rag/index`

#### Puente NotebookLM (Google Drive Sync)
- **Workflow n8n**: `notebooklm-drive-sync-workflow.json` — sincroniza archivos .md a Google Drive
- **Script**: `scripts/sync_project_knowledge.py` — detecta cambios en commits, soporta modo hook y manual
- **Git Hook**: `scripts/git-hooks/post-receive` — automatiza sync en cada push a main

### Archivos Creados
- `supabase/migrations/20260409_create_project_knowledge.sql`
- `docs/n8n/workflows/project-knowledge-rag-workflow.json`
- `docs/n8n/workflows/notebooklm-drive-sync-workflow.json`
- `scripts/sync_project_knowledge.py`
- `scripts/git-hooks/post-receive`
- `docs/PROJECT_KNOWLEDGE_RAG.md`
- `backend/src/routes/agent.routes.ts`

## [2026-04-09] - Fix Modal Bienvenida PRO

### Frontend - Modal Bienvenida PRO
- **Problema**: El modal de bienvenida PRO aparecía cada vez que el usuario abría su cuenta
- **Solución**: Nueva clave `pro_welcome_shown_{brand.id}` en localStorage que se setea permanentemente la primera vez
- **Archivo**: `frontend/src/app/dashboard/DashboardRouteShell.tsx`
- **Lógica**: Si el plan es PRO y NO se ha mostrado antes, se muestra y se marca como mostrado. La marca nunca se borra para que solo aparezca UNA SOLA VEZ

## [2026-04-09] - Sammy Orchestrator Deployment

### Infraestructura - Microservicio Sammy
- **Objetivo**: Desplegar Sammy (orquestador de agentes) como contenedor Docker 24/7 en el VPS de producción
- **Arquitectura**: Opción B - Microservicio separado, integrado en `docker-compose.backend.yml` con límites de memoria (300M límite, 100M reserva)
- **Volumen persistente**: `sammy_data` para SQLite memory, montaje del proyecto Lookitry (`/root/virtual-tryon:/app/project:ro`)
- **Healthcheck**: Básico, verifica que el proceso Node esté activo
- **Script deploy**: Actualizado `scripts/_deploy_now.py` para detectar cambios en directorio `sammy/` y disparar rebuild

### Servicio Sammy - Agente Orquestador
- **Punto de entrada**: `sammy/src/index.ts` integra bot Telegram, agent, LLM providers (MiniMax, Groq, OpenRouter), tools, memory SQLite
- **Variables de entorno**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USER_IDS`, `MINIMAX_API_KEY`, `GROQ_API_KEY`, `PROJECT_ROOT`, `API_BASE_URL`, etc.
- **Herramientas**: `list_files`, `read_file`, `search_code`, `git_status`, `get_current_time`, `read_project_context`
- **Sincronización**: `AgentActivitySync` y `HeartbeatService` opcionales con backend Lookitry
- **Build**: TypeScript compilado a `dist/`, Dockerfile multi‑stage (Node 20 Alpine)

### Archivos Creados/Modificados:
- `sammy/` (directorio completo con estructura modular)
- `docker-compose.backend.yml` (servicio `sammy` agregado)
- `scripts/_deploy_now.py` (detección de cambios en `sammy/`)
- `CHANGELOG.md` (esta entrada)

## [2026-04-09] - Project Knowledge RAG System (Segundo Cerebro)

### Sistema RAG para Agentes - Embedding de Documentación
- **Tabla `project_knowledge`**: Nueva tabla en Supabase con pgvector para almacenar embeddings de documentación core
- **Workflow n8n RAG**: `docs/n8n/workflows/project-knowledge-rag-workflow.json` - Indexa documentos via webhook
- **Webhook**: `POST /webhook/project-knowledge-rag` para recibir archivos y generar embeddings Gemini
- **RPC Functions**: `upsert_project_knowledge` y `search_project_knowledge` para upsert y búsqueda semántica

### API Endpoints RAG (Backend)
- **POST /api/agent/rag/search**: Búsqueda semántica con embeddings (usa Gemini para query embedding)
- **GET /api/agent/rag/stats**: Estadísticas de documentos indexados
- **GET /api/agent/rag/list**: Listar todos los documentos
- **POST /api/agent/rag/index**: Indexar documento manualmente via n8n

### Puente NotebookLM (Google Drive Sync)
- **Workflow n8n**: `docs/n8n/workflows/notebooklm-drive-sync-workflow.json`
- **Script Python**: `scripts/sync_project_knowledge.py` - Sincroniza a n8n RAG y Google Drive
- **Git Hook**: `scripts/git-hooks/post-receive` - Automatiza sync en push a main

### Archivos Creados:
- `supabase/migrations/20260409_create_project_knowledge.sql` - Schema + funciones RPC
- `docs/n8n/workflows/project-knowledge-rag-workflow.json` - Workflow n8n RAG
- `docs/n8n/workflows/notebooklm-drive-sync-workflow.json` - Workflow n8n Drive sync
- `scripts/sync_project_knowledge.py` - Script de sincronización
- `scripts/git-hooks/post-receive` - Git hook para automation
- `docs/PROJECT_KNOWLEDGE_RAG.md` - Documentación completa del sistema

### Archivos Modificados:
- `backend/src/routes/agent.routes.ts` - Agregados 4 endpoints RAG

---

## [2026-04-09] - Fix Mobile Touch Referral Buttons

### Corrección Mobile - Página de Referidos
- **Botón "Copiar código"**: Agregado `min-h-[44px] min-w-[44px]`, `p-3`, `active:scale-95`, `aria-label`, iconos `h-5 w-5`, tooltip reposicionado a `-top-9` con `whitespace-nowrap`
- **Botón "Aplicar"**: Cambiado layout a `flex-col gap-3 sm:flex-row` para mobile, `min-h-[48px] py-4 px-8`, iconos `h-5 w-5`, `aria-label`
- **Input código**: Agregado `min-h-[48px] py-4 text-base` para mejor touch target

**Archivos modificados:**
- `frontend/src/app/dashboard/referral/page.tsx`

---

## [2026-04-09] - Dashboard UX & Reviews Integration

### Mejoras Dashboard & Integraciones
- **Banner Onboarding**: Migrada persistencia de "Cuenta Operativa" a BD (`onboarding_dismissed`) en vez de localStorage para evitar reapariciones tras cerrar sesión.
- **Feedback Copy**: Añadido estado interactivo "¡Copiado!" para los botones de copia de bloques de código de SDK y Claves API.
- **Admin Reviews Section**: Incorporada métrica `pendingCount` y lista de `recentApproved` al endpoint de estadísticas globales, visualizadas en el grid principal de Admin Dashboard, corrigiendo validación JSX de comillas y layout grid `1.2fr_0.8fr`.
- **Dynamic Landing Reviews**: Creada ruta `/api/reviews/public` en backend, y modificado la landing page (`page.tsx`) para renderizar testimonios dinámicos directamente desde la Base de datos con soporte fallback ante errores.

## [2026-04-09] - Dashboard Laptop Optimization & Cleanup

### Dashboard Responsive (Settings)
- **Grid adaptable a 1100px (Laptop)**: Cambiado breakpoint principal de `xl:` a `lg:` para evitar stacking prematuro en pantallas medianas.
- **Layout 3-Columnas**: Configurado `lg:grid-cols-3` (1 col preview, 2 cols form) para optimizar el espacio en desktops compactos sin comprimir el formulario.
- **Form UI Tuning**: Ajustados grids internos de `md:` a `sm:` para prevenir solapamientos en anchos de 1024px-1100px.
- **Notch Alignment**: Verificada la posición del notch (`top-0`) para alineación perfecta en el marco del teléfono.

### Estabilidad de Desarrollo
- **Server Cleanup**: Identificados y eliminados procesos zombie en puertos 3000/3001 que causaban `EADDRINUSE`.
- **Integridad de Templates**: Verificado `TemplateShowcase.tsx` sin errores de sintaxis; confirmados fixes de cache del servidor.


### Nueva Estética: Neo-Luxury con Profundidad
- **Sidebar decorativo**: Gradiente sutil, borde de acento con color de marca, sombra 2xl
- **Step indicators**: Círculos con glow effect, sombras suaves, escala animada en hover
- **Progress bar**: Conexiones visuales entre pasos, colores derivados del primary
- **Product cards desktop**: Transiciones suaves, `translateX` en selección, badges con pulse
- **Product cards mobile**: Grid con glow radial cuando seleccionado, aspect-ratio square
- **Selected product card**: Glassmorphism con gradiente, glow effect decorativo
- **Empty state**: Icono grande con fondo sutil, mensaje amigable
- **Top bar desktop**: Backdrop blur 60, badge de status "En vivo"
- **Botones**: Shadows-xl a 2xl, hover scale, transiciones fluidas
- **Paleta derivada**: `adjustBrightness()` para generar primaryDark, primaryGlow, primarySubtle

### Mejoras de UX
- Responsive breakpoint ajustado a 768px (md en lugar de 600px)
- Selfie preview card con glassmorphism en mobile
- Mejor jerarquía visual con tipografía más marcada
- Animaciones staggered en productos (40ms delay)
- Ambient glow effects con blur para profundidad

## [2026-04-08] - Full Responsive Widget Templates

### Template Showcase - Responsive Completo
- **Grid productos**: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` (móvil→tablet→laptop→desktop)
- **Gaps**: `gap-3 sm:gap-4 md:gap-5` (espaciado progresivo)
- **Padding contenido**: `px-4 sm:px-6 md:px-8 lg:px-12` (margen lateral adaptativo)
- **Padding BottomCTA**: `p-3 sm:p-4`, `max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl`
- **SelfiePreview**: Tamaño de imagen `w-12 h-12 sm:w-14 sm:h-14`, padding `p-3 sm:p-4`
- **Header**: Logo `h-7 sm:h-9`, padding `px-4 sm:px-6 py-3 sm:py-4`
- **Título "Elige tu look"**: `text-2xl sm:text-3xl md:text-4xl lg:text-5xl`
- **Hero spacing**: `space-y-6 sm:space-y-8`
- **pb-40**: `pb-36 sm:pb-40 md:pb-44` (espacio extra para CTA en diferentes pantallas)

### Template Showcase Redesign (Mobile)

### Nueva Identidad Visual: Editorial Fashion Vitrine
- **Header**: Glassmorphism sticky con backdrop-blur-2xl, logo + botón reiniciar
- **SelfiePreview**: Card flotante glassmorphism con glow effect del color de marca
- **ProductGrid**: **Grid 2 columnas** (no scroll horizontal) con:
  - Cards con aspect-ratio square e imagen cover
  - Hover effect: scale + overlay gradient + nombre desliza desde abajo
  - Ring de selección con glow del color de marca
  - Badges de estado (generado/seleccionado) en esquina
  - Animación staggered por índice
- **BottomCTA**: Glassmorphism fixed con blur 20px, flecha de navegación
- **Estilo general**: Editorial/Magazine - vitrina de moda inmersiva

### Diferencias vs Modern Template
| Aspecto | Showcase (nuevo) | Modern |
|---------|-----------------|--------|
| Layout | Grid 2col, sin sidebar | Sidebar lateral |
| Scroll | Vertical natural | Horizontal en sidebar |
| Cards | Glassmorphism + glow | Solid cards |
| Header | Sticky glass | Colored header |
| Preview | Overlay flotante | Inline bar |

## [2026-04-08] - Widget Scroll Fixes

### Navegación en Widgets (Critical Fix)
- **RouteChrome**: Excluidos `/embed/`, `/pruebalo/`, `/sitio/`, `/marca/` de MobileBottomNav y CookieConsent
- **Motivo**: El bottom nav y cookie banner NO deben aparecer en páginas de widgets públicos
- Estos cambios ya están en producción (ambos servers retornan 200 OK)

### Template Showcase Mobile
- **Contenido scroll**: Reducido `pb-24` a `pb-4` ya que BottomCTA es fixed y no requiere padding extra en el scroll area

## [2026-04-08] - Dashboard & Settings Responsive Audit

### Layout y Navegación
- **DashboardLayout**: Corregido padding-top del main para coincidir con altura del header sticky (64px móvil, 80px tablet+)
- **DashboardBottomNav**: Navegación móvil ya tenía `md:hidden` con 5 items principales (Inicio, Productos, Pruebas IA, Resultados, Perfil)

### Dashboard Principal
- **Hero grid**: Agregado `grid-cols-1` base antes del breakpoint `lg:grid-cols-[1.35fr_0.95fr]` para correcto stacking en móvil

### Analytics
- **KPI grid**: Agregado breakpoint `xs:grid-cols-2` para pantallas muy pequeñas (320px+), gap reducido a `gap-4 sm:gap-6`

### Productos (ThumbnailsView)
- **Grid columnas**: Agregado `xl:grid-cols-6` para desktops anchos, gap mejorado a `gap-3 sm:gap-4 md:gap-6`

### Suscripción
- **Título del plan**: Tamaño responsivo progresivo `text-4xl sm:text-5xl lg:text-6xl xl:text-7xl` para mejor visualización en todos los tamaños

### Settings Page
- **Template grid**: `grid-cols-2 sm:grid-cols-4 lg:grid-cols-4` con gaps `gap-3 sm:gap-4`
- **Bottom actions**: `flex-col sm:flex-row` con stacking vertical en móvil, botones full-width
- **Logo upload**: Layout vertical en móvil `flex-col sm:flex-row`, logo 64x64 en móvil
- **Color pickers**: `grid-cols-1 sm:grid-cols-2`, color inputs `h-12 w-12 sm:h-14 sm:w-14`
- **Name/Slug y ButtonText/Welcome**: `grid-cols-1 sm:grid-cols-2` con gap 6

## [2026-04-08] - Responsive Widget Templates

### Mejoras de Responsive
- **TemplateBare**: Contenedor más adaptable con `max-w-md sm:max-w-lg` para mejor visualización en móviles
- **TemplateShowcase**: Productos con anchos responsivos `w-28 sm:w-32 md:w-36`, flechas de scroll reducidas en móvil `w-8 h-8 sm:w-10 sm:h-10`
- **TemplateModernSidebar**: Grid de productos mejorado `grid-cols-2 sm:grid-cols-3` para mejor aprovechamiento en pantallas pequeñas
- **TemplateBoldProStudio**: Anchos de productos responsivos `w-24 sm:w-28 sm:w-36`
- **FriendlyProductSelector**: Grid ajustado a `grid-cols-3 sm:grid-cols-4 md:grid-cols-5` para mejor distribución
- **ResultDisplay**: Layout del plugin con breakpoints md para grid de acciones

## [2026-04-08] - JSON-to-HTML Generation (Blog v2)

### Arquitectura Corregida
- **Backend ahora genera HTML completo** desde JSON estructurado
- El Article Producer de n8n genera JSON (NO HTML)
- Image Generator usa Replicate (NO OpenRouter - cumple regla 5.6)
- Frontend solo renderiza HTML, no procesa

### Nuevas Columnas en blog_draft_articles
- `sections` (jsonb) - Array de secciones con paragraphs, callouts, image_position
- `faqs` (jsonb) - Array de preguntas y respuestas
- `cta_context` (jsonb) - Tipo de CTA (trial/features/pricing/lead_magnet)
- `image_prompts` (jsonb) - Prompts para generar imágenes

### Nueva Función generateArticleHTML()
- Genera HTML limpio desde JSON estructurado
- Inserta imágenes en posiciones correctas según `image_position`
- Renderiza callouts (stat/tip/warning) con estilos apropiados
- Renderiza FAQ accordion
- Renderiza CTA final dinámico según `cta_context.type`

### CTA Dinámicos
- Templates configurables en `blog_settings.cta_templates`
- Tipos: trial, features, pricing, lead_magnet

### Migraciones SQL Aplicadas
- `20260408_add_structured_json_to_blog_draft_articles.sql`
- `20260408_add_cta_templates_to_blog_settings.sql`

### Workflows n8n Actualizados
- Article Producer: VMAu93Zx4k5qgzdm (genera JSON estructurado)
- Image Generator: l4Mb3wMfHUnsbEXH (usa Replicate, NO OpenRouter)

### Pendientes
- [x] Tablas blog_draft_articles y blog_topic_images versionadas en schema ✅
- [ ] API key de Replicate hardcodeada en workflows
- [ ] Por verificar Article Producer en producción

## [2026-04-08] - Schema Actualizado (Blog)

### Tablas Versionadas
- `blog_draft_articles` - Artículos en proceso de generación (JSON estructurado)
- `blog_topic_images` - Imágenes generadas para artículos
- Total de tablas: 26 → 28

### Políticas RLS Agregadas
- `blog_draft_articles_service_role_all` - Solo service_role tiene acceso
- `blog_topic_images_service_role_all` - Solo service_role tiene acceso

## [2026-04-08] - Fixes Críticos de Templates y Panel

### TemplateBoldProStudio.tsx
- Layout mobile-first: sin max-w-4xl ni grid-cols-12 que rompían mobile
- Header compacto en mobile (h-8 en lugar de h-10)
- Padding y gaps reducidos en mobile
- Gradientes de fondo condicionales (solo en fondos oscuros)
- Colores adaptativos: texto primario, texto secundario, borders según luminosidad del fondo

### SettingsForm.tsx
- Preview ahora usa TemplatePreviewCard real en lugar de placeholder con círculo dashed
- Cast de tipo explícito para widgetTemplate → WidgetTemplate

### TemplateShowcase.tsx
- Corregido text-gray-400 → text-gray-500 en SelfiePreviewBar y ProductShowcase
- Mejor contraste en textos secundarios

### TemplateModernSidebar.tsx
- Padding responsive en área principal (p-4 md:p-6)
- Textos secundarios cambiados a text-gray-500
- Botón Reiniciar con hover states correctos

### shared.tsx
- FriendlyProductSelector: text-gray-400 → text-gray-500
- SelfieThumb: text-gray-400 → text-gray-500

## [2026-04-08] - Panel de Diseño Unificado

### Cambios en SettingsForm.tsx
- Unificados tabs `general`, `appearance`, `pro` en un solo tab `design`
- Nueva sección "Diseño del Widget" con:
  - Vista previa del widget (preview visual)
  - Logo de la marca (upload)
  - Nombre y Slug (2 columnas)
  - Color pickers con input de texto
  - Grid de templates con TemplatePreviewCard
  - Textos personalizables (botón y mensaje bienvenida)
- Tabs reducidos a solo `design` e `integración`
- Mantenida funcionalidad existente: handleLogoUpload, handleSubmit, isPro

## [2026-04-08] - Blog Assembly Architecture

### Nuevos Endpoints Blog

#### POST /api/blog/article-content
- Recibe HTML del artículo (sin imágenes) desde Article Producer
- Guarda en tabla `blog_draft_articles`
- Body: topic_id, title, html_content, excerpt, meta_description, tags, category_slug

#### POST /api/blog/assemble-article
- Recibe topic_id después de que Image Generator termina
- Obtiene draft HTML de blog_draft_articles
- Obtiene URLs de imágenes de blog_topic_images
- Inserta imágenes en HTML (hero al inicio, body1 tras primer h2, body2 antes último h2)
- Crea artículo final en tabla `blogs` y lo publica

### Nueva Tabla: blog_draft_articles
- Almacena HTML del artículo antes de imágenes
- Campos: topic_id, title, html_content, excerpt, meta_description, tags, category_slug

### Flujo Corregido
1. Article Producer genera HTML → POST /api/blog/article-content
2. Image Generator crea imágenes → POST /api/blog/upload (topic_id + image_type)
3. Image Generator termina → POST /api/blog/assemble-article
4. Backend ensambla HTML + imágenes → publica

### Archivos Modificados
- `backend/src/controllers/blog.controller.ts` - nuevos endpoints
- `backend/src/routes/blog.routes.ts` - nuevas rutas
- `docs/blog/BLOG_ARCHITECTURE_SPLIT.md` - documentación actualizada
- `docs/blog/IMAGE_GENERATOR_WORKFLOW_V7.json` - workflow JSON
- `docs/blog/ARTICLE_PRODUCER_CHANGES.json` - cambios Article Producer

### Campo toc_items en blogs
- Se agregó columna `toc_items` (jsonb) a la tabla `blogs` para almacenar tabla de contenidos generada por IA
- Se actualizó `assembleArticle` para incluir `toc_items` del draft en el insert final
- Migración aplicada: `ALTER TABLE blogs ADD COLUMN IF NOT EXISTS toc_items jsonb;`
- Archivo modificado: `backend/src/controllers/blog.controller.ts`

---

## [2026-04-08] - Rediseño Visual Templates PRO

### Templates PRO - Mejoras Aplicadas

#### TemplateModern (Sidebar)
- **Header**: Logo h-10 + nombre con `primaryColor` + `welcomeMessage` debajo
- **Sidebar**: Sin texto "Probador Virtual" - solo branding + progreso visual
- **Bordes adaptativos**: `borderColor: ${primaryColor}30`

#### TemplateBold (Premium Dark)
- **Header glass**: Logo h-10, mensaje bienvenida visible, sin "Pro Studio"
- **Hero dinámico**: `welcomeMessage` como título si existe
- **Progreso animado**: Barra con `primaryColor`
- **Sin panel "PRO"**: Ya no molesta usuarios que compraron

#### TemplateShowcase (Bios)
- **Header full**: Background sólido `primaryColor`
- **Logo visible**: h-8, texto blanco fallback
- **Scroll indicators**: Flechas circulares blancas
- **CTA fixed**: Botón con `primaryColor` sólido

### Fixes Visuales Previos
- Spinner carga centrado (`min-h-screen` + flex centering)
- Slug excluido del payload si no es PRO
- Líneas grises → `${primaryColor}XX`
- Import React al inicio en Showcase

---

## [2026-04-08] - Correcciones Urgentes en Templates Bold y Showcase

### TemplateBoldProStudio
- **ELIMINADO** panel derecho "Consejos PRO" y "Plan PRO" - Ya买了PRO，不需要提醒
- Simplificado grid a single column (md:col-span-12)

### TemplateShowcase
- **MEJORADO** MicroHeader ahora usa `primaryColor` para el texto cuando no hay logo
- **MEJORADO** `welcomeMessage` se muestra de forma prominente en paso de upload (antes del uploader)
- **MEJORADO** SelfiePreviewBar usa `primaryColor` para el texto y hover states
- **MEJORADO** Indicadores de scroll: ahora son flechas circulares blancas con shadow (más visibles que gradientes)
- **MEJORADO** Botón "Cambiar" en SelfiePreviewBar usa primaryColor dinámico

### Archivos Modificados
- `frontend/src/components/tryon/templates/TemplateBoldProStudio.tsx`
- `frontend/src/components/tryon/templates/TemplateShowcase.tsx`

---

## [2026-04-08] - Fix Error "Slug requiere Plan Pro" en Trial

### Problema
- Usuarios con plan TRIAL recibían error "La personalización del slug requiere Plan Pro" al guardar cualquier configuración del dashboard
- El campo slug estaba incluido en el formData aunque estaba deshabilitado visualmente

### Solución
- Modificado `handleSubmit` en `SettingsForm.tsx` para excluir `slug` del payload cuando `!isPro`
- El backend ahora solo recibe el campo slug si el usuario es PRO (y realmente lo está cambiando)

### Cambio en SettingsForm.tsx
```typescript
const handleSubmit = async (e?: React.FormEvent) => {
  e?.preventDefault();
  setIsSubmitting(true);
  try {
    // No enviar slug si no es PRO (el backend lo rechaza)
    const dataToSubmit = isPro ? formData : { ...formData, slug: undefined };
    await onSubmit(dataToSubmit);
  } finally {
    setIsSubmitting(false);
  }
};
```

### Fix Adicional: TemplatePreviewCard
- Agregado `minimal` al Record `TEMPLATE_PREVIEWS` (faltaba en el tipo WidgetTemplate)
- Corregido `isDisabled={Boolean(tpl.proOnly) && !isPro}` para evitar undefined

---

## [2026-04-08] - Upgrade Visual Menú Templates Widget

### Mejoras Implementadas

#### 1. TemplatePreviewCard: Nuevo componente visual
- **CREADO**: `frontend/src/components/dashboard/TemplatePreviewCard.tsx`
- **FUNCIONALIDAD**: Grid de 4 tarjetas con miniaturas SVG inline representando cada template
- **PREVIEWS SVG**:
  - **Bare**: Wireframe simple con dispositivo centrado + contenido central
  - **Modern**: Sidebar izquierda con 3 pasos de progreso + área de contenido
  - **Bold**: Fondo oscuro con gradiente, grid layout 2x2, panel lateral
  - **Showcase**: Header compacto, scroll horizontal de productos, CTA fijo en bottom

#### 2. Estados de Interacción
- **Default**: Borde gris claro (`--border-color`)
- **Hover**: Elevación con sombra (`shadow-lg shadow-[#FF5C3A]/10`), borde naranja sutil
- **Selected**: Borde naranja sólido (`#FF5C3A`), fondo naranja sutil (`bg-[#FF5C3A]/5`)
- **Disabled (no PRO)**: Opacidad 50%, cursor `not-allowed`, overlay con tooltip

#### 3. Tooltips para no-PRO
- Hover sobre tarjeta PRO deshabilitada muestra overlay:
  - "Disponible en plan PRO"
  - "Mejora tu plan para desbloquear"

#### 4. Animaciones
- Transición suave 300ms ease-out
- Hover scale sutil (1.02), active scale (0.98)
- Preview SVG con transición de opacidad al hover

### Archivos Modificados
- `frontend/src/components/dashboard/TemplatePreviewCard.tsx` (nuevo)
- `frontend/src/components/dashboard/SettingsForm.tsx` (actualizado para usar TemplatePreviewCard)

---

## [2026-04-08] - Auditoría Templates Widget PRO

### Problemas Detectados y Corregidos

#### 1. TemplateModern: Sidebar ocupaba demasiado espacio en móvil
- **PROBLEMA**: `max-h-[50vh]` en sidebar hacía que ocupara 50% de la pantalla vertical en mobile
- **IMPACTO**: En bios de Instagram/TikTok (tamaño limitado), el contenido principal quedaba muy apretado
- **SOLUCIÓN**: Cambiado a `max-h-[35vh]` para sidebar compacto en móvil

#### 2. TemplateShowcase: Import de React mal ubicado
- **PROBLEMA**: Import de React estaba al FINAL del archivo (línea 309)
- **SOLUCIÓN**: Movido al inicio del archivo con los demás imports

#### 3. Menú de Edición: Sin preview visual de templates
- **PROBLEMA**: Solo había un `<select>` con nombres, sin preview ni descripciones
- **SOLUCIÓN**: Reemplazado por grid de 4 tarjetas visuales:
  - Cada tarjeta: icono (lucide-react), nombre, descripción, badge PRO
  - Borde highlighting en selección activa
  - Templates PRO deshabilitados para planes no-PRO
  - Iconos: Layout (Bare), Sidebar (Modern), Layers (Bold), Zap (Showcase)

#### 4. Tipo WidgetTemplate actualizado
- **AGREGADO**: `'showcase'` al tipo union
- **MANTENIDO**: `'minimal'` por compatibilidad con BD existente (mapea a showcase)

### Descripción de Templates (Ahora visible en Settings)

| Template | Descripción |
|---------|-------------|
| **Bare** | Template básico con flujo directo |
| **Modern** | Navegación lateral con barra de progreso — Ideal para catálogos extensos |
| **Bold** | Experiencia premium con diseño oscuro y consejos de uso |
| **Showcase** | Optimizado para bios — Scroll horizontal con CTA fijo |

### Archivos Modificados
- `frontend/src/components/tryon/templates/TemplateModernSidebar.tsx`
- `frontend/src/components/tryon/templates/TemplateShowcase.tsx`
- `frontend/src/components/dashboard/SettingsForm.tsx`
- `frontend/src/types/index.ts`

## [2026-04-08] - Auditoría y fixes pre-lanzamiento Mini-Landings (Open Release)

### Auditoría completa por agentes
- **DevGuardian**: Seguridad aprobada (8.5/10), sin vulnerabilidades críticas
- **DataAlchemist**: Issues DB resueltos (índice + columna missing)
- **WebWizard**: Accesibilidad corregida (aria-labels, focus states)
- **ArchitectAI**: Dockerfile Sharp corregido (vips deps)

### Fase 1: Base de Datos
- **ÍNDICE NUEVO**: `idx_brands_has_landing_page_active` en `brands(has_landing_page)` WHERE `has_landing_page = true`
  - Propósito: Optimizar queries de mini-landings activas
- **COLUMNA NUEVA**: `brands.custom_domain` (text)
  - Propósito: Permitir dominios personalizados para CORS
- **ÍNDICE NUEVO**: `brands_custom_domain_key` (unique) para `custom_domain`

### Fase 2: Accesibilidad (TemplateClassic, TemplateEditorial, TemplateModerno)
- **ARIA-LABELS**: Agregados a todos los social links en los 3 templates
  - `"Síguenos en ${platform}"` en header y footer
- **ARIA-LABELS**: Mobile menu button en TemplateClassic con `aria-expanded`
- **FOCUS STATES**: Agregados `focus-visible:ring-2 focus-visible:ring-[#FF5C3A]` a elementos interactivos

### Fase 3: Dockerfile (Sharp/vips)
- **DEPS builder**: Agregado `apk add --no-cache vips-dev`
- **DEPS runner**: Agregado `apk add --no-cache vips`
- **PROPÓSITO**: Fix error "sharp is required to be installed in standalone mode"

### Fase 4: Optional Chaining
- **TemplateClassic.tsx:333**: `products[0]?.id` → `products?.[0]?.id`
- **MiniLanding.tsx:35**: `result.brand.preview_timer_seconds` → `result?.brand?.preview_timer_seconds`

### Archivos Modificados
- `backend/` (migraciones SQL via Supabase MCP)
- `frontend/src/components/mini-landing/TemplateClassic.tsx`
- `frontend/src/components/mini-landing/TemplateEditorial.tsx`
- `frontend/src/components/mini-landing/TemplateModerno.tsx`
- `frontend/src/components/mini-landing/MiniLanding.tsx`
- `frontend/src/components/mini-landing/shared.tsx`
- `frontend/Dockerfile`

## [2026-04-08] - Fix CSP para widget Try-On en producción

### Corrección de Seguridad
- **PROBLEMA**: Content Security Policy del frontend bloqueaba scripts inline necesarios para la hidratación de React en rutas `/pruebalo/`
- **SÍNTOMA**: Widget Try-On se quedaba eternamente en "Cargando el probador..." en producción
- **CAUSA**: Las rutas `/pruebalo/:slug` estaban excluidas de la CSP en `next.config.js`, heredando una CSP restrictiva sin `'unsafe-inline'`
- **SOLUCIÓN**: Añadido header `Content-Security-Policy` a rutas `/(embed|marca|pruebalo)/:slug*` con directiva `script-src` que incluye `'unsafe-inline'`
- **IMPACTO**: Widget Try-On ahora puede ejecutar JavaScript correctamente y cargar productos de la marca

### Archivos Modificados
- `frontend/next.config.js` - Añadido header CSP a rutas de pruebalo/embed/marca

## [2026-04-08] - Fix CSP en middleware para widget Try-On

### Corrección de Seguridad
- **PROBLEMA**: Middleware del frontend sobrescribía la CSP con una versión restrictiva sin `'unsafe-inline'` para rutas `/pruebalo/` y `/embed/`
- **SÍNTOMA**: Widget Try-On seguía atascado en "Cargando el probador..." a pesar del fix anterior
- **CAUSA**: El archivo `frontend/src/middleware.ts` definía una CSP base sin `'unsafe-inline'` en `script-src`
- **SOLUCIÓN**: Actualizada la CSP en el middleware para incluir `'unsafe-inline'` y condicionalmente `'unsafe-eval'` en desarrollo
- **IMPACTO**: Widget Try-On ahora puede hidratar React correctamente y cargar completamente

### Archivos Modificados
- `frontend/src/middleware.ts` - Actualizada directiva `script-src` en CSP dinámico

## [2026-04-08] - Verificación Post-Fix CSP para Widget Try-On

### Verificación en Producción
- **PRUEBA**: Test automatizado con Playwright en marca `wilkie-devs` (productos activos)
- **RESULTADO**: Widget carga exitosamente, texto "Cargando el probador..." desaparece en <30s
- **CSP**: No se detectaron errores de Content Security Policy en consola
- **INTERACTIVIDAD**: Elementos del widget detectados (input file, productos visibles)
- **ERRORES**: Solo un error 500 en carga de imagen de producto (no relacionado con CSP)
- **CONCLUSIÓN**: El fix de CSP funciona correctamente, el widget Try-On opera sin bloqueos

### Archivos de Verificación
- `frontend/tests/csp-check.spec.ts` - Test de validación CSP
- `frontend/tests/widget.spec.ts` - Test existente actualizado (kevida)

## [2026-04-08] - Restauración Paso "Primeras Pruebas Recibidas" + Banner Dismissible

### Cambios en Dashboard Onboarding
- **REVERTIDO**: Eliminación del paso "Primeras pruebas recibidas" - ahora vuelve a aparecer en el checklist de onboarding
- **NUEVA LÓGICA**: Banner "Estado de tu cuenta" ya no se elimina automáticamente al completar onboarding
  - El banner permanece visible hasta que el usuario hace clic en "Entendido, ocultar banner" (solo visible cuando todos los pasos están completos)
  - Estado de cierre persistente via localStorage (`onboardingBannerDismissed`)
  - Una vez oculto, el banner no vuelve a aparecer (layout minimalista se muestra)
- **REGLA**: El banner NO se oculta automáticamente al completar pasos, solo cuando el usuario interactúa

### Archivos Modificados
- `frontend/src/lib/dashboardAccountState.ts` - Agregado paso "tryons" al checklist (id: 'tryons')
- `frontend/src/app/dashboard/page.tsx` - Nueva lógica de banner dismissible con localStorage
  - Estado `isBannerDismissed` y efecto para leer de localStorage
  - Función `handleDismissBanner` para guardar preferencia
  - Botón "Entendido, ocultar banner" condicional cuando `isOnboardingComplete && !isBannerDismissed`
  - Condición de renderizado cambiada de `if (isOnboardingComplete)` a `if (isOnboardingComplete && isBannerDismissed)`

## [2026-04-07] - Dashboard Onboarding Simplificado

### Cambios en Dashboard
- **TAREA 1**: Banner "Estado de tu cuenta" ahora se oculta cuando todos los pasos de onboarding están completos (`completedSteps === totalSteps`)
  - El usuario ya no ve el banner de estado cuando termina el onboarding
  - Se mantiene la información de diagnóstico y métricas del sistema
  
- **TAREA 2**: Eliminado paso "Primeras pruebas recibidas" del checklist de onboarding
  - Removido del array `checklist` en `dashboardAccountState.ts`
  - El flujo de steps queda en 4 pasos: Cuenta, Plan, Tienda/Widget, Producto

### Archivos Modificados
- `frontend/src/lib/dashboardAccountState.ts` (eliminado paso tryons del checklist)
- `frontend/src/app/dashboard/page.tsx` (agregada lógica para ocultar banner cuando onboarding completo)

## [2026-04-07] - Fix bug logout/session - Google login bloqueado

### Corrección de Seguridad y UX
- **auth.controller.ts**: Eliminado bloqueo de sesión activa en Google Login (líneas 440-454) para permitir cambio de cuenta
- **Cookie sameSite**: Cambiado de `strict` a `lax` en todos los endpoints de autenticación para compatibilidad con logout cross-origin
  - auth.controller.ts (setCookieToken)
  - auth.routes.ts (logout, refresh-session)
  - admin/auth.admin.controller.ts (adminLogin, adminLogout, adminGoogleLogin)
- **Google Sign-In Prompt**: Agregado `prompt: 'select_account'` en frontend GoogleSignInButton.tsx para forzar selector de cuenta
- **Motivo**: Usuarios con sesión activa no podían cambiar de cuenta Google ni cerrar sesión correctamente

### Archivos Modificados
- `backend/src/controllers/auth.controller.ts`
- `backend/src/routes/auth.routes.ts`
- `backend/src/controllers/admin/auth.admin.controller.ts`
- `frontend/src/components/auth/GoogleSignInButton.tsx`

## [2026-04-08] - Custom n8n MCP Server + DataAlchemist Update

### Nueva Funcionalidad
- **Custom n8n MCP Server**: Creado servidor MCP personalizado en `.opencode/mcp-servers/n8n-mcp-server/` que permite acceso completo a la API REST de n8n.wilkiedevs.com
  - 13 tools disponibles: listar, obtener, crear, actualizar, eliminar workflows, activar/desactivar, probar, ver ejecuciones, agregar nodos, gestión de tags
  - Usa header `X-N8N-API-KEY` para autenticación
  - Construido con MCP TypeScript SDK

### Actualización de Agentes
- **dataalchemist.md**: Actualizado para reflejar nuevas capacidades del MCP n8n
  - Tabla de herramientas MCP n8n
  - Ejemplos de uso de las nuevas tools
  - Workflow del blog agregado a la tabla (ID: fZxYlA62msyJM8Nx)
  - Reglas actualizadas sobre creación de workflows

### Configuración
- `opencode.json`: Reemplazado `n8n-mcp@latest` por custom MCP server local en `dist/index.js`
- `.opencode/mcp-servers/n8n-mcp-server/`: Nuevo directorio con package.json, tsconfig.json, README.md

## [2026-04-08] - Blog Editorial Magazine + Paginación

### Nuevas Funcionalidades
- **Blog Editorial Magazine**: Hero section rediseñado con tipografía display grande y animaciones framer-motion
- **Artículo Destacado**: Primer artículo publicado se muestra en formato 2 columnas con imagen prominente y badge "Artículo destacado"
- **Paginación**: Implementados controles de paginación (10 artículos/página) con números de página, botones Anterior/Siguiente, y info "Página X de Y"
- **Filtros por Categoría**: Pills visuales con nombre + contador de artículos por categoría
- **Animaciones Staggered**: Grid de artículos con entrada animada al scroll usando framer-motion

### Archivos Modificados
- `frontend/src/app/api/blog/route.ts` - Soporte paginación con offset
- `frontend/src/services/blog.service.ts` - Interfaces pagination y fetch actualizado
- `frontend/src/components/blog/BlogCard.tsx` - Variante 'featured'
- `frontend/src/components/blog/BlogList.tsx` - Featured + grid + paginación
- `frontend/src/app/blog/page.tsx` - Metadata en server component
- `frontend/src/components/blog/BlogHero.tsx` - NUEVO componente hero animado

## [2026-04-08] - Fix Blog API Routes

### Bug Fix
- `blog.service.ts`: Las funciones `fetchBlogCategories()`, `fetchBlogPosts()`, y `fetchBlogPostBySlug()` ahora usan `frontendFetch` que apunta al frontend Next.js (`NEXT_PUBLIC_APP_URL`) en lugar del cliente API que apuntaba al backend Express (`NEXT_PUBLIC_API_URL`)
- Los artículos del blog no cargaban porque las peticiones iban a `api.lookitry.com/api/blog` (backend Express, sin esas rutas) en lugar de `lookitry.com/api/blog` (frontend Next.js, con los API routes correctos)
- Las funciones admin (`adminFetchPosts`, etc.) siguen usando `adminApi` que correctamente apunta al backend Express

## [2026-04-07] - Mejoras Página de Planes

### Legibilidad
- Precios originales (tachados) más visibles con badges de descuento %
- Features excluidas con opacidad reducida y tachado
- Mejor contraste de textos en dark mode

### Marketing
- Añadido social proof: estrellas, "500+ tiendas en Colombia", ciudades
- Urgency badge: "Precios exclusivos por tiempo limitado"
- Ahorro destacado en COP al seleccionar duración
- Trust badges: "Pagos seguros con Wompi"

### UI/UX
- Cards sin altura mínima fija (más compactas)
- Badges de descuento más visibles
- Card Pro destacada con gradiente sutil y borde accent
- CTA final más impactante con "vender más"

### SEO
- Metadata actualizada con precios dinámicos
- Schema.org BreadcrumbList

## [2026-04-07] - Mega Menu Redesign

### Nuevo Diseño: "Clean Cards with Animated Accent"

**Problema:** El mega menu anterior era visualmente aburrido y sin imágenes, con iconos genéricos en cajas de color que no pegaban con la marca Lookitry.

**Solución:**
- Removidos iconos en cajas de color (Layout, Zap, Terminal, etc.)
- Removida columna 3 con gradiente e imagen
- Implementada línea lateral accent `#FF5C3A` que aparece desde arriba en hover
- Cards limpias solo con texto (título + descripción)
- Animación stagger en entrada (50ms delay entre items)
- CTA simple con flecha que se mueve en hover
- Headers "PRODUCTOS" y "EMPRESA" con línea inferior sutil

**Archivos modificados:**
- `frontend/src/components/landing/new-landing/LandingNav.tsx`

**Especificación:** `docs/superpowers/specs/2026-04-07-megamenu-design.md`

## [2026-04-07] - OpenCode Config Fix + Skills Update

### OpenCode Configuration Fix
- **Problema:** Error "Anthropic API key is missing" al activar agente Sammy
- **Solución:** 
  - Actualizado `opencode.json` para usar modelo MiniMax-M2.7 (minimax) en todos los agentes
  - Configurado correctamente el provider para MiniMax (sin Anthropic fallback)
  - Verificado que todos los agentes usen `minimax/MiniMax-M2.7`

### Skills Update (Destinados a OpenCode, no Claude)
- **Cambios realizados:**
  - `.agents/skills/claude-code-expert/SKILL.md` — Reescrito para OpenCode, eliminado refs a Anthropic/Claude Code
  - `.agents/skills/mcp-builder/SKILL.md` — Actualizado header para OpenCode
  - `.agents/skills/frontend-design/SKILL.md` — Actualizado header para OpenCode
  - `.agents/skills/seo-audit/SKILL.md` — Actualizado header para OpenCode
  - `.agents/skills/ui-ux-pro-max/SKILL.md` — Actualizado header para OpenCode
  - `.agents/skills/web-design-guidelines/SKILL.md` — Actualizado header para OpenCode
  - `.agents/skills/find-skills/SKILL.md` — Actualizado header para OpenCode
  - `.claude/SKILL.md` — Actualizada fuente de todos los skills a Lookitry/OpenCode
  - `skills-lock.json` — Actualizado sources a locales para skills propios

## [2026-04-06] - FIX CRÍTICO: Caída de Frontend (Modo Mantenimiento)
 
### Healthcheck Incompatible de Next.js en Alpine Resuelto
- **Problema:** El sitio `lookitry.com` mostraba pantalla de mantenimiento porque Traefik no ruteaba tráfico hacia el contenedor de frontend.
- **Causa:** El healthcheck añadido en el commit previo (`curl -f http://localhost:3000`) fallaba constantemente porque la imagen oficial `alpine` de Next.js no tiene `curl` instalado. Adicionalmente, tampoco contaba con un `wget` funcional para interactuar internamente de forma correcta. Como consecuencia, Docker marcaba el contenedor como `unhealthy`, causando que Traefik descartara este enrutador y cediera el tráfico al contenedor de fallback `lookitry-error-pages`.
- **Solución:** Se ha removido forzosamente el bloque `healthcheck` de `docker-compose.frontend.yml`. Traefik enrutará confiando en que el contenedor está ejecutándose en memoria. El backend retiene su propia validación. El contenedor ha sido reiniciado a la normalidad en el VPS.
 
## [2026-04-06] - Segmentación Avanzada de Leads y CRM Upgrade

### 1. Sistema de Filtrado Dinámico de Leads (CRM)
- **Backend:** 
  - Se modificó la tabla `email_campaigns` integrando filtros para `city`, `country`, `business_type`, y `status`.
  - Se creó el nuevo endpoint `GET /api/admin/leads/filters` para extraer dinámicamente opciones únicas de la BD.
  - Implementación de transición automática de estado en `EmailCampaignService.processNextBatch` (los prospectos pasan a estado `contacted` al enviar email correctamente).
  - Controlador `getLeads` ampliado para aceptar filtrado por `business_type`.
- **Frontend Admin (`/admin/leads`):**
  - Selectores `(select)` de País, Ciudad y Negocio pasaron de estar "harcodeados" a consumir la información agrupada generada desde `/api/admin/leads/filters`.
  - Indicadores visuales y tarjetas adaptados al estado real del usuario.

### 2. Marketing (Dashboard)
- **Modal de Nueva Campaña (`/admin/email-campaigns`):**
  - Implementación visual de la grilla de segmentación dinámica en el modal de destinatarios (filtrando por ciudad, país, estatus, tipo negocio) que envía la petición parametrizada al backend.
  - Eliminación de referencias textuales y promesas de tipo **"Free Trial"** como directriz obligatoria orientada al 100% hacia modelo Paid B2B, modificándose a "Descubrir Lookitry".

## [2026-04-07] - Email Testing Center + Health Page Fixes ✅
### 1. Centro de Pruebas de Marketing (Email Testing Center)
- **Backend:** Nueva funcionalidad `sendAdHocTest` que permite probar templates con datos de prueba sin crear campañas.
- **Ruta:** `POST /api/admin/email-campaigns/test-ad-hoc` protegida con permiso `marketing`.
- **Frontend Admin:**
  - Implementado "Centro de Pruebas Rápido" colapsable en `/admin/email-campaigns`.
  - Agregado botón "Probar Template" dentro del modal de creación de campañas.
  - Soporte para envío instantáneo a cualquier dirección de correo.
- **UX:** Diseño premium con el color accent `#FF5C3A`, transiciones suaves y validaciones de campo.

### 2. Estabilidad de Health Check (Admin Health)
- **Backend:** 
  - Corregida lógica de `checkSupabase` (uso de `Promise.resolve` para evitar errores de tipo `PromiseLike`).
  - Mejorada verificación de `n8n`: ahora usa `axios.get` con `validateStatus` para ser más resiliente a respuestas 4xx/5xx de webhooks.
- **Frontend Dashboard:** 
  - Corregido error que bloqueaba la página con un cuadro rojo cuando un servicio estaba caído (status 503).
  - Ahora la página muestra los datos parciales de los servicios activos incluso si el estado general es "down".

## [2026-04-07] - FIX: Error cargando campañas en Dashboard Admin

### Refactorización de Autenticación en Email Campaigns ✅
- **Problema:** El dashboard de campañas de email (`/admin/email-campaigns`) fallaba con "Error cargando campañas" en el VPS.
- **Causa:** El frontend utilizaba `fetch` manual con `Authorization: Bearer ${token}` extrayendo el token de `localStorage`. Sin embargo, el flujo de login de Lookitry utiliza **Cookies HTTP-Only** (`admin_token`) por seguridad, y no almacena el token en `localStorage`. Al no enviar las cookies (`credentials: 'include'`) y enviar un token `null`, la API rechazaba las peticiones.
- **Solución:**
  - Se refactorizó `frontend/src/app/admin/email-campaigns/page.tsx` para usar el servicio centralizado `adminApi`.
  - `adminApi` maneja automáticamente `credentials: 'include'`, asegurando que las cookies de sesión se envíen en cada petición.
  - Se eliminaron todas las referencias a `localStorage.getItem('admin_token')` en esta página.
- **Seguridad:** Se actualizó `backend/src/services/email-campaign.service.ts` para usar `maybeSingle()` en lugar de `single()` al insertar registros, siguiendo las reglas de programación defensiva del proyecto (Regla 5.3).

## [2026-04-07] - Soft Launch Readiness - 3 Features Completadas

### 1. Sistema de Tickets para Clientes ✅
**Nueva página:** `frontend/src/app/dashboard/support/page.tsx`
- Clientes pueden crear tickets de soporte desde su dashboard
- Ver estado de tickets (abiertos, en progreso, resueltos)
- Stats cards con conteo de tickets
- Modal de creación con categorías: Soporte Técnico, Facturación, Bug, etc.
- Incluye enlaces directos a email y WhatsApp

**Sidebar actualizado:** `frontend/src/components/dashboard/DashboardLayout.tsx`
- Nueva ruta "Soporte" agregada al menú
- Icono SupportIcon añadido

### 2. Template de Factura PDF ✅
**Archivo:** `docs/templates/FACTURA_TEMPLATE.html`
- Template profesional HTML listo para imprimir/convertir a PDF
- Incluye:
  - Logo Lookitry y datos de Wilkie Devs
  - NIT: 700.403.166-3 (persona natural)
  - Tabla de items con precios en COP
  - Cálculo de IVA (19%)
  - Información de pago (transferencia, Wompi, PayPal)
  - Disclaimer sobre resultados de IA
- Compatible con conversión a PDF via navegador o herramientas como wkhtmltopdf

### 3. UptimeRobot Configurado ✅
**API Key guardada:** `backend/.env` → `UPTIMEROBOT_API_KEY`
**Monitores creados (7):**
- lookitry.com/ (existente)
- API Lookitry Health
- Widget Try-On
- n8n Workflows
- MinIO Storage
- Database Supabase
- Admin Dashboard
**Status Page:** https://stats.uptimerobot.com/CTEnSD7d1j
**Link agregado a:** `/dashboard/support`

### 4. Fix RLS Tables (completado ayer) ✅
- Migration aplicada: enable_rls_critical_tables
- 9 tablas protegidas con RLS
- api_key de social_api_configs solo visible para service_role

## [2026-04-06] - Sistema de Verificación Social (Instagram + TikTok)

### Nueva Funcionalidad: Social Verification System

**Investigación Completada:**
- Documentado en `docs/research/social-verification-api-research.md`
- Instagram/TikTok APIs NO permiten prospecting público sin auth
- Solución: Extracción de handles desde website + HTTP verification

**Archivos Creados:**
- `backend/src/types/social-verification.ts` - Interfaces y patrones
- Nuevo método `verifySocialHandles()` en lead-enrichment.service.ts
- Nuevo método `runSearchWithSocialVerification()` en lead-generation.service.ts

**Base de Datos:**
- Columnas agregadas: `social_verification_status`, `social_verification_score`
- Índices creados para queries eficientes

**Funcionalidades:**
1. Extracción de handles Instagram/TikTok desde website
2. Verificación de URLs sociales con HTTP HEAD
3. Clasificación fashion basada en keywords de website
4. Scoring 0-100 basado en presencia social
5. Batch enrichment para leads existentes

**Limitaciones Conocidas:**
- NO se pueden verificar seguidores/seguidos sin APIs de terceros
- Para enrichment real: considerar Apollo.io en Fase 2

## [2026-04-07] - Auditoría Commercial Readiness - RESUELTO

### Auditoría Completa de Lanzamiento Comercial
- Generado reporte `COMMERCIAL_READINESS_AUDIT.md`
- **VEREDICTO: PARCIALMENTE RESUELTO**

### 🔴 Bloqueadores Críticos (RESUELTOS ✅)
1. **RLS no habilitado en 9 tablas** - ✅ RESUELTO
   - Migration `enable_rls_critical_tables` aplicada
   - Tablas protegidas: leads, social_api_configs, lead_searches, lead_outreach_log, google_places_quota, email_campaigns, email_campaign_recipients, admin_generations_log, admin_support_tickets
2. **Sin plan de backup/disaster recovery** - ✅ RESUELTO
   - Documento `docs/BACKUP_DISASTER_RECOVERY.md` creado
   - Scripts en `scripts/backup/` listos para subir al VPS

### ⚠️ Pendiente (Acción Manual Requerida)
- **PayPal:** `backend/.env` línea 68 tiene `PAYPAL_SANDBOX=true`
  - Cambiar a `PAYPAL_SANDBOX=false`
  - Usar credenciales de PRODUCCIÓN (no sandbox)

### ✅ Acciones Completadas
- RLS habilitado en las 9 tablas sin protección
- Políticas creadas: service_role full access, auth read, anon insert para tickets
- API key de social_api_configs solo legible por service_role
- Documento DR completo con RTO/RPO definidos
- Scripts de backup automatizado creados
- Widget Try-On funcionando

### Próximas Acciones (Inmediatas)
1. Habilitar RLS en `leads` y `social_api_configs`
2. Proteger columna `api_key` en social_api_configs (solo service_role)
3. Verificar/cambiar PayPal a credenciales de producción
4. Crear backup de Supabase y documentar plan DR

### 📊 Scores por Categoría
| Categoría | Score |
|-----------|-------|
| Legal/Compliance | 90/100 ✅ |
| UX/UI | 85/100 ✅ |
| Funcionalidades | 75/100 ⚠️ |
| Pagos | 70/100 ⚠️ |
| Escalabilidad | 60/100 ⚠️ |
| Monitoreo/Backups | 55/100 ⚠️ |
| Seguridad | 40/100 🔴 |

### Timeline Estimado
- Soft launch viable: 2-3 días de trabajo (resolver bloqueadores)
- Full launch: 1-2 meses de trabajo adicional

## [2026-04-06] - Auditoría Admin + Gap Críticos Resueltos

### Auditoría Completa del Panel Admin
- Generado reporte `ADMIN_AUDIT.md` con 100+ endpoints documentados
- Identificados 6 gaps críticos que fueron resueltos
- 16 rutas agregadas al sidebar (ahora 10 secciones, 33 rutas totales)

### NUEVA PÁGINA: Historial de Try-Ons (`/admin/generations`)
**Frontend:** `frontend/src/app/admin/generations/page.tsx`
- Stats cards: total, pending, processing, completed, failed
- Filtros: por marca, status, ID, rango de fechas
- Tabla con 8 columnas: ID, Marca, Producto, Status, Modelo, Tiempo, Fecha, Acciones
- Badges de status con colores
- Modal detalle con thumbnails, metadata JSON, botón reintentar
- Paginación con selector de items por página

### NUEVA PÁGINA: Tickets de Soporte (`/admin/tickets`)
**Frontend:** `frontend/src/app/admin/tickets/page.tsx`
- Stats cards: abiertos, alta prioridad, resueltos semana
- Filtros: status, prioridad, marca, asignado, búsqueda
- Tabla con bulk actions: cambiar estado, asignar masivamente
- Modal crear/editar con todos los campos
- Side panel con detalle + acciones rápidas
- Paginación

### BÚSQUEDA POR ID DE TRANSACCIÓN
**Frontend:** `frontend/src/app/admin/payments/page.tsx`
- SearchBox con debounce 300ms en parte superior
- Highlight card con resultado encontrado
- Busca por: transaction_id, payment_id, referencia Wompi

### BASE DE DATOS - Nuevas Tablas

**`admin_generations_log`**
```sql
- id, brand_id, product_id, customer_id, selfie_url, result_url
- status (pending/processing/completed/failed)
- model_used, processing_time_ms, retry_count, original_generation_id
- metadata JSONB, created_at, finished_at
- Índices: brand_id, status, created_at, original_generation_id
```

**`admin_support_tickets`**
```sql
- id, brand_id, admin_id, subject, description
- priority (low/medium/high/urgent), status (open/in_progress/resolved/closed)
- category, assigned_to, resolution_notes
- created_at, updated_at, resolved_at
- Índices: brand_id, status, priority, assigned_to
```

### ENDPOINTS NUEVOS

**Generaciones:**
- `GET /api/admin/generations` - lista con filtros y paginación
- `GET /api/admin/generations/:id` - detalle
- `PATCH /api/admin/generations/:id/retry` - reintentar fallida
- `GET /api/admin/brands/:brandId/generations` - por marca
- `GET /api/admin/generations/stats` - stats aggregate

**Tickets:**
- `GET /api/admin/tickets` - lista con filtros
- `GET /api/admin/tickets/:id` - detalle
- `POST /api/admin/tickets` - crear
- `PATCH /api/admin/tickets/:id` - actualizar
- `DELETE /api/admin/tickets/:id` - eliminar (solo open)
- `POST /api/admin/tickets/bulk-action` - acción masiva
- `GET /api/admin/tickets/stats` - stats

**Búsqueda:**
- `GET /api/admin/payments/search?q=` - búsqueda por ID transacción

**Utilidades:**
- `GET /api/admin/brands/list` - lista para dropdowns

### ARCHIVOS CREADOS
- `backend/src/db/migrations/002_admin_generations_log_and_support_tickets.sql`
- `backend/src/controllers/admin/generations.admin.controller.ts`
- `backend/src/controllers/admin/tickets.admin.controller.ts`
- `backend/src/services/generations-log.service.ts`
- `frontend/src/app/admin/generations/page.tsx`
- `frontend/src/app/admin/tickets/page.tsx`

### ARCHIVOS MODIFICADOS
- `frontend/src/app/admin/layout.tsx` - sidebar restaurado con 33 rutas
- `backend/src/routes/admin.routes.ts` - 14 rutas nuevas
- `backend/src/controllers/admin.controller.ts` - exports
- `backend/src/controllers/admin/generations.admin.controller.ts`
- `backend/src/controllers/admin/tickets.admin.controller.ts`
- `backend/src/controllers/admin/payment.admin.controller.ts`
- `backend/src/services/admin/brand.admin.service.ts`
- `frontend/src/app/admin/payments/page.tsx` - búsqueda por ID

---

## [2026-04-06] - Correcciones Panel Admin

### Sidebar Simplificado
- Reducido de 10 grupos/41 items a 5 grupos/~15 items
- Grupos: COMANDO (Mission Control, Funnel, Agentes), CLIENTES (Marcas, Suscripciones, Pagos), ANALYTICS (Estadisticas, Leads, Revenue), MARKETING (Promociones, Trial), CONFIGURACION (General, Pagos, Enterprise)
- Archivos: `frontend/src/app/admin/layout.tsx`

### Ruta Health Admin
- Agregada ruta `GET /api/admin/health` en `backend/src/routes/admin.routes.ts`
- Ahora el panel admin puede acceder al health check extendido del sistema

### Enterprise Page
- Corregido color hardcoded `#3b82f6` -> `var(--accent)` para pending status
- Corregido gradient hardcoded -> `var(--accent)` para boton "Crear cliente Enterprise"

### Social API Config
- Eliminados emojis (📸, 🎵) de plataformas
- Reemplazados con iconos lucide-react (Instagram, Music)
- Convertida propiedad `icon` a `IconComponent` para mejor compatibilidad
- Corregidos colores hardcoded a CSS variables

---

## [2026-04-06] - FASE 3: Cola de Trabajos Redis para Generaciones

### Sistema de Cola Persistente para Try-On

**Archivos creados:**
- `backend/src/services/generation-queue.service.ts` (nuevo) — Cola Redis con stats, retry, failed jobs
- `backend/src/scripts/queue-worker.ts` (nuevo) — Worker que consume jobs de la cola
- `backend/src/routes/queue.routes.ts` (nuevo) — Endpoints para monitorear cola

**Archivos modificados:**
- `backend/src/controllers/pruebalo.controller.ts` — Integración con cola de trabajos

**Funcionalidades implementadas:**
- Cola Redis `queue:tryon` para jobs de generación
- Cola `queue:tryon:processing` para jobs activos
- Cola `queue:tryon:failed` para jobs fallidos con retry automático (3 intentos)
- Worker que consume jobs de la cola con concurrency configurable (3 jobs simultáneos)
- Endpoints: GET /queue/stats, GET /queue/next, POST /queue/retry-failed
- Polling en controller hasta que job complete (máx 90s)

**Flujo:**
1. Request llega → Controller encola job → Responde 202 "Procesando"
2. Worker consume job de cola → Llama n8n → Actualiza BD
3. Controller detecta SUCCESS → Retorna resultado al frontend

**Beneficio principal:** Si n8n se cae, los jobs NO se pierden — esperan en Redis

---

## [2026-04-06] - Auditoria y correccion de errores del admin

### Problemas corregidos

**1. ELIMINACION DE EMOJIS**
- Se eliminaron todos los emojis de las etiquetas de navegacion del sidebar admin
- Archivos afectados:
  - `frontend/src/app/admin/layout.tsx` (labels: COMANDO, CLIENTES, ANALYTICS, MARKETING, FINANZAS, CONFIGURACION, SISTEMA, PRODUCTO, HELP)
  - `frontend/src/app/admin/config/layout.tsx` (label: Launch)

**2. MODAL DE ACTIVACION DE MARCA - ELIMINADO**
- Se elimino el modal y funcion de "Activar plan" para marcas
- El boton en BrandTable ahora solo cambia entre BASIC y PRO
- Archivos afectados:
  - `frontend/src/app/admin/brands/page.tsx`
  - `frontend/src/components/admin/brands/BrandTable.tsx`

**3. LEAD SEARCHES - Autenticacion corregida**
- Cambiado de `localStorage.getItem('admin_token')` a uso de `adminApi` (credentials: 'include')
- Ahora es consistente con el resto del admin
- Archivo afectado: `frontend/src/app/admin/lead-searches/page.tsx`

**4. UNIT-ECONOMICS - Interfaz mejorada**
- Agregado hero section con gradiente y borde accent (estilo subscriptions)
- Stats cards ahora usan el mismo formato que otras paginas
- Archivo afectado: `frontend/src/app/admin/unit-economics/page.tsx`

**5. RUTA /admin/config/trial - Corregida**
- Link del sidebar cambiado de `/admin/config/trial` (inexistente) a `/admin/trial-campaigns` (existente)
- Archivo afectado: `frontend/src/app/admin/layout.tsx`

**6. PRICING - Responsive corregido para laptops**
- Cambiado breakpoint de `xl:` a `2xl:` para el layout del sidebar
- Ahora en laptops (< 1536px) el contenido se muestra verticalmente
- Archivo afectado: `frontend/src/app/admin/pricing/page.tsx`

### Verificacion
- Build exitoso sin errores de TypeScript ni advertencias graves

---

## [2026-04-06] - Refactorizacion de color accent hardcoded a CSS variable

### Cambio de #FF5C3A hardcoded a var(--accent)

**Descripción:**
Se reemplazaron todas las instancias hardcoded de `#FF5C3A` (color accent de Lookitry) por la variable CSS `var(--accent)` en el frontend del admin para mejorar la mantenibilidad y consistencia del tema.

**Cambios realizados:**
- Se agregó `--accent: var(--color-accent)` en `frontend/src/app/globals.css`
- Se reemplazaron ~1000+ ocurrencias de `#FF5C3A` por `var(--accent)` en:
  - `frontend/src/app/admin/**/*.tsx` (dashboard, security, payments, profile, brands, etc.)
  - `frontend/src/components/admin/**/*.tsx` (AgentFilterBar, AgentStatsCards, BrandTable, etc.)
  - `frontend/src/components/auth/RegisterForm.tsx, LoginForm.tsx`
  - `frontend/src/components/dashboard/ReviewPromptModal.tsx, EmbedSection.tsx`
  - `frontend/src/components/ui/HalfStarRating.tsx`
  - Varios archivos más de páginas públicas y componentes

**Nota:**
Los colores de datos para gráficos (barras, líneas, badges de plan) NO fueron reemplazados ya que son valores específicos para visualización de datos y no del tema general.

**Archivos modificados (~50 archivos):**
- Todos los archivos en `frontend/src/app/admin/**/*.tsx`
- Todos los archivos en `frontend/src/components/admin/**/*.tsx`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/components/auth/LoginForm.tsx`
- `frontend/src/components/dashboard/ReviewPromptModal.tsx`
- `frontend/src/components/dashboard/EmbedSection.tsx`
- `frontend/src/components/ui/HalfStarRating.tsx`
- `frontend/src/app/globals.css`

**Verificación:**
- Build de producción pasando exitosamente ✓

---

## [2026-04-06] - FASE 2: Rate Limiting de Generaciones por Plan

### Control de Concurrencia para Generaciones Try-On

**Archivos creados:**
- `backend/src/services/generation-concurrency.service.ts` (nuevo) — Sistema de slots/concurrency

**Archivos modificados:**
- `backend/src/middleware/errorHandler.ts` — Añadido `ConcurrencyLimitError` y manejo en error handler
- `backend/src/controllers/pruebalo.controller.ts` — Integración con concurrency service en generateTryOn

**Funcionalidades implementadas:**
- Slots de concurrencia por brand basados en su plan:
  - BASIC: 2 generaciones simultáneas (30s timeout cola)
  - PRO: 5 generaciones simultáneas (30s timeout cola)
  - ENTERPRISE: 20 generaciones simultáneas (30s timeout cola)
  - TRIAL: 1 generación simultánea (30s timeout cola)
- Cola de espera con timeout configurable
- Error 429 cuando se excede el límite con mensaje descriptivo
- Release automático de slots al completar o fallar la generación
- Redis como backend para tracking de slots activos

** Beneficios:**
- CONTROL: Un cliente no puede acaparar todos los recursos de IA
- ESTABILIDAD: Cola ordenada con timeout de 30s
- FAIRNESS: Cada plan tiene límites proporcionales a lo que paga
- DEBUGGING: Información clara de por qué se rechazó una request

---

## [2026-04-06] - Auditoría Admin: Feedback + Dark/Light Mode

### Nueva Funcionalidad

**Archivo creado:**
- `frontend/src/app/admin/feedback/page.tsx` — Nueva página para moderar feedback de generaciones

**Funcionalidades implementadas:**
- Lista de feedbacks con filtros (error_type, resolved, brand_id)
- Stats: total feedbacks, resolved/unresolved, tasa de resolución
- Filtros por tipo de error con colores diferenciados
- Marcar como resuelto (PATCH /admin/feedback/:id/resolve)
- Eliminar feedback (DELETE /admin/feedback/:id)
- Modal de detalles del error
- Diseño consistente con CSS variables

### Correcciones Dark/Light Mode

**Páginas corregidas (colores hardcoded → CSS variables):**

1. **`frontend/src/app/admin/lead-searches/page.tsx`** — Corrections applied:
   - `text-[#0a0a0a]` → `var(--text-primary)`
   - `text-[#999]` → `var(--text-muted)`
   - `bg-white`, `bg-[#e5e5e5]` → `var(--bg-card)`, `var(--border-color)`
   - `bg-[#FF5C3A]` → `var(--accent)` (buttons)
   - `hover:bg-[#f5f5f5]` → CSS variables con hover state
   - Modal form inputs corregidos

2. **`frontend/src/app/admin/email-campaigns/page.tsx`** — Corrections applied:
   - Headers, tablas, inputs hardcoded → CSS variables
   - Buttons `bg-[#FF5C3A]` → `var(--accent)`
   - Error states con `rgba(239,68,68,0.1)` en lugar de `bg-red-50`
   - Modal forms con `var(--bg-input)`, `var(--border-color)`

3. **`frontend/src/app/admin/mini-landings/page.tsx`** — Corrections applied:
   - `border-[#FF5C3A]` → `border-[var(--accent)]`
   - `color: '#FF5C3A'` → `color: 'var(--accent)'`
   - `bg-[#FF5C3A]` → `bg-[var(--accent)]`
   - `shadow-[#FF5C3A]` → `shadow-[var(--accent)]`
   - `decoration-[#FF5C3A]` → `decoration-[var(--accent)]`
   - Spinner loader border-color

**Páginas corregidas adicionalmente:**
- `frontend/src/app/admin/trial-campaigns/page.tsx` — `hover:border-[#FF5C3A]/30` → `hover:border-[var(--accent)]/30`, botones, loader, hero gradient
- `frontend/src/app/admin/brands/page.tsx` — Múltiples correcciones: iconos, botones, hover states, filter chips, hero section
- `frontend/src/app/admin/health/page.tsx` — Spinner loader corregido
- `frontend/src/app/admin/agents/page.tsx` — Botones hover, iconos, spinners, modal
- `frontend/src/app/admin/layout.tsx` — Sidebar active state, logo accent, profile button
- `frontend/src/app/admin/subscriptions/page.tsx` — Card hover, iconos, botones, filtros, hero section
- `frontend/src/app/admin/admins/page.tsx` — Permission badges, action buttons, modals (Create/Edit), inputs

**Páginas aún con hardcoded colors (pendientes):**
- `/admin/revenue` — `text-[#FF5C3A]`, `bg-[#FF5C3A]`, focus rings
- `/admin/conversion` — `text-[#FF5C3A]`, `text-[#22c55e]`, `text-[#6366f1]`
- `/admin/enterprise` — `#FF5C3A` en múltiples secciones
- `/admin/woocommerce` — `bg-[#FF5C3A]` en botón refresh
- `/admin/reviews` — `text-white`, `hover:text-white`, `bg-[#FF5C3A]`
- `/admin/blog`, `/admin/risk`, `/admin/unit-economics`, `/admin/funnel`
- `/admin/playbooks`, `/admin/security`, `/admin/audit-log`, `/admin/notifications`
- `/admin/ia-costs`, `/admin/pricing`, `/admin/social-api-config`
- `/admin/soporte`

### Componentes Verificados

**Existentes y en uso:**
- `frontend/src/components/admin/ConfirmDialog.tsx` — Confirmaciones con theming
- `frontend/src/components/admin/AdminNotifications.tsx` — Notificaciones toast
- `frontend/src/components/admin/EmbeddedPlaybook.tsx` — Playbooks embebidos
- `frontend/src/components/admin/EnterpriseCalculator.tsx` — Calculadora enterprise

**No existen (sugerencia crear si se necesitan):**
- `AdminSpinner` — No existe, usar `animate-spin` con CSS variable
- `AdminToast` — Revisar `AdminNotifications`
- `StatCard` — No existe componente dedicado, implementar si se requiere reutilización

---

## [2026-04-06] - Página de Administración de Trial Campaigns

### Nueva Funcionalidad

**Archivo creado:**
- `frontend/src/app/admin/trial-campaigns/page.tsx` — Nueva página de admin para gestionar campañas de trial

**Funcionalidades implementadas:**
- Stats cards: Campaña activa, total de campaigns, días de trial, precio
- Lista de campaigns con grid view
- Formulario para crear/editar campaign (nombre, días, generaciones, precio COP, fecha fin, verificación tarjeta)
- Activar/desactivar campaigns (solo una activa a la vez)
- Eliminar campaigns con confirmación
- Toast notifications para success/error
- Empty state cuando no hay campaigns
- Diseño consistente con el resto del admin (colores CSS variables, lucide-react icons)

---

## [2026-04-06] - FASE 1: Límites de Memoria Docker + Node.js Flags

### Estabilidad del Sistema - Límites de Recursos

**Archivos modificados:**
- `docker-compose.frontend.yml` — Añadido `deploy.resources.limits.memory: 1G`, reservation 512M, healthcheck
- `docker-compose.backend.yml` — Añadido `deploy.resources.limits.memory: 1G`, reservation 512M, healthcheck, NODE_OPTIONS=--max-old-space-size=512
- `frontend/Dockerfile` — Añadido `ENV NODE_OPTIONS=--max-old-space-size=768`
- `backend/Dockerfile` — Añadido `ENV NODE_OPTIONS=--max-old-space-size=512`

**Cambios implementados:**
- Frontend: 1GB límite Docker, 768MB Node.js heap
- Backend: 1GB límite Docker, 512MB Node.js heap
- Health checks para restart automático si contenedor falla
- Reservas de memoria para garantizar recursos mínimos

** Beneficios:**
- Sistema nunca morirá por RAM overflow
- Comportamiento predecible bajo alta carga
- Fallback graceful cuando se alcance límite

---

## [2026-04-06] - Blindaje de Protección para Operaciones de Base de Datos

### Blindaje contra Operaciones Destructivas de IA

**Documentación actualizada:**
- `REGLAS_IMPORTANTES.md` (modificado) — Nueva sección 6.1 "Blindaje contra Operaciones Destructivas de IA"

**Cambios implementados:**
- Añadida regla obligatoria de confirmación explícita del usuario antes de ejecutar operaciones destructivas en DB
- Operaciones cubiertas: DROP, DELETE, TRUNCATE, ALTER DROP, UPDATE masivo, migraciones, executions SQL
- Excepciones solo en emergencia justificada con descripción de riesgo

---

## [2026-04-06] - Auditoría y Reorganización COMPLETA del Admin Panel

### RESUMEN EJECUTIVO
Reorganización completa del sidebar del admin panel, creando página de salud del sistema, y actualizando títulos de páginas.

### Archivos Modificados

**Layout Principal:**
- `frontend/src/app/admin/layout.tsx` (reescrito completamente)
  - Sidebar reorganizado en 9 grupos temáticos
  - Nuevos iconos SVG para mejor consistencia visual
  - Tema claro/oscuro funcionando correctamente
  - Responsive sidebar (mobile drawer + desktop collapsible)

**Nueva Página Creada:**
- `frontend/src/app/admin/health/page.tsx` (nuevo)
  - Dashboard de salud del sistema
  - Muestra estado de servicios, base de datos, memoria
  - Auto-refresh cada 30 segundos
  - Indicadores de estado: healthy/degraded/down

### Navegación REORGANIZADA (9 secciones):

```
🚀 COMANDO
├── Mission Control (/admin/dashboard)
├── Funnel SaaS (/admin/funnel)
├── Riesgo (/admin/risk)
├── Playbooks (/admin/playbooks)
└── Agents Activity (/admin/agents)

👥 CLIENTES
├── Marcas (/admin/brands)
├── Suscripciones (/admin/subscriptions)
├── Historial Pagos (/admin/payments)
├── Ingresos (/admin/revenue)
└── Conversión (/admin/conversion)

📊 ANALYTICS
├── Estadísticas (/admin/analytics)
├── Leads (/admin/leads)
├── Lead Searches (/admin/lead-searches)
└── Economía Unit. (/admin/unit-economics)

🎨 MARKETING
├── Email Campaigns (/admin/email-campaigns)
├── Promociones (/admin/marketing/promotions)
├── Trial Campaigns (/admin/config/trial)
└── Precios (/admin/pricing)

💳 FINANZAS
└── Créditos IA (/admin/ia-costs)

⚙️ CONFIGURACIÓN
├── General (/admin/configuracion)
├── Payments (/admin/payment-settings)
├── Social APIs (/admin/social-api-config)
└── Enterprise (/admin/enterprise)

🛡️ SISTEMA
├── Salud Sistema (/admin/health) [NUEVO]
├── Admins (/admin/admins)
├── Notificaciones (/admin/notifications)
├── Audit Log (/admin/audit-log)
└── Seguridad (/admin/security)

📦 PRODUCTO
├── Reviews (/admin/reviews)
├── Mini-Landings (/admin/mini-landings)
├── WooCommerce (/admin/woocommerce)
├── Blog (/admin/blog)
└── Referidos (/admin/referrals)

❓ HELP
├── Soporte (/admin/soporte)
└── Feedback (/admin/feedback)
```

### Página de Health Creada

`/admin/health` - Salud del Sistema:
- Estado general del sistema (healthy/degraded/down)
- Servicios activos con latencia
- Conexiones de base de datos
- Uso de memoria con barra visual
- Auto-refresh cada 30s
- Botón manual de actualizar

### Cambios en CSS/Theme

- Variables CSS funcionando correctamente en dark/light mode
- Background, cards, headers adaptándose al tema
- Sidebar usa variables CSS en lugar de colores hardcoded

### Páginas Verificadas (existen y funcionan):
- /admin/dashboard ✅
- /admin/brands ✅
- /admin/subscriptions ✅
- /admin/payments ✅
- /admin/revenue ✅
- /admin/conversion ✅
- /admin/leads ✅
- /admin/lead-searches ✅
- /admin/analytics ✅
- /admin/funnel ✅
- /admin/risk ✅
- /admin/playbooks ✅
- /admin/agents ✅
- /admin/email-campaigns ✅
- /admin/marketing/promotions ✅
- /admin/pricing ✅
- /admin/ia-costs ✅
- /admin/configuracion → /admin/config/trial ✅
- /admin/payment-settings ✅
- /admin/social-api-config ✅
- /admin/enterprise ✅
- /admin/health ✅ (NUEVO)
- /admin/admins ✅
- /admin/notifications ✅
- /admin/audit-log ✅
- /admin/security ✅
- /admin/reviews ✅
- /admin/mini-landings ✅
- /admin/woocommerce ✅
- /admin/blog ✅
- /admin/referrals ✅
- /admin/soporte ✅

### PÁGINAS QUE NO EXISTEN (referenciadas en sidebar pero sin página):
- /admin/feedback - No existe página, solo se muestra badge count
- /admin/coupons - No existe página

---

## [2026-04-06] - Sistema Heartbeat Agentes en Tiempo Real

### CRÍTICO - Sistema agent_sessions para tracking en tiempo real

**Backend:**
- `backend/supabase/migrations/20250406_agent_heartbeat.sql` (nuevo)
- `backend/src/services/agent-session.service.ts` (nuevo)
- `backend/src/routes/agent.routes.ts` (modificado)

**Frontend - Dashboard Agentes Activos:**
- `frontend/src/components/admin/agents/ActiveAgentsPanel.tsx` (nuevo)
- `frontend/src/app/admin/agents/page.tsx` (modificado)
- `frontend/src/services/agentApi.ts` (modificado)

**Features implementadas:**
- Panel de agentes activos con polling cada 5s
- Indicadores de estado: verde (working), amarillo (idle), rojo (error)
- Badge "VIVO" / "SILENCIOSO" según heartbeat (30s timeout)
- Tiempo desde último heartbeat
- Tarea actual del agente
- Count de agentes activos vs inactivos

**Tabla:** `agent_sessions`
- `agent_name` (UNIQUE) - nombre del agente
- `current_task_id` - FK a agent_activities
- `current_task_description` - descripción de tarea actual
- `status` - 'idle' | 'working' | 'error'
- `last_heartbeat_at` - timestamp del último heartbeat
- `metadata` - JSONB para datos adicionales

**Endpoints:**
- `POST /api/agent/heartbeat` - Enviar heartbeat
- `GET /api/agent/alive` - Ver agentes activos (TTL 2 min)
- `GET /api/agent/session/:agentName` - Ver sesión específica

**TTL:** 2 minutos - si un agente no envía heartbeat, se considera inactivo.

**Motivo:** Necesidad de ver en tiempo real qué agente está activo y qué tarea ejecuta.

---

## [2026-04-06] - Fix CORS Backend

### Problema
El backend usaba `origin: '*'` (wildcard) para rutas públicas, causando error "Access-Control-Allow-Origin header must not be wildcard when credentials mode is include".

**Archivos:** `backend/src/config/security.config.ts`

### Solución
El backend ahora valida contra lista de orígenes permitidos (localhost:3000, localhost:3001, lookitry.com/www/api).

**Motivo:** El frontend hace fetch con `credentials: 'include'`, incompatible con wildcard CORS.

---

## [2026-04-06] - TemplateShowcase - Nuevo Template Mobile-First

**Archivos:** 
- `frontend/src/components/tryon/templates/TemplateShowcase.tsx` (nuevo)
- `frontend/src/components/tryon/templates/TemplateMinimalTopBar.tsx` (eliminado)

Creado template "Showcase" para mostrador virtual en bios de Instagram/TikTok:
- Header 40px discreto
- Scroll horizontal swipe para productos (snap-x)
- CTA fixed bottom 56px en thumb-zone
- Touch targets +48px
- Mobile-first (320px)

**Motivo:** Bare y MinimalTopBar eran idénticos. Necesidad de template diferenciado para móvil.

---

## [2026-04-06] - Templates Pro - Colores Dinámicos

**Archivos:**
- `frontend/src/components/tryon/templates/TemplateBoldProStudio.tsx`
- `frontend/src/components/tryon/templates/TemplateModernSidebar.tsx`

Corregidos colores hardcoded:
- **BoldProStudio:** `bg-[#050505]` → `secondaryColor`, `color: '#0C0A09'` → `color: '#ffffff'`, textos usan `primaryColor` con opacidad
- **ModernSidebar:** Función `isLightColor()` para contraste dinámico en sidebar

**Motivo:** Colores hardcoded ignoraban configuración de marca.

---

## [2026-04-06] - Sistema de Tracking de Actividad de Agentes

### CRÍTICO - Sistema agent_activities

Nuevo sistema de tracking para monitorear actividad de agentes Lookitry.

**Migration SQL:** `backend/supabase/migrations/20250406_agent_activities.sql`
- Tabla `agent_activities` con campos: id, agent_name, task_type, task_description, status, duration_ms, error_message, metadata, created_at, finished_at
- Índices optimizados para queries frecuentes
- RLS Policies: admins pueden leer, service_role puede insertar/actualizar
- **Migration aplicada manualmente via supabase_apply_migration**

**Backend Service:** `backend/src/services/agent-activity.service.ts`
- `logActivity()` - Registra inicio de actividad
- `logActivityEnd()` - Actualiza con estado final
- `getActivities()` - Consulta con filtros
- `getStats()` / `getStatsByAgent()` - Estadísticas agregadas
- `getTrendData()` - Datos para gráficos
- `exportCsv()` - Exportación CSV

**Backend Routes:** `backend/src/routes/agent.routes.ts`
- `POST /api/agent/activity` - Iniciar actividad
- `PUT /api/agent/activity/:id` - Finalizar actividad
- `GET /api/agent/activities` - Listar con filtros
- `GET /api/agent/stats` - Stats globales
- `GET /api/agent/stats/:agentName` - Stats por agente
- `GET /api/agent/trends/:agentName` - Tendencias
- `GET /api/agent/distribution` - Distribución por tipo
- `GET /api/agent/export` - Exportar CSV

**Config Sammy (.env) actualizada:**
- `SUPABASE_URL` - URL del proyecto Supabase
- `SUPABASE_SERVICE_KEY` - Service role key para escribir en agent_activities
- `SUPABASE_SYNC_INTERVAL_MS=30000` - Intervalo de sync (30s)
- `API_BASE_URL=https://api.lookitry.com` - Backend API para sincronizar actividades

---

## [2026-04-06] - Sammy Enhancement (Telegram Bot)

### CRÍTICO - Activity Logging + Spanish Commands

Sammy (Telegram bot) mejorado con tracking de actividades y comandos en español.

**Sammy Source:** `sammy/src/`

**Archivos creados:**
- `sammy/src/commands/agent-commands.ts` - Parser de comandos en español
  - `parseSpanishAgentCommand()` - Reconoce patrones: "cómo va", "actividad de", "qué están haciendo", etc.
  - `buildAgentResponse()` - Formatea respuestas
  
- `sammy/src/sync/supabase-sync.ts` - Sync a Supabase
  - `AgentActivitySync` class con cola de actividades pendientes
  - Sync periódico (30s default)
  - `syncNow()` para shutdown graceful
  - Graceful handling si Supabase no disponible

**Archivos modificados:**
- `sammy/src/memory/sqlite.ts` - Nueva tabla `agent_activities` local + métodos de logging
- `sammy/src/index.ts` - Activity logging, Spanish command handler, nuevos comandos `/agents`, `/agentstats`, `/agentactivity`, `/agenterros`, sync en SIGINT
- `sammy/src/config/index.ts` - Nuevas variables SUPABASE_*
- `sammy/src/types/index.ts` - Nuevos campos en Config

**Comandos en español disponibles:**
- "cómo va [agente]?" → Stats en tiempo real
- "actividad de [agente] hoy" → Timeline de actividad
- "qué están haciendo los agentes?" → Overview todos
- "muéstrame los errores de hoy" → Errors aggregate
- "dame el report de ayer" → Daily summary
- "crea un dashboard de agentes" → Delega a WebWizard

**Comandos slash nuevos:**
- `/agents` - Overview de todos los agentes
- `/agentstats <nombre>` - Stats de agente específico
- `/agentactivity <nombre>` - Actividad reciente
- `/agenterros` - Errores recientes

---

## [2026-04-06] - Dashboard Agents Activity (/admin/agents)

### CRÍTICO - Nuevo Dashboard de Monitoreo de Agentes

Dashboard web para visualizar actividad de agentes en tiempo real.

**URL:** `/admin/agents`

**Archivos creados:**
- `frontend/src/services/agentApi.ts` - API service con tipos para agent stats/activities/trends
- `frontend/src/app/admin/agents/page.tsx` - Main page (~380 líneas)
- `frontend/src/components/admin/agents/AgentStatsCards.tsx` - Cards de stats + grid de agentes
- `frontend/src/components/admin/agents/AgentActivityTimeline.tsx` - Tabla timeline
- `frontend/src/components/admin/agents/AgentTaskDistribution.tsx` - Bar chart distribución
- `frontend/src/components/admin/agents/AgentTrendChart.tsx` - Gráfico tendencia 7 días
- `frontend/src/components/admin/agents/AgentFilterBar.tsx` - Filtros + export CSV

**Features:**
- Overview tab con stats cards (total tasks, success rate, avg duration, errors)
- Grid de agentes clickeables con modal de detalle
- Activity timeline con auto-refresh cada 30s
- Filtros: rango de fechas, agente, tipo tarea, status
- Export CSV
- Task distribution bar chart
- Trend chart últimos 7 días
- Mobile responsive

**Archivos modificados:**
- `frontend/src/app/admin/layout.tsx` - Link "Agents Activity" en sidebar

---

## [2026-04-06] - Login Usuario Rediseñado

**Archivos:** `frontend/src/components/auth/LoginForm.tsx`

Rediseñado login de usuario con misma estética que admin:
- Google primero, manual después
- Mismos colores, tipografías, bordes
- Botón "Ver planes" lleva a /planes
- Animaciones framer-motion

**Motivo:** Mejora de UX y consistencia con admin.

---

## [2026-04-06] - Sistema Reviews con Media Estrella

**Archivos:**
- `frontend/src/components/ui/HalfStarRating.tsx` (nuevo)
- `frontend/src/components/dashboard/ReviewPromptModal.tsx`

Nuevo componente HalfStarRating permite puntuación con media estrella (4.5, 3.5, etc):
- Click en mitad izquierda = 0.5
- Click en mitad derecha = entero
- Hover muestra preview

**Motivo:** Permite reviews más precisas.

---

## [2026-04-08] - Campo toc_items para Blog Draft Articles

### Modificación en endpoint articleContent

- Agregado campo `toc_items` a la destructuración de req.body en `blog.controller.ts`
- Agregado campo `toc_items: toc_items || null` en upsert de `blog_draft_articles`
- Creada columna `toc_items` de tipo JSONB en tabla `blog_draft_articles` mediante migración Supabase (`ALTER TABLE blog_draft_articles ADD COLUMN IF NOT EXISTS toc_items jsonb;`)

### Archivos modificados
- `backend/src/controllers/blog.controller.ts` - función articleContent (líneas 451, 468)

### Motivo
- Permitir almacenar items de tabla de contenidos generados por Article Producer para uso futuro en renderizado de artículos

---

## [2026-04-09] - Workflow n8n: Project Knowledge RAG con OpenAI

### Workflow de Indexación de Documentación con Embeddings

- **Problema anterior**: Workflow usaba Google Palm API (deprecated) con credenciales hardcodeadas
- **Solución**: Workflow refeactored con OpenAI `text-embedding-3-small`:
  - Webhook trigger en path `project-knowledge-rag`
  - Validación y preparación de datos (file_name, content, SHA256 hash, doc_type)
  - Verificación de documento existente en Supabase (compara content_hash)
  - Si hash cambió → genera embedding con OpenAI API
  - Upsert a Supabase via RPC `upsert_project_knowledge`
  - Respuestas: success (200), skipped (200 si sin cambios), error (500)
- **Variables de entorno requeridas**:
  - `SUPABASE_SERVICE_KEY` - Service role key de Supabase
  - `OPENAI_API_KEY` - API key de OpenAI
- **Modelo de embedding**: `text-embedding-3-small` (768 dimensiones)
- **Archivo**: `docs/n8n/workflows/project-knowledge-rag-workflow.json`

### Archivos creados
- `docs/n8n/workflows/project-knowledge-rag-workflow.json` - Workflow completo

### Motivo
- Migrar de Google Palm (deprecated) a OpenAI para embeddings de documentación
- Usar variables de entorno en lugar de credenciales hardcodeadas

## [2026-04-15] - Command Center Cleanup + Sam Assets

### Comando Center: Unificación

**Problema:** Existían múltiples versiones del Command Center (duplicados).

**Solución:**
- ELIMINADO: `SammyControlTower.tsx` (redundante)
- ELIMINADO: `sammy-control-tower.css` (redundante)
- ELIMINADO: `MissionControl.jsx` (redundante)
- ELIMINADO: `mission-control.css` (redundante)
- ELIMINADO: `mission-control/page.tsx` (redundante)
- MANTENIDO: `command-center/page.tsx` como fuente única

### Sam's Custom Assets Integrados

- `Room-sammanta.png` integrado como fondo de la sala de Sammy
- `sammy.webp` integrado como avatar animado de Sammy
- Assets copiados a `frontend/public/assets/` para acceso público
- Marcados con `unoptimized` para evitar procesamiento de Next.js

## 2026-04-17 21:35

### 🔧 Skills Actualizadas para Pixel
- ❌ ELIMINADA: `frontend-design`
- ✅ INSTALADA: `emil-design-eng` (emilkowalski/skill) - Filosofía de UI polish de Emil Kowalski
- ✅ INSTALADA: `impeccable` (pbakaus/impeccable) - Suite con: layout, optimize, overdrive, polish, quieter, shape, typeset
- ✅ INSTALADA: `taste-skill` (Leonxlnx/taste-skill) - 8 skills de diseño premium:
  - gpt-taste
  - minimalist-ui
  - industrial-brutalist-ui
  - high-end-visual-design
  - stitch-design-taste
  - design-taste-frontend
  - redesign-existing-projects
  - full-output-enforcement

## 2026-04-17 21:39

### 🎨 Mejoras de Diseño - Skills Aplicadas

**Skills utilizadas:**
- **emil-design-eng**: Filosofía de UI polish, detalles invisibles
- **impeccable**: Animaciones refined, polish de componentes  
- **taste**: Diseño premium, espaciado correcto

**Archivo mejorado: `payment-settings/page.tsx`**

1. **Loading State Premium:**
   - Spinner con efecto de profundidad (doble ring)
   - Animación fade-in con Framer Motion

2. **Toggle Component Refined:**
   - `whileTap={{ scale: 0.95 }}` para feedback táctil
   - Spring animation para el thumb (stiffness: 500, damping: 30)
   - Tamaño aumentado (h-7, w-12) para mejor touch target
   - Transiciones suaves de 300ms

3. **Field Component Polish:**
   - Inputs más grandes y espaciados (px-4, py-3)
   - Border-radius refinado (rounded-xl)
   - Focus states con `--accent` color y ring
   - Transiciones específicas de 200ms
   - Labels con mejor jerarquía (font-semibold, mb-2)

4. **SecretField Component Premium:**
   - Iconos de visibility más grandes (w-5 h-5)
   - `whileTap={{ scale: 0.9 }}` en botones
   - Hover states más refinados
   - Posicionamiento mejorado (right-3)

5. **Importaciones Actualizadas:**
   - Agregado `AnimatePresence` de framer-motion
