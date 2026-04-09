'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Package, Image as ImageIcon, TrendingUp, CreditCard,
  Globe, PauseCircle, MinusCircle, UserCheck, Building2,
  ArrowRight, ExternalLink, BarChart2, AlertTriangle, XCircle,
  Clock, ChevronRight, Activity, Zap, Target, Plus,
  MoreHorizontal, Search, Filter, ArrowUpDown, Eye, Pencil, Trash2,
  CheckCircle2, CircleDashed, Sparkles, Play, Pause, Star
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';

interface GlobalStats {
  totalBrands: number;
  totalProducts: number;
  totalGenerations: number;
  generationsThisMonth: number;
  successRate: number;
  brandsByPlan: { BASIC: number; PRO: number; TRIAL: number };
  landingStats: { active: number; suspended: number; inactive: number };
  reviewsStats?: { pendingCount: number; recentApproved: any[] };
}

interface ConversionStats {
  totalBrands: number;
  inTrial: number;
  paidTrials: number;
  trialToBasic: number;
  trialToPro: number;
  trialToEnterprise: number;
  converted: number;
  conversionRate: number;
  conversionsByMonth: { month: string; count: number }[];
}

interface Brand {
  id: string;
  name: string;
  email: string;
  plan: string;
  created_at: string;
  has_landing_page: boolean;
  active: boolean;
  products_count?: number;
  generations_count?: number;
}

