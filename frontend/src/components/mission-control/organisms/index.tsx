// Lookitry Mission Control - Main Organisms
// v1.0 | Abril 2026

'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Agent, TryOnMetrics, SystemStatus, BusinessMetrics, SecurityMetrics, GrowthMetrics, TradingMetrics, AutolookitryMetrics } from '@/lib/mission-control/types';
import { MOCK_AGENTS, MOCK_TRYON_METRICS, MOCK_SYSTEM_STATUS, MOCK_BUSINESS_METRICS, MOCK_SECURITY_METRICS, MOCK_GROWTH_METRICS, MOCK_TRADING_METRICS, MOCK_AUTOLOOKITRY_METRICS, formatCOP, formatUSD, formatPercent } from '@/lib/mission-control/constants';
import { AgentCard, QueueBar, WebhookFeed, ServiceTile, KanbanCard, TimelineNode, EmptyState } from '../molecules';
import { Section, GridArea } from './MCLayout';
import { StatCard, ProgressBar, StatusDot, Badge } from '../atoms';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Bot, Zap, Server } from 'lucide-react';

// ============================================================================
// AgentsGrid - Grid 5x2 de AgentCards
// ============================================================================

interface AgentsGridProps {
  agents?: Agent[];
  onAgentClick?: (agentId: string) => void;
}

