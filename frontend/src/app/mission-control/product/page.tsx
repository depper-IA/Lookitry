// Lookitry Mission Control - Product (Try-On) Page
// v1.0 | Abril 2026

'use client';

import { MCLayout, TryOnQueue } from '@/components/mission-control';
import { MOCK_SYSTEM_STATUS, MOCK_TRYON_METRICS } from '@/lib/mission-control/constants';

// ============================================================================
// Page Component
// ============================================================================

export default function ProductPage() {
  const systemStatus = MOCK_SYSTEM_STATUS.overall;
  
  const agentStatuses = {
    sammantha: 'online',
    pixel: 'online',
    kira: 'busy',
    nadia: 'online',
  };

  return (
    <MCLayout 
      globalStatus={systemStatus}
      notificationCount={0}
      agentStatuses={agentStatuses}
    >
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#F0F0F0]">Virtual Try-On</h1>
        <p className="mt-1 text-[#888888]">
          Monitoreo de cola de procesamiento y webhooks de Try-On
        </p>
      </div>

      <TryOnQueue metrics={MOCK_TRYON_METRICS} />
    </MCLayout>
  );
}