'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  CreditCard, 
  CheckCircle, 
  Mail, 
  MessageCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertCircle, 
  Banknote, 
  RefreshCw,
  Sparkles,
  Zap,
  Globe,
  Rocket,
  ChevronRight,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscriptionService } from '@/services/subscription.service';
import { usageService } from '@/services/usage.service';
import { paymentsService } from '@/services/payments.service';
import { authService } from '@/services/auth.service';
import { formatCurrency } from '@/utils/currency';
import type { SubscriptionPayment } from '@/types';
import type { SubscriptionInfo } from '@/services/subscription.service';
import { Spinner } from '@/components/ui/Spinner';
import type { UsageStats } from '@/types';
import { getSubscriptionDisplayState } from '@/lib/subscription-display';
import { DEFAULT_PRICING, FALLBACK_PRICES, FALLBACK_GENERATIONS } from '@/config/pricing';

// ── Animaciones ──────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.7,
      staggerChildren: 0.12
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// ── Constantes Estilográficas ────────────────────────────────────────────────
const DESIGN_SYSTEM = {
  BASIC: {
    name: 'Lookitry Basic',
    color: '#FF5C3A',
    secondaryColor: '#FF5C3A',
    glow: 'rgba(255, 92, 58, 0.08)',
    bg: 'bg-[var(--bg-card)]',
    icon: <Globe className="w-8 h-8" />,
    label: 'Plan básico'
  },
  PRO: {
    name: 'Lookitry Pro',
    color: '#FF5C3A',
    secondaryColor: '#FF5C3A',
    glow: 'rgba(255, 92, 58, 0.12)',
    bg: 'bg-[var(--bg-card)]',
    icon: <Rocket className="w-8 h-8" />,
    label: 'Plan pro'
  },
  TRIAL: {
     name: 'Período trial',
     color: '#FF5C3A',
     secondaryColor: '#FF5C3A',
     glow: 'rgba(255, 92, 58, 0.08)',
     bg: 'bg-[var(--bg-card)]',
     icon: <Zap className="w-8 h-8" />,
     label: 'Acceso trial'
  },
  ENTERPRISE: {
     name: 'Lookitry Enterprise',
     color: '#FF5C3A',
     secondaryColor: '#FF5C3A',
     glow: 'rgba(255, 92, 58, 0.12)',
     bg: 'bg-[var(--bg-card)]',
     icon: <Rocket className="w-8 h-8" />,
     label: 'Plan enterprise'
  }
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active:        { label: 'Sincronizada', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  expiring_soon: { label: 'Por vencer',   color: 'text-amber-500',   bg: 'bg-amber-500/10 border-amber-500/20'   },
  expired:       { label: 'Desactivada',  color: 'text-rose-500',    bg: 'bg-rose-500/10 border-rose-500/20'       },
  suspended:     { label: 'Suspendida',   color: 'text-rose-500',    bg: 'bg-rose-500/10 border-rose-500/20'       },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completado',  color: 'text-emerald-500' },
  pending:   { label: 'Pendiente',   color: 'text-amber-500'   },
  failed:    { label: 'Fallido',   color: 'text-rose-500'     },
};

function formatDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

const formatUsd = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatPaymentDisplay = (payment: SubscriptionPayment): string => {
  if (payment.currency === 'USD') {
    return formatUsd(payment.amount_original ?? payment.amount);
  }

  return formatCurrency(payment.amount_original ?? payment.amount);
};

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicPrices, setDynamicPrices] = useState<{ BASIC: number; PRO: number; TRIAL: number }>({ ...FALLBACK_PRICES });
  const [dynamicGenerations, setDynamicGenerations] = useState<{ BASIC: number; PRO: number }>({ ...FALLBACK_GENERATIONS });
  const [paySettings, setPaySettings] = useState<any>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [buyingAddon, setBuyingAddon] = useState(false);
  const [addonError, setAddonError] = useState('');
  const [selectedAddonGateway, setSelectedAddonGateway] = useState<'wompi' | 'paypal'>('wompi');
  const [resendSending, setResendSending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const load = async () => {
      try {
        const [subResult, paymentsResult, usageResult, settingsResult, pricingResult] = await Promise.allSettled([
          subscriptionService.getSubscriptionInfo(),
          subscriptionService.getPayments(),
          usageService.getUsageStats(),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/payment-settings/public`).then(r => r.ok ? r.json() : null),
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?id=in.(basic,pro,trial)&select=id,data`, {
            headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` },
          }).then(r => r.ok ? r.json() : null),
        ]);
        if (subResult.status === 'fulfilled') setInfo(subResult.value);
        if (paymentsResult.status === 'fulfilled') setPayments(paymentsResult.value);
        if (usageResult.status === 'fulfilled') setUsage(usageResult.value);
        if (settingsResult.status === 'fulfilled') setPaySettings(settingsResult.value);
        if (pricingResult.status === 'fulfilled' && Array.isArray(pricingResult.value)) {
          const prices = { ...FALLBACK_PRICES };
          const gens = { ...FALLBACK_GENERATIONS };
          pricingResult.value.forEach((row: any) => {
            if (row.id === 'basic') {
              prices.BASIC = row.data.precio_mensual_cop ?? FALLBACK_PRICES.BASIC;
              if (row.data.generaciones_mensuales ?? row.data.generaciones_mes) {
                gens.BASIC = row.data.generaciones_mensuales ?? row.data.generaciones_mes;
              }
            }
            if (row.id === 'pro') {
              prices.PRO = row.data.precio_mensual_cop ?? FALLBACK_PRICES.PRO;
              if (row.data.generaciones_mensuales ?? row.data.generaciones_mes) {
                gens.PRO = row.data.generaciones_mensuales ?? row.data.generaciones_mes;
              }
            }
            if (row.id === 'trial') {
              prices.TRIAL = row.data.precio_mensual_cop ?? row.data.precio_cop ?? FALLBACK_PRICES.TRIAL;
            }
          });
          setDynamicPrices(prices);
          setDynamicGenerations(gens);
        } else if (pricingResult.status === 'rejected') {
          console.warn('[SubscriptionPage] Error fetching pricing config, using fallbacks:', pricingResult.reason);
          setDynamicPrices({ ...FALLBACK_PRICES });
          setDynamicGenerations({ ...FALLBACK_GENERATIONS });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!paySettings) return;

    const wompiEnabled = paySettings?.wompiEnabled !== false;
    const paypalEnabled = paySettings?.paypalEnabled === true;

    if (!wompiEnabled && paypalEnabled) {
      setSelectedAddonGateway('paypal');
      return;
    }

    if (wompiEnabled) {
      setSelectedAddonGateway('wompi');
    }
  }, [paySettings]);

  // Verificar pago de créditos adicionales si volvemos desde Wompi o PayPal
  useEffect(() => {
    const status = searchParams.get('addon');
    const ref = searchParams.get('ref');
    if (status === 'success' && ref) {
      paymentsService.verifyAddon(ref).then(() => {
        // Recargar stats de uso silenciosamente por si se acaban de aplicar
        usageService.getUsageStats().then(setUsage).catch(() => {});
      }).catch(console.error);
    }
  }, [searchParams]);

  const subscriptionState = getSubscriptionDisplayState(info?.brand);
  const inTrial = (info?.isInTrial ?? false) || subscriptionState.isTrial || subscriptionState.displayPlan === 'TRIAL';
  const rawPlanKey = (subscriptionState.displayPlan ?? info?.brand?.plan ?? 'BASIC') as keyof typeof DESIGN_SYSTEM;
  const planKey = rawPlanKey in DESIGN_SYSTEM ? rawPlanKey : 'BASIC';
  const paidPlanKey = planKey === 'ENTERPRISE' ? 'PRO' : planKey;
  const currentDesign = inTrial ? DESIGN_SYSTEM.TRIAL : DESIGN_SYSTEM[planKey];
  const planStatus = inTrial
    ? {
        label: subscriptionState.statusLabel,
        color: subscriptionState.isTrialExpired ? 'text-rose-500' : 'text-amber-500',
      }
    : STATUS_LABELS[info?.status ?? 'active'];

  const displayDaysRemaining = inTrial ? (info?.trialDaysRemaining ?? 0) : (info?.daysRemaining ?? 0);
  const maxDays = inTrial ? 7 : 30; // Approximation for progress bar
  const progressPercent = Math.min(100, Math.max(0, Math.round(((maxDays - displayDaysRemaining) / maxDays) * 100)));
  const addonStatus = searchParams.get('addon');
  const addonSuccess = addonStatus === 'success';
  const addonCancelled = addonStatus === 'cancelled';
  const wompiAvailable = paySettings?.wompiEnabled !== false;
  const paypalAvailable = paySettings?.paypalEnabled === true;
  const addonPriceCop = 50000;
  const trm = Number(paySettings?.trm) > 0 ? Number(paySettings.trm) : 3900;
  const addonPriceUsd = Math.ceil((addonPriceCop / trm) * 100) / 100;
  const addonDisplayPrice = selectedAddonGateway === 'paypal'
    ? formatUsd(addonPriceUsd)
    : formatCurrency(addonPriceCop);
  const needsEmailVerification = info?.brand?.emailVerified === false;
  const addonLockedForTrial = inTrial;
  const addonLockedForVerification = needsEmailVerification;
  const addonLocked = addonLockedForTrial || addonLockedForVerification;

  const planFeatures = {
    BASIC: [
      'Hasta 5 productos activos',
      `${dynamicGenerations.BASIC} generaciones mensuales`,
      'Branding base (logo / colores)',
      'Plantillas: Minimal & Modern',
      'Soporte estándar WhatsApp',
      'Probador en URL propia slug'
    ],
    PRO: [
      'Hasta 15 productos activos',
      `${dynamicGenerations.PRO} generaciones mensuales`,
      'Control total de branding',
      'Todas las plantillas incl. Bold',
      'Textos de botón personalizados',
      'Mensaje de bienvenida único',
      'Slug personalizado ilimitado',
      'Soporte prioritario VIP'
    ]
  };

  // Lógica de filtrado y paginación
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.amount.toString().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const pagedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleBuyAddon = async () => {
    try {
      setBuyingAddon(true);
      setAddonError('');
      const checkout = await paymentsService.checkoutAddon('credits_500', selectedAddonGateway);
      window.location.href = checkout.checkoutUrl;
    } catch (error: any) {
      const rawMessage = error?.message || 'No se pudo iniciar la compra de créditos extra';
      const friendlyMessage =
        rawMessage.includes('Paquete adicional no encontrado o inactivo')
          ? 'El paquete de créditos extra aún no está configurado o activo en este entorno.'
          : rawMessage;
      setAddonError(friendlyMessage);
    } finally {
      setBuyingAddon(false);
    }
  };

  const handleResendVerification = async () => {
    if (!info?.brand?.email || resendSending) return;
    try {
      setResendSending(true);
      await authService.resendVerification(info.brand.email);
      setResendSent(true);
    } catch (error: any) {
      setAddonError(error?.message || 'No se pudo reenviar el correo de verificación');
    } finally {
      setResendSending(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-6xl mx-auto space-y-12 pb-24 px-4 lg:px-0"
    >
      {/* ══ TÍTULO ══ */}
      <motion.header variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#FF5C3A]" />
             </div>
             <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-none font-jakarta">Suscripción</h1>
          </div>
          <p className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase opacity-60">Gestión de plan y pagos</p>
        </div>
      </motion.header>

      {needsEmailVerification && (
        <motion.div variants={itemVariants} className="rounded-[2rem] border border-[#FF5C3A]/20 bg-[#FF5C3A]/6 p-6 shadow-lg shadow-[#FF5C3A]/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#FF5C3A]">Verificación pendiente</p>
              <h3 className="text-xl font-jakarta font-bold text-[var(--text-primary)]">Confirma tu correo para habilitar creditos y uso del widget</h3>
              <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
                Ya puedes revisar tu plan y tus créditos, pero conviene verificar <span className="font-semibold text-[var(--text-primary)]">{info?.brand?.email}</span> para completar la activación y evitar fricción en compras, recuperación y cambios futuros.
              </p>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={resendSending}
              className="inline-flex items-center justify-center rounded-2xl bg-[#FF5C3A] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#FF5C3A]/25 transition-all hover:brightness-110 disabled:opacity-60"
            >
              {resendSending ? 'Enviando...' : resendSent ? 'Correo reenviado' : 'Reenviar correo'}
            </button>
          </div>
        </motion.div>
      )}

      {/* ══ HERO CARD ══ */}
      <motion.div 
        variants={itemVariants} 
        className={`relative overflow-hidden rounded-[3.5rem] p-8 sm:p-12 ${currentDesign.bg} border border-[var(--border-color)] shadow-xl shadow-black/5`}
      >
         <div className="absolute inset-x-0 top-0 h-28 border-b border-[#FF5C3A]/10 bg-gradient-to-r from-[#FF5C3A]/6 via-transparent to-[#FF5C3A]/8" />
         <div className="absolute top-10 right-10 h-40 w-40 rounded-full blur-[80px] opacity-[0.08]" style={{ background: currentDesign.color }} />
         
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-center">
            <div className="space-y-8">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-[#FF5C3A] bg-[#FF5C3A]/10 border border-[#FF5C3A]/20">
                        Plan actual
                     </span>
                  </div>
                  <h2 className="text-6xl sm:text-7xl font-bold tracking-tighter text-[var(--text-primary)] leading-none font-jakarta">
                     {currentDesign.name}
                  </h2>
               </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                       {inTrial ? 'Fin del trial' : 'Próxima renovación'}
                     </p>
                     <p className="text-xl font-bold text-[var(--text-primary)]">
                       {formatDate(inTrial ? info?.trialEndDate : info?.brand?.subscriptionEndDate)}
                     </p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                       {inTrial ? 'Siguiente paso' : 'Precio mensual'}
                     </p>
                     <p className="text-xl font-bold text-[#FF5C3A]">
                       {inTrial ? 'Activa un plan' : formatCurrency(dynamicPrices[paidPlanKey] ?? 0)}
                     </p>
                  </div>
               </div>

               <div className="space-y-3 max-w-sm">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                     <span className="text-[var(--text-muted)] opacity-80">Días restantes</span>
                     <span className="text-[#FF5C3A] font-bold">{displayDaysRemaining} DÍAS</span>
                  </div>
                  <div className="h-2.5 bg-[var(--text-primary)]/10 rounded-full overflow-hidden border border-[var(--border-color)] shadow-inner">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full rounded-full bg-[#FF5C3A]"
                        style={{ boxShadow: `0 0 15px ${currentDesign.color}33` }}
                     />
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-4 bg-[var(--bg-input)] p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center text-[#FF5C3A] shadow-inner">
                     {currentDesign.icon}
                  </div>
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Estado del plan</p>
                     <p className={`text-sm font-bold uppercase ${planStatus.color}`}>
                        {planStatus.label}
                     </p>
                  </div>
               </div>

                <div className="space-y-2 mb-6">
                   <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Opciones</p>
                   {inTrial ? (
                      <div className="grid grid-cols-1 gap-3">
                         <button onClick={() => router.push('/dashboard/checkout?plan=BASIC')} className="w-full py-5 bg-[#FF5C3A] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg hover:brightness-110 transition-all active:scale-95">Activar plan básico</button>
                         <button onClick={() => router.push('/dashboard/checkout?plan=PRO')} className="w-full py-5 border-2 border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95">Cambiar a pro</button>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 gap-3">
                         {planKey === 'BASIC' && (
                            <button onClick={() => router.push(`/dashboard/checkout?plan=PRO`)} className="w-full py-5 border-2 border-[#FF5C3A]/40 hover:bg-[#FF5C3A]/5 text-[#FF5C3A] rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95">
                               Mejorar a pro
                            </button>
                         )}
                         <button onClick={() => router.push(`/dashboard/checkout?plan=${planKey}`)} className="w-full py-5 bg-[#FF5C3A] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-[#FF5C3A]/30 active:scale-95 transition-all">
                            {info?.status === 'active' ? 'Extender plan' : 'Renovar plan'}
                         </button>
                      </div>
                   )}
                </div>
            </div>
         </div>
      </motion.div>

      {/* ══ FILA DE PLANES ══ */}
      <motion.div variants={itemVariants} className="space-y-8">
         <div className="flex items-center gap-4">
            <div className="h-px bg-[var(--border-color)] flex-1" />
            <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--text-primary)]">Amplía tu alcance</h3>
            <div className="h-px bg-[var(--border-color)] flex-1" />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-10">
            {['BASIC', 'PRO'].map((p) => {
               const pk = p as 'BASIC' | 'PRO';
               const isCurrent = !inTrial && planKey === pk;
               return (
                  <motion.div 
                     key={pk}
                     whileHover={{ y: -8 }}
                     className={`relative p-10 rounded-[3.5rem] border-2 transition-all duration-500 overflow-hidden ${isCurrent ? 'bg-[var(--bg-card)] border-[#FF5C3A] shadow-xl' : 'bg-[var(--bg-base)] border-[var(--border-color)] hover:border-[var(--text-muted)]'}`}
                  >
                     {isCurrent && (
                        <div className="absolute top-0 right-0 px-8 py-3 bg-[#FF5C3A] text-white text-[9px] font-bold uppercase tracking-widest rounded-bl-[2.5rem]">
                           Plan actual
                        </div>
                     )}
                     <div className="mb-10">
                        <h4 className={`text-4xl font-bold tracking-tighter uppercase ${isCurrent ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'}`}>{pk}</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                           <span className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(dynamicPrices[pk])}</span>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">/ Mes</span>
                        </div>
                     </div>
                     <ul className="space-y-4 mb-12">
                        {planFeatures[pk as keyof typeof planFeatures].map((f, i) => (
                           <li key={i} className="flex items-start gap-4">
                              <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${isCurrent ? 'bg-[#FF5C3A]/20' : 'bg-[#FF5C3A]/10'}`}>
                                 <CheckCircle className="w-3 h-3 text-[#FF5C3A]" />
                              </div>
                              <span className="text-xs font-bold tracking-tight text-[var(--text-secondary)] opacity-80">{f}</span>
                           </li>
                        ))}
                     </ul>
                     <button 
                        onClick={() => router.push(`/dashboard/checkout?plan=${pk}`)}
                        className={`w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 ${isCurrent ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' : 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20 hover:brightness-110'}`}
                     >
                        {isCurrent ? 'Extender plan' : `Seleccionar ${pk}`}
                     </button>
                  </motion.div>
               );
            })}
         </div>
      </motion.div>

      {/* ══ PASARELAS DE PAGO ══ */}
      <motion.div variants={itemVariants} className="bg-[var(--bg-card)] rounded-3xl md:rounded-[3.5rem] border border-[var(--border-color)] p-8 md:p-16 shadow-xl shadow-black/5 space-y-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Cpu size={180} /></div>
         <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] border border-[#FF5C3A]/20 shadow-inner">
               <Cpu size={24} />
            </div>
            <div>
               <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-jakarta">Pagos y pasarelas</h3>
               <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">Soporte nativo para transacciones seguras</p>
            </div>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
            {[
              { name: 'Bancolombia', img: '/integrations/bancolombia.svg' },
              { name: 'Nequi', img: '/integrations/logo-nequi.svg' },
              { name: 'PSE', img: '/integrations/logo-pse.svg' },
              { name: 'Visa', img: '/integrations/visa.svg' }
            ].map(p => (
              <div key={p.name} className="p-6 md:p-8 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center grayscale hover:grayscale-0 hover:border-[#FF5C3A]/30 transition-all group/p shadow-sm hover:shadow-lg">
                 <img src={p.img} alt={p.name} className="h-6 md:h-7 w-auto object-contain group-hover/p:scale-110 transition-transform" />
              </div>
            ))}
         </div>
         <p className="text-[10px] font-medium text-[var(--text-muted)] text-center opacity-60">Procesamos tus pagos localmente en Colombia vía Wompi y mundialmente vía PayPal.</p>
      </motion.div>

      {/* ══ HISTORIAL & SOPORTE ══ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-10">
         <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 md:p-8 xl:p-12 space-y-8 shadow-xl shadow-black/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
                     <RefreshCw className="w-5 h-5 text-[#FF5C3A]" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Historial de pagos</h3>
               </div>

               <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Buscar por ID..." 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider px-10 py-3 rounded-xl outline-none focus:border-[#FF5C3A] transition-all"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-[var(--text-muted)]">
                      <Zap size={14} />
                    </div>
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider px-6 py-3 rounded-xl outline-none focus:border-[#FF5C3A] transition-all cursor-pointer"
                  >
                    <option value="all">TODOS</option>
                    <option value="completed">COMPLETADOS</option>
                    <option value="pending">PENDIENTES</option>
                    <option value="failed">FALLIDOS</option>
                  </select>
               </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-[var(--border-color)] opacity-40">
                        <th className="pb-5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Fecha</th>
                        <th className="pb-5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Inversión</th>
                        <th className="pb-5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-right">Estado</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                     {pagedPayments.map(p => (
                        <tr key={p.id} className="group hover:bg-[var(--bg-hover)] transition-colors">
                           <td className="py-6 pr-4">
                              <p className="text-xs font-bold text-[var(--text-primary)]">{formatDateTime(p.paymentDate)}</p>
                              <p className="text-[10px] font-semibold uppercase tracking-tight text-[var(--text-muted)] opacity-50">{p.paymentMethod ?? 'Pago manual'}</p>
                           </td>
                           <td className="py-6 pr-4">
                              <p className="text-sm font-bold text-[#FF5C3A] tracking-tight">
                                {formatCurrency(p.amount_cop ?? p.amount)}
                              </p>
                              {p.currency === 'USD' ? (
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                  {formatPaymentDisplay(p)}
                                  {p.exchange_rate_used ? ` · TRM ${p.exchange_rate_used.toLocaleString('es-CO')}` : ''}
                                </p>
                              ) : (
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                  {formatPaymentDisplay(p)}
                                </p>
                              )}
                           </td>
                           <td className="py-6 text-right">
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[var(--border-color)] ${PAYMENT_STATUS[p.status]?.color ?? 'text-white'}`}>
                                 {PAYMENT_STATUS[p.status]?.label ?? p.status}
                              </span>
                           </td>
                        </tr>
                     ))}
                     {payments.length === 0 && (
                        <tr><td colSpan={3} className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-30">Sin pagos registrados</td></tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
               <div className="flex items-center justify-center gap-4 pt-6">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-full border border-[var(--border-color)] hover:border-[#FF5C3A] text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Página {currentPage} de {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-full border border-[var(--border-color)] hover:border-[#FF5C3A] text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
               </div>
            )}
         </div>

         <div className="space-y-8">
            <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] space-y-6 shadow-xl shadow-black/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C3A]/5 blur-3xl rounded-full" />
               <div className="relative z-10 space-y-5">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-[#FF5C3A]" />
                     </div>
                     <div>
                        <h4 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Créditos extra</h4>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">Capacidad adicional inmediata</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] p-4 relative overflow-hidden group/box">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover/box:text-[#FF5C3A] transition-colors">Suscripción (Mes)</p>
                        <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">{usage?.currentMonth?.generationsRemaining ?? 0}</p>
                        <div className="mt-1 h-1 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-[#FF5C3A] transition-all duration-1000" 
                             style={{ width: `${Math.min(100, (usage?.currentMonth?.generationsUsed || 0) / (usage?.currentMonth?.generationsLimit || 1) * 100)}%` }} 
                           />
                        </div>
                     </div>
                     <div className="rounded-2xl border border-[#FF5C3A]/20 bg-[#FF5C3A]/5 p-4 relative overflow-hidden group/box">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF5C3A]">Créditos Extra</p>
                        <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">{usage?.extraCreditsBalance ?? 0}</p>
                        <p className="mt-1 text-[8px] font-bold uppercase tracking-tighter text-[var(--text-muted)] opacity-60">Sin vencimiento</p>
                     </div>
                  </div>

                  <div className="flex items-center justify-between px-2 pt-1 border-t border-[var(--border-color)] border-dashed">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Total Disponible ahora:</span>
                    <span className="text-sm font-black text-[#FF5C3A]">{usage?.availableCredits ?? 0}</span>
                  </div>

                  {addonLocked && (
                    <div className="rounded-2xl border border-[#FF5C3A]/20 bg-[#FF5C3A]/6 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF5C3A]">
                        {addonLockedForTrial ? 'Creditos extra no disponibles en trial' : 'Verificacion requerida'}
                      </p>
                      <p className="mt-2 text-sm font-bold text-[var(--text-primary)]">
                        {addonLockedForTrial
                          ? 'Activa un plan pago para habilitar paquetes de creditos extra.'
                          : 'Confirma tu correo para habilitar compra y consumo de creditos.'}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {addonLockedForTrial
                          ? 'Durante el trial usas unicamente los creditos incluidos en tu prueba. Los paquetes adicionales aparecen cuando tu cuenta tenga un plan activo.'
                          : `En cuanto confirmes ${info?.brand?.email}, el sistema habilitara los creditos extra y el probador volvera a quedar disponible.`}
                      </p>
                    </div>
                  )}

                  {!addonLocked && (
                  <div className="rounded-2xl border border-[#FF5C3A]/15 bg-[#FF5C3A]/5 p-4">
                     <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF5C3A]">Paquete sugerido</p>
                     <div className="mt-2 flex items-end justify-between gap-4">
                        <div>
                           <p className="text-sm font-bold text-[var(--text-primary)]">500 generaciones extra</p>
                           <p className="text-xs text-[var(--text-secondary)]">
                             {selectedAddonGateway === 'paypal'
                               ? 'Pago único con PayPal. El total se convierte automáticamente a USD usando la TRM actual.'
                               : 'Pago único en COP. No depende del corte mensual.'}
                           </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-[#FF5C3A]">{addonDisplayPrice}</span>
                          {selectedAddonGateway === 'paypal' && (
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                              TRM {trm} COP
                            </p>
                          )}
                        </div>
                     </div>
                  </div>
                  )}

                  {!addonLocked && (wompiAvailable || paypalAvailable) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {wompiAvailable && (
                        <button
                          type="button"
                          onClick={() => setSelectedAddonGateway('wompi')}
                          className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                            selectedAddonGateway === 'wompi'
                              ? 'border-[#FF5C3A] bg-[#FF5C3A]/10'
                              : 'border-[var(--border-color)] bg-[var(--bg-input)]'
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Método</p>
                          <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">Wompi</p>
                        </button>
                      )}
                      {paypalAvailable && (
                        <button
                          type="button"
                          onClick={() => setSelectedAddonGateway('paypal')}
                          className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                            selectedAddonGateway === 'paypal'
                              ? 'border-[#FF5C3A] bg-[#FF5C3A]/10'
                              : 'border-[var(--border-color)] bg-[var(--bg-input)]'
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Método</p>
                          <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">PayPal</p>
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleBuyAddon}
                    disabled={addonLocked || buyingAddon || (!wompiAvailable && !paypalAvailable)}
                    className={`${addonLocked ? 'hidden ' : ''}w-full flex items-center justify-center gap-3 py-4 bg-[#FF5C3A] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:brightness-110 active:scale-95 transition-all disabled:opacity-60`}
                  >
                    {buyingAddon ? 'Redirigiendo...' : `Comprar 500 créditos extra con ${selectedAddonGateway === 'paypal' ? 'PayPal' : 'Wompi'}`}
                  </button>

                  {addonSuccess && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Pago recibido</p>
                      <p className="mt-1 text-xs text-emerald-200">La compra de créditos extra quedó en proceso de confirmación. Si el webhook ya llegó, el saldo se reflejará aquí.</p>
                    </div>
                  )}

                  {addonCancelled && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pago cancelado</p>
                      <p className="mt-1 text-xs text-amber-200">No se registró una compra de créditos extra. Puedes intentarlo de nuevo.</p>
                    </div>
                  )}

                  {addonError && (
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">No se pudo abrir el checkout</p>
                      <p className="mt-1 text-xs text-rose-200">{addonError}</p>
                    </div>
                  )}

                  {!wompiAvailable && !paypalAvailable && (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Checkout no disponible</p>
                      <p className="mt-1 text-xs text-amber-200">No hay métodos de pago públicos habilitados para créditos extra en este entorno.</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="bg-[var(--bg-card)] p-10 rounded-3xl border border-[var(--border-color)] space-y-6 shadow-xl shadow-black/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C3A]/5 blur-3xl rounded-full" />
               <h4 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Soporte</h4>
               <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">¿Necesitas ayuda con tu suscripción o plan?</p>
               <div className="space-y-3">
                  <a href={`https://wa.me/${(paySettings?.manualWhatsapp || '573105436281').replace(/\D/g, '')}`} target="_blank" className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:border-emerald-500/50 transition-all group/wa">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">WhatsApp VIP</span>
                     <MessageCircle className="w-5 h-5 text-emerald-500 group-hover/wa:scale-110 transition-transform" />
                  </a>
                  <a href={`mailto:${paySettings?.manualEmail || 'info@lookitry.com'}`} className="flex items-center justify-between p-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl hover:border-[#FF5C3A]/30 transition-all group/mail">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Asistencia email</span>
                     <Mail className="w-5 h-5 text-[var(--text-muted)] group-hover/mail:text-[#FF5C3A] transition-all" />
                  </a>
               </div>
            </div>

            {planKey !== 'PRO' && (
              <div className="bg-zinc-900 p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF5C3A]/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A] flex items-center justify-center shadow-lg shadow-[#FF5C3A]/20">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white tracking-tight">Potencia tu marca</h4>
                  </div>
                  <p className="text-sm font-medium text-zinc-400 mb-10 leading-relaxed relative z-10">Accede a más productos, generaciones ilimitadas y personalización total con el plan pro.</p>
                  <button onClick={() => router.push('/dashboard/checkout?plan=PRO')} className="w-full flex items-center justify-center gap-3 py-5 bg-[#FF5C3A] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all relative z-10 shadow-lg shadow-[#FF5C3A]/20">
                    MEJORAR A PRO <ChevronRight size={14} />
                  </button>
                </div>
            )}
         </div>
      </motion.div>
    </motion.div>
  );
}
