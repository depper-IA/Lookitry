'use client';

import { BlogPost, BlogSettings, updateBlogSettings } from '@/services/blog.service';
import { Loader2, RefreshCw, Settings2, Calendar, CheckCircle2, AlertCircle, Clock, Search, FileText, ImageIcon } from 'lucide-react';

interface BlogStatusCardProps {
  settings: BlogSettings | null;
  isTriggering: boolean;
  isMonitoringRun: boolean;
  isSaving: boolean;
  executionStatus: string;
  executionTitle: string;
  executionMessage: string;
  executionTimestamp: string | null;
  onRequestTriggerNow: () => void;
  onToggleEnabled: () => void;
  onUpdateFrequency: (freq: 'daily' | 'weekly' | 'monthly') => void;
}

function sanitizeExecutionMessage(message: string | null | undefined, status: 'error' | 'success' | 'running' | 'idle') {
  const normalized = message?.trim();
  const looksTechnical = normalized
    ? /x-n8n-secret|http\s*\d+|metodo:|método:|webhook|execution-status|n8n/i.test(normalized)
    : false;

  if (normalized && !looksTechnical) {
    return normalized;
  }

  if (status === 'error') {
    return 'No pudimos completar la generación del artículo. Revisa la última ejecución del flujo o vuelve a intentarlo.';
  }

  if (status === 'success') {
    return (normalized && !looksTechnical)
      ? normalized
      : 'La ejecución terminó correctamente. El panel ya refleja el resultado más reciente del flujo editorial.';
  }

  if (status === 'running') {
    return 'Estamos preparando el artículo. Este proceso puede tardar varios minutos mientras investigamos, redactamos y generamos las imágenes.';
  }

  return 'Aquí verás el progreso real del flujo editorial y cualquier novedad importante de la publicación automática.';
}

function getStepStatus(executionMessage: string, executionStatus: string, stepSearch: string) {
  const msg = executionMessage.toLowerCase();

  if (executionStatus === 'success') return 'completed';
  if (executionStatus === 'error' && msg.includes(stepSearch)) return 'error';

  if (msg.includes(stepSearch)) {
    if (msg.includes('finalizado') || msg.includes('terminado') || msg.includes('completado')) {
      return 'completed';
    }
    return 'current';
  }

  const steps = ['investigando', 'redactando', 'generando imágenes'];
  const currentIdx = steps.findIndex(s => msg.includes(s));
  const stepIdx = steps.indexOf(stepSearch);

  if (currentIdx > stepIdx && currentIdx !== -1) return 'completed';

  return 'pending';
}

