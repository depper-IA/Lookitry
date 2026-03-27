'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Coins, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { BrandPlan, UsageStats } from '@/types';
import { paymentsService } from '@/services/payments.service';

interface CreditUsageAlertProps {
  plan: BrandPlan;
  usage: UsageStats;
}

export function CreditUsageAlert({ plan, usage }: CreditUsageAlertProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const threshold = useMemo(() => {
    if (plan === 'TRIAL') return 0;
    return Math.ceil((usage.currentMonth.generationsLimit || 0) * 0.2);
  }, [plan, usage.currentMonth.generationsLimit]);

  const remaining = usage.currentMonth.generationsRemaining;
  const shouldShow = plan !== 'TRIAL' && remaining <= threshold;
  const isCritical = remaining <= Math.max(1, Math.floor(threshold / 2));

  if (!shouldShow) {
    return null;
  }

  const handleBuyAddon = async () => {
    try {
      setLoading(true);
      const checkout = await paymentsService.checkoutAddon('credits_500');
      window.location.href = checkout.checkoutUrl;
    } catch (error: any) {
      window.alert(error?.message || 'No se pudo iniciar la compra de créditos extra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-[2.5rem] border px-6 py-6 md:px-8 md:py-7 shadow-lg ${
        isCritical
          ? 'bg-red-500/10 border-red-500/25'
          : 'bg-amber-500/10 border-amber-500/25'
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-4">
          <div
            className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              isCritical ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
            }`}
          >
            {isCritical ? <AlertTriangle className="h-5 w-5" /> : <Coins className="h-5 w-5" />}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
              Alerta de créditos
            </p>
            <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Tus créditos mensuales se están agotando. Para que tu probador virtual no se detenga, puedes adquirir un paquete extra o mejorar tu plan.
            </h3>
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Te quedan <span className="font-bold text-[var(--text-primary)]">{remaining}</span> créditos mensuales
              {' '}y <span className="font-bold text-[var(--text-primary)]">{usage.extraCreditsBalance}</span> créditos extra disponibles.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleBuyAddon}
            disabled={loading}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[#FF5C3A] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
            Comprar 500 Créditos Extra
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard/checkout?plan=PRO')}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--text-primary)] transition-all hover:border-[#FF5C3A]/35 hover:text-[#FF5C3A]"
          >
            Hacer Upgrade a Pro
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
