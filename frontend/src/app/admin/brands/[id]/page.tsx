'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Activity, DollarSign, Shield, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

import { adminApi } from '@/services/adminApi';

interface BrandFullData {
  brand: {
    id: string; name: string; email: string; slug: string; plan: string;
    subscription_status: string | null; trial_end_date: string | null;
    subscription_end_date: string | null; created_at: string;
    has_landing_page: boolean; landing_suspended_at: string | null;
    phone: string | null; contact_name: string | null;
    is_in_trial: boolean; trial_days_remaining: number | null;
  };
  usage: {
    products_count: number; active_products: number;
    generations_30d: number; successful_generations: number;
    failed_generations: number; success_rate: number;
    last_generation: string | null;
  };
  finances: {
    total_revenue: number; payments: Array<{ id: string; amount: number; currency: string; status: string; payment_date: string; payment_method: string; notes: string | null }>;
    payment_count: number; failed_payments: number;
  };
  support: {
    feedback_count: number; unresolved_feedback: number;
    feedback: Array<{ id: string; error_type: string; comment: string | null; created_at: string; resolved: boolean }>;
  };
  risk: { score: number; factors: string[] };
  products: Array<{ id: string; name: string; category: string; is_active: boolean; external_id: string | null; created_at: string }>;
  recent_generations: Array<{ id: string; status: string; generated_at: string; error_message: string | null; product_id: string | null }>;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit' });
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<BrandFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'finances' | 'support'>('overview');

  useEffect(() => {
    if (!id) return;
    adminApi.get(`/admin/brands/${id}/full`)
      .then(d => { 
        if (d?.error) {
          if (d.status === 404) setError('Marca no encontrada');
          else throw new Error(d.message);
          return;
        }
        if (d) setData(d); 
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>
      <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
        {error}
      </div>
    </div>
  );

  if (!data) return null;

  const { brand, usage, finances, support, risk, products, recent_generations } = data;

  const tabs = [
    { id: 'overview' as const, label: 'Resumen' },
    { id: 'usage' as const, label: 'Uso' },
    { id: 'finances' as const, label: 'Finanzas' },
    { id: 'support' as const, label: 'Soporte' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>{brand.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,92,58,0.15)', color: '#FF5C3A' }}>{brand.plan}</span>
            {brand.is_in_trial && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                Trial ({brand.trial_days_remaining}d)
              </span>
            )}
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{brand.email} · Slug: {brand.slug}</p>
        </div>
        <Link href={`/admin/brands`} className="text-sm font-medium" style={{ color: '#FF5C3A' }}>
          Volver a marcas
        </Link>
      </div>

      {risk.score > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: risk.score >= 50 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', borderColor: risk.score >= 50 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)' }}>
          <Shield className={`w-5 h-5 flex-shrink-0 ${risk.score >= 50 ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="flex-1">
            <span className={`text-sm font-semibold ${risk.score >= 50 ? 'text-red-400' : 'text-amber-400'}`}>
              Riesgo: {risk.score}/100
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {risk.factors.map((f, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border-color)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.id ? '' : ''}`}
            style={activeTab === tab.id ? { borderColor: '#FF5C3A', color: '#FF5C3A' } : { borderColor: 'transparent', color: 'var(--text-muted)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-jakarta font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Información</h3>
            <div className="space-y-3 text-sm">
              {[
                ['Estado', brand.subscription_status || brand.plan],
                ['Creada', formatDate(brand.created_at)],
                ['Contacto', brand.contact_name || '—'],
                ['Teléfono', brand.phone || '—'],
                ['Landing', brand.has_landing_page ? 'Activa' : 'Inactiva'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-jakarta font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Uso (30 días)</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Generaciones</span>
                <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{usage.generations_30d}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Tasa de éxito</span>
                <span className="font-bold font-mono" style={{ color: usage.success_rate >= 80 ? '#10b981' : '#ef4444' }}>{usage.success_rate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Productos</span>
                <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{usage.products_count} ({usage.active_products} activos)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Última generación</span>
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatDate(usage.last_generation)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-jakarta font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Finanzas</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Ingreso total</span>
                <span className="font-bold font-mono" style={{ color: '#10b981' }}>{formatCOP(finances.total_revenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Pagos</span>
                <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{finances.payment_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Pagos fallidos</span>
                <span className="font-bold font-mono" style={{ color: finances.failed_payments > 0 ? '#ef4444' : '#10b981' }}>{finances.failed_payments}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="space-y-5">
          <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-jakarta font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Package className="w-4 h-4" /> Productos ({products.length})
            </h3>
            {products.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin productos</p>
            ) : (
              <div className="space-y-2">
                {products.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      {p.category && <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{p.category}</span>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-gray-500/15 text-gray-500'}`}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-jakarta font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Activity className="w-4 h-4" /> Generaciones recientes
            </h3>
            {recent_generations.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin generaciones recientes</p>
            ) : (
              <div className="space-y-2">
                {recent_generations.map(g => (
                  <div key={g.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-2">
                      {g.status === 'SUCCESS' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{g.status}</span>
                      {g.error_message && <span className="text-xs" style={{ color: '#ef4444' }}>{g.error_message.slice(0, 80)}...</span>}
                    </div>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{formatDate(g.generated_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'finances' && (
        <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-jakarta font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <DollarSign className="w-4 h-4" /> Historial de pagos
          </h3>
          {finances.payments.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin pagos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Fecha', 'Monto', 'Método', 'Estado', 'Notas'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {finances.payments.map(p => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(p.payment_date)}</td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCOP(p.amount)}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{p.payment_method}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' : p.status === 'failed' ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total feedback</p>
              <p className="text-2xl font-bold font-jakarta mt-1" style={{ color: 'var(--text-primary)' }}>{support.feedback_count}</p>
            </div>
            <div className="rounded-[1.5rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin resolver</p>
              <p className="text-2xl font-bold font-jakarta mt-1" style={{ color: support.unresolved_feedback > 0 ? '#ef4444' : '#10b981' }}>{support.unresolved_feedback}</p>
            </div>
          </div>

          <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-jakarta font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Feedback</h3>
            {support.feedback.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin feedback registrado</p>
            ) : (
              <div className="space-y-2">
                {support.feedback.map(f => (
                  <div key={f.id} className="flex items-start justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" style={{ color: f.resolved ? '#10b981' : '#f59e0b' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{f.error_type}</span>
                      </div>
                      {f.comment && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{f.comment}</p>}
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatDate(f.created_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${f.resolved ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}`}>
                      {f.resolved ? 'Resuelto' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
