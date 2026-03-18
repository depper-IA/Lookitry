'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, Mail, MessageCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { subscriptionService } from '@/services/subscription.service';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/currency';
import type { SubscriptionPayment, PlanType } from '@/types';
import type { SubscriptionInfo } from '@/services/subscription.service';

// ── Constantes ────────────────────────────────────────────────────────────────

const PLAN_INFO_STATIC = {
  BASIC: {
    name: 'Plan Básico',
    price: 150000,
    gradient: 'from-[#FF5C3A] to-[#c0392b]',
    features: [
      'Hasta 5 productos',
      '400 generaciones/mes',
      'Branding básico (logo, colores)',
      'Templates Minimal y Modern',
      'Soporte por WhatsApp/email',
      'URL propia del probador',
    ],
  },
  PRO: {
    name: 'Plan Pro',
    price: 250000,
    gradient: 'from-[#FF5C3A] via-[#e04e30] to-[#0a0a0a]',
    features: [
      'Hasta 15 productos',
      '1.200 generaciones/mes',
      'Branding avanzado + personalización completa',
      'Templates Minimal, Modern y Bold',
      'Texto del botón personalizado',
      'Mensaje de bienvenida personalizado',
      'Modificación del slug del probador',
      'Soporte prioritario',
      'Integración con sistemas externos',
    ],
  },
} as const;

const TRIAL_INFO = {
  name: 'Plan Trial',
  gradient: 'from-[#6366f1] to-[#4f46e5]',
  features: [
    '1 producto',
    '50 generaciones incluidas',
    'Acceso completo al probador virtual',
    'Mini-landing pública',
    'Soporte por WhatsApp/email',
  ],
};

