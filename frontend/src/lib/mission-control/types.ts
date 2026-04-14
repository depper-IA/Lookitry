// Lookitry Mission Control - Types & Interfaces
// v1.0 | Abril 2026

// ============================================================================
// AGENTS
// ============================================================================

export type AgentStatus = 'online' | 'busy' | 'offline';

export interface AgentMetric {
  label: string;
  value: string | number;
  type?: 'percent' | 'count' | 'status' | 'currency' | 'version' | 'ratio';
  trend?: string;
  alert?: (value: number | string) => boolean;
  unit?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  lastActivity: string;
  metrics: AgentMetric[];
  statusMessage: string;
  icon: string;
}

// ============================================================================
// TRY-ON / PRODUCT
// ============================================================================

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: 'tryon' | 'descriptor' | 'enterprise-sync';
  status: JobStatus;
  userId: string;
  createdAt: string;
  duration?: number;
}

export interface TryOnMetrics {
  last24h: number;
  yesterdayCount: number;
  queue: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  avgResponseMs: number;
  successRate: number;
  hourlyVolume: { hour: string; count: number }[];
  recentJobs: Job[];
}

export interface WebhookEvent {
  timestamp: string;
  success: boolean;
  endpoint: string;
  userId: string;
  durationMs: number;
  error?: string;
}

// ============================================================================
// BUSINESS METRICS
// ============================================================================

export interface RevenueByPlan {
  planName: string;
  subs: number;
  revenue: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
}

export interface BusinessMetrics {
  mrr: number;
  arr: number;
  trialToPaidRate: number;
  activeUsers7d: number;
  activeUsersDelta: number;
  revenueByPlan: RevenueByPlan[];
  leadsTotal: number;
  leadsEnriched: number;
  leadsThisWeek: number;
  contactRate: number;
  pipelineByStage: PipelineStage[];
  trialFunnel: {
    started: number;
    active7d: number;
    converted: number;
  };
}

// ============================================================================
// SECURITY
// ============================================================================

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface BlockedIP {
  ip: string;
  country: string;
  attempts: number;
  blockedAt: string;
}

export interface SecurityMetrics {
  failedLogins24h: number;
  blockedIPs: BlockedIP[];
  rateLimitActive: number;
  criticalAlerts: Alert[];
  auditScore: number;
  loginAttemptsByHour: { hour: string; success: number; failed: number }[];
}

// ============================================================================
// TRADING
// ============================================================================

export interface Position {
  id: string;
  pair: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
}

export interface Trade {
  id: string;
  timestamp: string;
  pair: string;
  type: 'BUY' | 'SELL';
  size: number;
  pnl: number;
  duration: string;
}

export interface TradingMetrics {
  balance: number;
  pnlToday: number;
  pnlTodayPercent: number;
  pnlWeek: number;
  pnlWeekPercent: number;
  pnlMonth: number;
  tradesToday: number;
  winRate: number;
  openPositions: Position[];
  equityCurve: { timestamp: string; equity: number }[];
  connected: boolean;
  exchange: string;
  latencyMs: number;
  tradeHistory: Trade[];
}

// ============================================================================
// GROWTH
// ============================================================================

export interface EmailCampaign {
  id: string;
  name: string;
  sent: number;
  openRate: number;
  clickRate: number;
  status: 'active' | 'paused' | 'completed';
}

export interface GrowthMetrics {
  emailCampaigns: EmailCampaign[];
  leads: {
    total: number;
    enriched: number;
    enrichedPercent: number;
    thisWeek: number;
    contactRate: number;
  };
  social: {
    postsThisWeek: number;
    engagement: number;
    followers: number;
    platform: string;
  };
  fiverr: {
    activeOrders: number;
    completedThisMonth: number;
    revenueUSD: number;
    orders: FiverrOrder[];
  };
}

export interface FiverrOrder {
  id: string;
  title: string;
  price: number;
  status: 'active' | 'delivered' | 'completed';
  deliveredAt: string;
}

// ============================================================================
// AUTOLOOKITRY
// ============================================================================

export type FeatureStatus = 'todo' | 'in_progress' | 'done';
export type AutolookitryStatus = 'development' | 'beta' | 'production';

export interface Feature {
  id: string;
  name: string;
  status: FeatureStatus;
}

export interface RoadmapItem {
  version: string;
  name: string;
  date: string;
  completed: boolean;
}

export interface AutolookitryMetrics {
  status: AutolookitryStatus;
  progress: number;
  features: Feature[];
  metrics: {
    automatedJobs: number;
    manualJobs: number;
    automationRatio: number;
    timeSavedHours: number;
    errorRate: number;
  };
  nextRelease: string;
  roadmap: RoadmapItem[];
}

// ============================================================================
// SYSTEM STATUS
// ============================================================================

export type ServiceStatus = 'up' | 'down' | 'degraded';

export interface Service {
  name: string;
  url?: string;
  status: ServiceStatus;
  latencyMs?: number;
  uptime30d: number;
}

export interface ContainerInfo {
  name: string;
  status: 'running' | 'stopped' | 'restarting';
  cpu: number;
  ram: string;
  uptime: string;
}

export interface UptimeBlock {
  hour: string;
  status: 'up' | 'down' | 'degraded';
}

export interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  services: Service[];
  dockerContainers: ContainerInfo[];
  uptimeLast7d: UptimeBlock[][];
  lastDocUpdate: string;
  changelogVersion: string;
  docsCompleteness: number;
}

// ============================================================================
// UI STATE
// ============================================================================

export type DrawerContent =
  | { type: 'agent'; agentId: string }
  | { type: 'job'; jobId: string }
  | { type: 'alert'; alertId: string }
  | { type: 'ip'; ip: string }
  | { type: 'campaign'; campaignId: string }
  | null;

export type DateRangeOption = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
  option: DateRangeOption;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  read: boolean;
}

// ============================================================================
// GLOBAL STATE
// ============================================================================

export interface MissionControlState {
  // Data
  agents: Agent[] | null;
  tryon: TryOnMetrics | null;
  business: BusinessMetrics | null;
  security: SecurityMetrics | null;
  trading: TradingMetrics | null;
  growth: GrowthMetrics | null;
  autolookitry: AutolookitryMetrics | null;
  system: SystemStatus | null;

  // UI State
  activeSection: string;
  dateRange: DateRange;
  drawerContent: DrawerContent;
  notifications: Notification[];
  globalStatus: 'healthy' | 'warning' | 'critical';

  // Loading states
  loading: {
    agents: boolean;
    tryon: boolean;
    business: boolean;
    security: boolean;
    trading: boolean;
    growth: boolean;
    autolookitry: boolean;
    system: boolean;
  };

  // Last updated timestamps
  lastUpdated: {
    agents: Date | null;
    tryon: Date | null;
    business: Date | null;
    security: Date | null;
    trading: Date | null;
    growth: Date | null;
    autolookitry: Date | null;
    system: Date | null;
  };
}