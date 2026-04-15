// Lookitry Mission Control - Constants, Mock Data & Thresholds
// v1.0 | Abril 2026

import type {
  Agent,
  TryOnMetrics,
  BusinessMetrics,
  SecurityMetrics,
  TradingMetrics,
  GrowthMetrics,
  AutolookitryMetrics,
  SystemStatus,
} from './types';

// ============================================================================
// THRESHOLDS
// ============================================================================

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
} as const;

// ============================================================================
// AGENT ICONS
// ============================================================================

export const AGENT_ICONS: Record<string, string> = {
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

// ============================================================================
// POLLING INTERVALS (ms)
// ============================================================================

export const POLLING_INTERVALS = {
  system: 10000,
  tryon: 5000,
  security: 15000,
  business: 60000,
  agents: 30000,
  trading: 30000,
  growth: 300000,
} as const;

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'sammantha',
    name: 'Sammantha',
    role: 'Orquestadora',
    status: 'online',
    lastActivity: 'hace 2 min',
    statusMessage: 'Coordinando daily sync con el equipo...',
    icon: '🎯',
    metrics: [
      { label: 'Tareas', value: 47, trend: '+12%' },
      { label: 'Reportes', value: 1, unit: '/día' },
      { label: 'Coordinación', value: '98%', type: 'percent' },
    ],
  },
  {
    id: 'pixel',
    name: 'Pixel',
    role: 'Frontend',
    status: 'online',
    lastActivity: 'hace 5 min',
    statusMessage: 'Revisando PR #234 para Mission Control',
    icon: '🎨',
    metrics: [
      { label: 'Build', value: 'OK', type: 'status' },
      { label: 'Components', value: 23, trend: '+3' },
      { label: 'PR Open', value: 2, type: 'count' },
    ],
  },
  {
    id: 'kira',
    name: 'Kira',
    role: 'QA',
    status: 'busy',
    lastActivity: 'hace 1 min',
    statusMessage: 'Ejecutando suite de tests E2E',
    icon: '🔬',
    metrics: [
      { label: 'Tests Pass', value: '94%', type: 'percent' },
      { label: 'Lint Errors', value: 0, type: 'count', alert: (v) => Number(v) > 0 },
      { label: 'Coverage', value: '87%', type: 'percent' },
    ],
  },
  {
    id: 'nadia',
    name: 'Nadia',
    role: 'Data/AI',
    status: 'online',
    lastActivity: 'hace 3 min',
    statusMessage: 'Optimizando queries de n8n flows',
    icon: '🧬',
    metrics: [
      { label: 'Queries/hora', value: 1240, trend: '+8%' },
      { label: 'AI Calls hoy', value: 3820, trend: '+15%' },
      { label: 'n8n Flows', value: 12, type: 'count' },
    ],
  },
  {
    id: 'cipher',
    name: 'Cipher',
    role: 'Security',
    status: 'online',
    lastActivity: 'hace 10 min',
    statusMessage: 'Monitoreando tráfico de API',
    icon: '🛡️',
    metrics: [
      { label: 'Alertas', value: 0, type: 'count', alert: (v) => Number(v) > 0 },
      { label: 'IPs Bloq.', value: 3, type: 'count' },
      { label: 'Audit Score', value: '96%', type: 'percent' },
    ],
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    role: 'Infra',
    status: 'online',
    lastActivity: 'hace 15 min',
    statusMessage: 'Docker containers 100% operativos',
    icon: '⚡',
    metrics: [
      { label: 'Services Up', value: '12/12', type: 'ratio' },
      { label: 'Uptime', value: '99.9%', type: 'percent' },
      { label: 'SSL Válido', value: 'OK', type: 'status' },
    ],
  },
  {
    id: 'marlo',
    name: 'Marlo',
    role: 'Growth',
    status: 'online',
    lastActivity: 'hace 8 min',
    statusMessage: 'Ejecutando campaña de email nurture',
    icon: '📈',
    metrics: [
      { label: 'Leads Hoy', value: 34, trend: '+22%' },
      { label: 'Open Rate', value: '28%', type: 'percent' },
      { label: 'CRM Enriq.', value: '83%', type: 'percent' },
    ],
  },
  {
    id: 'rebecca',
    name: 'Rebecca',
    role: 'UGC',
    status: 'busy',
    lastActivity: 'hace 30 min',
    statusMessage: 'Editando contenido para @look.itry_',
    icon: '📸',
    metrics: [
      { label: 'Posts/sem', value: 7, type: 'count' },
      { label: 'Engagement', value: '4.2%', type: 'percent' },
      { label: 'Fiverr $', value: 280, unit: 'USD', type: 'currency' },
    ],
  },
  {
    id: 'leo',
    name: 'Leo',
    role: 'Trading',
    status: 'online',
    lastActivity: 'hace 1 min',
    statusMessage: 'Analizando posición BTC/USDT',
    icon: '💹',
    metrics: [
      { label: 'P&L Hoy', value: '+$120', type: 'currency' },
      { label: 'Trades', value: 18, type: 'count' },
      { label: 'Win Rate', value: '67%', type: 'percent' },
    ],
  },
  {
    id: 'lina',
    name: 'Lina',
    role: 'Docs',
    status: 'online',
    lastActivity: 'hace 20 min',
    statusMessage: 'Actualizando CHANGELOG v2.4',
    icon: '📚',
    metrics: [
      { label: 'Docs Update', value: 8, trend: 'hoy', type: 'count' },
      { label: 'CHANGELOG', value: 'v2.4', type: 'version' },
      { label: 'Completitud', value: '91%', type: 'percent' },
    ],
  },
];

