# CHANGELOG — Lookitry

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
