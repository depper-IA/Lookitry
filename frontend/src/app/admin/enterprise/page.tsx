'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Database,
  FileSpreadsheet,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Store,
  UserPlus,
  Workflow,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import EnterpriseCalculator from '@/components/admin/EnterpriseCalculator';

interface SyncConfig {
  id: string;
  brand_id: string;
  sync_type: 'csv' | 'api' | 'woocommerce';
  source_url: string;
  api_key?: string;
  active: boolean;
  last_sync_at?: string;
  last_sync_status?: 'success' | 'partial' | 'failed' | 'pending';
  last_sync_message?: string;
  products_synced_count: number;
  notes?: string;
  created_at: string;
  brands?: { id: string; name: string; email: string; slug: string; plan: string };
}

interface Brand {
  id: string;
  name: string;
  email: string;
  plan: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  success: { bg: 'rgba(16,185,129,0.12)', text: '#10b981', label: 'Correcto' },
  partial: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'Parcial' },
  failed: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', label: 'Con error' },
  pending: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', label: 'En proceso' },
};

const syncTypeMeta = {
  csv: {
    label: 'CSV',
    description: 'Archivo estructurado que se consulta para actualizar catálogo.',
    icon: FileSpreadsheet,
  },
  api: {
    label: 'API',
    description: 'Endpoint JSON del cliente con inventario o catálogo en tiempo real.',
    icon: Globe,
  },
  woocommerce: {
    label: 'WooCommerce',
    description: 'Conector a la API REST nativa de la tienda del cliente.',
    icon: Store,
  },
} as const;

