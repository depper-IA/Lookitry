# Changelog - Lookitry (AI Assisted)

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

## [2026-04-06] - Fix: Flujo Auth con Google → Checkout (sin paso intermedio)

### Problema
Usuario nuevo con Google iba a `/register/google-setup` (registro sin pago) y podía terminar en `/dashboard` sin pasar por checkout si la campaña no requería pago con tarjeta.

### Flujo Corregido
```
Google Login → Usuario Nuevo → /checkout (NO /register/google-setup)
```

### Backend
- `backend/src/services/google-auth.service.ts` - Agregado `redirectTo: '/checkout'` al retornar para usuario nuevo
- `backend/src/controllers/auth.controller.ts` - Agregado `redirectTo` al response de googleLogin

### Frontend
- `frontend/src/components/auth/GoogleSignInButton.tsx` - `data.needsOnboarding` ahora redirige a `/checkout` (no a `/register/google-setup`)
- `frontend/src/app/auth/google/callback/page.tsx` - Actualizado para usar `data.redirectTo` → `/checkout`
- `frontend/src/app/register/google-setup/page.tsx` - `handleSuccess` ahora siempre va a `/checkout` (no verifica trial)

### Checkout Flow
- El flujo `flow === 'checkout'` en GoogleSignInButton **NO fue modificado** y sigue funcionando igual

## [2026-04-06] - Fix: Loop de Sesión Activa

### Problema
El mensaje "Ya tienes una sesión activa" aparecía repetido porque usuarios con cookie `token` válida pero sin `brand` en localStorage recibían error `ALREADY_AUTHENTICATED` del backend, pero el frontend no redirigía.

### Backend
- `backend/src/controllers/auth.controller.ts` - register() y googleLogin()
- Cambiado manejo de `ALREADY_AUTHENTICATED` de status 400 (error) a 200 con `needsOnboarding: false` y `redirectTo: '/dashboard'`

### Frontend
- `frontend/src/components/auth/RegisterForm.tsx` - Agregado handling de `data.redirectTo` para redirigir automáticamente
- `frontend/src/components/auth/GoogleSignInButton.tsx` - Agregado handling de `data.redirectTo` antes de `data.needsOnboarding`

## [2026-04-06] - Sistema de Tracking de Actividad de Agentes

### CRÍTICO - Sistema agent_activities

Nuevo sistema de tracking para monitorear actividad de agentes Lookitry.

**Migration SQL:** `backend/supabase/migrations/20250406_agent_activities.sql`
- Tabla `agent_activities` con campos: id, agent_name, task_type, task_description, status, duration_ms, error_message, metadata, created_at, finished_at
- Índices optimizados para queries frecuentes
- RLS Policies: admins pueden leer, service_role puede insertar/actualizar

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
- `GET /api/agent/export` - Exportar CSV

**Archivos creados:**
- `backend/supabase/migrations/20250406_agent_activities.sql`
- `backend/src/services/agent-activity.service.ts`
- `backend/src/routes/agent.routes.ts`

**Archivos modificados:**
- `backend/src/routes/index.ts` (registradas rutas agent)

**Migration aplicada manualmente:**
- Tabla `agent_activities` creada via `supabase_apply_migration` (no via `npx supabase db push`)

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

**Backend endpoints usados:**
- `GET /api/agent/stats` - Stats globales
- `GET /api/agent/activities` - Timeline
- `GET /api/agent/stats/:agentName` - Detalle agente
- `GET /api/agent/trends/:agentName?days=7` - Tendencia
- `GET /api/agent/distribution` - Distribución por tipo
- `GET /api/agent/export` - CSV

---

## [2026-04-06] - Rediseño Login, Reviews Media Estrella y ActivateAccount

### HIGH - Rediseño Login Usuario (misma estética admin)

**Archivos:**
- `frontend/src/components/auth/LoginForm.tsx` (completo)

Rediseñado el login de usuario para que use la misma estética que el login admin:
- Layout: Logo → Google (arriba) → Separador → Email/Password → Login
- Colores, tipografías y bordes usando CSS variables (`var(--bg-card)`, `var(--border-color)`)
- Badge decorativo, animaciones con framer-motion
- Botón "Ver planes" (no a checkout directo)
- Errores con diseño consistente

---

### MEDIUM - Flujo Google Login Corregido

**Archivos:**
- `frontend/src/components/auth/GoogleSignInButton.tsx`

**Cambios:**
1. Google arriba en login (UI)
2. Flujo corregido: usuario con Google pero sin cuenta → `/activar-cuenta`
3. Usuario existente → `/dashboard` (NUNCA a checkout)
4. Nuevo usuario → `/register/google-setup`

