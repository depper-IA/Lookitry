# LOOKITRY MISSION CONTROL — SPEC.md
> Versión 1.0 | Dashboard Operacional Completo | Cyberpunk/Sci-fi
> Última actualización: Abril 2026

---

## 1. CONCEPT & VISION

### Concepto Central
**"The Nerve Center"** — Un centro de comando vivo que respira, pulsa y reacciona. No es un dashboard estático: es una sala de control de satélites donde cada agente de IA es un nodo activo en una constelación operacional. El observador siente que está mirando el cerebro vivo de Lookitry.

### Metáfora Visual
Inspirado en salas de control de misiones espaciales (NASA, SpaceX) fusionado con terminales hacker-chic. Cada panel es una "pantalla de sistema", cada agente una "unidad de operación autónoma", cada métrica un "indicador de telemetría crítica".

### Principios de Diseño
1. **Información densa, no caótica** — Máxima densidad de datos con jerarquía visual clara
2. **Vivo por defecto** — Todo elemento tiene un estado dinámico (pulsos, counters, streams)
3. **Naranja sobre negro** — El acento #FF5C3A es sagrado: se usa para "lo que importa AHORA"
4. **La grilla manda** — Sistema de grilla consistente, nunca layout arbitrario
5. **Cada pixel justificado** — Sin decoración sin función; sin función sin belleza

---

## 2. DESIGN LANGUAGE

### 2.1 Paleta de Colores

```css
:root {
  /* Fondos */
  --bg-base: #0a0a0a;
  --bg-card: #111111;
  --bg-card-hover: #161616;
  --bg-surface: #141414;
  --bg-overlay: #0d0d0d;
  --bg-input: #1a1a1a;

  /* Bordes */
  --border-subtle: #1e1e1e;
  --border-active: #2a2a2a;
  --border-accent: #FF5C3A33;
  --border-glow: #FF5C3A66;

  /* Acento primario — Naranja Lookitry */
  --accent: #FF5C3A;
  --accent-dim: #FF5C3A66;
  --accent-subtle: #FF5C3A1A;
  --accent-bright: #FF7A5C;
  --accent-glow: 0 0 20px #FF5C3A40, 0 0 60px #FF5C3A20;

  /* Status colors */
  --status-online: #00E5A0;
  --status-online-glow: 0 0 12px #00E5A060;
  --status-busy: #FFB547;
  --status-busy-glow: 0 0 12px #FFB54760;
  --status-offline: #444444;
  --status-critical: #FF3A5C;
  --status-critical-glow: 0 0 12px #FF3A5C60;

  /* Texto */
  --text-primary: #F0F0F0;
  --text-secondary: #888888;
  --text-muted: #555555;
  --text-accent: #FF5C3A;
  --text-positive: #00E5A0;
  --text-negative: #FF3A5C;

  /* Charts */
  --chart-1: #FF5C3A;
  --chart-2: #00E5A0;
  --chart-3: #FFB547;
  --chart-4: #5C8AFF;
  --chart-5: #BF5CFF;
}
```

### 2.2 Tipografía

