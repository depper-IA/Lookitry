// Lookitry Mission Control - Molecules Components
// v1.0 | Abril 2026

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Agent, Job, Alert, WebhookEvent } from '@/lib/mission-control/types';
import { StatusDot, Badge } from '../atoms';

// ============================================================================
// AgentCard - Card completa de agente
// ============================================================================

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const statusColors = {
    online: 'text-[#00E5A0]',
    busy: 'text-[#FFB547]',
    offline: 'text-[#888888]',
  };

  const getMetricTypeStyle = (metric: typeof agent.metrics[0]) => {
    if (metric.type === 'status') {
      return metric.value === 'OK' ? 'text-[#00E5A0]' : 'text-[#FF3A5C]';
    }
    if (metric.type === 'percent') {
      return 'text-[#F0F0F0]';
    }
    if (metric.trend) {
      return metric.trend.startsWith('+') ? 'text-[#00E5A0]' : 'text-[#FF3A5C]';
    }
    return 'text-[#F0F0F0]';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, borderColor: 'rgba(255,92,58,0.3)' }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg border border-[#1e1e1e] bg-[#111111] p-4 transition-all duration-200',
        'hover:shadow-[0_0_30px_rgba(255,92,58,0.1)]'
      )}
    >
      {/* Header: Status + Name */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={agent.status} size="md" />
          <span className="text-xl">{agent.icon}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={agent.status === 'online' ? 'online' : agent.status === 'busy' ? 'busy' : 'offline'}
            size="sm"
          >
            {agent.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="mt-2">
        <h3 className="font-display text-lg font-semibold text-[#F0F0F0]">
          {agent.name}
        </h3>
        <p className="text-sm text-[#888888]">{agent.role}</p>
      </div>

      {/* Metrics Row */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {agent.metrics.slice(0, 3).map((metric, idx) => (
          <div key={idx} className="text-center">
            <div className={cn('font-mono text-sm font-medium', getMetricTypeStyle(metric))}>
              {metric.value}
              {metric.unit && <span className="text-xs text-[#888888]">{metric.unit}</span>}
            </div>
            <div className="text-xs text-[#555555]">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Status Message */}
      <div className="mt-4 border-t border-[#1e1e1e] pt-3">
        <p className="text-sm italic text-[#888888]">&ldquo;{agent.statusMessage}&rdquo;</p>
        <p className="mt-1 text-xs text-[#555555]">{agent.lastActivity}</p>
      </div>

      {/* Hover glow effect */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{
        background: 'radial-gradient(circle at 50% 0%, rgba(255,92,58,0.05) 0%, transparent 70%)'
      }} />
    </motion.div>
  );
}

// ============================================================================
// QueueBar - Barra stackeada de cola de jobs
// ============================================================================

interface QueueBarProps {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export function QueueBar({ pending, processing, completed, failed }: QueueBarProps) {
  const total = pending + processing + completed + failed;
  
  if (total === 0) {
    return (
      <div className="flex h-8 w-full items-center justify-center rounded-lg bg-[#1e1e1e]">
        <span className="text-sm text-[#555555]">Sin jobs en cola</span>
      </div>
    );
  }

  const segments = [
    { value: pending, color: 'bg-[#FFB547]', label: 'Pendiente' },
    { value: processing, color: 'bg-[#5C8AFF]', label: 'Procesando' },
    { value: completed, color: 'bg-[#00E5A0]', label: 'Completado' },
    { value: failed, color: 'bg-[#FF3A5C]', label: 'Fallido' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex h-8 w-full overflow-hidden rounded-lg">
        {segments.map((segment, idx) => {
          const width = (segment.value / total) * 100;
          if (width === 0) return null;
          return (
            <motion.div
              key={idx}
              initial={{ width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
              className={cn('flex items-center justify-center', segment.color)}
              title={`${segment.label}: ${segment.value}`}
            >
              {width > 10 && (
                <span className="text-xs font-medium text-[#0a0a0a]">
                  {segment.value}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {segments.map((segment, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <div className={cn('h-2 w-2 rounded-full', segment.color)} />
            <span className="text-[#888888]">{segment.label}: {segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// WebhookFeed - Stream de eventos auto-scroll
// ============================================================================

interface WebhookFeedProps {
  events: WebhookEvent[];
  maxEvents?: number;
}

export function WebhookFeed({ events, maxEvents = 20 }: WebhookFeedProps) {
  const displayEvents = events.slice(0, maxEvents);

  return (
    <div className="space-y-1 font-mono text-xs">
      {displayEvents.map((event, idx) => (
        <motion.div
          key={`${event.timestamp}-${idx}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.02 }}
          className={cn(
            'flex items-center gap-2 rounded px-2 py-1',
            event.success ? 'hover:bg-[#1e1e1e]' : 'bg-[#FF3A5C]/5 hover:bg-[#FF3A5C]/10'
          )}
        >
          <span className="text-[#555555]">[{event.timestamp.split('T')[1]?.slice(0, 8)}]</span>
          {event.success ? (
            <span className="text-[#00E5A0]">✓</span>
          ) : (
            <span className="text-[#FF3A5C]">✗</span>
          )}
          <span className="text-[#888888]">{event.endpoint}</span>
          <span className="text-[#555555]">→</span>
          <span className={event.success ? 'text-[#888888]' : 'text-[#FF3A5C]'}>
            {event.success ? `${event.durationMs}ms` : event.error || 'timeout'}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// AlertItem - Item de alerta con severidad + mensaje
// ============================================================================

interface AlertItemProps {
  alert: Alert;
  onClick?: () => void;
}

const SEVERITY_STYLES = {
  critical: {
    bg: 'bg-[#FF3A5C]/10',
    border: 'border-[#FF3A5C]/30',
    text: 'text-[#FF3A5C]',
    icon: '●',
  },
  high: {
    bg: 'bg-[#FF5C3A]/10',
    border: 'border-[#FF5C3A]/30',
    text: 'text-[#FF5C3A]',
    icon: '▲',
  },
  medium: {
    bg: 'bg-[#FFB547]/10',
    border: 'border-[#FFB547]/30',
    text: 'text-[#FFB547]',
    icon: '■',
  },
  low: {
    bg: 'bg-[#888888]/10',
    border: 'border-[#888888]/30',
    text: 'text-[#888888]',
    icon: '○',
  },
};

export function AlertItem({ alert, onClick }: AlertItemProps) {
  const style = SEVERITY_STYLES[alert.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-200',
        style.bg,
        style.border,
        alert.resolved && 'opacity-50'
      )}
    >
      <span className={cn('mt-0.5 text-sm', style.text)}>{style.icon}</span>
      <div className="flex-1">
        <p className={cn('text-sm font-medium', style.text)}>{alert.message}</p>
        <p className="mt-1 text-xs text-[#555555]">{alert.timestamp}</p>
      </div>
      {alert.resolved && (
        <Badge variant="ok" size="sm">Resuelto</Badge>
      )}
    </motion.div>
  );
}

// ============================================================================
// ServiceTile - Tile de servicio con status y uptime
// ============================================================================

interface ServiceTileProps {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  uptime?: string;
}

export function ServiceTile({ name, status, latencyMs, uptime }: ServiceTileProps) {
  const statusStyles = {
    up: 'border-[#00E5A0]/20 bg-[#00E5A0]/5',
    down: 'border-[#FF3A5C]/20 bg-[#FF3A5C]/5',
    degraded: 'border-[#FFB547]/20 bg-[#FFB547]/5',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border p-4 transition-all duration-200',
        statusStyles[status]
      )}
    >
      <StatusDot status={status} size="lg" />
      <h4 className="mt-2 font-display text-sm font-medium text-[#F0F0F0]">{name}</h4>
      <p className="text-xs text-[#888888]">
        {status === 'up' ? 'Operativo' : status === 'down' ? 'Caído' : 'Degradado'}
      </p>
      {latencyMs && (
        <p className="mt-1 font-mono text-xs text-[#555555]">{latencyMs}ms</p>
      )}
      {uptime && (
        <p className="mt-1 text-xs text-[#888888]">{uptime}</p>
      )}
    </div>
  );
}

// ============================================================================
// KanbanCard - Tarjeta de feature en kanban
// ============================================================================

interface KanbanCardProps {
  name: string;
  status: 'todo' | 'in_progress' | 'done';
}

export function KanbanCard({ name, status }: KanbanCardProps) {
  const statusStyles = {
    todo: 'border-[#2a2a2a] bg-[#0a0a0a]',
    in_progress: 'border-[#FFB547]/30 bg-[#FFB547]/5',
    done: 'border-[#00E5A0]/30 bg-[#00E5A0]/5',
  };

  const statusLabels = {
    todo: { text: 'TODO', color: 'text-[#555555]' },
    in_progress: { text: 'EN PROGRESO', color: 'text-[#FFB547]' },
    done: { text: 'DONE', color: 'text-[#00E5A0]' },
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        'rounded-lg border p-3 transition-all duration-200',
        statusStyles[status]
      )}
    >
      <span className={cn('text-xs font-medium uppercase tracking-wider', statusLabels[status].color)}>
        {statusLabels[status].text}
      </span>
      <p className="mt-2 text-sm text-[#F0F0F0]">{name}</p>
    </motion.div>
  );
}

// ============================================================================
// TableRow - Fila de tabla con hover highlight
// ============================================================================

interface TableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({ children, onClick, className }: TableRowProps) {
  return (
    <motion.tr
      whileHover={{ backgroundColor: 'rgba(255,92,58,0.05)' }}
      onClick={onClick}
      className={cn(
        'border-b border-[#1e1e1e] transition-colors duration-150',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.tr>
  );
}

// ============================================================================
// TimelineNode - Nodo de roadmap con fecha y versión
// ============================================================================

interface TimelineNodeProps {
  version: string;
  name: string;
  date: string;
  completed: boolean;
  isLast?: boolean;
}

export function TimelineNode({ version, name, date, completed, isLast }: TimelineNodeProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.2 }}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border-2',
            completed
              ? 'border-[#00E5A0] bg-[#00E5A0]/10 text-[#00E5A0]'
              : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#555555]'
          )}
        >
          {completed ? '✓' : '○'}
        </motion.div>
        {!isLast && (
          <div className={cn('h-full w-px', completed ? 'bg-[#00E5A0]/30' : 'bg-[#2a2a2a]')} />
        )}
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-mono text-sm font-medium',
            completed ? 'text-[#00E5A0]' : 'text-[#888888]'
          )}>
            {version}
          </span>
          <span className="text-xs text-[#555555]">{date}</span>
        </div>
        <p className="text-sm text-[#F0F0F0]">{name}</p>
      </div>
    </div>
  );
}

// ============================================================================
// EmptyState - Estado vacío elegante
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-4xl text-[#555555]">{icon}</div>}
      <h3 className="mt-4 font-display text-lg font-medium text-[#888888]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[#555555]">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}