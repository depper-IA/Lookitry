'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, Mail, MessageCircle, ArrowUpCircle, ArrowDownCircle, AlertCircle, Banknote, RefreshCw } from 'lucide-react';
import { subscriptionService } from '@/services/subscription.service';
import { formatCurrency } from '@/utils/currency';
import type { SubscriptionPayment } from '@/types';
import type { SubscriptionInfo } from '@/services/subscription.service';
import { Spinner } from '@/components/ui/Spinner';

// ── Constantes ────────────────────────────────────────────────────────────────

const PLAN_INFO_STATIC = {
  BASIC: {
    name: 'Plan Básico',
    price: 150000,
    gradient: 'from-[#0a0a0a] via-[#141414] to-[#0d0a08]',
    accentColor: '#FF5C3A',
    glowColor: 'rgba(255,92,58,0.25)',
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
    gradient: 'from-[#080808] via-[#111111] to-[#0a0806]',
    accentColor: '#FF5C3A',
    glowColor: 'rgba(255,92,58,0.35)',
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
  gradient: 'from-[#0a0a0a] via-[#141414] to-[#0d0a08]',
  accentColor: '#FF5C3A',
  glowColor: 'rgba(255,92,58,0.25)',
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
  active:        { label: 'Activa',      color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  expiring_soon: { label: 'Por vencer',  color: 'text-amber-500',   bg: 'bg-amber-500/10 border-amber-500/20'   },
  expired:       { label: 'Vencida',     color: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/20'       },
  suspended:     { label: 'Suspendida',  color: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/20'       },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completado',  color: 'text-emerald-500' },
  pending:   { label: 'Pendiente',   color: 'text-amber-500'   },
  failed:    { label: 'Fallido',     color: 'text-red-500'     },
  refunded:  { label: 'Reembolsado', color: 'text-[var(--text-muted)]' },
};

function formatDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const router = useRouter();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
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
          subscriptionService.getPayments(),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/payment-settings/public`)
            .then(r => r.ok ? r.json() : null),
          fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vkdooutklowctuudjnkl.supabase.co'}/rest/v1/pricing_config?id=in.(basic,pro)&select=id,data`,
            {
              headers: {
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
              },
            }
          ).then(r => r.ok ? r.json() : null),
        ]);
        if (subResult.status === 'fulfilled') setInfo(subResult.value);
        if (paymentsResult.status === 'fulfilled') setPayments(paymentsResult.value);
        if (settingsResult.status === 'fulfilled' && settingsResult.value) {
          setPaySettings(settingsResult.value);
        }
        if (pricingResult.status === 'fulfilled' && Array.isArray(pricingResult.value)) {
          const prices = { BASIC: PLAN_INFO_STATIC.BASIC.price, PRO: PLAN_INFO_STATIC.PRO.price };
          for (const row of pricingResult.value) {
            if (row.id === 'basic' && row.data?.precio_mensual_cop) prices.BASIC = row.data.precio_mensual_cop;
            if (row.id === 'pro'   && row.data?.precio_mensual_cop) prices.PRO   = row.data.precio_mensual_cop;
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
      <div className="flex items-center justify-center min-h-64 py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="text-center py-16 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50 text-[var(--text-muted)]" />
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">No se pudo cargar la información de suscripción.</p>
      </div>
    );
  }

  const plan = (info.brand.plan as PlanKey) in PLAN_INFO_STATIC ? (info.brand.plan as PlanKey) : 'BASIC';
  const PLAN_INFO = {
    BASIC: { ...PLAN_INFO_STATIC.BASIC, price: dynamicPrices.BASIC },
    PRO:   { ...PLAN_INFO_STATIC.PRO,   price: dynamicPrices.PRO },
  };
  const planInfo    = PLAN_INFO[plan];
  const statusInfo  = STATUS_LABELS[info.status ?? 'active'] ?? STATUS_LABELS.active;
  const inTrial     = info.isInTrial ?? false;
  const trialDaysLeft = info.trialDaysRemaining ?? 0;

  const progressPercent = info.daysRemaining != null
    ? Math.min(100, Math.max(0, Math.round(((30 - info.daysRemaining) / 30) * 100)))
    : 100;

  const heroGradient = inTrial ? TRIAL_INFO.gradient  : planInfo.gradient;
  const heroAccent   = inTrial ? TRIAL_INFO.accentColor : planInfo.accentColor;
  const heroTitle    = inTrial ? TRIAL_INFO.name : planInfo.name;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-16">

      {/* HEADER */}
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)] italic uppercase font-jakarta">
          Facturación y Planes
        </h1>
        <p className="text-sm text-[var(--text-secondary)] font-medium max-w-2xl leading-relaxed">
          Administra los recursos de tu probador virtual, revisa tus límites y actualiza tus métodos de pago en cualquier momento.
        </p>
      </header>

      {/* ══ HERO PLAN ══ */}
      <div className={`rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br ${heroGradient} p-6 sm:p-8 md:p-10 text-white shadow-2xl relative overflow-hidden`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-60"
            style={{ background: `radial-gradient(circle, ${heroAccent}55 0%, transparent 70%)` }} />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-2xl opacity-40"
            style={{ background: `radial-gradient(circle, ${heroAccent}33 0%, transparent 70%)` }} />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: `linear-gradient(${heroAccent} 1px, transparent 1px), linear-gradient(90deg, ${heroAccent} 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${heroAccent}88, transparent)` }} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6 md:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                style={{ backgroundColor: heroAccent, boxShadow: `0 0 8px ${heroAccent}` }} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: `${heroAccent}cc` }}>Tu plan actual</p>
            </div>
            <div className="flex items-end gap-3 flex-wrap mb-3">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter italic uppercase leading-none"
                style={{ textShadow: `0 0 60px ${heroAccent}44` }}>
                {heroTitle}
              </h2>
              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest mb-1 border flex-shrink-0"
                style={{ color: heroAccent, borderColor: `${heroAccent}44`, background: `${heroAccent}15`, boxShadow: `0 0 20px ${heroAccent}20` }}>
                {inTrial ? 'Trial activo' : statusInfo.label}
              </span>
            </div>
            <p className="text-white/80 text-lg font-black tracking-tight">
              {inTrial ? (
                <span className="text-sm font-bold uppercase tracking-widest opacity-60">Período de prueba gratuito</span>
              ) : (
                <>{formatCurrency(planInfo.price)}<span className="text-sm font-bold uppercase tracking-widest opacity-50"> /mes</span></>
              )}
            </p>
            <div className="mt-8 max-w-sm">
              <div className="flex justify-between items-center mb-2 gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex-shrink-0">Renovación</span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex-shrink-0"
                  style={{ color: heroAccent, background: `${heroAccent}18`, border: `1px solid ${heroAccent}30` }}>
                  {inTrial
                    ? (trialDaysLeft > 0 ? `${trialDaysLeft} días` : 'Trial vencido')
                    : (info.daysRemaining != null && info.daysRemaining > 0 ? `${info.daysRemaining} días` : 'Vencida')}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${inTrial ? Math.max(5, Math.round((trialDaysLeft / (info.trialDaysRemaining ?? 7)) * 100)) : progressPercent}%`,
                    background: `linear-gradient(90deg, ${heroAccent}88, ${heroAccent})`,
                    boxShadow: `0 0 12px ${heroAccent}88`,
                  }} />
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-3 flex-shrink-0 flex-wrap">
            {inTrial ? (
              <>
                <button onClick={() => router.push('/dashboard/checkout?plan=BASIC')}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl whitespace-nowrap"
                  style={{ background: heroAccent, color: '#ffffff', boxShadow: `0 8px 32px ${heroAccent}50` }}>
                  <ArrowUpCircle className="w-4 h-4 flex-shrink-0" /> Activar Básico
                </button>
                <button onClick={() => router.push('/dashboard/checkout?plan=PRO')}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 border whitespace-nowrap"
                  style={{ color: heroAccent, borderColor: `${heroAccent}40`, background: `${heroAccent}12`, backdropFilter: 'blur(12px)' }}>
                  <ArrowUpCircle className="w-4 h-4 flex-shrink-0" /> Activar PRO
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push(`/dashboard/checkout?plan=${plan === 'BASIC' ? 'PRO' : 'BASIC'}`)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 border whitespace-nowrap"
                  style={{ color: heroAccent, borderColor: `${heroAccent}40`, background: `${heroAccent}12`, backdropFilter: 'blur(12px)' }}>
                  {plan === 'BASIC'
                    ? <><ArrowUpCircle className="w-4 h-4 flex-shrink-0" /> Cambiar a Pro</>
                    : <><ArrowDownCircle className="w-4 h-4 flex-shrink-0" /> Cambiar a Básico</>}
                </button>
                {(info?.status === 'expiring_soon' || info?.status === 'expired') && (
                  <button onClick={() => router.push(`/dashboard/checkout?plan=${plan}`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 shadow-2xl whitespace-nowrap"
                    style={{ background: heroAccent, color: '#ffffff', boxShadow: `0 8px 32px ${heroAccent}50` }}>
                    <CreditCard className="w-4 h-4 flex-shrink-0" /> Renovar ahora
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══ PLANES EN FILA ══ */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-[#FF5C3A]" />
          </div>
          <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">Nuestros Planes</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {(Object.keys(PLAN_INFO) as PlanKey[]).map(p => {
            const pi = PLAN_INFO[p];
            const isCurrent = !inTrial && p === plan;
            return (
              <div key={p}
                className={`rounded-[2rem] border-2 p-6 transition-all duration-300 relative overflow-hidden flex flex-col ${isCurrent ? 'bg-[var(--bg-card)] border-[#FF5C3A] shadow-2xl shadow-[#FF5C3A]/10' : 'bg-[var(--bg-base)] border-[var(--border-color)] hover:border-[var(--text-muted)]'}`}>
                {isCurrent && (
                  <div className="absolute top-0 right-0 px-4 py-2 bg-[#FF5C3A] text-white text-[9px] font-black uppercase tracking-widest rounded-bl-3xl">
                    Tu Plan Actual
                  </div>
                )}
                <div className="mb-6">
                  <h4 className={`text-3xl font-black uppercase italic tracking-tighter ${isCurrent ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'}`}>{pi.name}</h4>
                  <p className={`text-xs font-bold uppercase tracking-widest mt-2 ${isCurrent ? 'text-[#FF5C3A]' : 'text-[var(--text-muted)]'}`}>
                    {formatCurrency(pi.price)}/mes
                  </p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {pi.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrent ? 'bg-[#FF5C3A]/20' : 'bg-[#FF5C3A]/10'}`}>
                        <CheckCircle className="w-3 h-3 text-[#FF5C3A]" />
                      </div>
                      <span className="text-sm font-medium text-[var(--text-secondary)] leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                {(inTrial || !isCurrent) && (
                  <button onClick={() => router.push(`/dashboard/checkout?plan=${p}`)}
                    className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all bg-[#FF5C3A] text-white hover:brightness-110 active:scale-95 shadow-lg shadow-[#FF5C3A]/20">
                    {inTrial ? `Activar ${pi.name}` : `Cambiar a ${pi.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ MÉTODOS DE PAGO + HISTORIAL ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Métodos de Pago */}
        <div className="bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border-color)] space-y-5 shadow-xl shadow-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-[#FF5C3A]" />
            </div>
            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">Métodos de Pago</h3>
          </div>

          {paySettings?.wompiEnabled && (
            <div className="bg-[var(--bg-base)] p-5 rounded-[1.5rem] border border-[var(--border-color)] hover:border-[#FF5C3A]/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF5C3A] flex items-center justify-center shadow-lg shadow-[#FF5C3A]/30 flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-sm uppercase tracking-tight italic text-[var(--text-primary)]">Pago en línea</span>
              </div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-4 leading-relaxed">
                Paga de forma segura con tarjeta, PSE o Nequi vía Wompi.
              </p>
              <button onClick={() => router.push(`/dashboard/checkout?plan=${plan}`)}
                className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-[var(--bg-card)] border-2 border-[#FF5C3A] text-[#FF5C3A] rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-[#FF5C3A] hover:text-white active:scale-95">
                Renovar ahora
              </button>
            </div>
          )}

          {paySettings?.transferEnabled && (
            <div className="bg-[var(--bg-base)] p-5 rounded-[1.5rem] border border-[var(--border-color)] hover:border-[var(--text-muted)] transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--text-primary)]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" style={{ color: 'var(--text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                </div>
                <span className="font-black text-sm uppercase tracking-tight italic text-[var(--text-primary)]">Transferencia</span>
              </div>
              <div className="text-[11px] space-y-2 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
                {paySettings.transferBankName && <p className="font-medium text-[var(--text-secondary)] flex justify-between gap-2">Banco <span className="text-[var(--text-primary)] font-black uppercase tracking-tight">{paySettings.transferBankName}</span></p>}
                {paySettings.transferAccountHolder && <p className="font-medium text-[var(--text-secondary)] flex justify-between gap-2">Titular <span className="text-[var(--text-primary)] font-black uppercase tracking-tight">{paySettings.transferAccountHolder}</span></p>}
                {paySettings.transferAccountNumber && <p className="font-medium text-[var(--text-secondary)] flex justify-between gap-2">Cuenta {paySettings.transferAccountType} <span className="text-[var(--text-primary)] font-black tracking-widest">{paySettings.transferAccountNumber}</span></p>}
              </div>
            </div>
          )}

          {(paySettings?.manualEnabled || !paySettings) && (
            <div className="bg-[var(--bg-base)] p-5 rounded-[1.5rem] border border-[var(--border-color)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="font-black text-sm uppercase tracking-tight italic text-[var(--text-primary)]">Soporte Directo</span>
              </div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-4">
                {paySettings?.manualInstructions || 'Contáctanos por WhatsApp para coordinar tu pago.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(paySettings?.manualWhatsapp || !paySettings) && (
                  <a href={`https://wa.me/${(paySettings?.manualWhatsapp || '573105436281').replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:brightness-110 active:scale-95">
                    <MessageCircle className="w-3.5 h-3.5 fill-current" /> WhatsApp
                  </a>
                )}
                {(paySettings?.manualEmail || !paySettings) && (
                  <a href={`mailto:${paySettings?.manualEmail || 'info@lookitry.com'}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:border-[var(--text-muted)] active:scale-95">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Historial de Transacciones */}
        <div className="bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border-color)] shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#FF5C3A]" />
            </div>
            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">Historial</h3>
          </div>
          {(!Array.isArray(payments) || payments.length === 0) ? (
            <div className="text-center py-12 bg-[var(--bg-base)] rounded-2xl border border-dashed border-[var(--border-color)]">
              <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Sin transacciones aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="pb-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Fecha</th>
                    <th className="pb-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Monto</th>
                    <th className="pb-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {payments.map(p => {
                    const st = PAYMENT_STATUS[p.status] ?? { label: p.status, color: 'text-[var(--text-muted)]' };
                    return (
                      <tr key={p.id} className="hover:bg-[var(--bg-base)] transition-colors">
                        <td className="py-4 pr-4">
                          <p className="text-xs font-black tracking-tight text-[var(--text-primary)]">{formatDate(p.paymentDate)}</p>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-0.5">{p.paymentMethod ?? 'Manual'}</p>
                        </td>
                        <td className="py-4 pr-4 text-sm font-black text-[#FF5C3A] tracking-tighter">{formatCurrency(p.amount)}</td>
                        <td className="py-4 text-right">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${st.color}`}
                            style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
