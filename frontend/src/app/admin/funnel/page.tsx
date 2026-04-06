'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Users, UserCheck, CreditCard, Package, ArrowRight, AlertTriangle, Zap } from 'lucide-react';

import { adminApi } from '@/services/adminApi';
import { motion } from 'framer-motion';
import { EmbeddedPlaybook } from '@/components/admin/EmbeddedPlaybook';

interface FunnelData {
  total_brands: number;
  registered: number;
  verified: number;
  trial_started: number;
  trial_active: number;
  trial_converted: number;
  paid_basic: number;
  paid_pro: number;
  paid_enterprise: number;
  active_usage: number;
  low_usage: number;
  churn_risk: number;
  stages: Array<{
    name: string;
    count: number;
    pct_of_total: number;
    pct_of_prev: number;
    icon: string;
    color: string;
    description: string;
  }>;
}

export default function AdminFunnelPage() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const stageNavigation: Record<string, string> = {
    'Registro': '/admin/brands',
    'Verificación': '/admin/brands',
    'Trial iniciado': '/admin/brands?plan=TRIAL',
    'Trial activo': '/admin/brands?plan=TRIAL',
    'Conversión a pago': '/admin/brands?plan=TRIAL',
    'Plan Basic': '/admin/brands?plan=BASIC',
    'Plan Pro': '/admin/brands?plan=PRO',
    'Uso activo': '/admin/brands?plan=BASIC',
    'Riesgo de churn': '/admin/risk',
  };

  const handleStageClick = (stageName: string) => {
    const href = stageNavigation[stageName];
    if (href) router.push(href);
  };

  const hasLowTrialConversion = data?.stages[4]?.pct_of_prev && data.stages[4].pct_of_prev < 50;
  const hasStalledTrials = Boolean(data?.trial_active && data.trial_active > 0 && hasLowTrialConversion);

  useEffect(() => {
    Promise.all([
      adminApi.get('/admin/stats'),
      adminApi.get('/admin/stats/conversion'),
      adminApi.get('/admin/risk'),
    ])
      .then(([stats, conversion, risk]) => {
        if (stats.error) throw new Error(stats.message);

        const totalBrands = stats.totalBrands || 0;
        const registered = totalBrands;
        const verified = totalBrands;
        const trialStarted = stats.brandsByPlan?.TRIAL || 0;
        const trialActive = conversion?.inTrial || 0;
        const trialConverted = conversion?.converted || 0;
        const paidBasic = stats.brandsByPlan?.BASIC || 0;
        const paidPro = stats.brandsByPlan?.PRO || 0;
        const paidEnterprise = 0;
        const activeUsage = (paidBasic + paidPro + paidEnterprise) - (risk?.summary?.high_risk || 0);
        const lowUsage = risk?.summary?.medium_risk || 0;
        const churnRisk = risk?.summary?.high_risk || 0;

        const stages = [
          { name: 'Registro', count: registered, pct_of_total: totalBrands > 0 ? 100 : 0, pct_of_prev: 100, icon: 'users', color: '#3b82f6', description: 'Cuentas creadas en la plataforma' },
          { name: 'Verificación', count: verified, pct_of_total: totalBrands > 0 ? Math.round((verified / totalBrands) * 100) : 0, pct_of_prev: registered > 0 ? Math.round((verified / registered) * 100) : 0, icon: 'check', color: '#6366f1', description: 'Cuentas verificadas y activas' },
          { name: 'Trial iniciado', count: trialStarted, pct_of_total: totalBrands > 0 ? Math.round((trialStarted / totalBrands) * 100) : 0, pct_of_prev: verified > 0 ? Math.round((trialStarted / verified) * 100) : 0, icon: 'zap', color: '#f59e0b', description: 'Marcas en período de prueba' },
          { name: 'Trial activo', count: trialActive, pct_of_total: totalBrands > 0 ? Math.round((trialActive / totalBrands) * 100) : 0, pct_of_prev: trialStarted > 0 ? Math.round((trialActive / trialStarted) * 100) : 0, icon: 'clock', color: '#f97316', description: 'Trials vigentes sin expirar' },
          { name: 'Conversión a pago', count: trialConverted, pct_of_total: totalBrands > 0 ? Math.round((trialConverted / totalBrands) * 100) : 0, pct_of_prev: trialActive > 0 ? Math.round((trialConverted / trialActive) * 100) : 0, icon: 'creditcard', color: '#10b981', description: 'Trials convertidos a planes pagos' },
          { name: 'Plan Basic', count: paidBasic, pct_of_total: totalBrands > 0 ? Math.round((paidBasic / totalBrands) * 100) : 0, pct_of_prev: trialConverted > 0 ? Math.round((paidBasic / trialConverted) * 100) : 0, icon: 'package', color: '#64748b', description: 'Marcas en plan Basic activo' },
          { name: 'Plan Pro', count: paidPro, pct_of_total: totalBrands > 0 ? Math.round((paidPro / totalBrands) * 100) : 0, pct_of_prev: trialConverted > 0 ? Math.round((paidPro / trialConverted) * 100) : 0, icon: 'star', color: '#FF5C3A', description: 'Marcas en plan Pro activo' },
          { name: 'Uso activo', count: activeUsage, pct_of_total: totalBrands > 0 ? Math.round((activeUsage / totalBrands) * 100) : 0, pct_of_prev: (paidBasic + paidPro) > 0 ? Math.round((activeUsage / (paidBasic + paidPro)) * 100) : 0, icon: 'activity', color: '#10b981', description: 'Marcas pagas con uso regular' },
          { name: 'Riesgo de churn', count: churnRisk, pct_of_total: totalBrands > 0 ? Math.round((churnRisk / totalBrands) * 100) : 0, pct_of_prev: (paidBasic + paidPro) > 0 ? Math.round((churnRisk / (paidBasic + paidPro)) * 100) : 0, icon: 'alert', color: '#ef4444', description: 'Marcas con señales de abandono' },
        ];

        setData({
          total_brands: totalBrands,
          registered, verified, trial_started: trialStarted, trial_active: trialActive,
          trial_converted: trialConverted, paid_basic: paidBasic, paid_pro: paidPro,
          paid_enterprise: paidEnterprise, active_usage: activeUsage,
          low_usage: lowUsage, churn_risk: churnRisk, stages,
        });
      })
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

  const maxCount = Math.max(...data.stages.map(s => s.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Funnel SaaS</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Viaje completo del cliente: registro → trial → pago → uso → retención</p>
      </div>

      <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="font-jakarta font-bold text-sm mb-6" style={{ color: 'var(--text-primary)' }}>Embudo de conversión</h2>

        <div className="space-y-3">
          {data.stages.map((stage, i) => (
            <div
              key={stage.name}
              onClick={() => handleStageClick(stage.name)}
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity rounded-lg p-1 -mx-1"
            >
              <div className="w-36 text-right flex-shrink-0">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{stage.name}</span>
              </div>

              <div className="flex-1">
                <div className="relative h-8 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
                  <div
                    className="h-full rounded-lg transition-all duration-700 flex items-center px-3"
                    style={{ width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 8 : 0)}%`, backgroundColor: stage.color + '30' }}
                  >
                    <span className="text-sm font-bold font-mono" style={{ color: stage.color }}>{stage.count}</span>
                  </div>
                </div>
              </div>

              <div className="w-24 text-right flex-shrink-0">
                <span className="text-xs font-mono" style={{ color: stage.pct_of_prev >= 50 ? '#10b981' : stage.pct_of_prev >= 20 ? '#f59e0b' : '#ef4444' }}>
                  {stage.pct_of_prev}%
                </span>
              </div>

              {i < data.stages.length - 1 && (
                <div className="w-6 flex-shrink-0 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Etapa</span>
            <span>Cantidad</span>
            <span>Conversión desde anterior</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-jakarta font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Tasas clave</h3>
          <div className="space-y-4">
            {[
              { label: 'Registro → Trial', value: data.stages[2]?.pct_of_prev || 0, color: '#f59e0b' },
              { label: 'Trial → Pago', value: data.stages[4]?.pct_of_prev || 0, color: '#10b981' },
              { label: 'Pago → Uso activo', value: data.stages[7]?.pct_of_prev || 0, color: '#3b82f6' },
              { label: 'Tasa de churn', value: data.total_brands > 0 ? Math.round((data.churn_risk / data.total_brands) * 100) : 0, color: '#ef4444' },
            ].map(rate => (
              <div key={rate.label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rate.label}</span>
                <span className="text-lg font-bold font-mono" style={{ color: rate.color }}>{rate.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-jakarta font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Distribución de planes</h3>
          <div className="space-y-3">
            {[
              { label: 'Trial', count: data.trial_started, color: '#f59e0b' },
              { label: 'Basic', count: data.paid_basic, color: '#64748b' },
              { label: 'Pro', count: data.paid_pro, color: '#FF5C3A' },
              { label: 'Enterprise', count: data.paid_enterprise, color: '#6366f1' },
            ].map(plan => (
              <div key={plan.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{plan.label}</span>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{plan.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-jakarta font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Puntos de fricción</h3>
          <div className="space-y-3">
            {data.stages.filter(s => s.pct_of_prev < 50 && s.count > 0).map(stage => (
              <div key={stage.name} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{stage.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Solo {stage.pct_of_prev}% avanza desde la etapa anterior</p>
                </div>
              </div>
            ))}
            {data.stages.filter(s => s.pct_of_prev < 50 && s.count > 0).length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No hay puntos de fricción significativos</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="font-jakarta font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Detalle por etapa</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Etapa', 'Cantidad', '% del total', '% desde anterior', 'Descripción'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.stages.map(stage => (
                <tr key={stage.name} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{stage.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold" style={{ color: stage.color }}>{stage.count}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>{stage.pct_of_total}%</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.pct_of_prev >= 50 ? 'bg-emerald-500/15 text-emerald-500' : stage.pct_of_prev >= 20 ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'}`}>
                      {stage.pct_of_prev}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{stage.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EmbeddedPlaybook
        playbookId="trial-stalled"
        showWhen={hasStalledTrials}
        title="Playbook: Trial estancado"
      />
    </motion.div>
  );
}
