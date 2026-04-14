// Lookitry Mission Control - Growth Page (Marlo + Rebecca)
// v1.0 | Abril 2026

'use client';

import { MCLayout, GrowthPanel } from '@/components/mission-control';
import { MOCK_SYSTEM_STATUS, MOCK_GROWTH_METRICS } from '@/lib/mission-control/constants';

// ============================================================================
// Page Component
// ============================================================================

export default function GrowthPage() {
  const systemStatus = MOCK_SYSTEM_STATUS.overall;
  
  const agentStatuses = {
    marlo: 'online',
    rebecca: 'busy',
  };

  return (
    <MCLayout 
      globalStatus={systemStatus}
      notificationCount={0}
      agentStatuses={agentStatuses}
    >
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#F0F0F0]">Growth</h1>
        <p className="mt-1 text-[#888888]">
          Marketing, CRM y contenido de Marlo + Rebecca
        </p>
      </div>

      <GrowthPanel metrics={MOCK_GROWTH_METRICS} />
    </MCLayout>
  );
}