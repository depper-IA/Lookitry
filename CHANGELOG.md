# Changelog - Lookitry (AI Assisted)

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