```css
/* Fuentes: Plus Jakarta Sans + DM Sans + JetBrains Mono */
--font-display: 'Plus Jakarta Sans', sans-serif;
--font-body: 'DM Sans', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### 2.3 Sistema de Motion

- **Entrada**: Staggered fade-in desde abajo (translateY: 20px → 0), delay escalonado de 80ms por elemento
- **Hover**: Escala sutil (1.0 → 1.01) + border-glow transition 200ms ease
- **Status**: Pulse infinito en indicators (escala 1.0 → 1.15 → 1.0, 2s infinite)
- **Números**: Counter animado con easing ease-out, duración 800ms
- **Charts**: Path stroke-dashoffset animation on mount, 1000ms ease-out

---

## 3. LAYOUT & STRUCTURE

### 3.1 Estructura de Rutas

```
/mission-control/
├── page.tsx                    # Overview hub
├── agents/page.tsx             # Panel completo de agentes
├── product/page.tsx            # Try-On / Webhooks / Jobs
├── business/page.tsx           # Business metrics & revenue
├── security/page.tsx          # Cipher's dashboard
├── growth/page.tsx            # Marlo + Rebecca
├── trading/page.tsx           # Leo
├── autolookitry/page.tsx       # Módulo Autolookitry
└── system/page.tsx             # Infra + uptime + docs
```

### 3.2 Layout Shell

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Logo | System Status | Notifications | Clock        │
├──────────┬──────────────────────────────────────────────────┤
│ SIDEBAR  │ MAIN CONTENT AREA                                │
│ (240px)  │ (fluid, padding 24px)                            │
│          │                                                  │
│ Nav tabs │ Page-specific grid layout                        │
│ + Agent  │ Responsive: 1 → 2 → 3 → 4 columnas              │
│ mini     │                                                  │
│ status   │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

---

## 4. FEATURES & INTERACTIONS

### 4.1 AGENTS PANEL (10 Agent Cards)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│SAMMANTHA│ PIXEL   │ KIRA    │ NADIA   │ CIPHER  │
│ Orch.   │Frontend │ QA      │ Data/AI │Security │
├─────────┼─────────┼─────────┼─────────┼─────────┤
│ ZEPHYR  │ MARLO   │ REBECCA │ LEO     │ LINA    │
│ Infra   │ Growth  │ UGC     │ Trading │ Docs    │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

#### Agent Card Structure

```typescript
interface AgentCard {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'offline';
  lastActivity: string;
  metrics: AgentMetric[];
  statusMessage: string;
}
```

#### Métricas por Agente

| Agente | Métricas |
|--------|----------|
| **Sammantha** | Tareas Hoy: 47 (+12%), Reportes: 1/día, Coordinación: 98% |
| **Pixel** | Build Status: OK, Components: 23 (+3), PR Open: 2 |
| **Kira** | Tests Pass: 94%, Lint Errors: 0, Coverage: 87% |
| **Nadia** | Queries/hora: 1240 (+8%), AI Calls hoy: 3820 (+15%), n8n Flows: 12 |
| **Cipher** | Alertas: 0, IPs Bloq.: 3, Audit Score: 96% |
| **Zephyr** | Services Up: 12/12, Uptime: 99.9%, SSL Válido: OK |
| **Marlo** | Leads Hoy: 34 (+22%), Open Rate: 28%, CRM Enriq.: 83% |
| **Rebecca** | Posts Semana: 7, Engagement: 4.2%, Fiverr $: $280 USD |
| **Leo** | P&L Hoy: +$120, Trades: 18, Win Rate: 67% |
| **Lina** | Docs Updated: 8 (hoy), CHANGELOG: v2.4, Completitud: 91% |

---

### 4.2 PRODUCT / TRY-ON CONTROL

#### Métricas Principales
- **Try-Ons 24h**: Counter animado, comparativa ayer
- **Queue Actual**: pending / processing / completed
- **Avg Response**: Tiempo promedio en segundos
- **Success Rate**: % con glow verde si >95%, rojo si <90%

#### Queue Panel
- Barra horizontal stackeada con colores por status
- Webhook Activity Feed con últimas 20 entradas
- Chart: Try-On Volume (últimas 24h)

---

### 4.3 BUSINESS METRICS

#### KPI Cards
```
┌──────────┬──────────┬──────────┬──────────┐
│   MRR    │   ARR    │ Trial→  │  Active │
│ $2.4M COP│ $28.8M COP│  Paid   │  Users  │
│  +8% mom │  +8% mom │  12.4%  │   847   │
└──────────┴──────────┴──────────┴──────────┘
```

#### Gráficos
- Revenue por Plan (barras verticales)
- Funnel Trial → Paid
- Pipeline de Leads (Marlo)

---

### 4.4 SECURITY DASHBOARD (Cipher)

```
┌────────────────┬────────────────┬────────────────┐
│ Login Fallidos │   IPs Bloq.    │  Rate Limits   │
│      23        │       7        │      12        │
│ últimas 24h    │   activas      │    activos     │
└────────────────┴────────────────┴────────────────┘
```

#### Componentes
- Alert Summary (top cards)
- Critical Alerts Panel (ordenado por severidad)
- Login Attempts Chart (barras por hora)
- Blocked IPs Table
- Security Score Gauge (0-100)

---

### 4.5 MARKETING & GROWTH

#### Marlo (Email / CRM)
- Email Campaigns table con métricas
- Leads stats: Total, Enriquecidos %, Contact Rate
- Pipeline por etapa

#### Rebecca (UGC / Social)
- Posts/semana: 7, Engagement: 4.2%
- Fiverr orders: 3 órdenes activas, $280 USD
- Social feed thumbnails

---

### 4.6 TRADING (Leo)

```
┌──────────┬──────────┬──────────┬──────────┐
│ Balance  │ P&L Hoy  │ P&L Sem  │  Trades  │
│ $12,450  │  +$120   │  +$890   │   18     │
│  USDT    │ +0.97%   │ +7.2%    │   hoy    │
└──────────┴──────────┴──────────┴──────────┘
```

#### Componentes
- Equity Curve Chart (1D/7D/1M/3M)
- Open Positions Table
- Trade History (paginado)
- Exchange Connection Status

---

### 4.7 AUTOLOOKITRY [BETA]

```
┌─────────────────────────────────────────────────────────┐
│ 🤖 AUTOLOOKITRY [BETA]                                  │
│ Estado: EN DESARROLLO ████████░░ 80%                    │
└─────────────────────────────────────────────────────────┘
```

#### Features en Desarrollo (Kanban)
```
TODO         │ IN PROGRESS    │ DONE
─────────────┼────────────────┼───────────────
API auto-queue│ Auto-retry     │ Job scheduler
Batch upload │ Smart caching  │ Queue monitor
             │ Webhook retry   │ Basic retry
