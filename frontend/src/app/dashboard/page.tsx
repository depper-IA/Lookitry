'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { subscriptionService } from '@/services/subscription.service';
import { Spinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    subscriptionService.getSubscriptionInfo()
      .then(info => { setStatus(info.status); setDaysRemaining(info.daysRemaining ?? null); setChecked(true); })
      .catch(() => { setChecked(true); router.push('/dashboard/products'); });
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    const needsBanner = status === 'expiring_soon' || status === 'expired' || status === 'suspended';
    if (!needsBanner) router.push('/dashboard/products');
  }, [checked, status, router]);

  if (!checked || !status) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const isExpired = status === 'expired' || status === 'suspended';

  return (
    <div className="max-w-lg mx-auto mt-12 px-4">
      <div
        className="rounded-2xl border-2 p-8 text-center"
        style={{
          borderColor: isExpired ? '#fca5a5' : '#fcd34d',
          backgroundColor: isExpired ? '#fef2f2' : '#fffbeb',
        }}
      >
        <div className="flex justify-center mb-4">
          {isExpired ? (
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <h2 className={`font-syne font-bold text-xl mb-2 ${isExpired ? 'text-red-800' : 'text-amber-800'}`}>
          {isExpired
            ? 'Tu suscripción ha vencido'
            : `Tu suscripción vence en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`}
        </h2>

        <p className={`text-sm mb-6 ${isExpired ? 'text-red-600' : 'text-amber-700'}`}>
          {isExpired
            ? 'Para continuar usando el servicio necesitas renovar tu suscripción.'
            : 'Renueva pronto para no perder el acceso a tu probador virtual.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/subscription"
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              isExpired ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Ver opciones de renovación
          </Link>
          {!isExpired && (
            <Link
              href="/dashboard/products"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-sm border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
            >
              Continuar al dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