export const MOCK_TRYON_METRICS: TryOnMetrics = {
  last24h: 847,
  yesterdayCount: 762,
  queue: {
    pending: 12,
    processing: 3,
    completed: 832,
    failed: 0,
  },
  avgResponseMs: 3400,
  successRate: 0.974,
  hourlyVolume: [
    { hour: '00:00', count: 12 },
    { hour: '01:00', count: 8 },
    { hour: '02:00', count: 5 },
    { hour: '03:00', count: 4 },
    { hour: '04:00', count: 6 },
    { hour: '05:00', count: 15 },
    { hour: '06:00', count: 28 },
    { hour: '07:00', count: 45 },
    { hour: '08:00', count: 67 },
    { hour: '09:00', count: 89 },
    { hour: '10:00', count: 102 },
    { hour: '11:00', count: 95 },
    { hour: '12:00', count: 78 },
    { hour: '13:00', count: 65 },
    { hour: '14:00', count: 72 },
    { hour: '15:00', count: 88 },
    { hour: '16:00', count: 92 },
    { hour: '17:00', count: 78 },
    { hour: '18:00', count: 55 },
    { hour: '19:00', count: 42 },
    { hour: '20:00', count: 38 },
    { hour: '21:00', count: 29 },
    { hour: '22:00', count: 21 },
    { hour: '23:00', count: 15 },
  ],
  recentJobs: [
    { id: 'job-001', type: 'tryon', status: 'completed', userId: 'user_abc', createdAt: '2026-04-14T14:23:01Z', duration: 2300 },
    { id: 'job-002', type: 'tryon', status: 'completed', userId: 'user_xyz', createdAt: '2026-04-14T14:22:58Z', duration: 2800 },
    { id: 'job-003', type: 'descriptor', status: 'completed', userId: 'prod_123', createdAt: '2026-04-14T14:22:44Z', duration: 800 },
    { id: 'job-004', type: 'tryon', status: 'failed', userId: 'user_def', createdAt: '2026-04-14T14:22:31Z', duration: 25000 },
    { id: 'job-005', type: 'enterprise-sync', status: 'completed', userId: 'org_456', createdAt: '2026-04-14T14:22:18Z', duration: 1100 },
  ],
};

export const MOCK_BUSINESS_METRICS: BusinessMetrics = {
  mrr: 2400000,
  arr: 28800000,
  trialToPaidRate: 0.124,
  activeUsers7d: 847,
  activeUsersDelta: 124,
  revenueByPlan: [
    { planName: 'BASIC', subs: 42, revenue: 180000 },
    { planName: 'PRO', subs: 38, revenue: 350000 },
    { planName: 'SCALE', subs: 12, revenue: 700000 },
    { planName: 'TRIAL', subs: 67, revenue: 20000 },
  ],
  leadsTotal: 1247,
  leadsEnriched: 1035,
  leadsThisWeek: 89,
  contactRate: 0.34,
  pipelineByStage: [
    { stage: 'Lead', count: 234 },
    { stage: 'Calificado', count: 87 },
    { stage: 'Demo', count: 34 },
    { stage: 'Propuesta', count: 12 },
    { stage: 'Cerrado', count: 5 },
  ],
  trialFunnel: {
    started: 124,
    active7d: 89,
    converted: 16,
  },
};