export default function BlogStatusCard({
  settings,
  isTriggering,
  isMonitoringRun,
  isSaving,
  executionStatus,
  executionTitle,
  executionMessage,
  executionTimestamp,
  onRequestTriggerNow,
  onToggleEnabled,
  onUpdateFrequency,
}: BlogStatusCardProps) {
  const editorialSteps = [
    { key: 'investigando', label: 'Investigando', icon: Search, color: 'text-indigo-500', bg: 'bg-indigo-500/5', border: 'border-indigo-500/20' },
    { key: 'redactando', label: 'Redactando', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
    { key: 'generando imágenes', label: 'Imágenes IA', icon: ImageIcon, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/5', border: 'border-fuchsia-500/20' },
  ];

  return (
    <div className="lg:col-span-8 rounded-[2.5rem] border p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden transition-all hover:shadow-[var(--accent)]/5 bg-[var(--bg-card)] border-[var(--border-color)]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />

      <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-jakarta font-black uppercase tracking-tighter text-2xl flex items-center gap-2 text-[var(--text-primary)]">
              Pulso <span className="text-[var(--accent)]">IA</span>
            </h2>
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
              executionStatus === 'running' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
              executionStatus === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
              'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}>
              {executionStatus === 'running' ? 'Procesando' : executionStatus === 'error' ? 'Fallo' : 'Activo'}
            </div>
          </div>
          <p className="text-sm font-medium opacity-60 leading-relaxed mb-6 text-[var(--text-primary)]">
            Nuestra red neuronal investiga tendencias, redacta con alma y genera visuales de alto impacto de forma autónoma.
          </p>

          {/* Real-time Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {editorialSteps.map((step) => {
              const status = getStepStatus(executionMessage, executionStatus, step.key);
              const Icon = step.icon;
              return (
                <div
                  key={step.key}
                  className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500 ${
                    status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-100 scale-100' :
                    status === 'error' ? 'bg-red-500/5 border-red-500/20 opacity-100' :
                    status === 'current' ? `${step.bg} ${step.border} shadow-lg shadow-black/5 scale-[1.02] active-pulse` :
                    'bg-black/5 dark:bg-white/5 border-transparent opacity-30 scale-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    status === 'completed' ? 'text-emerald-500' :
                    status === 'error' ? 'text-red-500' :
                    status === 'current' ? step.color :
                    'text-zinc-500'
                  }`}>
                    {status === 'current' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    status === 'current' ? step.color : 'text-[var(--text-primary)]'
                  }`}>
                    {step.label}
                  </span>
                  {status === 'completed' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute top-2 right-2" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 absolute top-2 right-2" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Message Buffer */}
          <div className={`p-6 rounded-3xl border transition-all ${
            executionStatus === 'error' ? 'bg-red-500/5 border-red-500/20' :
            executionStatus === 'running' ? 'bg-[var(--accent)]/5 border-[var(--accent)]/10' :
            'bg-black/5 dark:bg-white/5 border-transparent'
          }`}>
            <div className="flex gap-4 items-start">
              <div className={`mt-1 ${executionStatus === 'error' ? 'text-red-500' : 'text-[var(--accent)]'}`}>
                {executionStatus === 'error' ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 text-[var(--text-primary)]">
                  {executionTitle}
                </h4>
                <p className="text-[13px] font-bold leading-relaxed text-[var(--text-primary)]">
                  {executionMessage}
                </p>
                {executionTimestamp && (
                  <div className="mt-3 text-[9px] font-bold uppercase tracking-widest opacity-30 text-[var(--text-primary)]">
                    Última señal: {new Date(executionTimestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-3">
          <button
            onClick={onRequestTriggerNow}
            disabled={isTriggering || isMonitoringRun}
            className="group relative w-full px-6 py-4 rounded-2xl bg-[var(--accent)] text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              {isTriggering || isMonitoringRun ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Forzar Pulso
            </span>
          </button>

          <button
            onClick={onToggleEnabled}
            disabled={isSaving}
            className={`w-full px-6 py-3.5 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${
              settings?.is_enabled
                ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10'
                : 'border-zinc-500/30 text-zinc-500 bg-zinc-500/5 hover:bg-zinc-500/10'
            }`}
          >
            {settings?.is_enabled ? '● Sistema Activo' : '○ Flujo Pausado'}
          </button>

          <div className="mt-4 p-5 rounded-3xl bg-black/5 dark:bg-white/5 border border-transparent">
            <div className="flex items-center gap-2 mb-3 opacity-40">
              <Settings2 className="w-3 h-3" />
              <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">
                Configuración
              </h5>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1.5 block text-[var(--text-primary)]">
                  Frecuencia
                </label>
                <select
                  value={settings?.frequency}
                  onChange={(e) => onUpdateFrequency(e.target.value as any)}
                  className="w-full bg-transparent text-xs font-bold outline-none border-none p-0 cursor-pointer text-[var(--text-primary)]"
                >
                  <option value="daily" className="bg-white dark:bg-[#0a0a0a]">Diaria</option>
                  <option value="weekly" className="bg-white dark:bg-[#0a0a0a]">Semanal</option>
                  <option value="monthly" className="bg-white dark:bg-[#0a0a0a]">Mensual</option>
                </select>
              </div>
              <div className="pt-3 border-t border-black/5 dark:border-white/5">
                <label className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1 block text-[var(--text-primary)]">
                  Próximo Vuelo
                </label>
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                  <Calendar className="w-3 h-3 opacity-40" />
                  <span className="text-xs font-black">
                    {settings ? new Date(settings.next_run).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}