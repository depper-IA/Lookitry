'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Shield, TrendingDown, Clock, XCircle } from 'lucide-react';
import { adminApi } from '@/services/adminApi';

interface RiskBrand {
  id: string; name: string; email: string; plan: string;
  risk_score: number; risk_factors: string[];
  subscription_status: string | null; trial_end_date: string | null;
  generations_30d: number; failed_generations_30d: number;
  failed_payments_60d: number; last_generation: string | null;
}

interface RiskData {
  risk_brands: RiskBrand[];
  summary: { total_at_risk: number; high_risk: number; medium_risk: number; low_risk: number; };
}

export default function AdminRiskPage() {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    adminApi.get('/admin/risk')
      .then(d => { if (d.error) throw new Error(d.message); setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
      {error}
    </div>
  );

  if (!data) return null;

  const filtered = filter === 'all' ? data.risk_brands :
    filter === 'high' ? data.risk_brands.filter(b => b.risk_score >= 50) :
    filter === 'medium' ? data.risk_brands.filter(b => b.risk_score >= 25 && b.risk_score < 50) :
    data.risk_brands.filter(b => b.risk_score < 25);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Riesgo y Retención</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Marcas en riesgo de churn, trials estancados y señales de alerta temprana</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total en riesgo', value: data.summary.total_at_risk, color: '#ef4444' },
          { label: 'Riesgo alto', value: data.summary.high_risk, color: '#ef4444' },
          { label: 'Riesgo medio', value: data.summary.medium_risk, color: '#f59e0b' },
          { label: 'Riesgo bajo', value: data.summary.low_risk, color: '#3b82f6' },
        ].map(c => (
          <div key={c.label} className="rounded-[1.5rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: `3px solid ${c.color}` }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.label}</p>
            <p className="text-2xl font-bold font-jakarta mt-1" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'bg-[#FF5C3A] text-white' : ''}`}
            style={filter !== f ? { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' } : {}}>
            {f === 'all' ? 'Todos' : f === 'high' ? 'Alto' : f === 'medium' ? 'Medio' : 'Bajo'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-[2rem] p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: '#10b981' }} />
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Sin marcas en riesgo</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Todas las marcas están operando normalmente</p>
          </div>
        ) : (
          filtered.map(brand => (
            <div key={brand.id} className="rounded-[1.5rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/brands/${brand.id}`} className="text-base font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>{brand.name}</Link>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,92,58,0.15)', color: '#FF5C3A' }}>{brand.plan}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{brand.email}</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black font-jakarta ${brand.risk_score >= 50 ? 'text-red-500' : brand.risk_score >= 25 ? 'text-amber-500' : 'text-blue-500'}`}>
                    {brand.risk_score}
                  </span>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Risk Score</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {brand.risk_factors.map((factor, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                    <AlertTriangle className="w-3 h-3" />
                    {factor}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Generaciones 30d</p>
                  <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{brand.generations_30d}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Errores 30d</p>
                  <p className="text-sm font-bold font-mono" style={{ color: brand.failed_generations_30d > 0 ? '#ef4444' : 'var(--text-primary)' }}>{brand.failed_generations_30d}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pagos fallidos 60d</p>
                  <p className="text-sm font-bold font-mono" style={{ color: brand.failed_payments_60d > 0 ? '#ef4444' : 'var(--text-primary)' }}>{brand.failed_payments_60d}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Estado</p>
                  <p className="text-sm font-bold" style={{ color: brand.subscription_status === 'suspended' ? '#ef4444' : 'var(--text-primary)' }}>{brand.subscription_status || brand.plan}</p>
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <Link href={`/admin/brands/${brand.id}`} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity" style={{ color: '#FF5C3A' }}>
                  Ver ficha completa <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
