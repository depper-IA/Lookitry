// Lookitry Mission Control - Security Page
// v1.0 | Abril 2026

'use client';

import { MCLayout, SecurityPanel } from '@/components/mission-control';
import { MOCK_SYSTEM_STATUS, MOCK_SECURITY_METRICS } from '@/lib/mission-control/constants';

// ============================================================================
// Page Component
// ============================================================================

export default function SecurityPage() {
  const systemStatus = MOCK_SYSTEM_STATUS.overall;
  
  const agentStatuses = {
    cipher: 'online',
  };

  return (
    <MCLayout 
      globalStatus={systemStatus}
      notificationCount={0}
      agentStatuses={agentStatuses}
    >
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#F0F0F0]">Seguridad</h1>
        <p className="mt-1 text-[#888888]">
          Dashboard de Cipher - Monitoreo de seguridad y alertas
        </p>
      </div>

      <SecurityPanel metrics={MOCK_SECURITY_METRICS} />
    </MCLayout>
  );
}