export function AgentsGrid({ agents = MOCK_AGENTS, onAgentClick }: AgentsGridProps) {
  return (
    <Section title="Equipo de Agentes" subtitle="10 agentes activos monitorizando operaciones">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {agents.map((agent, idx) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <AgentCard
              agent={agent}
              onClick={() => onAgentClick?.(agent.id)}
            />
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

// ============================================================================
// TryOnQueue - Panel completo de queue + feed
// ============================================================================

interface TryOnQueueProps {
  metrics?: TryOnMetrics;
}

export function TryOnQueue({ metrics = MOCK_TRYON_METRICS }: TryOnQueueProps) {
  const queueTotal = metrics.queue.pending + metrics.queue.processing + metrics.queue.completed + metrics.queue.failed;
  const changePercent = ((metrics.last24h - metrics.yesterdayCount) / metrics.yesterdayCount * 100).toFixed(1);
  
  // Convertir jobs a webhook events para el feed
  const webhookEvents = metrics.recentJobs.map(job => ({
    timestamp: job.createdAt,
    success: job.status === 'completed',
    endpoint: `/webhook/${job.type}`,
    userId: job.userId,
    durationMs: job.duration || 0,
    error: job.status === 'failed' ? 'timeout' : undefined,
  }));

  return (
    <Section
      title="Virtual Try-On"
      subtitle="Cola de procesamiento y actividad de webhooks"
      actions={
        <div className="flex items-center gap-2">
          <Badge variant={metrics.successRate > 0.95 ? 'ok' : metrics.successRate > 0.90 ? 'warning' : 'error'}>
            Success: {formatPercent(metrics.successRate)}
          </Badge>
        </div>
      }
    >
      {/* KPI Row */}
      <GridArea cols={4} gap="md" className="mb-6">
        <StatCard
          label="Try-Ons 24h"
          value={metrics.last24h.toLocaleString()}
          trend={`${parseFloat(changePercent) > 0 ? '+' : ''}${changePercent}%`}
          trendDirection={parseFloat(changePercent) > 0 ? 'up' : 'down'}
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          label="En Cola"
          value={queueTotal}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Tiempo Promedio"
          value={`${(metrics.avgResponseMs / 1000).toFixed(1)}s`}
        />
        <StatCard
          label="Tasa Éxito"
          value={formatPercent(metrics.successRate)}
          accent={metrics.successRate > 0.95}
        />
      </GridArea>

      {/* Queue + Feed */}
      <GridArea cols={2} gap="md">
        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <h3 className="mb-4 font-display text-sm font-semibold text-[#F0F0F0]">Estado de Cola</h3>
          <QueueBar
            pending={metrics.queue.pending}
            processing={metrics.queue.processing}
            completed={metrics.queue.completed}
            failed={metrics.queue.failed}
          />
        </div>

        <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
          <h3 className="mb-4 font-display text-sm font-semibold text-[#F0F0F0]">Webhook Stream</h3>
          <WebhookFeed events={webhookEvents} maxEvents={10} />
        </div>
      </GridArea>
    </Section>
  );
}

// ============================================================================
// SystemStatusGrid - Grid de servicios + uptime
// ============================================================================

interface SystemStatusGridProps {
  status?: SystemStatus;
}

export function SystemStatusGrid({ status = MOCK_SYSTEM_STATUS }: SystemStatusGridProps) {
  const serviceTiles = status.services.map(svc => ({
    name: svc.name,
    status: svc.status as 'up' | 'down' | 'degraded',
    latencyMs: svc.latencyMs,
    uptime: `${(svc.uptime30d * 100).toFixed(1)}%`,
  }));

  return (
    <Section
      title="Estado del Sistema"
      subtitle="Todos los servicios operativos"
      actions={
        <Badge variant={status.overall === 'healthy' ? 'ok' : status.overall === 'warning' ? 'warning' : 'critical'}>
          {status.overall.toUpperCase()}
        </Badge>
      }
    >
      {/* Services Grid */}
      <GridArea cols={4} gap="md" className="mb-6">
        {serviceTiles.map((svc, idx) => (
          <motion.div
            key={svc.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <ServiceTile {...svc} />
          </motion.div>
        ))}
      </GridArea>

      {/* Docker Containers */}
      <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
        <h3 className="mb-4 font-display text-sm font-semibold text-[#F0F0F0]">Docker Containers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e1e] text-left text-xs uppercase tracking-wider text-[#555555]">
                <th className="pb-2">Container</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">CPU</th>
                <th className="pb-2">RAM</th>
                <th className="pb-2">Uptime</th>
              </tr>
            </thead>
            <tbody>
              {status.dockerContainers.map((container, idx) => (
                <motion.tr
                  key={container.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-[#1e1e1e]/50 hover:bg-[#1e1e1e]/30"
                >
                  <td className="py-2 font-mono text-[#F0F0F0]">{container.name}</td>
                  <td className="py-2">
                    <StatusDot status={container.status === 'running' ? 'up' : 'down'} size="sm" />
                  </td>
                  <td className="py-2 font-mono text-[#888888]">{container.cpu}%</td>
                  <td className="py-2 font-mono text-[#888888]">{container.ram}</td>
                  <td className="py-2 text-[#555555]">{container.uptime}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

// ============================================================================
// BusinessKPIs - Row de KPI cards + charts
// ============================================================================

interface BusinessKPIsProps {
  metrics?: BusinessMetrics;
}

export function BusinessKPIs({ metrics = MOCK_BUSINESS_METRICS }: BusinessKPIsProps) {
  return (
    <Section
      title="Métricas de Negocio"
      subtitle="Revenue y métricas de crecimiento"
    >
      {/* KPI Cards */}
      <GridArea cols={4} gap="md" className="mb-6">
        <StatCard
          label="MRR"
          value={formatCOP(metrics.mrr)}
          trend="+8%"
          trendDirection="up"
          icon={<TrendingUp className="h-4 w-4" />}
          accent
        />
        <StatCard
          label="ARR"
          value={formatCOP(metrics.arr)}
          trend="+8%"
          trendDirection="up"
        />
        <StatCard
          label="Trial → Paid"
          value={`${(metrics.trialToPaidRate * 100).toFixed(1)}%`}
          trend="▲ meta"
          trendDirection="up"
        />
        <StatCard
          label="Users Activos 7d"
          value={metrics.activeUsers7d.toLocaleString()}
          trend={`+${metrics.activeUsersDelta}`}
          trendDirection="up"
        />
      </GridArea>

      {/* Revenue by Plan */}
      <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
        <h3 className="mb-4 font-display text-sm font-semibold text-[#F0F0F0]">Revenue por Plan</h3>
        <div className="flex items-end justify-around gap-4">
          {metrics.revenueByPlan.map((plan, idx) => {
            const maxRevenue = Math.max(...metrics.revenueByPlan.map(p => p.revenue));
            const height = (plan.revenue / maxRevenue) * 150;
            
            return (
              <motion.div
                key={plan.planName}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 rounded-t-lg bg-[#FF5C3A]/20" style={{ height }}>
                  <div className="flex h-full items-end justify-center pb-2">
                    <span className="font-mono text-sm font-medium text-[#FF5C3A]">
                      {formatCOP(plan.revenue)}
                    </span>
                  </div>
                </div>
                <span className="mt-2 text-sm font-medium text-[#F0F0F0]">{plan.planName}</span>
                <span className="text-xs text-[#555555]">{plan.subs} subs</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// ============================================================================
// SecurityPanel - Dashboard Cipher completo
// ============================================================================

interface SecurityPanelProps {
  metrics?: SecurityMetrics;
}

export function SecurityPanel({ metrics = MOCK_SECURITY_METRICS }: SecurityPanelProps) {
  return (
    <Section
      title="Seguridad"
      subtitle="Monitoreo de Cipher"
      actions={
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#888888]">Audit Score:</span>
          <span className="font-mono text-lg font-bold text-[#00E5A0]">{metrics.auditScore}%</span>
        </div>
      }
    >
      {/* KPI Cards */}
      <GridArea cols={3} gap="md" className="mb-6">
        <StatCard
          label="Login Fallidos 24h"
          value={metrics.failedLogins24h}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="IPs Bloqueadas"
          value={metrics.blockedIPs.length}
        />
        <StatCard
          label="Rate Limits Activos"
          value={metrics.rateLimitActive}
        />
      </GridArea>

      {/* Blocked IPs Table */}
      <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
        <h3 className="mb-4 font-display text-sm font-semibold text-[#F0F0F0]">IPs Bloqueadas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e1e] text-left text-xs uppercase tracking-wider text-[#555555]">
                <th className="pb-2">IP</th>
                <th className="pb-2">País</th>
                <th className="pb-2">Intentos</th>
                <th className="pb-2">Bloqueada hace</th>
              </tr>
            </thead>
            <tbody>
              {metrics.blockedIPs.map((ip, idx) => (
                <motion.tr
                  key={ip.ip}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-[#1e1e1e]/50 hover:bg-[#1e1e1e]/30"
                >
                  <td className="py-2 font-mono text-[#FF3A5C]">{ip.ip}</td>
                  <td className="py-2 text-[#888888]">{ip.country}</td>
                  <td className="py-2 font-mono text-[#888888]">{ip.attempts}</td>
                  <td className="py-2 text-[#555555]">{ip.blockedAt}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}

// ============================================================================
// GrowthPanel - Marlo + Rebecca combinados
// ============================================================================

interface GrowthPanelProps {
  metrics?: GrowthMetrics;
}

export function GrowthPanel({ metrics = MOCK_GROWTH_METRICS }: GrowthPanelProps) {
  return (
    <Section
      title="Marketing & Growth"
      subtitle="Marlo + Rebecca"
    >
      {/* Email Campaigns */}
      <div className="mb-6 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
        <h3 className="mb-4 font-display text-sm font-semibold text-[#F0F0F0]">Email Campaigns</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e] text-left text-xs uppercase tracking-wider text-[#555555]">
              <th className="pb-2">Campaña</th>
              <th className="pb-2">Enviados</th>
              <th className="pb-2">Open%</th>
              <th className="pb-2">Click%</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {metrics.emailCampaigns.map((campaign, idx) => (
              <motion.tr
                key={campaign.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-b border-[#1e1e1e]/50"
              >
                <td className="py-3 font-medium text-[#F0F0F0]">{campaign.name}</td>
                <td className="py-3 font-mono text-[#888888]">{campaign.sent.toLocaleString()}</td>
                <td className="py-3">
                  <span className={cn(
                    'font-mono',
                    campaign.openRate > 0.25 ? 'text-[#00E5A0]' : 'text-[#FFB547]'
                  )}>
                    {(campaign.openRate * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="py-3">
                  <span className={cn(
                    'font-mono',
                    campaign.clickRate > 0.05 ? 'text-[#00E5A0]' : 'text-[#FFB547]'
                  )}>
                    {(campaign.clickRate * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="py-3">
                  <Badge
                    variant={campaign.status === 'active' ? 'online' : campaign.status === 'paused' ? 'warning' : 'offline'}
                    size="sm"
                  >
                    {campaign.status.toUpperCase()}
                  </Badge>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* KPIs Row */}
      <GridArea cols={4} gap="md">
        <StatCard label="Total Leads" value={metrics.leads.total.toLocaleString()} trend="+89" trendDirection="up" />
        <StatCard label="Enriquecidos" value={`${(metrics.leads.enrichedPercent * 100).toFixed(0)}%`} />
        <StatCard label="Posts/semana" value={metrics.social.postsThisWeek} />
        <StatCard label="Fiverr USD" value={`$${metrics.fiverr.revenueUSD}`} />
      </GridArea>
    </Section>
  );
}

// ============================================================================
// TradingPanel - Leo panel completo
// ============================================================================

interface TradingPanelProps {
  metrics?: TradingMetrics;
}

export function TradingPanel({ metrics = MOCK_TRADING_METRICS }: TradingPanelProps) {
  return (
    <Section
      title="Trading"
      subtitle="Panel de Leo"
      actions={
        <Badge variant={metrics.connected ? 'online' : 'error'} size="sm">
          {metrics.connected ? '● CONECTADO' : '○ DESCONECTADO'} {metrics.exchange}
        </Badge>
      }
    >
      {/* KPIs Row */}
      <GridArea cols={4} gap="md" className="mb-6">
        <StatCard
          label="Balance"
          value={formatUSD(metrics.balance)}
          icon={<Server className="h-4 w-4" />}
          accent
        />
        <StatCard
          label="P&L Hoy"
          value={metrics.pnlToday > 0 ? `+${formatUSD(metrics.pnlToday)}` : formatUSD(metrics.pnlToday)}
          trend={`${metrics.pnlTodayPercent > 0 ? '+' : ''}${metrics.pnlTodayPercent}%`}
          trendDirection={metrics.pnlToday >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="P&L Semana"
          value={metrics.pnlWeek > 0 ? `+${formatUSD(metrics.pnlWeek)}` : formatUSD(metrics.pnlWeek)}
          trend="+7.2%"
          trendDirection="up"
        />
        <StatCard
          label="Trades Hoy"
          value={metrics.tradesToday}
        />
      </GridArea>

      {/* Open Positions */}
      <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
        <h3 className="mb-4 font-display text-sm font-semibold text-[#F0F0F0]">Posiciones Abiertas</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e] text-left text-xs uppercase tracking-wider text-[#555555]">
              <th className="pb-2">Par</th>
              <th className="pb-2">Size</th>
              <th className="pb-2">Entry</th>
              <th className="pb-2">Current</th>
              <th className="pb-2">P&L</th>
            </tr>
          </thead>
          <tbody>
            {metrics.openPositions.map((pos, idx) => (
              <motion.tr
                key={pos.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-b border-[#1e1e1e]/50"
              >
                <td className="py-3 font-mono font-medium text-[#F0F0F0]">{pos.pair}</td>
                <td className="py-3 font-mono text-[#888888]">{pos.size}</td>
                <td className="py-3 font-mono text-[#888888]">{pos.entryPrice.toLocaleString()}</td>
                <td className="py-3 font-mono text-[#888888]">{pos.currentPrice.toLocaleString()}</td>
                <td className={cn(
                  'py-3 font-mono font-medium',
                  pos.pnl >= 0 ? 'text-[#00E5A0]' : 'text-[#FF3A5C]'
                )}>
                  {pos.pnl >= 0 ? '+' : ''}{formatUSD(pos.pnl)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ============================================================================
// AutolookitryPanel - Panel Autolookitry completo
// ============================================================================

interface AutolookitryPanelProps {
  metrics?: AutolookitryMetrics;
}

export function AutolookitryPanel({ metrics = MOCK_AUTOLOOKITRY_METRICS }: AutolookitryPanelProps) {
  const columns = {
    todo: metrics.features.filter(f => f.status === 'todo'),
    in_progress: metrics.features.filter(f => f.status === 'in_progress'),
    done: metrics.features.filter(f => f.status === 'done'),
  };

  return (
    <Section
      title="Autolookitry"
      subtitle="Automatización inteligente de Virtual Try-On"
      actions={<Badge variant="beta">BETA</Badge>}
    >
      {/* Progress Banner */}
      <div className="mb-6 rounded-lg border border-[#FF5C3A]/30 bg-[#FF5C3A]/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-[#FF5C3A]" />
            <div>
              <h3 className="font-display text-sm font-semibold text-[#F0F0F0]">Autolookitry</h3>
              <p className="text-xs text-[#888888]">Estado: EN DESARROLLO</p>
            </div>
          </div>
          <span className="font-mono text-lg font-bold text-[#FF5C3A]">
            {Math.round(metrics.progress * 100)}%
          </span>
        </div>
        <ProgressBar value={metrics.progress * 100} color="accent" showLabel={false} size="md" className="mt-4" />
      </div>

      {/* Kanban Board */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {(['todo', 'in_progress', 'done'] as const).map((column) => (
          <div key={column} className="rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-3">
            <h4 className={cn(
              'mb-3 text-xs font-medium uppercase tracking-wider',
              column === 'todo' ? 'text-[#555555]' : column === 'in_progress' ? 'text-[#FFB547]' : 'text-[#00E5A0]'
            )}>
              {column === 'todo' ? 'TODO' : column === 'in_progress' ? 'EN PROGRESO' : 'DONE'}
            </h4>
            <div className="space-y-2">
              {columns[column].map((feature) => (
                <KanbanCard key={feature.id} name={feature.name} status={feature.status} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <GridArea cols={4} gap="md">
        <StatCard
          label="Jobs Automatizados"
          value={metrics.metrics.automatedJobs.toLocaleString()}
        />
        <StatCard
          label="Ratio Automación"
          value={`${(metrics.metrics.automationRatio * 100).toFixed(1)}%`}
        />
        <StatCard
          label="Tiempo Ahorrado"
          value={`${metrics.metrics.timeSavedHours}h`}
        />
        <StatCard
          label="Tasa Error"
          value={`${(metrics.metrics.errorRate * 100).toFixed(1)}%`}
        />
      </GridArea>

      {/* Roadmap */}
      <div className="mt-6 rounded-lg border border-[#1e1e1e] bg-[#111111] p-4">
        <h3 className="mb-4 font-display text-sm font-semibold text-[#F0F0F0]">Roadmap</h3>
        <div className="space-y-0">
          {metrics.roadmap.map((item, idx) => (
            <TimelineNode
              key={item.version}
              version={item.version}
              name={item.name}
              date={item.date}
              completed={item.completed}
              isLast={idx === metrics.roadmap.length - 1}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

// ============================================================================
// OverviewStats - Stats para la página principal
// ============================================================================

interface OverviewStatsProps {
  agentCount?: number;
  systemStatus?: 'healthy' | 'warning' | 'critical';
  tryons24h?: number;
  activeUsers?: number;
  pnlToday?: number;
}

export function OverviewStats({
  agentCount = 10,
  systemStatus = 'healthy',
  tryons24h = 847,
  activeUsers = 847,
  pnlToday = 120,
}: OverviewStatsProps) {
  return (
    <Section title="Mission Control Overview" subtitle="Resumen operativo en tiempo real">
      <GridArea cols={4} gap="md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-[#FF5C3A]/30 bg-gradient-to-br from-[#FF5C3A]/10 to-transparent p-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-xs text-[#888888]">Agentes Activos</p>
              <p className="font-mono text-2xl font-bold text-[#FF5C3A]">{agentCount}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
        >
          <div className="flex items-center gap-2">
            <StatusDot status={systemStatus === 'healthy' ? 'up' : systemStatus === 'warning' ? 'degraded' : 'down'} size="lg" />
            <div>
              <p className="text-xs text-[#888888]">Sistema</p>
              <p className={cn(
                'font-mono text-lg font-bold',
                systemStatus === 'healthy' ? 'text-[#00E5A0]' : systemStatus === 'warning' ? 'text-[#FFB547]' : 'text-[#FF3A5C]'
              )}>
                {systemStatus.toUpperCase()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
        >
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#FF5C3A]" />
            <div>
              <p className="text-xs text-[#888888]">Try-Ons 24h</p>
              <p className="font-mono text-2xl font-bold text-[#F0F0F0]">{tryons24h.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#00E5A0]" />
            <div>
              <p className="text-xs text-[#888888]">Users Activos</p>
              <p className="font-mono text-2xl font-bold text-[#F0F0F0]">{activeUsers.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-4"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className={cn('h-5 w-5', pnlToday >= 0 ? 'text-[#00E5A0]' : 'text-[#FF3A5C]')} />
            <div>
              <p className="text-xs text-[#888888]">P&L Trading</p>
              <p className={cn(
                'font-mono text-2xl font-bold',
                pnlToday >= 0 ? 'text-[#00E5A0]' : 'text-[#FF3A5C]'
              )}>
                {pnlToday >= 0 ? '+' : ''}{formatUSD(pnlToday)}
              </p>
            </div>
          </div>
        </motion.div>
      </GridArea>
    </Section>
  );
}