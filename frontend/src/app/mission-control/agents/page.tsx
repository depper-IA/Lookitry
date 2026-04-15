// Lookitry Mission Control - Agents Page
// v1.0 | Abril 2026

'use client';

import { MCLayout, AgentsGrid } from '@/components/mission-control';
import { MOCK_AGENTS, MOCK_SYSTEM_STATUS } from '@/lib/mission-control/constants';

// ============================================================================
// Page Component
// ============================================================================

export default function AgentsPage() {
  const systemStatus = MOCK_SYSTEM_STATUS.overall;
  
  // Create agent statuses map for sidebar
  const agentStatuses = MOCK_AGENTS.reduce((acc, agent) => {
    acc[agent.id] = agent.status;
    return acc;
  }, {} as Record<string, 'online' | 'busy' | 'offline'>);

  return (
    <MCLayout 
      globalStatus={systemStatus}
      notificationCount={0}
      agentStatuses={agentStatuses}
    >
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#F0F0F0]">Agentes</h1>
        <p className="mt-1 text-[#888888]">
          Panel de control para los 10 agentes de IA activos en Lookitry
        </p>
      </div>

      <AgentsGrid 
        agents={MOCK_AGENTS}
        onAgentClick={(agentId) => console.log('Agent clicked:', agentId)}
      />
    </MCLayout>
  );
}