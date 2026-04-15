// Lookitry Mission Control - System Status Page (Zephyr + Lina)
// v1.0 | Abril 2026

'use client';

import { MCLayout, SystemStatusGrid } from '@/components/mission-control';
import { MOCK_SYSTEM_STATUS } from '@/lib/mission-control/constants';

// ============================================================================
// Page Component
// ============================================================================

export default function SystemPage() {
  const systemStatus = MOCK_SYSTEM_STATUS.overall;
  
  const agentStatuses = {
    zephyr: 'online',
    lina: 'online',
  };

  return (
    <MCLayout 
      globalStatus={systemStatus}
      notificationCount={0}
      agentStatuses={agentStatuses}
    >
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#F0F0F0]">Sistema</h1>
        <p className="mt-1 text-[#888888]">
          Infraestructura, servicios y documentación (Zephyr + Lina)
        </p>
      </div>

      <SystemStatusGrid status={MOCK_SYSTEM_STATUS} />
    </MCLayout>
  );
}