```

#### Métricas
- Jobs automatizados (vs manuales): ratio
- Tiempo ahorrado: horas/semana
- Tasa de error auto-retry: %
- Próxima release: countdown

---

### 4.8 SYSTEM STATUS (Zephyr + Lina)

```
┌──────────┬──────────┬──────────┬──────────┐
│ API Main │ Supabase │  MinIO   │  Traefik │
│    ● UP  │    ● UP  │    ● UP  │    ● UP  │
│   99.9%  │   99.8%  │   100%   │   99.9%  │
├──────────┼──────────┼──────────┼──────────┤
│   GROQ   │OpenRouter│  Wompi   │  Brevo   │
│    ● UP  │    ● UP  │    ● UP  │    ● UP  │
│  API OK  │  API OK  │  API OK  │  API OK  │
└──────────┴──────────┴──────────┴──────────┘
```

#### Componentes
- Services Grid (status tiles)
- Uptime Chart (últimos 7 días)
- Docker Services Table
- Docs Status (Lina)

---

## 5. COMPONENT INVENTORY

### Átomos
- `StatCard` - Métrica individual con label, valor, trend, glow
- `StatusDot` - Indicador ● con pulse animation
- `Badge` - Pill de status (ONLINE / BUSY / OFFLINE / BETA / OK / ERROR)
- `MetricDelta` - "+12%" con color y flecha
- `ProgressBar` - Barra animada con % label
- `GlowButton` - CTA con hover glow naranja
- `IconButton` - Botón cuadrado con icono
- `MonoNumber` - Número en JetBrains Mono con counter animation
- `LiveClock` - Reloj HH:MM:SS en tiempo real

### Moléculas
- `AgentCard` - Card completa de agente
- `WebhookFeed` - Stream de eventos auto-scroll
- `AlertItem` - Item de alerta con severidad + mensaje
- `QueueBar` - Barra stackeada de cola de jobs
- `ServiceTile` - Tile de servicio con status y uptime

### Organismos
- `MCHeader` - Header global completo
- `MCSidebar` - Sidebar de navegación
- `AgentsGrid` - Grid 5x2 de AgentCards
- `TryOnQueue` - Panel completo de queue + feed
- `BusinessKPIs` - Row de KPI cards + charts
- `SecurityPanel` - Dashboard Cipher completo
- `GrowthPanel` - Marlo + Rebecca combinados
- `TradingPanel` - Leo panel completo
- `AutolookitryPanel` - Panel Autolookitry completo
- `SystemStatusGrid` - Grid de servicios + uptime

### Charts (Recharts)
- `TryOnLineChart` - Área + línea, 24h de generaciones
- `RevenueBarChart` - Barras verticales por plan
- `EquityCurveChart` - Línea P&L con fill condicional
- `LoginAttemptsChart` - Barras stackeadas exitosos/fallidos
- `UptimeHeatmap` - Grid de bloques por servicio/hora

---

## 6. TECHNICAL APPROACH

### Estructura de Archivos

```
frontend/src/app/mission-control/
├── layout.tsx
├── page.tsx                    # Overview
├── agents/page.tsx
├── product/page.tsx
├── business/page.tsx
├── security/page.tsx
├── growth/page.tsx
├── trading/page.tsx
├── autolookitry/page.tsx
└── system/page.tsx

frontend/src/components/mission-control/
├── atoms/
│   ├── StatCard.tsx
│   ├── StatusDot.tsx
│   ├── Badge.tsx
│   ├── MonoNumber.tsx
│   ├── LiveClock.tsx
│   └── index.ts
├── molecules/
│   ├── AgentCard.tsx
│   ├── WebhookFeed.tsx
│   ├── AlertItem.tsx
│   ├── QueueBar.tsx
│   └── index.ts
├── organisms/
│   ├── MCHeader.tsx
│   ├── MCSidebar.tsx
│   ├── AgentsGrid.tsx
│   ├── TryOnQueue.tsx
│   └── index.ts
├── charts/
│   ├── TryOnLineChart.tsx
│   ├── RevenueBarChart.tsx
│   └── index.ts
└── index.ts

