'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Music, ExternalLink, AlertTriangle, X, Check, Loader2, Image } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

interface SocialApiConfig {
  id: string;
  platform: string;
  config: Record<string, any>;
  is_active: boolean;
  last_test_at?: string;
  last_test_result?: Record<string, any>;
}

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram / Meta',
    IconComponent: Instagram,
    description: 'Instagram Graph API para enviar DMs automatizados',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password' },
    ],
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    note: 'Requiere: Meta Business SDK approved + Instagram Business account',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    IconComponent: Music,
    description: 'TikTok Marketing API para automatizar outreach',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password' },
    ],
    docsUrl: 'https://developers.tiktok.com/',
    note: 'Requiere: TikTok Marketing API access approval',
  },
];

function IconCheck() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}
function IconX() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconSpinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function IconWarning() {
  return <AlertTriangle className="w-4 h-4" style={{ color: 'var(--accent)' }} />;
}

export default function SocialApiConfigPage() {
  const [configs, setConfigs] = useState<Record<string, SocialApiConfig>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});
  const [editPlatform, setEditPlatform] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const fetchConfigs = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/social-api-configs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error cargando configuraciones');
      const data = await res.json();

      const configsMap: Record<string, SocialApiConfig> = {};
      for (const config of data.configs || []) {
        configsMap[config.platform] = config;
      }
      setConfigs(configsMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleSave = async (platformId: string) => {
    setSaving(platformId);
    try {
      const platform = PLATFORMS.find((p) => p.id === platformId);
      if (!platform) return;

      const config: Record<string, string> = {};
      for (const field of platform.fields) {
        config[field.key] = formValues[`${platformId}_${field.key}`] || '';
      }

      const token = localStorage.getItem('admin_token');
      await fetch(`${API_URL}/api/admin/social-api-configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform: platformId, config }),
      });

      setEditPlatform(null);
      fetchConfigs();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(null);
  };

  const handleTest = async (platformId: string) => {
    setTesting(platformId);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/social-api-configs/${platformId}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setTestResult({ ...testResult, [platformId]: result });
    } catch (err: any) {
      setTestResult({ ...testResult, [platformId]: { success: false, message: err.message } });
    }
    setTesting(null);
  };

  const handleToggleActive = async (platformId: string, active: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${API_URL}/api/admin/social-api-configs/${platformId}/active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active }),
      });
      fetchConfigs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (platformId: string) => {
    if (!confirm('¿Eliminar esta configuración?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${API_URL}/api/admin/social-api-configs/${platformId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchConfigs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="p-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Social API Config</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Configura las credenciales para automatizar outreach en Instagram y TikTok
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
          <IconWarning />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="space-y-6">
        {PLATFORMS.map((platform) => {
          const config = configs[platform.id];
          const isEditing = editPlatform === platform.id;

          return (
            <div key={platform.id} className="rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,92,58,0.12)', color: 'var(--accent)' }}>
                    <platform.IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{platform.name}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{platform.description}</p>
                  </div>
                </div>
                {config?.is_active ? (
                  <span className="px-2 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                    Conectado
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: 'rgba(107,114,128,0.12)', color: 'var(--text-muted)' }}>
                    No configurado
                  </span>
                )}
              </div>

              {config?.last_test_result && (
                <div className={`mb-4 p-3 rounded-lg text-sm`} style={config.last_test_result.success ? { backgroundColor: 'rgba(16,185,129,0.08)', color: '#10b981' } : { backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                  <div className="flex items-center gap-2">
                    {config.last_test_result.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {config.last_test_result.message}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--bg-base)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <strong>Requisito:</strong> {platform.note}
                </p>
                <a
                  href={platform.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs hover:underline mt-1"
                  style={{ color: 'var(--accent)' }}
                >
                  Ver documentacion <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {platform.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={formValues[`${platform.id}_${field.key}`] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [`${platform.id}_${field.key}`]: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave(platform.id)}
                      disabled={saving === platform.id}
                      className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      {saving === platform.id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Guardar'}
                    </button>
                    <button
                      onClick={() => setEditPlatform(null)}
                      className="px-4 py-2 rounded-lg hover:opacity-80 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditPlatform(platform.id)}
                    className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: 'var(--text-primary)' }}
                  >
                    {config ? 'Editar' : 'Configurar'}
                  </button>
                  {config && (
                    <>
                      <button
                        onClick={() => handleTest(platform.id)}
                        disabled={testing === platform.id}
                        className="px-4 py-2 border rounded-lg transition-colors disabled:opacity-50"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                      >
                        {testing === platform.id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Test'}
                      </button>
                      <button
                        onClick={() => handleToggleActive(platform.id, !config.is_active)}
                        className="px-4 py-2 border rounded-lg transition-colors"
                        style={{ borderColor: config.is_active ? '#ef4444' : '#10b981', color: config.is_active ? '#ef4444' : '#10b981' }}
                      >
                        {config.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDelete(platform.id)}
                        className="px-4 py-2 border rounded-lg transition-colors"
                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-base)' }}>
        <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Como obtener las credenciales</h3>
        <div className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Instagram / Meta:</p>
            <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
              <li>Crea una app en <a href="https://developers.facebook.com" className="hover:underline" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">Facebook Developers</a></li>
              <li>Agrega el producto &quot;Instagram Graph API&quot;</li>
              <li>Configura Instagram Business account</li>
              <li>Genera un Long-Lived Access Token</li>
            </ol>
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>TikTok:</p>
            <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
              <li>Aplica en <a href="https://developers.tiktok.com" className="hover:underline" style={{ color: 'var(--accent)' }} target="_blank" rel="noopener noreferrer">TikTok Developers</a></li>
              <li>Espera aprobación (puede tomar semanas)</li>
              <li>Obtén tu Access Token desde el portal</li>
            </ol>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