export const MOCK_SECURITY_METRICS: SecurityMetrics = {
  failedLogins24h: 23,
  blockedIPs: [
    { ip: '191.x.x.x', country: 'CO', attempts: 47, blockedAt: 'hace 2h' },
    { ip: '104.x.x.x', country: 'US', attempts: 23, blockedAt: 'hace 5h' },
    { ip: '203.x.x.x', country: 'BR', attempts: 15, blockedAt: 'hace 8h' },
  ],
  rateLimitActive: 12,
  criticalAlerts: [],
  auditScore: 96,
  loginAttemptsByHour: [
    { hour: '08:00', success: 12, failed: 2 },
    { hour: '09:00', success: 28, failed: 1 },
    { hour: '10:00', success: 45, failed: 3 },
    { hour: '11:00', success: 52, failed: 5 },
    { hour: '12:00', success: 38, failed: 2 },
    { hour: '13:00', success: 25, failed: 1 },
    { hour: '14:00', success: 41, failed: 4 },
    { hour: '15:00', success: 48, failed: 3 },
    { hour: '16:00', success: 55, failed: 2 },
  ],
};

export const MOCK_TRADING_METRICS: TradingMetrics = {
  balance: 12450,
  pnlToday: 120,
  pnlTodayPercent: 0.97,
  pnlWeek: 890,
  pnlWeekPercent: 7.2,
  pnlMonth: 2340,
  tradesToday: 18,
  winRate: 0.67,
  openPositions: [
    { id: 'pos-001', pair: 'BTC/USDT', size: 0.05, entryPrice: 84200, currentPrice: 84890, pnl: 34.5 },
    { id: 'pos-002', pair: 'ETH/USDT', size: 0.8, entryPrice: 3140, currentPrice: 3195, pnl: 44 },
  ],
  equityCurve: Array.from({ length: 30 }, (_, i) => ({
    timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    equity: 10000 + Math.random() * 3000 + i * 80,
  })),
  connected: true,
  exchange: 'Binance Testnet',
  latencyMs: 12,
  tradeHistory: [
    { id: 'trade-001', timestamp: '2026-04-14T14:30:00Z', pair: 'BTC/USDT', type: 'BUY', size: 0.02, pnl: 45.2, duration: '2h 15m' },
    { id: 'trade-002', timestamp: '2026-04-14T12:15:00Z', pair: 'ETH/USDT', type: 'SELL', size: 0.5, pnl: -12.3, duration: '45m' },
    { id: 'trade-003', timestamp: '2026-04-14T10:00:00Z', pair: 'SOL/USDT', type: 'BUY', size: 5, pnl: 89.5, duration: '4h 30m' },
  ],
};

export const MOCK_GROWTH_METRICS: GrowthMetrics = {
  emailCampaigns: [
    { id: 'camp-001', name: 'Welcome Series', sent: 1240, openRate: 0.312, clickRate: 0.074, status: 'active' },
    { id: 'camp-002', name: 'Trial Nurture', sent: 847, openRate: 0.289, clickRate: 0.051, status: 'active' },
    { id: 'camp-003', name: 'Churn Prevention', sent: 312, openRate: 0.221, clickRate: 0.038, status: 'paused' },
  ],
  leads: {
    total: 1247,
    enriched: 1035,
    enrichedPercent: 0.83,
    thisWeek: 89,
    contactRate: 0.34,
  },
  social: {
    postsThisWeek: 7,
    engagement: 0.042,
    followers: 2847,
    platform: '@look.itry_',
  },
  fiverr: {
    activeOrders: 3,
    completedThisMonth: 8,
    revenueUSD: 280,
    orders: [
      { id: 'fiv-001', title: 'Virtual Try-On Demo', price: 150, status: 'active', deliveredAt: '' },
      { id: 'fiv-002', title: 'Product Showcase Video', price: 80, status: 'active', deliveredAt: '' },
      { id: 'fiv-003', title: 'Brand Guidelines', price: 50, status: 'delivered', deliveredAt: '2026-04-10' },
    ],
  },
};

