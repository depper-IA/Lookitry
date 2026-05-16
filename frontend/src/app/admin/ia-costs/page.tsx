'use client';

import { useEffect, useState, useCallback } from 'react';
import { CreditCard, ExternalLink, RefreshCw, AlertTriangle, Brain } from 'lucide-react';

import { adminApi } from '@/services/adminApi';
import { motion } from 'framer-motion';
import { EmbeddedPlaybook } from '@/components/admin/EmbeddedPlaybook';

interface ProviderCredits {
  provider: 'openrouter';
  status: 'ok' | 'partial' | 'not_configured';
  label: string | null;
  usage: number | null;
  limit: number | null;
  balance: number | null;
  usage_percent: number | null;
  estimated_generations_remaining: number | null;
  cost_per_generation: number;
  low_balance_alert: boolean;
  critical_balance_alert: boolean;
  settings_url?: string | null;
  message?: string | null;
}

interface PaymentSettings {
  ai_prompt_master: string;
  ai_prompt_negative: string;
}

export default function AdminIACostsPage() {
  const [openRouterCredits, setOpenRouterCredits] = useState<ProviderCredits | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [aiPromptMaster, setAiPromptMaster] = useState('');
  const [aiPromptNegative, setAiPromptNegative] = useState('');
  const [savingAI, setSavingAI] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadCredits = useCallback(async () => {
    setLoadingCredits(true);
    try {
      const orData = await adminApi.get('/admin/openrouter-credits');
      if (!orData.error) setOpenRouterCredits(orData);
    } catch { /* silencioso */ }
    finally { setLoadingCredits(false); }
  }, []);

  const loadPaymentSettings = useCallback(async () => {
    try {
      const data = await adminApi.get('/admin/payment-settings');
      if (!data.error) {
        if (data.ai_prompt_master) setAiPromptMaster(data.ai_prompt_master);
        if (data.ai_prompt_negative) setAiPromptNegative(data.ai_prompt_negative);
      }
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    loadCredits();
    loadPaymentSettings();
  }, []);

  async function handleSaveAI() {
    setSavingAI(true);
    try {
      const data = await adminApi.put('/admin/payment-settings', { 
        ai_prompt_master: aiPromptMaster, 
        ai_prompt_negative: aiPromptNegative 
      });
      if (data.error) throw new Error(data.message || 'Error');
      setSuccess('Configuración de IA guardada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); setTimeout(() => setError(''), 4000); }
    finally { setSavingAI(false); }
  }

  const totalBalance = openRouterCredits?.balance || 0;
  const totalUsage = openRouterCredits?.usage || 0;
  const hasAlert = openRouterCredits?.critical_balance_alert || openRouterCredits?.low_balance_alert;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Costos e IA</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Créditos de proveedores, costos por generación y prompts maestros</p>
      </div>

      {hasAlert && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-400">Uno o más proveedores tienen balance bajo. Considera recargar.</span>
        </div>
      )}

      <EmbeddedPlaybook
        playbookId="ia-costs-spike"
        showWhen={hasAlert}
        title="Playbook: Costo IA disparado"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-[1.5rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '3px solid #10b981' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Balance total disponible</p>
          <p className="text-2xl font-bold font-jakarta mt-1" style={{ color: '#10b981' }}>${totalBalance.toFixed(2)}</p>
        </div>
        <div className="rounded-[1.5rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '3px solid #f59e0b' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Uso acumulado</p>
          <p className="text-2xl font-bold font-jakarta mt-1" style={{ color: '#f59e0b' }}>${totalUsage.toFixed(2)}</p>
        </div>
        <div className="rounded-[1.5rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '3px solid var(--accent)' }}>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Costo promedio/gen</p>
          <p className="text-2xl font-bold font-jakarta mt-1" style={{ color: 'var(--accent)' }}>~$0.045</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[openRouterCredits].filter(Boolean).map((credits: any) => (
          <div key={credits.provider} className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>OpenRouter</p>
                <h3 className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>Créditos y consumo</h3>
              </div>
              <button onClick={loadCredits} disabled={loadingCredits}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors disabled:opacity-50"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)' }}>
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCredits ? 'animate-spin' : ''}`} /> Actualizar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Balance</p>
                <p className={`text-lg font-bold font-mono ${credits.critical_balance_alert ? 'text-red-500' : credits.low_balance_alert ? 'text-amber-500' : 'text-emerald-500'}`}>
                  ${credits.balance?.toFixed(2) || '—'}
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Generaciones restantes</p>
                <p className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                  {credits.estimated_generations_remaining?.toLocaleString() || '—'}
                </p>
              </div>
            </div>

            {credits.usage_percent !== null && credits.limit !== null && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Uso del límite</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{credits.usage_percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className={`h-full rounded-full transition-all ${credits.critical_balance_alert ? 'bg-red-500' : credits.low_balance_alert ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${credits.usage_percent}%` }} />
                </div>
              </div>
            )}

            {credits.settings_url && (
              <a href={credits.settings_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                <ExternalLink className="w-3.5 h-3.5" /> Ir a billing
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <h2 className="font-jakarta font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Prompts maestros de IA</h2>
        </div>

        {error && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>{error}</div>}
        {success && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>{success}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Master Prompt</label>
            <textarea value={aiPromptMaster} onChange={e => setAiPromptMaster(e.target.value)} rows={6}
              className="w-full px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Prompt Negativo</label>
            <textarea value={aiPromptNegative} onChange={e => setAiPromptNegative(e.target.value)} rows={4}
              className="w-full px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveAI} disabled={savingAI}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
              {savingAI ? 'Guardando...' : 'Guardar prompts'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
