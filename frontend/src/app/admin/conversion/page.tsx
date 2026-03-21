'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Percent, 
  ChevronRight,
  Target,
  ArrowRight,
  AlertCircle,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { api } from '@/services/api';

interface ConversionStats {
  totalBrands: number;
  inTrial: number;
  converted: number;
  conversionRate: number;
  conversionsByMonth: {
    month: string;
    count: number;
  }[];
}

export default function AdminConversionPage() {
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ConversionStats>('/admin/stats/conversion');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar métricas de conversión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5C3A]"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <p>{error || 'No se pudieron cargar las métricas'}</p>
      </div>
    );
  }

  // Tasa de abandono (estimada como los que no han convertido)
  const churnEstimate = Math.max(0, 100 - stats.conversionRate);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Embudo de Conversión</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Métricas de adquisición y retención de clientes.</p>
      </div>

      {/* Main Funnel Visualization */}
      <div className="rounded-3xl border p-8 bg-gradient-to-br from-[#FF5C3A]/5 via-transparent to-transparent" style={{ borderColor: 'var(--border-color)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Step 1: Registration */}
          <div className="relative group">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border shadow-sm transition-all group-hover:shadow-md" style={{ borderColor: 'var(--border-color)' }}>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Registros Totales</h3>
              <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.totalBrands}</p>
              <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Marcas que crearon cuenta</p>
            </div>
            <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-zinc-900 rounded-full border items-center justify-center shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>
          </div>

          {/* Step 2: Trial */}
          <div className="relative group">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border shadow-sm transition-all group-hover:shadow-md" style={{ borderColor: 'var(--border-color)' }}>
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Prueba Activa</h3>
              <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.inTrial}</p>
              <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Marcas en trial period</p>
            </div>
            <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white dark:bg-zinc-900 rounded-full border items-center justify-center shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>
          </div>

          {/* Step 3: Converted */}
          <div className="group">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border-2 shadow-lg border-[#FF5C3A]/30 transition-all group-hover:border-[#FF5C3A]">
              <div className="w-10 h-10 rounded-full bg-[#FF5C3A]/10 text-[#FF5C3A] flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Marcas Pagas</h3>
              <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.converted}</p>
              <p className="text-[10px] mt-2 font-bold text-[#FF5C3A]">Conversión Final: {stats.conversionRate}%</p>
            </div>
          </div>

        </div>
      </div>

      {/* Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Conversion KPIs */}
        <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Target className="w-5 h-5 text-[#FF5C3A]" />
            KPIs de Eficiencia
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                  <Percent className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Tasa de Conversión</span>
              </div>
              <span className="text-xl font-black" style={{ color: '#10b981' }}>{stats.conversionRate}%</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                  <RefreshCcw className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Drop-off Rate</span>
              </div>
              <span className="text-xl font-black" style={{ color: '#f59e0b' }}>{churnEstimate}%</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 opacity-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Lifetime Value (LTV)</span>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Calculando...</span>
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Crecimiento Mensual</h3>
          
          <div className="h-48 flex items-end gap-3 pt-4">
            {stats.conversionsByMonth.map((m) => {
              const maxVal = Math.max(...stats.conversionsByMonth.map(x => x.count)) || 1;
              const height = (m.count / maxVal) * 100;
              
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="w-full bg-[#FF5C3A]/10 rounded-t-lg relative overflow-hidden h-full flex items-end">
                    <div 
                      className="w-full bg-[#FF5C3A] transition-all duration-700" 
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(m.month + '-01').toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                    {m.count} conversiones
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-[10px] text-center font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Nuevas activaciones pagas (6 meses)
          </p>
        </div>

      </div>
    </div>
  );
}