type PlanKey = keyof typeof PLAN_INFO_STATIC;

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active:        { label: 'Activa',      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  expiring_soon: { label: 'Por vencer',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200'   },
  expired:       { label: 'Vencida',     color: 'text-red-700',     bg: 'bg-red-50 border-red-200'       },
  suspended:     { label: 'Suspendida',  color: 'text-red-700',     bg: 'bg-red-50 border-red-200'       },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completado',  color: 'text-emerald-600' },
  pending:   { label: 'Pendiente',   color: 'text-amber-600'   },
  failed:    { label: 'Fallido',     color: 'text-red-600'     },
  refunded:  { label: 'Reembolsado', color: 'text-gray-500'    },
};

function formatDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Descuentos por meses ─────────────────────────────────────────────────────

const MONTH_DISCOUNTS: { months: number; pct: number; label: string }[] = [
  { months: 1,  pct: 0,  label: '1 mes' },
  { months: 3,  pct: 5,  label: '3 meses' },
  { months: 6,  pct: 10, label: '6 meses' },
  { months: 12, pct: 15, label: '12 meses' },
];

function calcTotal(basePrice: number, months: number, pct: number) {
  return Math.round(basePrice * months * (1 - pct / 100));
}

// ── Modal cambio de plan ──────────────────────────────────────────────────────

function ChangePlanModal({ currentPlan, onClose, dynamicPrices }: { currentPlan: PlanKey; onClose: () => void; dynamicPrices: { BASIC: number; PRO: number } }) {
  const [message, setMessage] = useState('');
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const targetKey: PlanKey = currentPlan === 'BASIC' ? 'PRO' : 'BASIC';
  const PLAN_INFO = {
    BASIC: { ...PLAN_INFO_STATIC.BASIC, price: dynamicPrices.BASIC },
    PRO:   { ...PLAN_INFO_STATIC.PRO,   price: dynamicPrices.PRO },
  };
  const target = PLAN_INFO[targetKey];
  const discount = MONTH_DISCOUNTS.find(d => d.months === selectedMonths)!;
  const total = calcTotal(target.price, selectedMonths, discount.pct);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/brands/request-plan-change`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ targetPlan: targetKey, message, months: selectedMonths }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al enviar solicitud');
      setSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl shadow-2xl w-full max-w-md border">
        <div className={`bg-gradient-to-r ${target.gradient} rounded-t-2xl px-6 py-5`}>
          <h3 className="text-white font-syne font-bold text-lg">Solicitar cambio a {target.name}</h3>
          <p className="text-white/70 text-sm mt-1">{formatCurrency(target.price)}/mes</p>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-3">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <p style={{ color: 'var(--text-primary)' }} className="font-semibold">Solicitud enviada</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-2">
                Nos pondremos en contacto contigo en las próximas 24 horas para coordinar el cambio.
              </p>
              <button onClick={onClose} className="mt-5 w-full py-2.5 min-h-[44px] rounded-xl bg-[#FF5C3A] text-white font-medium text-sm hover:bg-[#e04e30] transition-colors">
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-4">
                Cuéntanos por qué quieres cambiar al <strong>{target.name}</strong> y nos contactaremos para coordinar el cambio.
              </p>

              {/* Selector de meses con descuento */}
              <div className="mb-4">
                <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium mb-2">Meses a contratar</p>
                <div className="grid grid-cols-4 gap-2">
                  {MONTH_DISCOUNTS.map(d => (
                    <button
                      key={d.months}
                      onClick={() => setSelectedMonths(d.months)}
                      style={{
                        borderColor: selectedMonths === d.months ? '#FF5C3A' : 'var(--border-color)',
                        background: selectedMonths === d.months ? 'rgba(255,92,58,0.08)' : 'var(--bg-hover)',
                      }}
                      className="relative py-2.5 rounded-xl border-2 text-center transition-all min-h-[44px]"
                    >
                      <span style={{ color: 'var(--text-primary)' }} className="block text-sm font-bold">{d.months}</span>
                      <span style={{ color: 'var(--text-muted)' }} className="block text-xs">mes{d.months > 1 ? 'es' : ''}</span>
                      {d.pct > 0 && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          -{d.pct}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {discount.pct > 0 && (
                  <div className="mt-2.5 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                    <span className="text-xs text-emerald-600">Total con {discount.pct}% descuento</span>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(total)}</span>
                  </div>
                )}
                {discount.pct === 0 && (
                  <div style={{ background: 'var(--bg-hover)' }} className="mt-2.5 flex items-center justify-between rounded-xl px-3 py-2">
                    <span style={{ color: 'var(--text-muted)' }} className="text-xs">Total</span>
                    <span style={{ color: 'var(--text-primary)' }} className="text-sm font-bold">{formatCurrency(total)}</span>
                  </div>
                )}
              </div>

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ej: Necesito más productos y generaciones para mi tienda..."
                rows={3}
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-3 py-2.5 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
              />
              {error && <p className="text-xs text-red-600 bg-red-500/10 px-3 py-2 rounded-lg mt-2">{error}</p>}
              <p style={{ color: 'var(--text-muted)' }} className="mt-1.5 text-xs">
                Tu solicitud se enviará a{' '}
                <a href="mailto:info@pruebalo.wilkiedevs.com" className="text-[#FF5C3A] hover:underline">
                  info@pruebalo.wilkiedevs.com
                </a>
              </p>
              <div className="flex gap-3 mt-4">
                <button onClick={onClose}
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  className="flex-1 py-2.5 min-h-[44px] rounded-xl border text-sm hover:opacity-80 transition-opacity">
                  Cancelar
                </button>
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || loading}
                  className="flex-1 py-2.5 min-h-[44px] rounded-xl bg-[#FF5C3A] text-white font-medium text-sm hover:bg-[#e04e30] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const router = useRouter();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [dynamicPrices, setDynamicPrices] = useState<{ BASIC: number; PRO: number }>({
    BASIC: PLAN_INFO_STATIC.BASIC.price,
    PRO: PLAN_INFO_STATIC.PRO.price,
  });
  const [paySettings, setPaySettings] = useState<{
    wompiEnabled: boolean;
    wompiPublicKey: string;
    manualEnabled: boolean;
    manualInstructions: string;
    manualWhatsapp: string;
    manualEmail: string;
    transferEnabled: boolean;
    transferBankName: string;
    transferAccountNumber: string;
    transferAccountType: string;
    transferAccountHolder: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [subResult, paymentsResult, settingsResult, pricingResult] = await Promise.allSettled([
          subscriptionService.getSubscriptionInfo(),
          api.get<SubscriptionPayment[]>('/brands/me/payments'),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com'}/api/payment-settings/public`)
            .then(r => r.ok ? r.json() : null),
          fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?id=in.(basic,pro)&select=id,config`,
            {
              headers: {
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
              },
            }
          ).then(r => r.ok ? r.json() : null),
        ]);
        if (subResult.status === 'fulfilled') setInfo(subResult.value);
        if (paymentsResult.status === 'fulfilled') setPayments(paymentsResult.value.data);
        if (settingsResult.status === 'fulfilled' && settingsResult.value) {
          setPaySettings(settingsResult.value);
        }
        if (pricingResult.status === 'fulfilled' && Array.isArray(pricingResult.value)) {
          const prices = { ...dynamicPrices };
          for (const row of pricingResult.value) {
            if (row.id === 'basic' && row.config?.precio_mensual_cop) {
              prices.BASIC = row.config.precio_mensual_cop;
            }
            if (row.id === 'pro' && row.config?.precio_mensual_cop) {
              prices.PRO = row.config.precio_mensual_cop;
            }
          }
          setDynamicPrices(prices);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-[#FF5C3A]/30 border-t-[#FF5C3A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">No se pudo cargar la información de suscripción.</p>
      </div>
    );
  }

  const plan = (info.brand.plan as PlanKey) in PLAN_INFO_STATIC
    ? (info.brand.plan as PlanKey)
    : 'BASIC';
  const PLAN_INFO = {
    BASIC: { ...PLAN_INFO_STATIC.BASIC, price: dynamicPrices.BASIC },
    PRO:   { ...PLAN_INFO_STATIC.PRO,   price: dynamicPrices.PRO },
  };
  const planInfo = PLAN_INFO[plan];
  const statusInfo = STATUS_LABELS[info.status ?? 'active'] ?? STATUS_LABELS.active;
  const inTrial = info.isInTrial ?? false;
  const trialDaysLeft = info.trialDaysRemaining ?? 0;

  const progressPercent = info.daysRemaining != null
    ? Math.min(100, Math.max(0, Math.round(((30 - info.daysRemaining) / 30) * 100)))
    : 100;

  // Hero: diferente si está en trial
  const heroGradient = inTrial ? TRIAL_INFO.gradient : planInfo.gradient;
  const heroTitle = inTrial ? TRIAL_INFO.name : planInfo.name;
  const heroSubtitle = inTrial
    ? `${trialDaysLeft} ${trialDaysLeft === 1 ? 'día restante' : 'días restantes'}`
    : `${formatCurrency(planInfo.price)}/mes`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      {/* Hero: plan actual */}
      <div className={`rounded-2xl bg-gradient-to-br ${heroGradient} p-6 text-white shadow-lg`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Tu plan actual</p>
            <h2 className="text-3xl font-syne font-bold mt-1">{heroTitle}</h2>
            <p className="text-white/80 text-lg mt-1">
              {inTrial ? (
                <span className="text-base font-normal">Período de prueba gratuito</span>
              ) : (
                <>{formatCurrency(planInfo.price)}<span className="text-sm font-normal">/mes</span></>
              )}
            </p>
          </div>
          {inTrial ? (
            <span className="px-3 py-1.5 rounded-full border text-sm font-medium bg-white/20 text-white border-white/30">
              Trial activo
            </span>
          ) : (
            <span className={`px-3 py-1.5 rounded-full border text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          )}
        </div>

        {/* Barra de progreso del trial */}
        {inTrial && (
          <div className="mt-5">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all"
                style={{ width: `${Math.max(5, Math.round((trialDaysLeft / (info.trialDaysRemaining ?? 7)) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-white/70 mt-1.5 text-right">
              {trialDaysLeft > 0 ? `${trialDaysLeft} días restantes` : 'Trial vencido'}
            </p>
          </div>
        )}

        {/* Barra de progreso suscripción normal */}
        {!inTrial && info.daysRemaining != null && (
          <div className="mt-5">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-white/70 mt-1.5 text-right">
              {info.daysRemaining > 0
                ? `${info.daysRemaining} días restantes`
                : 'Suscripción vencida'}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {inTrial ? (
            // En trial: botones directos para activar BASIC o PRO
            <>
              <button
                onClick={() => router.push('/dashboard/checkout?plan=BASIC')}
                className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl bg-white text-[#6366f1] text-sm font-semibold transition-colors border border-white/30 hover:bg-white/90"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Activar Plan Básico
              </button>
              <button
                onClick={() => router.push('/dashboard/checkout?plan=PRO')}
                className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors border border-white/30"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Activar Plan Pro
              </button>
              <a
                href="https://wa.me/573105436281"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors border border-white/30"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar soporte
              </a>
            </>
          ) : (
            // Suscripción normal
            <>
              <button
                onClick={() => setShowChangePlan(true)}
                className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors border border-white/30"
              >
                {plan === 'BASIC'
                  ? <><ArrowUpCircle className="w-4 h-4" /> Cambiar a Pro</>
                  : <><ArrowDownCircle className="w-4 h-4" /> Cambiar a Básico</>}
              </button>
              {(info?.status === 'expiring_soon' || info?.status === 'expired') && (
                <button
                  onClick={() => router.push(`/dashboard/checkout?plan=${plan}`)}
                  className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl bg-white text-[#FF5C3A] text-sm font-semibold transition-colors border border-white/30 hover:bg-white/90"
                >
                  <CreditCard className="w-4 h-4" />
                  Renovar ahora
                </button>
              )}
              <a
                href="https://wa.me/573105436281"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors border border-white/30"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar soporte
              </a>
            </>
          )}
        </div>
      </div>

      {/* Comparativa de planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(PLAN_INFO) as PlanKey[]).map(p => {
          const pi = PLAN_INFO[p];
          const isCurrent = !inTrial && p === plan;
          return (
            <div
              key={p}
              style={{
                background: isCurrent ? 'var(--bg-card)' : 'var(--bg-hover)',
                borderColor: isCurrent ? '#FF5C3A' : 'var(--border-color)',
              }}
              className={`rounded-2xl border-2 p-5 transition-all ${isCurrent ? 'shadow-md' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 style={{ color: 'var(--text-primary)' }} className="font-bold">{pi.name}</h3>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm">{formatCurrency(pi.price)}/mes</p>
                </div>
                {isCurrent && (
                  <span className="text-xs bg-[#FF5C3A]/10 text-[#FF5C3A] px-2.5 py-1 rounded-full font-semibold">
                    Tu plan
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {pi.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {(inTrial || !isCurrent) && (
                <button
                  onClick={() => router.push(`/dashboard/checkout?plan=${p}`)}
                  className="mt-4 w-full py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-colors bg-[#FF5C3A] hover:bg-[#e04e30] text-white"
                >
                  {inTrial ? `Activar ${pi.name}` : `Cambiar a ${pi.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Renovación y pagos */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-5">
        <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold mb-4">Renovación y pagos</h3>

        {/* Wompi */}
        {paySettings?.wompiEnabled && (
          <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="mb-4 p-4 rounded-xl border">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-[#FF5C3A]" />
              <span style={{ color: 'var(--text-primary)' }} className="font-medium text-sm">Pago en línea — Wompi</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }} className="text-xs mb-3">
              Paga de forma segura con tarjeta débito/crédito, PSE o Nequi.
            </p>
            <button
              onClick={() => router.push(`/dashboard/checkout?plan=${plan}`)}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Renovar con Wompi
            </button>
          </div>
        )}

        {/* Transferencia bancaria */}
        {paySettings?.transferEnabled && (
          <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="mb-4 p-4 rounded-xl border">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <span style={{ color: 'var(--text-primary)' }} className="font-medium text-sm">Transferencia bancaria</span>
            </div>
            <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
              {paySettings.transferBankName && <p><span className="font-medium">Banco:</span> {paySettings.transferBankName}</p>}
              {paySettings.transferAccountHolder && <p><span className="font-medium">Titular:</span> {paySettings.transferAccountHolder}</p>}
              {paySettings.transferAccountNumber && <p><span className="font-medium">Cuenta {paySettings.transferAccountType}:</span> {paySettings.transferAccountNumber}</p>}
            </div>
          </div>
        )}

        {/* Pago manual / contacto */}
        {(paySettings?.manualEnabled || !paySettings) && (
          <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="p-4 rounded-xl border">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <span style={{ color: 'var(--text-primary)' }} className="font-medium text-sm">Pago manual</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }} className="text-xs mb-3">
              {paySettings?.manualInstructions || 'Contáctanos para coordinar el pago de tu renovación.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {(paySettings?.manualWhatsapp || !paySettings) && (
                <a
                  href={`https://wa.me/${(paySettings?.manualWhatsapp || '573105436281').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl border text-xs hover:opacity-80 transition-opacity"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {paySettings?.manualWhatsapp || '+57 310 543 6281'}
                </a>
              )}
              {(paySettings?.manualEmail || !paySettings) && (
                <a
                  href={`mailto:${paySettings?.manualEmail || 'info@pruebalo.wilkiedevs.com'}`}
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl border text-xs hover:opacity-80 transition-opacity"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {paySettings?.manualEmail || 'info@pruebalo.wilkiedevs.com'}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Historial de pagos */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border overflow-hidden">
        <div style={{ borderColor: 'var(--border-color)' }} className="px-5 py-4 border-b">
          <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold">Historial de pagos</h3>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm">Sin historial de pagos aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="text-left border-b">
                  <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">Fecha</th>
                  <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">Monto</th>
                  <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">Método</th>
                  <th style={{ color: 'var(--text-muted)' }} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--border-color)' }} className="divide-y">
                {payments.map(p => {
                  const st = PAYMENT_STATUS[p.status] ?? { label: p.status, color: 'text-gray-500' };
                  return (
                    <tr key={p.id} className="hover:opacity-80 transition-opacity">
                      <td style={{ color: 'var(--text-secondary)' }} className="px-5 py-3.5">{formatDate(p.paymentDate)}</td>
                      <td style={{ color: 'var(--text-primary)' }} className="px-5 py-3.5 font-medium">{formatCurrency(p.amount)}</td>
                      <td style={{ color: 'var(--text-muted)' }} className="px-5 py-3.5 capitalize">{p.paymentMethod ?? '—'}</td>
                      <td className={`px-5 py-3.5 font-medium ${st.color}`}>{st.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showChangePlan && (
        <ChangePlanModal currentPlan={plan} onClose={() => setShowChangePlan(false)} dynamicPrices={dynamicPrices} />
      )}
    </div>
  );
}
