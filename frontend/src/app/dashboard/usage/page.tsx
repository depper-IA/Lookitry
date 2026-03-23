'use client';

import { useState, useEffect } from 'react';
import { UsageStats } from '@/components/dashboard/UsageStats';
import { Spinner } from '@/components/ui/Spinner';
import { usageService } from '@/services/usage.service';
import type { UsageStats as UsageStatsType } from '@/types';

export default function UsagePage() {
  const [stats, setStats] = useState<UsageStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await usageService.getUsageStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          Uso y Estadísticas
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Monitorea el uso de tu plan mensual
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      <UsageStats stats={stats} />
    </div>
  );
}
