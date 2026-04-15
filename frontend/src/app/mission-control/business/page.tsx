// Lookitry Mission Control - Business Metrics Page
// v1.0 | Abril 2026

'use client';

import { MCLayout, BusinessKPIs } from '@/components/mission-control';
import { MOCK_SYSTEM_STATUS, MOCK_BUSINESS_METRICS } from '@/lib/mission-control/constants';

// ============================================================================
// Page Component
// ============================================================================

export default function BusinessPage() {
  const systemStatus = MOCK_SYSTEM_STATUS.overall;
  
  const agentStatuses = {
    sammantha: 'online',
    marlo: 'online',
  };

  return (
    <MCLayout 
      globalStatus={systemStatus}
      notificationCount={0}
      agentStatuses={agentStatuses}
    >
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#F0F0F0]">Business</h1>
        <p className="mt-1 text-[#888888]">
          Métricas de negocio, revenue y pipeline de leads
        </p>
      </div>

      <BusinessKPIs metrics={MOCK_BUSINESS_METRICS} />
    </MCLayout>
  );
}