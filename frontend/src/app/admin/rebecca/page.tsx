'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import { Bot, Save, RefreshCw, ToggleLeft, ToggleRight, MessageSquare, Settings, Shield } from 'lucide-react';

interface ConfigItem {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

interface ConfigValues {
  model: string;
  max_output_tokens: string;
  temperature: string;
  is_enabled: string;
  rate_limit_max: string;
  rate_limit_window_ms: string;
  web_instructions: string;
  whatsapp_instructions: string;
  system_prompt_extra: string;
  max_history: string;
}

const MODEL_OPTIONS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (rápido)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (más capaz)' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
];

export default function RebeccaAdminPage() {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [values, setValues] = useState<ConfigValues>({
    model: 'gemini-2.5-flash',
    max_output_tokens: '600',
    temperature: '0.7',
    is_enabled: 'true',
    rate_limit_max: '20',
    rate_limit_window_ms: '3600000',
    web_instructions: 'Respuestas completas pero concisas. Máximo 3 párrafos.',
    whatsapp_instructions: 'Máximo 200 caracteres por mensaje. Si necesitás más, dividí en varios mensajes cortos.',
    system_prompt_extra: '',
    max_history: '10',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'model' | 'generation' | 'channels' | 'limits'>('model');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await adminApi.get<{ config: ConfigItem[]; values: ConfigValues }>('/api/admin/rebecca/config');
      setConfig(data.config || []);
      if (data.values) setValues((v) => ({ ...v, ...data.values }));
    } catch (error) {
      console.error('Error fetching config:', error);
      showNotification('Error al cargar configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminApi.patch('/api/admin/rebecca/config', { updates: Object.entries(values).map(([key, value]) => ({ key, value })) });
      showNotification('Configuración guardada');
      fetchConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      showNotification('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const isEnabled = values.is_enabled === 'true';

  const tabs = [
    { id: 'model', label: 'Modelo', icon: <Bot className="h-4 w-4" /> },
    { id: 'generation', label: 'Generación', icon: <Settings className="h-4 w-4" /> },
    { id: 'channels', label: 'Canales', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'limits', label: 'Límites', icon: <Shield className="h-4 w-4" /> },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jakarta text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Rebecca — Agente IA
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Configura el modelo, prompts y comportamiento de Rebecca
          </p>
        </div>
        <div className="flex items-center gap-3">
          {notification && (
            <span className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-success, #10b98120)', color: 'var(--text-success, #10b981)' }}>
              {notification}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ background: isEnabled ? 'var(--accent)/10' : 'var(--bg-card)', borderColor: isEnabled ? 'var(--accent)/30' : 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-gray-400'}`} />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Rebecca {isEnabled ? 'está activa' : 'está desactivada'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {isEnabled ? 'El widget de chat responde a los usuarios' : 'El widget no responde mensajes'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setValues((v) => ({ ...v, is_enabled: isEnabled ? 'false' : 'true' }))}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          {isEnabled ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
          {isEnabled ? 'Desactivar' : 'Activar'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {activeTab === 'model' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Modelo de IA
              </label>
              <select
                value={values.model}
                onChange={(e) => setValues((v) => ({ ...v, model: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                Flash es más rápido y económico. Pro es más capaz para conversaciones complejas.
              </p>
            </div>

            <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Prompt adicional del sistema
              </label>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Este texto se agrega al prompt base de Rebecca. Úsalo para instrucciones especiales.
              </p>
              <textarea
                value={values.system_prompt_extra}
                onChange={(e) => setValues((v) => ({ ...v, system_prompt_extra: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Ej: Siempre menciona el plan PRO cuando el usuario pregunta por planes premium."
              />
            </div>
          </div>
        )}

        {activeTab === 'generation' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <label className="block text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Parámetros de generación
              </label>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Máx. tokens de salida
                  </label>
                  <input
                    type="number"
                    value={values.max_output_tokens}
                    onChange={(e) => setValues((v) => ({ ...v, max_output_tokens: e.target.value }))}
                    min="50"
                    max="8192"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>600 ≈ 3 párrafos. 200 ≈ 1-2 oraciones.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Temperatura
                  </label>
                  <input
                    type="number"
                    value={values.temperature}
                    onChange={(e) => setValues((v) => ({ ...v, temperature: e.target.value }))}
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>0.7 = balance. Menor = más predecible.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Historial de conversación
              </label>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Cuántos mensajes previos se envían al modelo para dar contexto.
              </p>
              <input
                type="number"
                value={values.max_history}
                onChange={(e) => setValues((v) => ({ ...v, max_history: e.target.value }))}
                min="0"
                max="50"
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Instrucciones — Widget Web
              </label>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Se agrega al system prompt cuando el usuario escribe desde el widget de chat en lookitry.com
              </p>
              <textarea
                value={values.web_instructions}
                onChange={(e) => setValues((v) => ({ ...v, web_instructions: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Instrucciones — WhatsApp
              </label>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Se agrega al system prompt cuando el mensaje viene de WhatsApp vía YCloud
              </p>
              <textarea
                value={values.whatsapp_instructions}
                onChange={(e) => setValues((v) => ({ ...v, whatsapp_instructions: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        )}

        {activeTab === 'limits' && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <label className="block text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Rate Limiting del Widget
              </label>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Máx. requests por ventana
                  </label>
                  <input
                    type="number"
                    value={values.rate_limit_max}
                    onChange={(e) => setValues((v) => ({ ...v, rate_limit_max: e.target.value }))}
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Ventana (ms)
                  </label>
                  <input
                    type="number"
                    value={values.rate_limit_window_ms}
                    onChange={(e) => setValues((v) => ({ ...v, rate_limit_window_ms: e.target.value }))}
                    min="60000"
                    max="3600000"
                    step="60000"
                    className="w-full px-4 py-3 rounded-xl border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>3600000 = 1 hora</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}