function formatMonth(key: string) {
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminDashboardPage() {
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [conversion, setConversion] = useState<ConversionStats | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState({ expiring: 0, failed: 0, critical: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      adminApi.get('/admin/stats'),
      adminApi.get('/admin/stats/conversion'),
      adminApi.get('/admin/brands?limit=8&sort=created_at:desc'),
      adminApi.get('/admin/revenue/payments?limit=5'),
    ])
      .then(([stats, conv, brandsData, paymentsData]) => {
        if (stats.error) throw new Error(stats.message);
        setGlobal(stats);
        setConversion(conv);
        if (brandsData.brands) setBrands(brandsData.brands);
        if (paymentsData.payments) setRecentPayments(paymentsData.payments);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    adminApi.get('/admin/alerts').then(data => {
      if (data.expiring) setAlerts(prev => ({ ...prev, expiring: data.expiring }));
      if (data.failed) setAlerts(prev => ({ ...prev, failed: data.failed }));
      if (data.critical) setAlerts(prev => ({ ...prev, critical: data.critical }));
    }).catch(() => {});
  }, []);

  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = selectedPlan === 'all' || brand.plan === selectedPlan;
    return matchesSearch && matchesPlan;
  });

  if (loading) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      <p className="animate-pulse text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        Cargando Mission Control
      </p>
    </div>
  );

  if (error) return (
    <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6">
      <div className="flex items-center gap-3">
        <XCircle className="h-5 w-5 text-rose-500" />
        <p className="text-sm font-medium text-rose-500">{error}</p>
      </div>
    </div>
  );

  if (!global || !conversion) return null;

  const conversionsByMonth = conversion?.conversionsByMonth || [];
  const maxCount = Math.max(...conversionsByMonth.map(m => m.count || 0), 1);
  const brandsByPlan = global?.brandsByPlan || { BASIC: 0, PRO: 0, TRIAL: 0 };
  const landingStats = global?.landingStats || { active: 0, suspended: 0, inactive: 0 };

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-4 pb-20 md:px-0">
      {/* Hero Section - Account Status Style */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.2rem] border border-[var(--accent)]/20 bg-[linear-gradient(135deg,rgba(255,92,58,0.08),var(--bg-card)_28%,var(--bg-card)_100%)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.1)] md:p-10"
      >
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        
        <div className="relative flex flex-wrap items-center gap-3 mb-6">
          <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
            Mission Control
          </span>
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-primary)' }}>
            {global.totalBrands} marcas activas
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="Total Marcas"
                value={global.totalBrands}
                accent="#3b82f6"
              />
              <StatCard
                icon={<Package className="h-5 w-5" />}
                label="Productos"
                value={global.totalProducts}
                accent="#10b981"
              />
              <StatCard
                icon={<ImageIcon className="h-5 w-5" />}
                label="Generaciones"
                value={global.totalGenerations}
                accent="#8b5cf6"
              />
              <StatCard
                icon={<Activity className="h-5 w-5" />}
                label="Éxito IA"
                value={`${Math.round(global.successRate)}%`}
                accent="var(--accent)"
              />
            </div>

            {/* Alerts */}
            {(alerts.expiring > 0 || alerts.failed > 0) && (
              <div className="space-y-2">
                {alerts.expiring > 0 && (
                  <AlertCard
                    href="/admin/subscriptions?filter=expiring"
                    icon={<Clock className="h-5 w-5" />}
                    title={`${alerts.expiring} suscripción${alerts.expiring > 1 ? 'es' : ''} por vencer`}
                    subtitle="Próximos 7 días"
                    color="#f59e0b"
                  />
                )}
                {alerts.failed > 0 && (
                  <AlertCard
                    href="/admin/payments?filter=failed"
                    icon={<XCircle className="h-5 w-5" />}
                    title={`${alerts.failed} pago${alerts.failed > 1 ? 's' : ''} fallido${alerts.failed > 1 ? 's' : ''}`}
                    subtitle="Requieren atención"
                    color="#ef4444"
                  />
                )}
              </div>
            )}
          </div>

          {/* Conversion Chart */}
          <div className="rounded-[1.8rem] border border-[var(--border-color)] bg-[var(--bg-input)]/40 p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                  Conversiones
                </p>
                <h3 className="mt-1 text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Trial → Plan pago
                </h3>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black" style={{ color: 'var(--accent)' }}>{conversion.conversionRate}%</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>tasa conversión</p>
              </div>
            </div>

            {conversionsByMonth.length === 0 || conversionsByMonth.every(m => m.count === 0) ? (
              <div className="flex h-24 items-center justify-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin conversiones registradas</p>
              </div>
            ) : (
              <div className="flex items-end gap-2 h-28">
                {conversionsByMonth.map((m) => {
                  const heightPct = (m.count / maxCount) * 100;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full rounded-t-lg overflow-hidden" style={{ height: '70px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700"
                          style={{
                            height: `${heightPct}%`,
                            backgroundColor: 'var(--accent)',
                            opacity: heightPct > 0 ? 1 : 0,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                        {formatMonth(m.month)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Brands Section - Main Focus */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
              Gestión rápida
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Marcas activas
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="h-11 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
              style={{ color: 'var(--text-primary)' }}
            >
              <option value="all">Todos los planes</option>
              <option value="PRO">Pro</option>
              <option value="TRIAL">Trial</option>
              <option value="BASIC">Basic</option>
            </select>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredBrands.slice(0, 9).map((brand) => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </AnimatePresence>
          
          {/* Add New Card */}
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-[180px] cursor-pointer items-center justify-center rounded-[1.8rem] border-2 border-dashed border-[var(--border-color)] transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5"
          >
            <a href="/admin/brands" className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                <Plus className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Añadir marca</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Crear nueva cuenta</p>
              </div>
            </a>
          </motion.div>
        </div>

        {filteredBrands.length > 9 && (
          <div className="mt-6 text-center">
            <a
              href="/admin/brands"
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-6 py-3 text-sm font-bold transition-all hover:border-[var(--accent)]/30 hover:text-[var(--accent)]"
              style={{ color: 'var(--text-primary)' }}
            >
              Ver todas las {filteredBrands.length} marcas
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </motion.section>

      {/* Bottom Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {/* Plan Distribution */}
          <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl md:p-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                Distribución
              </p>
              <h3 className="mt-1 text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Planes activos
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Plan Pro', count: brandsByPlan.PRO || 0, color: 'var(--accent)' },
              { label: 'Plan Trial', count: brandsByPlan.TRIAL || 0, color: '#6366f1' },
              { label: 'Plan Basic', count: brandsByPlan.BASIC || 0, color: '#64748b' },
            ].map(p => {
              const total = global.totalBrands;
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <div key={p.label} className="flex items-center gap-4">
                  <div className="w-24 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{p.label}</div>
                  <div className="flex-1 h-3 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--bg-input)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{p.count}</span>
                    <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mini-landings */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <MiniStat icon={<Globe className="h-4 w-4" />} value={landingStats.active} label="Activas" color="#10b981" />
            <MiniStat icon={<PauseCircle className="h-4 w-4" />} value={landingStats.suspended} label="Suspendidas" color="#f59e0b" />
            <MiniStat icon={<MinusCircle className="h-4 w-4" />} value={landingStats.inactive} label="Inactivas" color="#64748b" />
          </div>
        </motion.section>

        {/* Reviews Section */}
        {global.reviewsStats && (
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl md:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                  Feedback
                </p>
                <div className="flex items-center gap-3">
                  <h3 className="mt-1 text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Reseñas recientes
                  </h3>
                  {global.reviewsStats.pendingCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-500 border border-amber-500/20">
                      <Sparkles className="h-3 w-3" /> {global.reviewsStats.pendingCount} pendientes
                    </span>
                  )}
                </div>
              </div>
              <a href="/admin/feedback" className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] transition-all hover:opacity-80">
                Ver todas <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
            </div>

            <div className="space-y-4">
              {global.reviewsStats.recentApproved.length === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Sin reseñas aprobadas recientes.</p>
              ) : (
                global.reviewsStats.recentApproved.map((review) => (
                  <div key={review.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-4 relative overflow-hidden transition-all hover:border-[var(--accent)]/30">
                    {review.is_featured && (
                      <div className="absolute right-3 top-3 text-[var(--accent)]">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                       <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{review.reviewer_name}</p>
                       <span className="flex text-amber-400">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                       </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                       &quot;{review.comment}&quot;
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.section>
        )}
        </div>

        {/* Recent Activity */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="space-y-6"
        >
          <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                  Actividad reciente
                </p>
                <h3 className="mt-1 text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Últimos pagos
                </h3>
              </div>
              <a href="/admin/payments" className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] transition-all hover:opacity-80">
                Ver todos <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
            </div>

            <div className="space-y-3">
              {recentPayments.length === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Sin pagos recientes</p>
              ) : (
                recentPayments.slice(0, 4).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: p.status === 'completed' ? '#22c55e' : p.status === 'failed' ? '#ef4444' : '#f59e0b'
                        }}
                      />
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {p.brands?.name || p.brandName || '—'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {p.payment_method || p.paymentMethod || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        ${(p.amount_cop || p.amount || 0).toLocaleString('es-CO')}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(p.created_at || p.payment_date)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <QuickStat
              icon={<TrendingUp className="h-5 w-5" />}
              label="Trial → Pro"
              value={conversion.trialToPro}
              color="#22c55e"
            />
            <QuickStat
              icon={<UserCheck className="h-5 w-5" />}
              label="Convertidas"
              value={conversion.converted}
              color="#14b8a6"
            />
            <QuickStat
              icon={<CreditCard className="h-5 w-5" />}
              label="Trials activos"
              value={conversion.inTrial}
              color="#f59e0b"
            />
            <QuickStat
              icon={<Target className="h-5 w-5" />}
              label="Este mes"
              value={global.generationsThisMonth}
              color="#8b5cf6"
            />
          </div>
        </motion.section>
      </div>

      {/* Footer Actions */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <QuickActionCard
          href="/admin/brands"
          icon={<Users className="h-6 w-6" />}
          title="Marcas"
          description="Gestionar cuentas y configuraciones"
        />
        <QuickActionCard
          href="/admin/subscriptions"
          icon={<CreditCard className="h-6 w-6" />}
          title="Suscripciones"
          description="Planes y renovaciones"
        />
        <QuickActionCard
          href="/admin/payments"
          icon={<TrendingUp className="h-6 w-6" />}
          title="Ingresos"
          description="Historial de transacciones"
        />
        <QuickActionCard
          href="/admin/analytics"
          icon={<BarChart2 className="h-6 w-6" />}
          title="Analytics"
          description="Métricas y rendimiento"
        />
      </motion.section>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5"
    >
      <div className="flex items-center justify-between">
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </motion.div>
  );
}

function AlertCard({ href, icon, title, subtitle, color }: { href: string; icon: React.ReactNode; title: string; subtitle: string; color: string }) {
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 rounded-xl border p-4 transition-all hover:scale-[1.01]"
      style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold" style={{ color }}>{title}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
      <ChevronRight className="h-5 w-5" style={{ color }} />
    </motion.a>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group rounded-[1.8rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--accent)]/30"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black"
            style={{ backgroundColor: 'rgba(255,92,58,0.1)', color: 'var(--accent)' }}
          >
            {(brand.name || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{brand.name}</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{brand.email}</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
          backgroundColor: brand.plan === 'PRO' ? 'rgba(168,85,247,0.12)' : brand.plan === 'TRIAL' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
          color: brand.plan === 'PRO' ? '#a855f7' : brand.plan === 'TRIAL' ? '#6366f1' : '#10b981'
        }}>
          {brand.plan}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">
          <Package className="h-3.5 w-3.5" />
          {brand.products_count || 0} productos
        </span>
        <span className="flex items-center gap-1">
          <ImageIcon className="h-3.5 w-3.5" />
          {brand.generations_count || 0} gen.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={`/admin/brands/${brand.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] py-2.5 text-xs font-bold transition-all hover:border-[var(--accent)]/30 hover:text-[var(--accent)]"
          style={{ color: 'var(--text-primary)' }}
        >
          <Eye className="h-3.5 w-3.5" />
          Ver
        </a>
        <a
          href={`/admin/brands/${brand.id}?edit=true`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] transition-all hover:border-[var(--accent)]/30"
        >
          <Pencil className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
        </a>
      </div>
    </motion.div>
  );
}

function MiniStat({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-4 text-center">
      <div className="flex justify-center mb-2" style={{ color }}>{icon}</div>
      <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function QuickActionCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--accent)]/30"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
        {icon}
      </div>
      <div>
        <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h4>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
      <ArrowRight className="ml-auto h-5 w-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
    </motion.a>
  );
}