**Nueva página:**
- `frontend/src/app/activar-cuenta/page.tsx` (nueva)

Página de activación para usuarios que ya tienen cuenta Google pero no marca activa. Pide nombre + slug y redirige a `/trial-checkout`.

---

### MEDIUM - Reviews con Media Estrella

**Archivos:**
- `frontend/src/components/ui/HalfStarRating.tsx` (nuevo)
- `frontend/src/components/dashboard/ReviewPromptModal.tsx`

**Funcionalidad:**
- Click en mitad izquierda de estrella = 0.5
- Click en mitad derecha = estrella completa
- Hover muestra preview de rating
- Soporta: ★★★★★ (5), ★★★★☆ (4.5), ★★★☆☆ (3.5), ★★☆☆☆ (2.5), ★☆☆☆☆ (1.5)

---

### INFO - Widget Template Preview

**Estado:** Verificado funcional en `frontend/src/app/dashboard/mi-pagina/page.tsx`

El preview del template funciona correctamente:
- Sticky panel derecho con Browser Bar
- `LandingPreview` renderiza según template (classic, editorial, moderno)
- Es responsive y se adapta al contenedor

---

## [2026-04-06] - Fix CORS, TemplateShowcase y Templates Pro

### CRÍTICO - Fix CORS Backend

**Archivos:** `backend/src/config/security.config.ts`

El backend ya no usa `origin: '*'` (wildcard) para rutas públicas. Ahora valida contra lista de orígenes permitidos incluyendo localhost:3000 (dev), localhost:3001 (dev backend), y lookitry.com/www/api (producción). Esto resuelve el error "Access-Control-Allow-Origin header must not be wildcard when credentials mode is include".

**Motivo:** El frontend hace fetch con `credentials: 'include'`, lo cual es incompatible con wildcard CORS.

---

### HIGH - TemplateShowcase: Nuevo Widget Mobile-First

**Archivos:** 
- `frontend/src/components/tryon/templates/TemplateShowcase.tsx` (nuevo)
- `frontend/src/components/tryon/templates/TemplateMinimalTopBar.tsx` (eliminado)

Creado nuevo template "Showcase" diseñado específicamente como mostrador virtual para bios de Instagram/TikTok:
- Header discreto 40px
- Scroll horizontal swipe para productos (snap-x)
- CTA fixed bottom 56px en thumb-zone
- Touch targets +48px
- Mobile-first (320px)
- Eliminado StepBar indicator para simplificar

**Motivo:** Los templates Bare y MinimalTopBar eran prácticamente idénticos. Se necesitaba un template diferenciado para uso en móvil.

---

### MEDIUM - Templates Pro: Colores Dinámicos

**Archivos:**
- `frontend/src/components/tryon/templates/TemplateBoldProStudio.tsx`
- `frontend/src/components/tryon/templates/TemplateModernSidebar.tsx`

Corregidos colores hardcoded en los templates Pro:
- **TemplateBoldProStudio:** `bg-[#050505]` → usa `secondaryColor`, `color: '#0C0A09'` → `color: '#ffffff'`, textos `text-white/50` → usan `primaryColor` con opacidad
- **TemplateModernSidebar:** Agregada función `isLightColor()` para detectar contraste y aplicar texto dinámico en sidebar

**Motivo:** Los colores hardcoded ignoraban la configuración de marca y podían causar problemas de legibilidad.

---

## [2026-04-06] - Rediseño páginas Brands y Subscriptions admin

### HIGH - Mejoras de UX/UI

**`admin/brands/page.tsx`** — Rediseño completo inspirado en dashboard:

- **Hero Section con stats cards**: Total, Trial, Activas, Suspendidas con iconos y colores accent
- **Reemplazo modal por Side Panel**:-brandDetailsModal eliminado, ahora usa panel lateral deslizable (slide from right) con Framer Motion
- **Vista dual (Grid/Tabla)**: Toggle para cambiar entre vista cards en grid o tabla tradicional
- **Filtros intuitivos como chips/badges**: Plan (Todos/Trial/Basic/Pro/Landing) y Estado (Todos/Activas/Suspendidas) en línea horizontal
- **BrandCard visual**: Cada marca en card con avatar, plan badge, stats rápidos y acciones
- **Búsqueda inline**: Barra de búsqueda prominente en la sección de filtros
- **Removida complejidad excesiva**: Eliminada selección masiva, ordenamiento con flechas en headers

**`admin/subscriptions/page.tsx`** — Rediseño completo inspirado en dashboard:

- **Hero Section con stats cards**: Total, Activas, Por vencer, MRR con colores distintos
- **Vista dual (Grid/Tabla)**: Toggle para cambiar entre SubscriptionCard en grid o tabla
- **SubscriptionCard**: Card visual con avatar, plan badge, estado, días restantes, precio y acciones
- **Filtros como chips con colores**: Todas (azul), Activas (verde), Vencen 7d (amarillo), Trial (índigo), Suspendidas (rojo)
- **Cálculo MRR dinámico**: Muestra MRR en stats cards
- **Alerta contextual**: Banner de advertencia cuando hay suscripciones por vencer
- **Removida selección masiva**: Simplificado flujo de trabajo

### MEDIUM - Componentes removidos/simplificados

- **`BrandDetailsModal.tsx`**: ELIMINADO — funcionalmente reemplazado por BrandSidePanel integrado en la página
- **`BrandFilters.tsx`**: Simplificado — la lógica de filtros ahora vive directamente en la página

### Principios aplicados

- Jerarquía clara: Stats → Búsqueda → Filtros → Resultados
- Affordances claros: Chips de colores para filtros, iconos evidentes para acciones
- Espaciado generoso: Padding consistente, cards con border-radius amplio
- Estados claros: Loading con spinner animado, empty state con ícono y mensaje
- Consistencia: CSS variables (`--bg-card`, `--accent`, `--text-primary`), gradientes sutiles en headers

### Archivos modificados

- `frontend/src/app/admin/brands/page.tsx` (rediseño completo)
- `frontend/src/app/admin/subscriptions/page.tsx` (rediseño completo)
- `frontend/src/components/admin/brands/BrandDetailsModal.tsx` (eliminado)
- `frontend/src/components/admin/brands/BrandFilters.tsx` (simplificado, aún usado en la tabla)

---

### HIGH - Frontend Template System

- **`TemplateMinimalTopBar.tsx`**: ELIMINADO - Era redundante con TemplateBare, solo difería en header/step bar
- **`TemplateShowcase.tsx`**: NUEVO template mobile-first para bio de Instagram/TikTok
  - Header ultra-discreto (40px máx)
  - Selector de productos con **swipe horizontal** (snap scroll)
  - CTA gigante bottom-fixed (56px altura, zona thumb)
  - Full-screen mobile-first: 320px primero
  - Info de producto compacta
  - Sin StepBar (flujo simplificado)
- **`types.ts`**: Agregado tipo `'showcase'` a Layout
- **`TryOnWidget.tsx`**: 
  - `minimal`/`top-bar` ahora mapean a `showcase`
  - Template por defecto para templates未知 usa Showcase

### MEDIUM - Detalles de UX

- Scroll horizontal con indicadores de dirección (gradientes fade)
- Touch targets mínimo 44px
- Botón CTA con shadow color dinámico según marca

## [2026-04-06] - Auditoría UX/Diseño admin - Mejoras visuales y correcciones

### CRÍTICO - Correcciones de bugs

- **`admin/revenue/page.tsx`**: Eliminado bloque `TabConfig` duplicado (líneas 815-835) que renderizaba dos veces el tab de configuración
- **`admin/layout.tsx`**: Corregido matching de navegación activa que incorrectamente marcaba sub-rutas como activas. Nueva lógica: `pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/') && pathname.split('/')[3] === undefined)`
- **`admin/layout.tsx`**: Corregido color `#555` hardcodeado → `var(--text-muted)` en texto de loading
- **`admin/leads/page.tsx`**: Modal de creación/edición de lead ahora usa tema oscuro consistente (`var(--bg-card)`, `var(--border-color)`, `var(--text-primary)`) en lugar de fondo blanco hardcodeado

### HIGH - Accesibilidad y refactorización

- **`components/admin/brands/BrandTable.tsx`**: Agregados `aria-label` a los 6 botones de acción de la tabla de marcas para mejor accesibilidad
- **`app/admin/admins/page.tsx`**: Refactorizado `PermissionBadge` y `Toast` de inline styles a Tailwind + CSS variables

### MEDIUM - Estilos globales y componentes

- **`globals.css`**: Agregado `focus-visible` con outline `#FF5C3A` para todos los elementos interactivos (buttons, inputs, selects, textareas)
- **`app/admin/subscriptions/page.tsx`**: Mejorado header con hero section estilo dashboard (gradiente, border accent, badges de estado)

### Archivos modificados

- `frontend/src/app/admin/revenue/page.tsx`
- `frontend/src/app/admin/layout.tsx`
- `frontend/src/app/admin/leads/page.tsx`
- `frontend/src/app/admin/admins/page.tsx`
- `frontend/src/components/admin/brands/BrandTable.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/app/admin/subscriptions/page.tsx`

---

## [2026-04-06] - Fix errores build y completado pendientes admin

### Fix errores de build

