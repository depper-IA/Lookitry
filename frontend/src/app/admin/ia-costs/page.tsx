'use client';

import { useEffect, useState, useCallback } from 'react';
import { Brain } from 'lucide-react';

import { adminApi } from '@/services/adminApi';
import { motion } from 'framer-motion';

export default function AdminIACostsPage() {
  const [aiPromptMaster, setAiPromptMaster] = useState('');
  const [aiPromptNegative, setAiPromptNegative] = useState('');
  const [savingAI, setSavingAI] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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
    loadPaymentSettings();
  }, []);

  async function handleSaveAI() {
    setSavingAI(true);
    try {
      const data = await adminApi.put('/admin/payment-settings', {
        ai_prompt_master: aiPromptMaster,
        ai_prompt_negative: aiPromptNegative,
      });
      if (data.error) throw new Error(data.message || 'Error');
      setSuccess('Configuración de IA guardada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); setTimeout(() => setError(''), 4000); }
    finally { setSavingAI(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Costos e IA</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Generación via Vertex AI (GCP). Costos en Google Cloud Console.</p>
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
