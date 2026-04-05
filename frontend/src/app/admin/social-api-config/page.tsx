'use client';

import { useEffect, useState, useCallback } from 'react';

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
    icon: '📸',
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
    icon: '🎵',
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
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}
function IconExternalLink() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0a0a0a]">Social API Config</h1>
        <p className="text-sm text-[#999] mt-1">
          Configura las credenciales para automatizar outreach en Instagram y TikTok
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <IconWarning />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><IconX /></button>
        </div>
      )}

      <div className="space-y-6">
        {PLATFORMS.map((platform) => {
          const config = configs[platform.id];
          const isEditing = editPlatform === platform.id;

          return (
            <div key={platform.id} className="bg-white rounded-lg border border-[#e5e5e5] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-bold text-[#0a0a0a]">{platform.name}</h3>
                    <p className="text-sm text-[#999]">{platform.description}</p>
                  </div>
                </div>
                {config?.is_active ? (
                  <span className="px-2 py-1 bg-[#10b981]/10 text-[#10b981] text-xs rounded-full font-medium">
                    Conectado
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-[#6b7280]/10 text-[#6b7280] text-xs rounded-full font-medium">
                    No configurado
                  </span>
                )}
              </div>

              {config?.last_test_result && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${config.last_test_result.success ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                  {config.last_test_result.success ? (
                    <div className="flex items-center gap-2">
                      <IconCheck />
                      {config.last_test_result.message}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <IconX />
                      {config.last_test_result.message}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-[#fafafa] rounded-lg mb-4">
                <p className="text-xs text-[#666]">
                  <strong>Requisito:</strong> {platform.note}
                </p>
                <a
                  href={platform.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#FF5C3A] hover:underline mt-1"
                >
                  Ver documentación <IconExternalLink />
                </a>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {platform.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-[#666] mb-1">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={formValues[`${platform.id}_${field.key}`] || ''}
                        onChange={(e) => setFormValues({ ...formValues, [`${platform.id}_${field.key}`]: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
                      />
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave(platform.id)}
                      disabled={saving === platform.id}
                      className="px-4 py-2 bg-[#FF5C3A] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {saving === platform.id ? <IconSpinner /> : 'Guardar'}
                    </button>
                    <button
                      onClick={() => setEditPlatform(null)}
                      className="px-4 py-2 text-[#666] hover:text-[#0a0a0a] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditPlatform(platform.id)}
                    className="px-4 py-2 bg-[#0a0a0a] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    {config ? 'Editar' : 'Configurar'}
                  </button>
                  {config && (
                    <>
                      <button
                        onClick={() => handleTest(platform.id)}
                        disabled={testing === platform.id}
                        className="px-4 py-2 border border-[#e5e5e5] rounded-lg hover:bg-[#fafafa] transition-colors disabled:opacity-50"
                      >
                        {testing === platform.id ? <IconSpinner /> : 'Test'}
                      </button>
                      <button
                        onClick={() => handleToggleActive(platform.id, !config.is_active)}
                        className={`px-4 py-2 border rounded-lg transition-colors ${config.is_active ? 'border-[#ef4444] text-[#ef4444] hover:bg-[#fef2f2]' : 'border-[#10b981] text-[#10b981] hover:bg-[#f0fdf4]'}`}
                      >
                        {config.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDelete(platform.id)}
                        className="px-4 py-2 border border-[#e5e5e5] text-[#ef4444] rounded-lg hover:bg-[#fef2f2] transition-colors"
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

      <div className="mt-8 p-4 bg-[#fafafa] rounded-lg">
        <h3 className="font-bold text-[#0a0a0a] mb-2">Cómo obtener las credenciales</h3>
        <div className="space-y-3 text-sm text-[#666]">
          <div>
            <p className="font-medium text-[#0a0a0a]">Instagram / Meta:</p>
            <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
              <li>Crea una app en <a href="https://developers.facebook.com" className="text-[#FF5C3A] hover:underline" target="_blank" rel="noopener noreferrer">Facebook Developers</a></li>
              <li>Agrega el producto &quot;Instagram Graph API&quot;</li>
              <li>Configura Instagram Business account</li>
              <li>Genera un Long-Lived Access Token</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-[#0a0a0a]">TikTok:</p>
            <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
              <li>Aplica en <a href="https://developers.tiktok.com" className="text-[#FF5C3A] hover:underline" target="_blank" rel="noopener noreferrer">TikTok Developers</a></li>
              <li>Espera aprobación (puede tomar semanas)</li>
              <li>Obtén tu Access Token desde el portal</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
