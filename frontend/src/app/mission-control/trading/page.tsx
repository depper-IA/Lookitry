// Lookitry Mission Control - Trading Page (Leo)
// v1.0 | Abril 2026

'use client';

import { MCLayout, TradingPanel } from '@/components/mission-control';
import { MOCK_SYSTEM_STATUS, MOCK_TRADING_METRICS } from '@/lib/mission-control/constants';

// ============================================================================
// Page Component
// ============================================================================

export default function TradingPage() {
  const systemStatus = MOCK_SYSTEM_STATUS.overall;
  
  const agentStatuses = {
    leo: 'online',
  };

  return (
    <MCLayout 
      globalStatus={systemStatus}
      notificationCount={0}
      agentStatuses={agentStatuses}
    >
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#F0F0F0]">Trading</h1>
        <p className="mt-1 text-[#888888]">
          Panel de Leo - Operaciones de trading y posiciones abiertas
        </p>
      </div>

      <TradingPanel metrics={MOCK_TRADING_METRICS} />
    </MCLayout>
  );
}