function formatDate(value?: string) {
  if (!value) return 'Nunca';
  return new Date(value).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ShellCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border ${className}`}
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <ShellCard className="p-5">
      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-jakarta font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        {sub}
      </p>
    </ShellCard>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function EnterpriseSyncPage() {
  const [configs, setConfigs] = useState<SyncConfig[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [moduleAvailable, setModuleAvailable] = useState(true);
  const [moduleMessage, setModuleMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [triggeringIds, setTriggeringIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SyncConfig | null>(null);
  const [form, setForm] = useState({
    brand_id: '',
    sync_type: 'csv' as 'csv' | 'api' | 'woocommerce',
    source_url: '',
    api_key: '',
    notes: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/enterprise`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'No se pudieron cargar las configuraciones enterprise.');
      setConfigs(data.configs || []);
      setModuleAvailable(data.moduleAvailable !== false);
      setModuleMessage(data.moduleMessage || '');
      setError('');
    } catch (err: any) {
      console.error('Error cargando configs:', err);
      setError(err?.message || 'No pude cargar las configuraciones enterprise.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/brands`, { credentials: 'include' });
      if (!res.ok) throw new Error('No se pudieron cargar las marcas enterprise.');
      const data = await res.json();
      setBrands((data.brands || []).filter((brand: Brand) => brand.plan === 'ENTERPRISE'));
    } catch (err) {
      console.error('Error cargando marcas:', err);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchBrands();
  }, [fetchConfigs, fetchBrands]);

  const handleTrigger = async (brandId: string, brandName: string) => {
    if (!moduleAvailable) {
      setError(moduleMessage || 'El módulo enterprise aún no está disponible en esta base.');
      return;
    }

    setTriggeringIds((prev) => new Set(prev).add(brandId));
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/enterprise/${brandId}/trigger-sync`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al disparar sync');
      setSuccessMsg(`Sync iniciado para "${brandName}". n8n ya puede procesar el catálogo.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchConfigs();
    } catch (err: any) {
      setError(err.message || 'No se pudo ejecutar el sync.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setTriggeringIds((prev) => {
        const next = new Set(prev);
        next.delete(brandId);
        return next;
      });
    }
  };

  const openForm = (config?: SyncConfig) => {
    if (!moduleAvailable) {
      setError(moduleMessage || 'El módulo enterprise aún no está disponible en esta base.');
      return;
    }

    if (config) {
      setEditingConfig(config);
      setForm({
        brand_id: config.brand_id,
        sync_type: config.sync_type,
        source_url: config.source_url,
        api_key: config.api_key || '',
        notes: config.notes || '',
        active: config.active,
      });
    } else {
      setEditingConfig(null);
      setForm({
        brand_id: '',
        sync_type: 'csv',
        source_url: '',
        api_key: '',
        notes: '',
        active: true,
      });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!moduleAvailable) {
      setError(moduleMessage || 'El módulo enterprise aún no está disponible en esta base.');
      return;
    }

    if (!form.brand_id || !form.source_url) {
      setError('Marca y fuente son obligatorias para guardar la configuración.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/enterprise/${form.brand_id}/sync-config`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sync_type: form.sync_type,
          source_url: form.source_url,
          api_key: form.api_key || undefined,
          notes: form.notes || undefined,
          active: form.active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la configuración');

      setSuccessMsg('Configuración enterprise guardada correctamente.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowForm(false);
      fetchConfigs();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const allBrandsWithConfig = new Set(configs.map((config) => config.brand_id));
  const availableBrands = brands.filter((brand) => !allBrandsWithConfig.has(brand.id));

  const summary = useMemo(() => {
    const active = configs.filter((config) => config.active).length;
    const withIssues = configs.filter((config) => ['failed', 'partial'].includes(config.last_sync_status || '')).length;
    const syncedProducts = configs.reduce((sum, config) => sum + (config.products_synced_count || 0), 0);

    return {
      total: configs.length,
      active,
      withIssues,
      syncedProducts,
    };
  }, [configs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      <ShellCard className="overflow-hidden">
        <div
          className="p-6 md:p-8"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(255,92,58,0.18), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]"
                style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}
              >
                <Workflow className="h-3.5 w-3.5" />
                Ingesta enterprise
              </span>
              <h1 className="mt-4 text-3xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Central de catálogos automatizados
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                Esta pestaña sirve para conectar catálogos externos de clientes Enterprise con Lookitry.
                Aquí decides desde dónde se lee el inventario, activas o pausas la automatización y disparas
                syncs manuales cuando el cliente cambia productos, precios o imágenes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchConfigs}
                className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </button>
              <button
                onClick={() => openForm()}
                disabled={!moduleAvailable}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed"
                style={{ background: '#FF5C3A', opacity: moduleAvailable ? 1 : 0.5 }}
              >
                <Plus className="h-4 w-4" />
                Nueva conexión
              </button>
              <Link
                href="/admin/enterprise/crear"
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
              >
                <UserPlus className="h-4 w-4" />
                Crear cliente Enterprise
              </Link>
            </div>
          </div>

        </div>
      </ShellCard>

      {successMsg && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)', color: '#10b981' }}
        >
          {successMsg}
        </div>
      )}
      {error && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444' }}
        >
          {error}
        </div>
      )}
      {!moduleAvailable && moduleMessage && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)', color: '#f59e0b' }}
        >
          {moduleMessage}
        </div>
      )}

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">Información del cliente</p>
          <h2 className="mt-2 text-xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Contexto operativo para cuentas enterprise
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ShellCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}>
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-jakarta font-bold" style={{ color: 'var(--text-primary)' }}>
                Cómo funciona esta pestaña
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Piensa en esto como un puente entre el catálogo del cliente y tu sistema.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Workflow,
                title: '1. Conectas la fuente',
                body: 'Defines si el cliente entrega un CSV, un endpoint API o credenciales de WooCommerce.',
              },
              {
                icon: Settings2,
                title: '2. n8n transforma',
                body: 'El flujo descarga los productos, procesa imágenes y arma la estructura que entiende Lookitry.',
              },
              {
                icon: BadgeCheck,
                title: '3. Lookitry actualiza',
                body: 'Se crea o refresca el catálogo interno y luego revisas el estado del último sync.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border p-5"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
                >
                  <div className="inline-flex rounded-2xl p-2.5" style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </ShellCard>

        <ShellCard className="p-6">
          <h2 className="text-lg font-jakarta font-bold" style={{ color: 'var(--text-primary)' }}>
            Recomendaciones
          </h2>
          <div className="mt-5 space-y-4">
            {[
              'Usa CSV cuando el cliente solo puede exportar productos por lotes y no necesita cambios en tiempo real.',
              'Prefiere API o WooCommerce cuando el inventario cambia seguido y quieres menos trabajo manual.',
              'Si un sync queda “parcial”, normalmente hay campos vacíos, imágenes caídas o permisos incompletos.',
              'Añade notas internas por cliente para dejar claro qué fuente manda y cuándo conviene ejecutar manualmente.',
              'Mantén una sola conexión activa por marca para evitar duplicados y choques entre catálogos.',
            ].map((tip) => (
              <div
                key={tip}
                className="flex gap-3 rounded-[1.5rem] border p-4"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#FF5C3A' }} />
                <p className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </ShellCard>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">Calculadora de precios</p>
          <h2 className="mt-2 text-xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Margen y propuesta comercial
          </h2>
        </div>
        <EnterpriseCalculator />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">Estado de cuenta</p>
          <h2 className="mt-2 text-xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Resumen de conexiones enterprise
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Conexiones" value={String(summary.total)} sub="clientes enterprise con fuente configurada" />
          <StatCard label="Activas" value={String(summary.active)} sub="automatizaciones listas para ejecutar" />
          <StatCard label="Con alertas" value={String(summary.withIssues)} sub="syncs que conviene revisar hoy" />
          <StatCard label="Productos" value={summary.syncedProducts.toLocaleString('es-CO')} sub="registros sincronizados reportados" />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">Historial</p>
          <h2 className="mt-2 text-xl font-jakarta font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Conexiones, syncs y trazabilidad
          </h2>
        </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <ShellCard className="w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-jakarta font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editingConfig ? 'Editar conexión enterprise' : 'Nueva conexión enterprise'}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Configura la fuente externa que n8n usará para sincronizar el catálogo.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-2xl border p-2 transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {!editingConfig && (
                <Field label="Marca enterprise">
                  <select
                    value={form.brand_id}
                    onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                    className="min-h-[44px] w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Seleccionar marca...</option>
                    {availableBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name} ({brand.email})
                      </option>
                    ))}
                    {brands.length === 0 && <option disabled>No hay marcas ENTERPRISE todavía</option>}
                  </select>
                </Field>
              )}

              <Field label="Tipo de fuente">
                <select
                  value={form.sync_type}
                  onChange={(e) => setForm({ ...form, sync_type: e.target.value as 'csv' | 'api' | 'woocommerce' })}
                  className="min-h-[44px] w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="csv">CSV</option>
                  <option value="api">API</option>
                  <option value="woocommerce">WooCommerce</option>
                </select>
              </Field>

              <div className="md:col-span-2">
                <Field label={form.sync_type === 'csv' ? 'URL del CSV' : 'URL del endpoint'}>
                  <input
                    type="url"
                    value={form.source_url}
                    onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                    placeholder={
                      form.sync_type === 'csv'
                        ? 'https://cliente.com/catalogo.csv'
                        : form.sync_type === 'woocommerce'
                          ? 'https://cliente.com/wp-json/wc/v3/products'
                          : 'https://cliente.com/api/products'
                    }
                    className="min-h-[44px] w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="API key o credencial opcional">
                  <input
                    type="password"
                    value={form.api_key}
                    onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                    placeholder="ck_xxx o token del cliente"
                    className="min-h-[44px] w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="Notas operativas">
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="Ej: catálogo de temporada, corre cada lunes, revisar imágenes verticales."
                    className="w-full rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </Field>
              </div>
            </div>

            <div
              className="mt-5 flex items-center justify-between rounded-[1.5rem] border px-4 py-3"
              style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Sync activo
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Si lo apagas, la configuración queda guardada pero no debería ejecutarse.
                </p>
              </div>
              <button
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`relative h-7 w-14 rounded-full transition-colors ${form.active ? 'bg-[#FF5C3A]' : 'bg-white/10'}`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${form.active ? 'translate-x-8' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: '#FF5C3A' }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                {saving ? 'Guardando...' : 'Guardar conexión'}
              </button>
            </div>
          </ShellCard>
        </div>
      )}

      {loading ? (
        <ShellCard className="p-10">
          <div className="flex items-center justify-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando conexiones enterprise...
          </div>
        </ShellCard>
      ) : configs.length === 0 ? (
        <ShellCard className="p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.5rem]"
            style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}
          >
            <Workflow className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-jakarta font-bold" style={{ color: 'var(--text-primary)' }}>
            Aún no hay conexiones enterprise
          </h3>
          <p className="mt-2 max-w-xl mx-auto text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
            Crea la primera configuración cuando un cliente enterprise necesite que su catálogo se
            sincronice automáticamente desde un origen externo.
          </p>
        </ShellCard>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => {
            const meta = syncTypeMeta[config.sync_type];
            const StatusIcon = meta.icon;
            const status = statusColors[config.last_sync_status || 'pending'] || statusColors.pending;
            const brandName = config.brands?.name || config.brand_id;

            return (
              <ShellCard key={config.id} className="p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: status.bg, color: status.text }}
                      >
                        {status.label}
                      </span>
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          background: config.active ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.08)',
                          color: config.active ? '#10b981' : 'var(--text-muted)',
                        }}
                      >
                        {config.active ? 'Activa' : 'Pausada'}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-jakarta font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {brandName}
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {config.brands?.email || 'Sin email'} · {meta.description}
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div
                        className="rounded-[1.5rem] border p-4"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
                      >
                        <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                          Fuente
                        </p>
                        <p className="mt-2 text-sm break-all" style={{ color: 'var(--text-primary)' }}>
                          {config.source_url}
                        </p>
                      </div>
                      <div
                        className="rounded-[1.5rem] border p-4"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
                      >
                        <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                          Último sync
                        </p>
                        <p className="mt-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(config.last_sync_at)}
                        </p>
                      </div>
                      <div
                        className="rounded-[1.5rem] border p-4"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
                      >
                        <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                          Productos sincronizados
                        </p>
                        <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {config.products_synced_count.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>

                    {config.notes && (
                      <div
                        className="mt-4 rounded-[1.5rem] border p-4"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
                      >
                        <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                          Nota interna
                        </p>
                        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                          {config.notes}
                        </p>
                      </div>
                    )}

                    {config.last_sync_message && (
                      <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                        Último mensaje: {config.last_sync_message}
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-3">
                    <button
                      onClick={() => handleTrigger(config.brand_id, brandName)}
                      disabled={!config.active || triggeringIds.has(config.brand_id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: '#FF5C3A' }}
                    >
                      {triggeringIds.has(config.brand_id) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Iniciando sync
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Ejecutar sync manual
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => openForm(config)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-85"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      <Settings2 className="h-4 w-4" />
                      Editar conexión
                    </button>

                    <div
                      className="rounded-[1.5rem] border p-4"
                      style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}
                    >
                      <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                        Lectura rápida
                      </p>
                      <div className="mt-3 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-start gap-2">
                          <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: '#FF5C3A' }} />
                          <span>{config.active ? 'Automatización lista para correr.' : 'Configuración guardada pero en pausa.'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: '#FF5C3A' }} />
                          <span>
                            Si el estado queda en parcial o error, revisa fuente, credenciales y estructura del catálogo.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ShellCard>
            );
          })}
        </div>
      )}
      </section>
    </motion.div>
  );
}
