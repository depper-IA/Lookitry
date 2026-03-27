'use client';

import { useState, useEffect, useCallback } from 'react';

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

const statusColors: Record<string, string> = {
  success: 'bg-green-500/20 text-green-300',
  partial: 'bg-yellow-500/20 text-yellow-300',
  failed: 'bg-red-500/20 text-red-300',
  pending: 'bg-blue-500/20 text-blue-300',
};

const statusLabels: Record<string, string> = {
  success: '✓ Exitoso',
  partial: '⚠ Parcial',
  failed: '✗ Error',
  pending: '⟳ En proceso',
};

export default function EnterpriseSyncPage() {
  const [configs, setConfigs] = useState<SyncConfig[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
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

  const getAuthHeaders = () => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('admin_token='))
      ?.split('=')[1];
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    };
  };

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/enterprise`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch (err) {
      console.error('Error cargando configs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/brands`, { headers: getAuthHeaders() });
      const data = await res.json();
      setBrands((data.brands || []).filter((b: Brand) => b.plan === 'ENTERPRISE'));
    } catch (err) {
      console.error('Error cargando marcas:', err);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchBrands();
  }, [fetchConfigs, fetchBrands]);

  const handleTrigger = async (brandId: string, brandName: string) => {
    setTriggeringIds((prev) => new Set(prev).add(brandId));
    try {
      const res = await fetch(`${API_URL}/api/admin/enterprise/${brandId}/trigger-sync`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al disparar sync');
      setSuccessMsg(`✓ Sync iniciado para "${brandName}". n8n procesará los productos en breve.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchConfigs();
    } catch (err: any) {
      setError(err.message);
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
      setForm({ brand_id: '', sync_type: 'csv', source_url: '', api_key: '', notes: '', active: true });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.brand_id || !form.source_url) {
      setError('Marca y URL de fuente son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/enterprise/${form.brand_id}/sync-config`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sync_type: form.sync_type,
          source_url: form.source_url,
          api_key: form.api_key || undefined,
          notes: form.notes || undefined,
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setSuccessMsg('✓ Configuración guardada exitosamente.');
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowForm(false);
      fetchConfigs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const allBrandsWithConfig = new Set(configs.map((c) => c.brand_id));
  const availableBrands = brands.filter((b) => !allBrandsWithConfig.has(b.id));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Enterprise Sync — The Sync</h1>
          <p className="text-sm text-gray-400 mt-1">
            Gestiona la ingesta automática de catálogos para clientes Enterprise vía CSV, API o WooCommerce.
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Agregar Config
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingConfig ? 'Editar configuración' : 'Nueva configuración de sync'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-3">
              {/* Marca */}
              {!editingConfig && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Marca Enterprise</label>
                  <select
                    value={form.brand_id}
                    onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="">Seleccionar marca...</option>
                    {availableBrands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.email})</option>
                    ))}
                    {brands.length === 0 && (
                      <option disabled>No hay marcas con plan ENTERPRISE</option>
                    )}
                  </select>
                </div>
              )}

              {/* Tipo de fuente */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo de fuente</label>
                <select
                  value={form.sync_type}
                  onChange={(e) => setForm({ ...form, sync_type: e.target.value as any })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="csv">CSV — Archivo delimitado por coma</option>
                  <option value="api">API — Endpoint JSON del cliente</option>
                  <option value="woocommerce">WooCommerce — API REST nativa</option>
                </select>
              </div>

              {/* URL de la fuente */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {form.sync_type === 'csv' ? 'URL del CSV' : 'URL del API endpoint'}
                </label>
                <input
                  type="url"
                  value={form.source_url}
                  onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                  placeholder={form.sync_type === 'csv' ? 'https://tienda.com/productos.csv' : 'https://tienda.com/wp-json/wc/v3/products'}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
                />
              </div>

              {/* API Key (opcional) */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">API Key del cliente (opcional)</label>
                <input
                  type="password"
                  value={form.api_key}
                  onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                  placeholder="ck_xxxx:cs_xxxx"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
                />
              </div>

              {/* Notas internas */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Notas internas del admin</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Ej: Cliente de moda femenina. Actualizar catálogo cada lunes."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none"
                />
              </div>

              {/* Activo */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.active ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-gray-300">Sync activo</span>
              </label>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-700 text-gray-300 hover:text-white rounded-lg py-2 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando configuraciones...</div>
      ) : configs.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-gray-800">
          <div className="text-4xl mb-3">🔄</div>
          <p className="text-gray-400 font-medium">No hay clientes Enterprise configurados</p>
          <p className="text-gray-600 text-sm mt-1">Agrega la primera configuración de sync para un cliente Enterprise.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info de la marca */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-semibold text-sm">
                      {config.brands?.name || config.brand_id}
                    </h3>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                      ENTERPRISE
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.active ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      {config.active ? 'Activo' : 'Pausado'}
                    </span>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full capitalize">
                      {config.sync_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{config.brands?.email}</p>
                  <p className="text-xs text-gray-600 mt-0.5 truncate font-mono">{config.source_url}</p>
                  {config.notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">{config.notes}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openForm(config)}
                    className="text-xs border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleTrigger(config.brand_id, config.brands?.name || config.brand_id)}
                    disabled={!config.active || triggeringIds.has(config.brand_id)}
                    className="text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    {triggeringIds.has(config.brand_id) ? '⟳ Iniciando...' : '▶ Ejecutar Sync'}
                  </button>
                </div>
              </div>

              {/* Stats de último sync */}
              <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-4 flex-wrap text-xs text-gray-500">
                <span>
                  <span className="text-gray-400">Último sync:</span>{' '}
                  {config.last_sync_at ? new Date(config.last_sync_at).toLocaleString('es-CO') : 'Nunca'}
                </span>
                {config.last_sync_status && (
                  <span className={`px-2 py-0.5 rounded-full ${statusColors[config.last_sync_status] || 'bg-gray-700 text-gray-400'}`}>
                    {statusLabels[config.last_sync_status] || config.last_sync_status}
                  </span>
                )}
                <span>
                  <span className="text-gray-400">Productos sincronizados:</span>{' '}
                  <span className="text-white font-medium">{config.products_synced_count}</span>
                </span>
                {config.last_sync_message && (
                  <span className="text-gray-600 truncate max-w-xs italic">
                    {config.last_sync_message}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* N8n Workflow Guide */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 mt-8">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>⚡</span> Configuración del Flujo en n8n
        </h3>
        <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
          <li>Importa el flujo <code className="text-purple-300 bg-gray-800 px-1 rounded">enterprise-sync-workflow.json</code> en tu instancia de n8n.</li>
          <li>Configura la variable de entorno <code className="text-green-300 bg-gray-800 px-1 rounded">N8N_ENTERPRISE_SYNC_WEBHOOK_URL</code> en el backend.</li>
          <li>Agrega la clave <code className="text-green-300 bg-gray-800 px-1 rounded">ENTERPRISE_SYNC_TOKEN</code> tanto en el backend como en las credenciales de n8n (header Authorization).</li>
          <li>El flujo procesa cada imagen con <strong className="text-white">background removal</strong>, la sube a MinIO y llama a <code className="text-blue-300 bg-gray-800 px-1 rounded">POST /api/enterprise/sync-product</code>.</li>
          <li>Al finalizar, n8n llama a <code className="text-blue-300 bg-gray-800 px-1 rounded">PATCH /api/admin/enterprise/{'{brandId}'}/sync-status</code> con el resultado total.</li>
        </ol>
      </div>
    </div>
  );
}
