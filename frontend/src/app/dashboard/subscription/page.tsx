'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscriptionService } from '@/services/subscription.service';
import { formatCurrency } from '@/utils/currency';
import type { SubscriptionPayment } from '@/types';
import type { SubscriptionInfo } from '@/services/subscription.service';
import { Spinner } from '@/components/ui/Spinner';

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
    glow: 'rgba(255, 92, 58, 0.1)',
    bg: 'bg-zinc-50/50',
    icon: <Globe className="w-8 h-8" />,
    label: 'Plan Básico'
  },
  PRO: {
    name: 'Lookitry Pro',
    color: '#FF5C3A',
    secondaryColor: '#FF5C3A',
    glow: 'rgba(255, 92, 58, 0.15)',
    bg: 'bg-zinc-50/80',
    icon: <Rocket className="w-8 h-8" />,
    label: 'Plan Pro'
  },
  TRIAL: {
     name: 'Período Trial',
     color: '#FF5C3A',
     secondaryColor: '#FF5C3A',
     glow: 'rgba(255, 92, 58, 0.1)',
     bg: 'bg-zinc-100/50',
     icon: <Zap className="w-8 h-8" />,
     label: 'Acceso Trial'
  }
};

const PLAN_FEATURES = {
  BASIC: [
    'Hasta 5 productos activos',
    '400 generaciones mensuales',
    'Branding base (Logo / Colores)',
    'Templates: Minimal & Modern',
    'Soporte estándar WhatsApp',
    'Probador en URL propia slug'
  ],
  PRO: [
    'Hasta 15 productos activos',
    '1.200 generaciones mensuales',
    'Control Total de Branding',
    'Templates: All Incl. Bold',
    'Textos de botón personalizados',
    'Mensaje de bienvenida único',
    'Slug personalizado ilimitado',
    'Soporte Prioritario VIP'
  ]
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active:        { label: 'Sincronizada', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  expiring_soon: { label: 'Por Vencer',   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
  expired:       { label: 'Desactivada',  color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20'       },
  suspended:     { label: 'Suspendida',   color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20'       },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completado',  color: 'text-emerald-400' },
  pending:   { label: 'Pendiente',   color: 'text-amber-400'   },
  failed:    { label: 'Fallido',   color: 'text-rose-400'     },
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

export default function SubscriptionPage() {
  const router = useRouter();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicPrices, setDynamicPrices] = useState<{ BASIC: number; PRO: number; TRIAL: number }>({ BASIC: 150000, PRO: 250000, TRIAL: 0 });
  const [paySettings, setPaySettings] = useState<any>(null);

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const load = async () => {
      try {
        const [subResult, paymentsResult, settingsResult, pricingResult] = await Promise.allSettled([
          subscriptionService.getSubscriptionInfo(),
          subscriptionService.getPayments(),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/payment-settings/public`).then(r => r.ok ? r.json() : null),
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?id=in.(basic,pro)&select=id,data`, {
            headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` },
          }).then(r => r.ok ? r.json() : null),
        ]);
        if (subResult.status === 'fulfilled') setInfo(subResult.value);
        if (paymentsResult.status === 'fulfilled') setPayments(paymentsResult.value);
        if (settingsResult.status === 'fulfilled') setPaySettings(settingsResult.value);
        if (pricingResult.status === 'fulfilled' && Array.isArray(pricingResult.value)) {
          const prices = { BASIC: 150000, PRO: 250000, TRIAL: 0 };
          pricingResult.value.forEach((row: any) => {
            if (row.id === 'basic') prices.BASIC = row.data.precio_mensual_cop;
            if (row.id === 'pro') prices.PRO = row.data.precio_mensual_cop;
          });
          setDynamicPrices(prices);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const planKey = (info?.brand?.plan ?? 'BASIC') as keyof typeof DESIGN_SYSTEM;
  const inTrial = info?.isInTrial ?? false;
  const currentDesign = inTrial ? DESIGN_SYSTEM.TRIAL : DESIGN_SYSTEM[planKey];
  const nextPlan = planKey === 'BASIC' ? 'PRO' : 'BASIC';

  const progressPercent = info?.daysRemaining != null
    ? Math.min(100, Math.max(0, Math.round(((30 - info.daysRemaining) / 30) * 100)))
    : 100;

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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-6xl mx-auto space-y-12 pb-24 px-4"
    >
      {/* ══ TITULO VANGUARDISTA ══ */}
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#FF5C3A]" />
             </div>
             <h1 className="text-4xl font-[900] tracking-tighter text-[var(--text-primary)] italic uppercase leading-none font-jakarta">Suscripción</h1>
          </div>
          <p className="text-[11px] font-black tracking-[0.2em] text-[var(--text-muted)] uppercase opacity-60">Gestión de plan y pagos</p>
        </div>
      </motion.header>

      {/* ══ HERO CARD PREMIUM (GLASS-METAL) ══ */}
      <motion.div 
        variants={itemVariants} 
        className={`relative overflow-hidden rounded-[3.5rem] p-8 sm:p-12 ${currentDesign.bg} border border-[var(--border-color)] shadow-2xl shadow-black/5`}
      >
         {/* Animated Orbs */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.15] transition-all duration-[3000ms]" style={{ background: `radial-gradient(circle, ${currentDesign.color} 0%, transparent 70%)` }} />
         <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.1]" style={{ background: `radial-gradient(circle, ${currentDesign.secondaryColor || '#FF5C3A'} 0%, transparent 70%)` }} />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.03]" style={{ background: `radial-gradient(circle, ${currentDesign.color} 0%, transparent 70%)` }} />
         
         {/* Grid pattern overlay */}
         <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-[#FF5C3A] bg-[#FF5C3A]/10 border border-[#FF5C3A]/20">
                        Plan Actual
                     </span>
                  </div>
                  <h2 className="text-6xl sm:text-7xl font-[950] tracking-tighter italic uppercase text-[var(--text-primary)] leading-none">
                     {currentDesign.name}
                  </h2>
               </div>

                <div className="flex items-center gap-10">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Próxima Renovación</p>
                     <p className="text-xl font-black text-[var(--text-primary)] italic">{formatDate(info?.brand?.subscriptionEndDate)}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Precio Mensual</p>
                     <p className="text-xl font-black text-[#FF5C3A] italic">{inTrial ? '$0' : formatCurrency(dynamicPrices[planKey] ?? 0)}</p>
                  </div>
               </div>

               <div className="space-y-3 max-w-sm">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                     <span className="text-[var(--text-muted)] opacity-80">Días restantes</span>
                     <span className="text-[#FF5C3A] font-[900]">{info?.daysRemaining ?? 0} DÍAS</span>
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

            <div className="flex flex-col gap-4 bg-[var(--bg-input)] backdrop-blur-3xl p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center text-[#FF5C3A] shadow-inner">
                     {currentDesign.icon}
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Estado del Plan</p>
                     <p className={`text-sm font-black uppercase italic ${STATUS_LABELS[info?.status ?? 'active'].color}`}>
                        {STATUS_LABELS[info?.status ?? 'active'].label}
                     </p>
                  </div>
               </div>

                <div className="space-y-2 mb-6">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Opciones</p>
                   {inTrial ? (
                      <div className="grid grid-cols-1 gap-3">
                         <button onClick={() => router.push('/dashboard/checkout?plan=BASIC')} className="w-full py-5 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:brightness-110 transition-all active:scale-95">Activar BASIC</button>
                         <button onClick={() => router.push('/dashboard/checkout?plan=PRO')} className="w-full py-5 border-2 border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95">Cambiar a PRO</button>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 gap-3">
                         {planKey === 'BASIC' && (
                            <button onClick={() => router.push(`/dashboard/checkout?plan=PRO`)} className="w-full py-5 border-2 border-[#FF5C3A]/40 hover:bg-[#FF5C3A]/5 text-[#FF5C3A] rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95">
                               Upgrade a PRO
                            </button>
                         )}
                         <button onClick={() => router.push(`/dashboard/checkout?plan=${planKey}`)} className="w-full py-5 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-[#FF5C3A]/30 active:scale-95 transition-all">
                            {info?.status === 'active' ? 'Extender Plan' : 'Renovar Plan'}
                         </button>
                      </div>
                   )}
                </div>
            </div>
         </div>
      </motion.div>

      {/* ══ FILA DE PLANES ESTILIZADA ══ */}
      <motion.div variants={itemVariants} className="space-y-8">
         <div className="flex items-center gap-4">
            <div className="h-px bg-[var(--border-color)] flex-1" />
            <h3 className="text-xl font-[900] uppercase italic tracking-tighter text-[var(--text-primary)]">Amplía tu Alcance</h3>
            <div className="h-px bg-[var(--border-color)] flex-1" />
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {['BASIC', 'PRO'].map((p) => {
               const pk = p as 'BASIC' | 'PRO';
               const isCurrent = !inTrial && planKey === pk;
               return (
                  <motion.div 
                     key={pk}
                     whileHover={{ y: -8 }}
                     className={`relative p-10 rounded-[3.5rem] border-2 transition-all duration-500 overflow-hidden ${isCurrent ? 'bg-[var(--bg-card)] border-[#FF5C3A] shadow-3xl shadow-[#FF5C3A]/5' : 'bg-[var(--bg-base)] border-[var(--border-color)] hover:border-[var(--text-muted)]'}`}
                  >
                     {isCurrent && (
                        <div className="absolute top-0 right-0 px-8 py-3 bg-[#FF5C3A] text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-bl-[2.5rem]">
                           Plan Actual
                        </div>
                     )}
                     <div className="mb-10">
                        <h4 className={`text-4xl font-[950] tracking-tighter italic uppercase ${isCurrent ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'}`}>{pk}</h4>
                        <div className="flex items-baseline gap-2 mt-2">
                           <span className="text-2xl font-black text-[var(--text-primary)]">{formatCurrency(dynamicPrices[pk])}</span>
                           <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">/ MES</span>
                        </div>
                     </div>
                     <ul className="space-y-4 mb-12">
                        {PLAN_FEATURES[pk].map((f, i) => (
                           <li key={i} className="flex items-start gap-4">
                              <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${isCurrent ? 'bg-[#FF5C3A]/20' : 'bg-[#FF5C3A]/10'}`}>
                                 <CheckCircle className="w-3 h-3 text-[#FF5C3A]" />
                              </div>
                              <span className="text-xs font-bold uppercase tracking-tight text-[var(--text-secondary)] opacity-80">{f}</span>
                           </li>
                        ))}
                     </ul>
                     <button 
                        onClick={() => router.push(`/dashboard/checkout?plan=${pk}`)}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 ${isCurrent ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' : 'bg-[#FF5C3A] text-white shadow-xl shadow-[#FF5C3A]/20 hover:brightness-110'}`}
                     >
                        {isCurrent ? 'EXTENDER PLAN' : `SELECCIONAR ${pk}`}
                     </button>
                  </motion.div>
               );
            })}
         </div>
      </motion.div>

      {/* ══ HISTORIAL & SOPORTE ══ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] p-10 space-y-8 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
                     <RefreshCw className="w-5 h-5 text-[#FF5C3A]" />
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Historial de Pagos</h3>
               </div>

               <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Buscar por ID..." 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] uppercase font-black tracking-widest px-10 py-3 rounded-full outline-none focus:border-[#FF5C3A] transition-all"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-[var(--text-muted)]">
                      <Zap size={14} />
                    </div>
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[10px] uppercase font-black tracking-widest px-6 py-3 rounded-full outline-none focus:border-[#FF5C3A] transition-all cursor-pointer"
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
                        <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Fecha</th>
                        <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Inversión</th>
                        <th className="pb-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Estado</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                     {pagedPayments.map(p => (
                        <tr key={p.id} className="group hover:bg-[var(--bg-hover)] transition-colors">
                           <td className="py-6 pr-4">
                              <p className="text-xs font-black italic text-[var(--text-primary)]">{formatDateTime(p.paymentDate)}</p>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-50">{p.paymentMethod ?? 'Pago manual'}</p>
                           </td>
                           <td className="py-6 pr-4 text-sm font-black text-[#FF5C3A] tracking-tighter italic">{formatCurrency(p.amount)}</td>
                           <td className="py-6 text-right">
                              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-[var(--border-color)] ${PAYMENT_STATUS[p.status]?.color ?? 'text-white'}`}>
                                 {PAYMENT_STATUS[p.status]?.label ?? p.status}
                              </span>
                           </td>
                        </tr>
                     ))}
                     {payments.length === 0 && (
                        <tr><td colSpan={3} className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-30">Sin pagos registrados</td></tr>
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Página {currentPage} de {totalPages}</span>
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
            <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border-color)] space-y-6 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C3A]/5 blur-3xl rounded-full" />
               <h4 className="text-lg font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Soporte</h4>
               <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed">¿Necesitas ayuda con tu suscripción?</p>
               <div className="space-y-3">
                  <a href={`https://wa.me/573105436281`} target="_blank" className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl group-hover:border-emerald-500/50 transition-all">
                     <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">WhatsApp VIP</span>
                     <MessageCircle className="w-4 h-4 text-emerald-400" />
                  </a>
                  <a href="mailto:info@lookitry.com" className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/30 transition-all">
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Email</span>
                     <Mail className="w-4 h-4 text-white/60" />
                  </a>
               </div>
            </div>

            {planKey !== 'PRO' && (
              <div className="bg-zinc-50 p-10 rounded-[3rem] border border-zinc-200/60 shadow-deep relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF5C3A]/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-[#FF5C3A] flex items-center justify-center shadow-lg shadow-[#FF5C3A]/30">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-lg font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Actualiza tu Plan</h4>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-10 leading-relaxed italic relative z-10">Accede a más productos, generaciones y personalización total con el Plan PRO.</p>
                  <button onClick={() => router.push('/dashboard/checkout?plan=PRO')} className="w-full flex items-center justify-center gap-3 py-5 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all relative z-10">
                    ACTUALIZAR A PRO <ChevronRight size={14} />
                  </button>
                </div>
            )}
         </div>
      </motion.div>
    </motion.div>
  );
}
