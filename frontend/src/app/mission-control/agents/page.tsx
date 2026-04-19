// Lookitry Mission Control - Agents Page (with real OpenClaw data + Detail Modal)
// v1.0 | Abril 2026

'use client';

import { useEffect, useState, useCallback } from 'react';
import { MCLayout } from '@/components/mission-control';
import { AgentsGrid } from '@/components/mission-control/organisms';
import { AgentDetailModal } from '@/components/mission-control/molecules/AgentDetailModal';
import type { Agent } from '@/lib/mission-control/types';
import { MOCK_SYSTEM_STATUS } from '@/lib/mission-control/constants';

const POLLING_INTERVAL = 30000; // 30 seconds

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const systemStatus = MOCK_SYSTEM_STATUS.overall;

  // Fetch agents from API
  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents/status', {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.agents) {
        setAgents(data.agents);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch agents');
      }
    } catch (err) {
      console.error('[AgentsPage] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchAgents();

    const interval = setInterval(fetchAgents, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  // Create agent statuses map for sidebar
  const agentStatuses = agents
    ? agents.reduce((acc, agent) => {
        acc[agent.id] = agent.status;
        return acc;
      }, {} as Record<string, 'online' | 'busy' | 'offline'>)
    : {};

  // Handle agent click - open modal
  const handleAgentClick = useCallback((agentId: string) => {
    const agent = agents?.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setIsModalOpen(true);
    }
  }, [agents]);

  return (
    <MCLayout 
      globalStatus={systemStatus}
      notificationCount={0}
      agentStatuses={agentStatuses}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#F0F0F0]">Agentes</h1>
            <p className="mt-1 text-[#888888]">
              Panel de control para los 10 agentes de IA activos en Lookitry
            </p>
          </div>
          {lastUpdated && (
            <div className="text-right">
              <div className="text-xs text-[#666666]">Última actualización</div>
              <div className="text-sm text-[#FF5C3A] font-mono">
                {lastUpdated.toLocaleTimeString('es-CO')}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && !agents && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#FF5C3A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-[#888888]">Cargando estado de agentes...</div>
          </div>
        </div>
      )}

      {error && !agents && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
          <div className="text-red-400 font-semibold mb-1">Error al cargar agentes</div>
          <div className="text-red-300/70 text-sm">{error}</div>
          <button
            onClick={fetchAgents}
            className="mt-3 px-4 py-2 bg-red-800 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {agents && (
        <>
          <AgentsGrid 
            agents={agents}
            onAgentClick={handleAgentClick}
          />
          <div className="mt-4 text-center text-xs text-[#444444]">
            Los datos se actualizan automáticamente cada 30 segundos
          </div>
        </>
      )}

      {/* Agent Detail Modal */}
      <AgentDetailModal
        agent={selectedAgent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </MCLayout>
  );
}
