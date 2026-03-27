'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers
} from 'lucide-react';
import { api } from '@/services/api';

interface GlobalStats {
  totalBrands: number;
  totalProducts: number;
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  generationsThisMonth: number;
  successRate: number;
  brandsByPlan: {
    BASIC: number;
    PRO: number;
  };
  landingStats: {
    active: number;
    suspended: number;
    inactive: number;
  };
  generationsByMonth: {
    month: string;
    total: number;
    success: number;
    failed: number;
  }[];
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<GlobalStats>('/admin/stats');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas');
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
      <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] p-4 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <p>{error || 'No se pudieron cargar las estadísticas'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Analíticas globales</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Resumen del rendimiento y salud del ecosistema Lookitry.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Marcas" 
          value={stats.totalBrands} 
          icon={<Users className="w-5 h-5" />} 
          color="#3b82f6"
          description="Clientes registrados"
        />
        <StatCard 
          title="Generaciones (Mes)" 
          value={stats.generationsThisMonth} 
          icon={<Sparkles className="w-5 h-5" />} 
          color="#FF5C3A"
          description="Actividad de este mes"
        />
        <StatCard 
          title="Tasa de Éxito" 
          value={`${stats.successRate.toFixed(1)}%`} 
          icon={<CheckCircle2 className="w-5 h-5" />} 
          color="#10b981"
          description={`${stats.successfulGenerations.toLocaleString()} exitosas`}
        />
        <StatCard 
          title="Total Productos" 
          value={stats.totalProducts} 
          icon={<Package className="w-5 h-5" />} 
          color="#8b5cf6"
          description="Ítems activos en catálogo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica de Generaciones */}
        <div className="lg:col-span-2 rounded-[2rem] border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Uso de IA por mes</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Volumen de generaciones en los últimos 6 meses</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>

          <div className="h-64 flex items-end gap-2 md:gap-4 pt-4">
            {stats.generationsByMonth.map((m) => {
              const maxVal = Math.max(...stats.generationsByMonth.map(x => x.total)) || 1;
              const height = (m.total / maxVal) * 100;
              const successHeight = (m.success / maxVal) * 100;
              
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="w-full rounded-t-lg relative overflow-hidden h-full flex items-end" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <div 
                      className="w-full bg-[#FF5C3A]/20 transition-all duration-500" 
                      style={{ height: `${height}%` }}
                    />
                    <div 
                      className="absolute bottom-0 w-full bg-[#FF5C3A] transition-all duration-700 delay-100" 
                      style={{ height: `${successHeight}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-tighter" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(m.month + '-01').toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-xl">
                    <p className="font-bold border-b border-white/20 pb-1 mb-1">{m.month}</p>
                    <p>Total: {m.total}</p>
                    <p className="text-green-400">Éxito: {m.success}</p>
                    <p className="text-red-400">Fallo: {m.failed}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#FF5C3A]" />
              <span>Exitosas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#FF5C3A]/20" />
              <span>Fallidas</span>
            </div>
          </div>
        </div>

        {/* Distribución de Planes */}
        <div className="rounded-[2rem] border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-jakarta font-bold tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>Suscripciones</h3>
          
          <div className="space-y-6">
            <PlanStats 
              label="Plan Básico" 
              count={stats.brandsByPlan.BASIC} 
              total={stats.totalBrands} 
              color="#3b82f6" 
            />
            <PlanStats 
              label="Plan Pro" 
              count={stats.brandsByPlan.PRO} 
              total={stats.totalBrands} 
              color="#8b5cf6" 
            />
            <div className="pt-6 mt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <h4 className="text-sm font-jakarta font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Mini-Landings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                  <p className="text-[10px] font-bold text-green-600 uppercase">Activas</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stats.landingStats.active}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] font-bold text-amber-600 uppercase">Suspendidas</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stats.landingStats.suspended}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Última actualización: {new Date().toLocaleString('es-CO')}</span>
        </div>
        <p>Datos sincronizados con Supabase & Wompi</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, description }: { title: string; value: string | number; icon: React.ReactNode; color: string; description?: string }) {
  return (
    <div className="rounded-[1.5rem] border p-5 transition-all hover:shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderLeft: `3px solid ${color}` }}>
      <div className="flex items-center justify-between mb-3">
        <div style={{ color }}>
          {icon}
        </div>
        <ArrowUpRight className="w-4 h-4 text-gray-300" />
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</h3>
        <p className="text-2xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {description && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
      </div>
    </div>
  );
}

function PlanStats({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-black" style={{ color: 'var(--text-primary)' }}>{count}</span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
        <div 
          className="h-full transition-all duration-1000" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{percentage.toFixed(1)}% del total</p>
    </div>
  );
}
