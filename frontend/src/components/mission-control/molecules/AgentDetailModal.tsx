// Lookitry Mission Control - Agent Detail Modal
// v1.0 | Abril 2026

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Clock, MessageSquare, Terminal, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent } from '@/lib/mission-control/types';
import { StatusDot, Badge } from '../atoms';

interface AgentDetailModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AgentDetailModal({ agent, isOpen, onClose }: AgentDetailModalProps) {
  if (!agent) return null;

  const statusColors = {
    online: 'border-[#00E5A0]/30 bg-[#00E5A0]/5',
    busy: 'border-[#FFB547]/30 bg-[#FFB547]/5',
    offline: 'border-[#888888]/30 bg-[#888888]/5',
  };

  const statusBgColors = {
    online: 'bg-[#00E5A0]',
    busy: 'bg-[#FFB547]',
    offline: 'bg-[#888888]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Wrapper - Centrado absoluto */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-lg rounded-xl border border-[#2a2a2a] bg-[#111111] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1e1e1e] p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{agent.icon}</span>
                <div>
                  <h2 className="font-display text-lg font-bold text-[#F0F0F0]">{agent.name}</h2>
                  <p className="text-sm text-[#888888]">{agent.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={agent.status === 'online' ? 'online' : agent.status === 'busy' ? 'busy' : 'offline'}
                >
                  {agent.status.toUpperCase()}
                </Badge>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-[#888888] transition-colors hover:bg-[#1e1e1e] hover:text-[#F0F0F0]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Status Message */}
              <div className={cn(
                'rounded-lg border p-4',
                statusColors[agent.status]
              )}>
                <p className="text-sm italic text-[#F0F0F0]">&ldquo;{agent.statusMessage}&rdquo;</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-[#888888]">
                  <Clock className="h-3 w-3" />
                  <span>{agent.lastActivity}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#888888]">
                  <Activity className="h-4 w-4" />
                  Métricas del Agente
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {agent.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-center"
                    >
                      <div className="font-mono text-lg font-semibold text-[#F0F0F0]">
                        {metric.value}
                        {metric.unit && <span className="text-xs text-[#888888]">{metric.unit}</span>}
                      </div>
                      <div className="mt-1 text-xs text-[#888888]">{metric.label}</div>
                      {metric.trend && (
                        <div className={cn(
                          'mt-1 text-xs font-medium',
                          metric.trend.startsWith('+') ? 'text-[#00E5A0]' : 'text-[#FF3A5C]'
                        )}>
                          {metric.trend}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Info */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-[#888888]">
                  <Terminal className="h-4 w-4" />
                  Configuración
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2">
                    <span className="text-[#888888]">ID</span>
                    <code className="font-mono text-xs text-[#FF5C3A]">{agent.id}</code>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2">
                    <span className="text-[#888888]">Icon</span>
                    <span className="text-lg">{agent.icon}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-4 py-2 text-sm text-[#888888] transition-colors hover:border-[#FF5C3A]/30 hover:text-[#F0F0F0]">
                  <Zap className="h-4 w-4" />
                  Activar Tarea
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-4 py-2 text-sm text-[#888888] transition-colors hover:border-[#5C8AFF]/30 hover:text-[#F0F0F0]">
                  <MessageSquare className="h-4 w-4" />
                  Enviar Mensaje
                </button>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
