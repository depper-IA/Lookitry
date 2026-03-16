'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock } from 'lucide-react';
import { subscriptionService } from '@/services/subscription.service';

const DISMISS_KEY = 'trial_banner_dismissed_date';

export function TrialBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    // Verificar si fue descartado hoy
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const today = new Date().toDateString();
    if (dismissed === today) return;

    subscriptionService.getSubscriptionInfo().then((info) => {
      if (!info.isInTrial) return;
      setTrialDays(info.trialDaysRemaining);
      setUrgent((info.trialDaysRemaining ?? 99) <= 3);
      setVisible(true);
    }).catch(() => {/* silencioso */});
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toDateString());
    setVisible(false);
  };

  if (!visible) return null;

  const daysLabel = trialDays === null
    ? 'Tu período de prueba está activo'
    : trialDays <= 0
      ? 'Tu período de prueba ha terminado'
      : trialDays === 1
        ? 'Queda 1 día de prueba'
        : `Quedan ${trialDays} días de prueba`;

  return (
    <div
      className="rounded-xl border px-4 py-3 mb-5 flex items-center gap-3 flex-wrap"
      style={{
        background: urgent ? 'rgba(255,92,58,0.08)' : 'var(--bg-card)',
        borderColor: urgent ? '#FF5C3A' : 'var(--border-color)',
      }}
    >
      <Clock
        className="w-4 h-4 flex-shrink-0"
        style={{ color: urgent ? '#FF5C3A' : 'var(--text-muted)' }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {daysLabel}
        </p>
        {trialDays !== null && trialDays > 0 && (
          <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(5, Math.min(100, ((7 - trialDays) / 7) * 100))}%`,
                background: urgent ? '#FF5C3A' : '#FF5C3A88',
              }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
        <button
          onClick={() => router.push('/dashboard/checkout?plan=BASIC')}
          className="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: '#FF5C3A' }}
        >
          Plan Básico
        </button>
        <button
          onClick={() => router.push('/dashboard/checkout?plan=PRO')}
          className="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-opacity hover:opacity-85"
          style={{
            background: 'var(--bg-hover)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          Plan Pro
        </button>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