export const MOCK_AUTOLOOKITRY_METRICS: AutolookitryMetrics = {
  status: 'development',
  progress: 0.8,
  features: [
    { id: 'feat-001', name: 'API auto-queue', status: 'todo' },
    { id: 'feat-002', name: 'Batch upload', status: 'todo' },
    { id: 'feat-003', name: 'Auto-retry', status: 'in_progress' },
    { id: 'feat-004', name: 'Smart caching', status: 'in_progress' },
    { id: 'feat-005', name: 'Webhook retry', status: 'in_progress' },
    { id: 'feat-006', name: 'Job scheduler', status: 'done' },
    { id: 'feat-007', name: 'Queue monitor', status: 'done' },
    { id: 'feat-008', name: 'Basic retry', status: 'done' },
  ],
  metrics: {
    automatedJobs: 423,
    manualJobs: 1247,
    automationRatio: 0.253,
    timeSavedHours: 47,
    errorRate: 0.023,
  },
  nextRelease: '2026-04-28',
  roadmap: [
    { version: 'v0.1', name: 'Basic Retry', date: '2026-02-15', completed: true },
    { version: 'v0.2', name: 'Job Scheduler', date: '2026-03-01', completed: true },
    { version: 'v0.3', name: 'Queue Monitor', date: '2026-03-15', completed: true },
    { version: 'v0.4', name: 'Auto-Retry', date: '2026-04-10', completed: true },
    { version: 'v1.0', name: 'Launch', date: '2026-05-01', completed: false },
    { version: 'v1.1', name: 'Scale', date: '2026-06-01', completed: false },
  ],
};

export const MOCK_SYSTEM_STATUS: SystemStatus = {
  overall: 'healthy',
  services: [
    { name: 'API Main', status: 'up', latencyMs: 45, uptime30d: 0.999 },
    { name: 'Supabase', status: 'up', latencyMs: 38, uptime30d: 0.998 },
    { name: 'MinIO', status: 'up', uptime30d: 1.0 },
    { name: 'Traefik', status: 'up', uptime30d: 0.999 },
    { name: 'GROQ', status: 'up', latencyMs: 120, uptime30d: 0.995 },
    { name: 'OpenRouter', status: 'up', latencyMs: 200, uptime30d: 0.992 },
    { name: 'Wompi', status: 'up', uptime30d: 1.0 },
    { name: 'Brevo', status: 'up', latencyMs: 85, uptime30d: 0.997 },
  ],
  dockerContainers: [
    { name: 'lookitry-api', status: 'running', cpu: 12, ram: '890MB', uptime: '7d 4h' },
    { name: 'lookitry-frontend', status: 'running', cpu: 3, ram: '210MB', uptime: '7d 4h' },
    { name: 'supabase-db', status: 'running', cpu: 8, ram: '1.2GB', uptime: '14d 2h' },
    { name: 'minio', status: 'running', cpu: 1, ram: '140MB', uptime: '14d 2h' },
    { name: 'traefik', status: 'running', cpu: 0.5, ram: '45MB', uptime: '14d 2h' },
  ],
  uptimeLast7d: Array.from({ length: 8 }, (_, dayIndex) =>
    Array.from({ length: 24 }, (_, hourIndex) => ({
      hour: `${hourIndex.toString().padStart(2, '0')}:00`,
      status: Math.random() > 0.02 ? 'up' as const : 'degraded' as const,
    }))
  ),
  lastDocUpdate: '2026-04-14T10:30:00Z',
  changelogVersion: 'v2.4',
  docsCompleteness: 0.91,
};

// ============================================================================
// NAVIGATION
// ============================================================================

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'Grid', badge: null },
  { id: 'agents', label: 'Agentes', icon: 'Cpu', badge: '10' },
  { id: 'product', label: 'Try-On', icon: 'Zap', badge: null },
  { id: 'business', label: 'Business', icon: 'TrendingUp', badge: null },
  { id: 'security', label: 'Seguridad', icon: 'Shield', badge: null },
  { id: 'growth', label: 'Growth', icon: 'Megaphone', badge: null },
  { id: 'trading', label: 'Trading', icon: 'Activity', badge: null },
  { id: 'autolookitry', label: 'Autolookitry', icon: 'Bot', badge: 'BETA' },
  { id: 'system', label: 'Sistema', icon: 'Server', badge: null },
] as const;

// ============================================================================
// FORMATTERS HELPERS
// ============================================================================

export const formatCOP = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatUSD = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};