frontend/src/hooks/
├── useMissionControlData.ts
├── useAgentsStatus.ts
├── useTryOnMetrics.ts
├── useBusinessMetrics.ts
├── useSecurityAlerts.ts
├── useTradingData.ts
├── useSystemStatus.ts
└── useRealtimePolling.ts

frontend/src/lib/mission-control/
├── types.ts
├── constants.ts
├── animations.ts
├── formatters.ts
└── index.ts

frontend/src/app/api/mission-control/
├── agents/route.ts
├── tryon-metrics/route.ts
├── business-metrics/route.ts
├── security/route.ts
├── trading/route.ts
├── system-status/route.ts
└── growth/route.ts
```

### Real-time Strategy

| Sección | Intervalo | Método |
|---------|-----------|--------|
| System Status | 10s | Polling |
| Try-On Queue | 5s | Polling (crítico) |
| Security Alerts | 15s | Polling |
| Business KPIs | 60s | Polling |
| Agents Status | 30s | Polling |
| Trading | 30s | Polling |
| Growth Metrics | 300s | Polling |

### Autenticación

```typescript
// Solo Sam Wilkie (Telegram ID: 1049458877) y Melissa Urbano (942528796)
```

---

## 7. ICONOGRAFÍA POR AGENTE

```typescript
export const AGENT_ICONS = {
  sammantha: '🎯',
  pixel: '🎨',
  kira: '🔬',
  nadia: '🧬',
  cipher: '🛡️',
  zephyr: '⚡',
  marlo: '📈',
  rebecca: '📸',
  leo: '💹',
  lina: '📚',
};
```

---

## 8. THRESHOLDS PARA ALERTAS

```typescript
export const MC_THRESHOLDS = {
  tryon: {
    successRate: { warning: 0.90, critical: 0.80 },
    avgResponseMs: { warning: 10000, critical: 20000 },
  },
  business: {
    trialToPaid: { warning: 0.08, critical: 0.05 },
    openRate: { warning: 0.20, critical: 0.15 },
    clickRate: { warning: 0.04, critical: 0.02 },
  },
  security: {
    failedLogins24h: { warning: 50, critical: 200 },
    criticalAlerts: { warning: 1, critical: 3 },
  },
  system: {
    uptime: { warning: 0.99, critical: 0.95 },
  },
  trading: {
    pnlDay: { warning: -100, critical: -500 },
  },
};
```

---

## 9. MOCK DATA

Para desarrollo inicial, usar los siguientes datos mock:

```typescript
export const MOCK_AGENTS: Agent[] = [
  { id: 'sammantha', name: 'Sammantha', role: 'Orquestadora', status: 'online', lastActivity: 'hace 2 min', statusMessage: 'Coordinando daily sync...', metrics: [
    { label: 'Tareas', value: 47, trend: '+12%' },
    { label: 'Reportes', value: 1, unit: '/día' },
    { label: 'Coordinación', value: '98%', type: 'percent' }
  ]},
  { id: 'pixel', name: 'Pixel', role: 'Frontend', status: 'online', lastActivity: 'hace 5 min', statusMessage: 'Revisando PR #234', metrics: [
    { label: 'Build', value: 'OK', type: 'status' },
    { label: 'Components', value: 23, trend: '+3' },
    { label: 'PR Open', value: 2, type: 'count' }
  ]},
  // ... resto de agentes
];

export const MOCK_TRYON_METRICS: TryOnMetrics = {
  last24h: 847,
  queue: { pending: 12, processing: 3, completed: 832, failed: 0 },
  avgResponseMs: 3400,
  successRate: 0.974
};

export const MOCK_BUSINESS_METRICS: BusinessMetrics = {
  mrr: 2400000,
  arr: 28800000,
  trialToPaidRate: 0.124,
  activeUsers7d: 847
};

export const MOCK_SYSTEM_STATUS: SystemStatus = {
  overall: 'healthy',
  services: [
    { name: 'API Main', status: 'up', uptime30d: 0.999 },
    { name: 'Supabase', status: 'up', uptime30d: 0.998 },
    { name: 'MinIO', status: 'up', uptime30d: 1.0 },
    { name: 'Traefik', status: 'up', uptime30d: 0.999 },
    { name: 'GROQ', status: 'up', latencyMs: 45 },
    { name: 'OpenRouter', status: 'up', latencyMs: 120 },
    { name: 'Wompi', status: 'up' },
    { name: 'Brevo', status: 'up' }
  ]
};
```

---

*SPEC.md — Lookitry Mission Control v1.0*
*Preparado para implementación en Next.js 14 + TypeScript + Tailwind*
*Última actualización: Abril 2026*