'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import { 
  Activity, 
  Server, 
  Database, 
  Cloud, 
  Zap, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  uptime_seconds: number;
  version: string;
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    latency_ms?: number;
    message?: string;
  }[];
  database: {
    status: 'connected' | 'disconnected';
    pool_size: number;
    active_connections: number;
  };
  redis?: {
    status: 'connected' | 'disconnected';
    latency_ms?: number;
  };
  memory: {
    used_mb: number;
    total_mb: number;
    percent: number;
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'down' | 'up' | 'down' | 'degraded' | 'connected' | 'disconnected' }) {
  const config = {
    healthy: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Saludable' },
    up: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Activo' },
    connected: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Conectado' },
    degraded: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Degradado' },
    down: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Caído' },
    disconnected: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Desconectado' },
  };
  const c = config[status] || config.down;
  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function ServiceCard({ service }: { service: HealthStatus['services'][0] }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border" style={{ 
      backgroundColor: 'var(--bg-input)', 
      borderColor: service.status === 'down' ? 'rgba(239,68,68,0.3)' : 'var(--border-color)' 
    }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ 
          backgroundColor: service.status === 'up' ? 'rgba(16,185,129,0.1)' : service.status === 'degraded' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
          color: service.status === 'up' ? '#10b981' : service.status === 'degraded' ? '#f59e0b' : '#ef4444'
        }}>
          {service.status === 'up' ? <CheckCircle className="w-5 h-5" /> : service.status === 'degraded' ? <AlertTriangle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{service.name}</p>
          {service.message && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{service.message}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {service.latency_ms !== undefined && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{service.latency_ms}ms</span>
        )}
        <StatusBadge status={service.status} />
      </div>
    </div>
  );
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = async () => {
    try {
      const data = await adminApi.get('/admin/health');
      if (data.error) throw new Error(data.message || 'Error cargando estado');
      setHealth(data);
      setLastRefresh(new Date());
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      <p className="animate-pulse text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        Verificando sistema
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

  if (!health) return null;

  const overallStatus = health.status;
  const statusColor = overallStatus === 'healthy' ? '#10b981' : overallStatus === 'degraded' ? '#f59e0b' : '#ef4444';

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-20">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_25px_60px_rgba(0,0,0,0.1)] md:p-8"
        style={{ 
          borderColor: `${statusColor}30`,
          background: `linear-gradient(135deg, ${statusColor}08, var(--bg-card) 28%, var(--bg-card) 100%)`
        }}
      >
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full" style={{ backgroundColor: `${statusColor}10`, filter: 'blur(60px)' }} />
        
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ 
              borderColor: `${statusColor}30`, 
              backgroundColor: `${statusColor}10`, 
              color: statusColor 
            }}>
              {overallStatus === 'healthy' ? 'Sistema Operativo' : overallStatus === 'degraded' ? 'Rendimiento Reducido' : 'Sistema Caído'}
            </span>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
              v{health.version}
            </span>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-bold tracking-tight text-3xl" style={{ color: 'var(--text-primary)' }}>Salud del Sistema</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Última verificación: {lastRefresh?.toLocaleTimeString('es-CO') || '—'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Clock className="w-4 h-4" />
              Uptime: {formatUptime(health.uptime_seconds)}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4" style={{ color: statusColor }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Estado</span>
            </div>
            <p className="text-xl font-bold" style={{ color: statusColor }}>
              {overallStatus === 'healthy' ? 'Óptimo' : overallStatus === 'degraded' ? 'Degradado' : 'Crítico'}
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4" style={{ color: health.database.status === 'connected' ? '#10b981' : '#ef4444' }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Database</span>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {health.database.active_connections}/{health.database.pool_size}
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="w-4 h-4" style={{ color: health.redis?.status === 'connected' ? '#10b981' : '#ef4444' }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Redis</span>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {health.redis?.status === 'connected' ? 'Conectado' : 'N/A'}
            </p>
          </div>
          <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" style={{ color: '#8b5cf6' }} />
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Memoria</span>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {health.memory.percent.toFixed(0)}%
            </p>
          </div>
        </div>
      </motion.section>

      {/* Memory Bar */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Uso de Memoria</span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{health.memory.used_mb.toFixed(0)}MB / {health.memory.total_mb.toFixed(0)}MB</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${health.memory.percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ 
              backgroundColor: health.memory.percent > 90 ? '#ef4444' : health.memory.percent > 70 ? '#f59e0b' : '#10b981'
            }}
          />
        </div>
      </motion.section>

      {/* Services Grid */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Servicios</h2>
          <button
            onClick={fetchHealth}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
        
        <div className="grid gap-3 md:grid-cols-2">
          {health.services.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>
      </motion.section>

      {/* Database Details */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5" style={{ color: '#3b82f6' }} />
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Base de Datos</h3>
          <StatusBadge status={health.database.status} />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
            <p className="text-2xl font-black" style={{ color: '#3b82f6' }}>{health.database.pool_size}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pool máximo</p>
          </div>
          <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
            <p className="text-2xl font-black" style={{ color: '#10b981' }}>{health.database.active_connections}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Activas</p>
          </div>
          <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{health.memory.used_mb.toFixed(0)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>MB usados</p>
          </div>
          <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{formatUptime(health.uptime_seconds)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Uptime</p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}