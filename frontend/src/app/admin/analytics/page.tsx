'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, TrendingUp, Image, Package, Users, BarChart2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface GlobalStats {
  totalBrands: number;
  totalProducts: number;
  totalGenerations: number;
  generationsThisMonth: number;
  successRate: number;
  brandsByPlan: { BASIC: number; PRO: number };
  landingStats: { active: number; suspended: number; inactive: number };
}

interface BrandGenStat {
  brandId: string;
  brandName: string;
  brandSlug: string;
  plan: string;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  generationsThisMonth: number;
}

interface AdminAnalyticsData {
  global: GlobalStats;
  topBrands: BrandGenStat[];
  generationsByMonth: { month: string; total: number; success: number; failed: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function adminFetch(path: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') ?? '' : '';
  return fetch(`${API_URL}/api${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

function formatMonth(key: string) {
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
}

// ── Tarjeta KPI ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: color }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, brandsRes] = await Promise.all([
        adminFetch('/admin/stats'),
        adminFetch('/admin/brands?per_page=100'),
      ]);
      const statsJson = await statsRes.json();
      const brandsJson = await brandsRes.json();

      if (!statsRes.ok) throw new Error(statsJson.message || 'Error al cargar estadísticas');

      // Construir topBrands desde la lista de marcas (ordenadas por generaciones)
      const brands: any[] = brandsJson.brands ?? [];
      const topBrands: BrandGenStat[] = brands
        .map((b: any) => ({
          brandId: b.id,
          brandName: b.name,
          brandSlug: b.slug,
          plan: b.plan,
          totalGenerations: b.totalGenerations ?? 0,
          successfulGenerations: b.successfulGenerations ?? 0,
          failedGenerations: b.failedGenerations ?? 0,
          generationsThisMonth: b.generationsThisMonth ?? 0,
        }))
        .sort((a, b) => b.totalGenerations - a.totalGenerations)
        .slice(0, 10);

      setData({
        global: statsJson,
        topBrands,
        generationsByMonth: statsJson.generationsByMonth ?? [],
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(255,92,58,0.2)', borderTopColor: '#FF5C3A' }} />
    </div>
  );

  if (error) return (
    <div className="px-4 py-3 rounded-xl border text-sm" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
      {error}
    </div>
  );

  if (!data) return null;

  const { global: g, topBrands, generationsByMonth } = data;
  const maxGen = Math.max(...generationsByMonth.map(m => m.total), 1);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Métricas globales de uso y generaciones</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl border text-sm transition-opacity hover:opacity-80"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total marcas"         value={g.totalBrands}                    icon={<Users className="w-4 h-4" />}     color="#3b82f6" />
        <KpiCard label="Generaciones totales" value={g.totalGenerations.toLocaleString()} icon={<Image className="w-4 h-4" />}     color="#8b5cf6" />
        <KpiCard label="Este mes"             value={g.generationsThisMonth.toLocaleString()} icon={<BarChart2 className="w-4 h-4" />} color="#FF5C3A" />
        <KpiCard
          label="Tasa de éxito IA"
          value={`${Math.round(g.successRate)}%`}
          sub={g.successRate >= 90 ? 'Excelente' : g.successRate >= 70 ? 'Normal' : 'Revisar'}
          icon={<TrendingUp className="w-4 h-4" />}
          color={g.successRate >= 90 ? '#10b981' : g.successRate >= 70 ? '#f59e0b' : '#ef4444'}
        />
      </div>

      {/* Distribución por plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Distribución por plan</h2>
          <div className="space-y-4">
            {[
              { label: 'Plan Basic', count: g.brandsByPlan.BASIC, color: '#64748b' },
              { label: 'Plan Pro',   count: g.brandsByPlan.PRO,   color: '#FF5C3A' },
            ].map(p => {
              const pct = g.totalBrands > 0 ? Math.round((p.count / g.totalBrands) * 100) : 0;
              return (
                <div key={p.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {p.count} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t grid grid-cols-3 gap-3 text-center" style={{ borderColor: 'var(--border-color)' }}>
            {[
              { label: 'Activas',     value: g.landingStats?.active ?? 0,    color: '#10b981' },
              { label: 'Suspendidas', value: g.landingStats?.suspended ?? 0, color: '#f59e0b' },
              { label: 'Sin landing', value: g.landingStats?.inactive ?? 0,  color: '#6b7280' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-lg font-bold font-syne" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico generaciones por mes */}
        {generationsByMonth.length > 0 && (
          <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Generaciones por mes</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Últimos 6 meses</p>
            <div className="flex items-end gap-2 h-32">
              {generationsByMonth.slice(-6).map(m => {
                const h = Math.round((m.total / maxGen) * 100);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {m.total > 0 ? m.total : ''}
                    </span>
                    <div className="w-full rounded-t-md relative" style={{ height: '80px', background: 'var(--border-color)' }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500"
                        style={{ height: `${h}%`, backgroundColor: '#FF5C3A' }}
                      />
                    </div>
                    <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {formatMonth(m.month)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top marcas por generaciones */}
      {topBrands.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Top marcas por generaciones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-hover)' }}>
                  {['Marca', 'Plan', 'Total', 'Este mes', 'Exitosas', 'Fallidas', 'Tasa éxito'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topBrands.map((b, i) => {
                  const tasa = b.totalGenerations > 0
                    ? Math.round((b.successfulGenerations / b.totalGenerations) * 100)
                    : 0;
                  return (
                    <tr key={b.brandId} className="border-t transition-opacity hover:opacity-80" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono w-5 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                          <div>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{b.brandName}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.brandSlug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={b.plan === 'PRO'
                            ? { backgroundColor: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }
                            : { backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                        >
                          {b.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--text-primary)' }}>{b.totalGenerations.toLocaleString()}</td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>{b.generationsThisMonth.toLocaleString()}</td>
                      <td className="px-5 py-3.5" style={{ color: '#10b981' }}>{b.successfulGenerations.toLocaleString()}</td>
                      <td className="px-5 py-3.5" style={{ color: b.failedGenerations > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        {b.failedGenerations.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: tasa >= 90 ? '#10b981' : tasa >= 70 ? '#f59e0b' : '#ef4444' }}
                        >
                          {tasa}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {topBrands.length === 0 && (
            <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin datos de generaciones aún</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