- **`admin/security/page.tsx`**: Eliminado import duplicado de `motion` (framer-motion)
- **`admin/dashboard/page.tsx`**: Reemplazado componente `BrutalBadge` inexistente por badge inline con estilos inline (colores según plan: PRO=violeta, TRIAL=índigo, BASIC=verde)
- **`admin/funnel/page.tsx`**: Corregido tipo `boolean | 0 | undefined` en `hasStalledTrials` usando `Boolean()` cast

### Completado pendientes auditoría admin dashboard

- **Funnel clickeable**: Cada etapa ahora navega a la página filtrada correspondiente (Trial → brands?plan=TRIAL, Pro → brands?plan=PRO, Riesgo → /admin/risk)
- **Playbooks embebidos**: Nuevo componente `EmbeddedPlaybook` integrado en:
  - `/admin/risk` → playbook churn-prevention (cuando high_risk > 0)
  - `/admin/payments` → playbook payment-failed (cuando hay pagos fallidos)
  - `/admin/funnel` → playbook trial-stalled (cuando conversión Trial <50%)
  - `/admin/ia-costs` → playbook ia-costs-spike (cuando balance bajo)

### Archivos modificados

- `frontend/src/app/admin/security/page.tsx`
- `frontend/src/app/admin/dashboard/page.tsx`
- `frontend/src/app/admin/funnel/page.tsx`
- `frontend/src/components/admin/EmbeddedPlaybook.tsx` (nuevo)
- `frontend/src/app/admin/risk/page.tsx`
- `frontend/src/app/admin/payments/page.tsx`
- `frontend/src/app/admin/ia-costs/page.tsx`

---

## [2026-04-06] - Visión con OpenRouter para análisis de imágenes

### Nueva funcionalidad

- Sammy ahora puede ver y analizar imágenes usando OpenRouter Vision
- Modelo: `google/gemini-2.5-flash-image-preview` (costo mínimo ~$0.00000013/1K tokens)
- Flujo: imagen → Gemini Vision (análisis) → OpenCode (corrección)
- Prompt especializado en debugging para análisis de código/errores
- Archivos: `sammy/src/audio/groq.ts` (nueva función `analyzeImageWithOpenRouter`), `sammy/src/index.ts`

---

## [2026-04-06] - Fix soporte imágenes en Sammy

### Bug fix

- TypeScript error `file_mime_type` no existía en tipo `Audio`
- Solucionado con type assertion `(ctx.message.audio as any).file_mime_type`
- Build ahora compila correctamente

---

## [2026-04-06] - Streaming en Sammy

### Sammy streaming de respuestas

- Sammy ahora muestra progreso en tiempo real via Telegram
- Mensaje inicial "⏳ Procesando..." que se actualiza con cada parte
- Muestra: iteración, herramientas usadas, respuesta parcial
- Archivos modificados: `sammy/src/index.ts`, `sammy/src/opencode/client.ts`
- README.md actualizado con documentación de streaming

---

## [2026-04-06] - Sistema de Agentes Integración Completa

### Agentes actualizados con MCPs, modelos y optimización de tokens

| Agente | MCPs | Modelo Principal | Fallback | Subagentes |
|--------|------|-------------------|----------|------------|
| Sammy | memory | MiniMax | DeepSeek Coder | GROQ |
| WebWizard | supabase, n8n | MiniMax | DeepSeek Coder | GROQ |
| DevGuardian | supabase, context7 | MiniMax | DeepSeek Coder | GROQ |
| DataAlchemist | supabase, n8n, context7 | MiniMax | DeepSeek Coder | GROQ |
| GrowthPilot | supabase, hostinger-mcp | MiniMax | DeepSeek Coder | GROQ |
| ArchitectAI | hostinger-mcp, supabase | MiniMax | DeepSeek Coder | GROQ |

### Modelos gratuitos utilizados

- **MiniMax** (principal): `minimax-coding-plan/MiniMax-M2.7`
- **DeepSeek Coder** (fallback): `deepseek/deepseek-coder-33b-instruct`
- **GROQ** (subagentes): `groq/llama-3.3-70b-instruct`

### Archivos modificados

- `AGENTS.md` — Tabla de agentes + protocolo comunicación + modelos
- `REGLAS_IMPORTANTES.md` — Sección 10: Sistema de Agentes IA
- `.claude/SKILL.md` — Índice de agentes especializados
- `.opencode/agents/*.md` — Todos los agentes actualizados

### Limpieza realizada

- Eliminada carpeta `para agentes/` (migrado a .opencode/agents/)
- Eliminado `creador_agentes.md`
- Archivado CHANGELOG.md → `CHANGELOG_ARCHIVE_2026_Q1.md`
- Creado nuevo CHANGELOG.md limpio

---
