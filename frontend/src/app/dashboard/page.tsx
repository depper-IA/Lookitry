'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Gauge,
  LayoutTemplate,
  Package,
  PlugZap,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/services/api';
import { usageService } from '@/services/usage.service';
import { analyticsService, type BrandAnalytics } from '@/services/analytics.service';
import { subscriptionService, type SubscriptionInfo } from '@/services/subscription.service';
import { brandsService } from '@/services/brands.service';
import type { Brand, UsageStats as UsageStatsType } from '@/types';
import { deriveDashboardAccountState, type WooMetricsSummary } from '@/lib/dashboardAccountState';
import { getSubscriptionDisplayState } from '@/lib/subscription-display';

export default function DashboardPage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [usage, setUsage] = useState<UsageStatsType | null>(null);
  const [analytics, setAnalytics] = useState<BrandAnalytics | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [wooMetrics, setWooMetrics] = useState<WooMetricsSummary>(null);
  const [loading, setLoading] = useState(true);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [brandResult, usageResult, analyticsResult, subscriptionResult, wooMetricsResult] = await Promise.allSettled([
          brandsService.getCurrentBrand(),
          usageService.getUsageStats(),
          analyticsService.getOverview(),
          subscriptionService.getSubscriptionInfo(),
          api.get('/brands/me/woocommerce-metrics'),
        ]);

        if (!mounted) {
          return;
        }

        if (brandResult.status === 'fulfilled') {
          setBrand(brandResult.value);
        }
        if (usageResult.status === 'fulfilled') {
          setUsage(usageResult.value);
        }
        if (analyticsResult.status === 'fulfilled') {
          setAnalytics(analyticsResult.value);
        }
        if (subscriptionResult.status === 'fulfilled') {
          setSubscriptionInfo(subscriptionResult.value);
        }
        if (wooMetricsResult.status === 'fulfilled') {
          setWooMetrics((wooMetricsResult.value?.data as WooMetricsSummary) ?? null);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const accountState = useMemo(
    () =>
      deriveDashboardAccountState({
        brand,
        usage,
        analytics,
        subscriptionInfo,
        wooMetrics,
      }),
    [brand, usage, analytics, subscriptionInfo, wooMetrics],
  );
  const subscriptionDisplayState = useMemo(() => getSubscriptionDisplayState(subscriptionInfo?.brand ?? brand), [subscriptionInfo?.brand, brand]);
  const trialExpired = subscriptionDisplayState.isTrialExpired;

  useEffect(() => {
    if (trialExpired) {
      setShowTrialExpiredModal(true);
    }
  }, [trialExpired]);

  useEffect(() => {
    const dismissed = localStorage.getItem('onboardingBannerDismissed') === 'true';
    setIsBannerDismissed(dismissed);
  }, []);

  const handleDismissBanner = () => {
    localStorage.setItem('onboardingBannerDismissed', 'true');
    setIsBannerDismissed(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="animate-pulse text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Sincronizando estado de tu cuenta...
        </p>
      </div>
    );
  }

  const hasLandingPage = Boolean(brand?.hasLandingPage ?? brand?.has_landing_page);
  const landingUrl = brand?.customDomain
    ? (brand.customDomain.startsWith('http://') || brand.customDomain.startsWith('https://')
        ? brand.customDomain
        : `https://${brand.customDomain}`)
    : `/sitio/${brand?.slug ?? ''}`;
  const showcaseUrl = hasLandingPage ? landingUrl : `/marca/${brand?.slug ?? ''}`;
  const showcaseLabel = hasLandingPage ? 'Ver sitio de marca' : 'Ver probador';
  const isTrial = (subscriptionInfo?.isInTrial ?? false) || subscriptionDisplayState.isTrial || subscriptionDisplayState.displayPlan === 'TRIAL';
  const planLabel = isTrial ? 'TRIAL' : subscriptionDisplayState.displayPlan ?? brand?.plan ?? 'BASIC';
  const successRate = Math.round(analytics?.successRate ?? 0);
  const totalGenerations = analytics?.totalGenerations ?? 0;
  const productsCount = usage?.currentMonth?.productsCount ?? 0;
  const productsLimit = usage?.currentMonth?.productsLimit ?? (brand?.plan === 'PRO' ? 15 : 5);
  const monthlyGenerations = usage?.currentMonth?.generationsUsed ?? 0;
  const generationsLimit = usage?.currentMonth?.generationsLimit ?? 0;
  const revenueView = isTrial ? 'Activación en curso' : subscriptionInfo?.status === 'active' || subscriptionInfo?.status === 'expiring_soon' ? 'Plan al día' : 'Revisión requerida';

  if (showTrialExpiredModal) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-8 px-4 pb-20 md:space-y-10 md:px-0">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-lg rounded-3xl border border-[#FF5C3A]/20 bg-[#0a0a0a] p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
              <Sparkles className="h-8 w-8 text-rose-500" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">Tu trial ha vencido</h2>
            <p className="mb-8 text-sm text-[#999]">
              Para seguir usando Lookitry, elige uno de nuestros planes pagos. Tu probador virtual y todos los datos están seguros.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => window.location.href = '/dashboard/checkout?plan=PRO'}
                className="w-full rounded-xl bg-[#FF5C3A] py-4 text-sm font-bold text-white transition-all hover:bg-[#ff785c]"
              >
                Comprar Pro
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/checkout?plan=BASIC'}
                className="w-full rounded-xl border border-[#2a2a2a] py-4 text-sm font-bold text-white transition-all hover:bg-white/5"
              >
                Comprar Basic
              </button>
              <button
                onClick={() => setShowTrialExpiredModal(false)}
                className="w-full py-3 text-xs text-[#666] transition-all hover:text-white"
              >
                Continuar al dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Banner de estado oculto cuando todos los pasos de onboarding están completos Y el usuario lo ha descartado
  const isOnboardingComplete = accountState.completedSteps === accountState.totalSteps;

  if (isOnboardingComplete && isBannerDismissed) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-8 px-4 pb-20 md:space-y-10 md:px-0">
        {/* Grid principal cuando onboarding está completo */}
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl md:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Diagnóstico operativo
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  Estado del sistema
                </h2>
              </div>
              <Link
                href="/dashboard/integrations"
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-primary)] transition-all hover:border-[#FF5C3A]/30 hover:text-[#FF5C3A]"
              >
                Revisar integración
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {accountState.systemChecks.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {item.label}
                  </p>
                  <p
                    className={`mt-3 text-sm font-bold tracking-tight ${
                      item.tone === 'ok'
                        ? 'text-[#FF5C3A]'
                        : item.tone === 'warn'
                          ? 'text-[#f59e0b]'
                          : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="space-y-6"
          >
            <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF5C3A]/10 text-[#FF5C3A]">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    Lectura rápida
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    Rendimiento actual
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <MetricCard
                  icon={<Package size={16} />}
                  label="Productos activos"
                  value={`${productsCount}/${productsLimit}`}
                  helper="Catálogo disponible"
                />
                <MetricCard
                  icon={<Activity size={16} />}
                  label="Pruebas totales"
                  value={String(totalGenerations)}
                  helper="Interacciones registradas"
                />
                <MetricCard
                  icon={<Sparkles size={16} />}
                  label="Tasa de éxito"
                  value={`${successRate}%`}
                  helper="Calidad de generación"
                />
                <MetricCard
                  icon={<Gauge size={16} />}
                  label="Consumo del mes"
                  value={generationsLimit > 0 ? `${monthlyGenerations}/${generationsLimit}` : String(monthlyGenerations)}
                  helper="Capacidad usada"
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF5C3A]/10 text-[#FF5C3A]">
                  <PlugZap size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    Ruta rápida
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    Acciones clave
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <QuickAction href="/dashboard/subscription" icon={<Sparkles size={16} />} title="Plan y facturación" description="Centraliza renovaciones, upgrades y pagos en una sola pantalla." />
                {(brand?.plan === 'PRO' || accountState.checklist.some(i => i.id === 'store')) && (
                  <QuickAction href="/dashboard/integrations" icon={<PlugZap size={16} />} title="Conectar tienda" description="Instala el plugin, valida WooCommerce y termina la activación técnica." />
                )}
                <QuickAction href="/dashboard/products" icon={<Package size={16} />} title="Gestionar productos" description="Carga catálogo, activa prendas y prepara el primer lanzamiento." />
                <QuickAction href="/dashboard/mi-pagina" icon={<LayoutTemplate size={16} />} title="Sitio de marca" description="Ajusta landing, dominio y la experiencia pública del probador." />
              </div>

            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Actividad comercial
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  Resumen del plan
                </h2>
              </div>
              <Link
                href="/dashboard/subscription"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C3A] transition-all hover:opacity-80"
              >
                Abrir suscripción
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <SummaryBox label="Plan actual" value={planLabel} helper={isTrial ? 'Prueba habilitada' : 'Suscripción vigente'} />
              <SummaryBox label="Estado" value={revenueView} helper={subscriptionInfo?.status === 'expiring_soon' ? 'Conviene renovar pronto' : 'Fuente oficial de cobro'} />
              <SummaryBox label="Capacidad mensual" value={generationsLimit > 0 ? `${generationsLimit}` : 'Sin dato'} helper="Generaciones incluidas" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Productos destacados
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  Qué está viendo tu cliente
                </h2>
              </div>
              <Link
                href="/dashboard/analytics"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C3A] transition-all hover:opacity-80"
              >
                Ver resultados
              </Link>
            </div>

            {!analytics?.mostUsedProducts?.length ? (
              <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--border-color)] bg-[var(--bg-input)] p-6 text-center">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Aún no hay productos con interacción.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                  Cuando el widget empiece a usarse, aquí verás qué productos están moviendo más interés.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {analytics.mostUsedProducts.slice(0, 3).map((item, index) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF5C3A]/10 text-[#FF5C3A]">
                      <span className="text-sm font-black">#{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {item.successfulGenerations} pruebas exitosas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-4 pb-20 md:space-y-10 md:px-0">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.2rem] border border-[#FF5C3A]/20 bg-[linear-gradient(135deg,rgba(255,92,58,0.08),var(--bg-card)_28%,var(--bg-card)_100%)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.1)] md:p-10 dark:border-[#FF5C3A]/15 dark:bg-[linear-gradient(135deg,rgba(255,92,58,0.10),rgba(20,20,20,0.96)_28%,rgba(10,10,10,1)_100%)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.28)]"
      >
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-[#FF5C3A]/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#FF5C3A]/20 bg-[#FF5C3A]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">
                Estado de tu cuenta
              </span>
              <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-primary)]">
                Plan {planLabel}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="font-jakarta text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">
                {accountState.statusTitle}
              </h1>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-[var(--text-muted)] md:text-base">
                {accountState.statusDescription}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.8rem] border border-[var(--border-color)] bg-[var(--bg-input)]/40 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-black/20">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                      Siguiente acción
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--text-primary)]">
                      {accountState.nextAction.title}
                    </h2>
                  </div>
                  <Sparkles className="h-5 w-5 text-[#FF5C3A]" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  {accountState.nextAction.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={accountState.nextAction.href}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#FF5C3A] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:brightness-110"
                  >
                    {accountState.nextAction.cta}
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href={showcaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] transition-all hover:border-[#FF5C3A]/30 hover:bg-[var(--bg-input)]/80 dark:border-white/10 dark:bg-white/5"
                  >
                    {showcaseLabel}
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-[var(--border-color)] bg-[var(--bg-input)]/40 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-black/20">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                      Progreso del flujo
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-[var(--text-primary)]">
                      {accountState.progressPercent}%
                    </p>
                  </div>
                  <Gauge className="h-5 w-5 text-[#FF5C3A]" />
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--bg-input)] dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#FF5C3A] transition-all"
                    style={{ width: `${accountState.progressPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  {accountState.completedSteps} de {accountState.totalSteps} hitos ya están resueltos.
                </p>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Estado comercial: {revenueView}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 dark:border-white/10 dark:bg-[rgba(20,20,20,0.92)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Checklist visible
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Qué ya quedó y qué falta
                </h2>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[#FF5C3A]" />
            </div>

            <div className="mt-5 space-y-3">
              {accountState.checklist.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-4 rounded-[1.4rem] border border-[var(--border-color)] bg-[var(--bg-input)]/50 px-4 py-4 transition-all hover:border-[#FF5C3A]/25 hover:bg-[var(--bg-input)] dark:border-white/8 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${item.done ? 'bg-[#FF5C3A]/14 text-[#FF5C3A]' : 'bg-[var(--bg-input)] text-[var(--text-muted)] dark:bg-white/5'}`}>
                    {item.done ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">{item.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${item.done ? 'bg-[#FF5C3A]/12 text-[#FF5C3A]' : 'bg-[var(--bg-input)] text-[var(--text-muted)] dark:bg-white/5'}`}>
                        {item.stateLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
            {isOnboardingComplete && !isBannerDismissed && (
              <div className="mt-6 pt-6 border-t border-[var(--border-color)] dark:border-white/10">
                <button
                  onClick={handleDismissBanner}
                  className="w-full rounded-2xl bg-[#FF5C3A] py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:brightness-110"
                >
                  Entendido, ocultar banner
                </button>
                <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
                  El banner no volverá a aparecer. Puedes ver el progreso en{' '}
                  <Link href="/dashboard/analytics" className="text-[#FF5C3A] hover:underline">
                    Analytics
                  </Link>.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl md:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Diagnóstico operativo
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Estado del sistema
              </h2>
            </div>
            <Link
              href="/dashboard/integrations"
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-primary)] transition-all hover:border-[#FF5C3A]/30 hover:text-[#FF5C3A]"
            >
              Revisar integración
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {accountState.systemChecks.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {item.label}
                </p>
                <p
                  className={`mt-3 text-sm font-bold tracking-tight ${
                    item.tone === 'ok'
                      ? 'text-[#FF5C3A]'
                      : item.tone === 'warn'
                        ? 'text-[#f59e0b]'
                        : 'text-[var(--text-primary)]'
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="space-y-6"
        >
          <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF5C3A]/10 text-[#FF5C3A]">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Lectura rápida
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Rendimiento actual
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MetricCard
                icon={<Package size={16} />}
                label="Productos activos"
                value={`${productsCount}/${productsLimit}`}
                helper="Catálogo disponible"
              />
              <MetricCard
                icon={<Activity size={16} />}
                label="Pruebas totales"
                value={String(totalGenerations)}
                helper="Interacciones registradas"
              />
              <MetricCard
                icon={<Sparkles size={16} />}
                label="Tasa de éxito"
                value={`${successRate}%`}
                helper="Calidad de generación"
              />
              <MetricCard
                icon={<Gauge size={16} />}
                label="Consumo del mes"
                value={generationsLimit > 0 ? `${monthlyGenerations}/${generationsLimit}` : String(monthlyGenerations)}
                helper="Capacidad usada"
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF5C3A]/10 text-[#FF5C3A]">
                <PlugZap size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Ruta rápida
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  Acciones clave
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <QuickAction href="/dashboard/subscription" icon={<Sparkles size={16} />} title="Plan y facturación" description="Centraliza renovaciones, upgrades y pagos en una sola pantalla." />
              {(brand?.plan === 'PRO' || accountState.checklist.some(i => i.id === 'store')) && (
                <QuickAction href="/dashboard/integrations" icon={<PlugZap size={16} />} title="Conectar tienda" description="Instala el plugin, valida WooCommerce y termina la activación técnica." />
              )}
              <QuickAction href="/dashboard/products" icon={<Package size={16} />} title="Gestionar productos" description="Carga catálogo, activa prendas y prepara el primer lanzamiento." />
              <QuickAction href="/dashboard/mi-pagina" icon={<LayoutTemplate size={16} />} title="Sitio de marca" description="Ajusta landing, dominio y la experiencia pública del probador." />
            </div>

          </div>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Actividad comercial
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Resumen del plan
              </h2>
            </div>
            <Link
              href="/dashboard/subscription"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C3A] transition-all hover:opacity-80"
            >
              Abrir suscripción
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SummaryBox label="Plan actual" value={planLabel} helper={isTrial ? 'Prueba habilitada' : 'Suscripción vigente'} />
            <SummaryBox label="Estado" value={revenueView} helper={subscriptionInfo?.status === 'expiring_soon' ? 'Conviene renovar pronto' : 'Fuente oficial de cobro'} />
            <SummaryBox label="Capacidad mensual" value={generationsLimit > 0 ? `${generationsLimit}` : 'Sin dato'} helper="Generaciones incluidas" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Productos destacados
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Qué está viendo tu cliente
              </h2>
            </div>
            <Link
              href="/dashboard/analytics"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C3A] transition-all hover:opacity-80"
            >
              Ver resultados
            </Link>
          </div>

          {!analytics?.mostUsedProducts?.length ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--border-color)] bg-[var(--bg-input)] p-6 text-center">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Aún no hay productos con interacción.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                Cuando el widget empiece a usarse, aquí verás qué productos están moviendo más interés.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {analytics.mostUsedProducts.slice(0, 3).map((item, index) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF5C3A]/10 text-[#FF5C3A]">
                    <span className="text-sm font-black">#{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      {item.successfulGenerations} pruebas exitosas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-4">
      <div className="flex items-center gap-2 text-[#FF5C3A]">{icon}</div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{helper}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-[1.4rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-4 transition-all hover:border-[#FF5C3A]/30"
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FF5C3A]/10 text-[#FF5C3A]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[var(--text-primary)]">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{description}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#FF5C3A]" />
    </Link>
  );
}

function SummaryBox({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-xl font-black tracking-tight text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{helper}</p>
    </div>
  );
}
