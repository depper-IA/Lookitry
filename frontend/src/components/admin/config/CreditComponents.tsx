'use client';

import { useState } from 'react';

interface ProviderCredits {
  provider: 'openrouter' | 'replicate';
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
  can_top_up?: boolean;
  settings_url?: string | null;
  message?: string | null;
  configured?: boolean;
  is_free_tier?: boolean;
}

interface CreditMetricProps {
  label: string;
  value: string;
  sub: string;
  color?: string;
}

interface CreditProviderCardProps {
  provider: ProviderCredits | null;
  loading: boolean;
  onRefresh: () => void;
  fallbackProvider: 'openrouter' | 'replicate';
}

export function CreditMetric({ label, value, sub, color }: CreditMetricProps) {
  return (
    <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
      <p style={{ color: 'var(--text-muted)' }} className="mb-1 text-xs font-medium">{label}</p>
      <p className="text-xl font-bold font-mono" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
      <p style={{ color: 'var(--text-muted)' }} className="mt-0.5 text-xs">{sub}</p>
    </div>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function IconExternalLink({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
}

export function CreditProviderCard({ provider, loading, onRefresh, fallbackProvider }: CreditProviderCardProps) {
  const providerKey = provider?.provider || fallbackProvider;
  const providerName = providerKey === 'replicate' ? 'Replicate' : 'OpenRouter';
  const providerAction = providerKey === 'replicate' ? 'Ir a billing de Replicate' : 'Ir a créditos de OpenRouter';
  const balanceColor = provider?.critical_balance_alert
    ? '#ef4444'
    : provider?.low_balance_alert
      ? '#f59e0b'
      : '#10b981';

  return (
    <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FF5C3A]">{providerName}</p>
          <h3 style={{ color: 'var(--text-primary)' }} className="mt-1 text-lg font-jakarta font-bold">
            Crédito y consumo independiente
          </h3>
          {provider?.message && (
            <p style={{ color: 'var(--text-muted)' }} className="mt-2 text-sm">{provider.message}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-hover)' }}
          >
            <IconRefresh className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          {provider?.settings_url && (
            <a
              href={provider.settings_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-[#FF5C3A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#e04e30]"
            >
              <IconExternalLink className="h-3.5 w-3.5" />
              {providerAction}
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FF5C3A] border-t-transparent" />
        </div>
      ) : provider ? (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <CreditMetric
              label="Saldo disponible"
              value={provider.balance !== null ? `$${provider.balance.toFixed(2)}` : 'No disponible'}
              sub="USD restantes"
              color={provider.balance !== null ? balanceColor : 'var(--text-primary)'}
            />
            <CreditMetric
              label="Consumo"
              value={provider.usage !== null ? `$${provider.usage.toFixed(2)}` : 'No disponible'}
              sub="USD usados"
            />
            <CreditMetric
              label="Límite"
              value={provider.limit !== null ? `$${provider.limit.toFixed(2)}` : 'No configurado'}
              sub="USD límite"
            />
            <CreditMetric
              label="Generaciones restantes"
              value={provider.estimated_generations_remaining !== null ? provider.estimated_generations_remaining.toLocaleString() : '—'}
              sub="estimado"
              color={provider.estimated_generations_remaining !== null && provider.estimated_generations_remaining < 50 ? '#ef4444' : undefined}
            />
          </div>
          {provider.usage_percent !== null && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Uso del presupuesto</span>
                <span className="text-xs font-mono font-bold" style={{ color: balanceColor }}>
                  {provider.usage_percent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(provider.usage_percent, 100)}%`, background: balanceColor }}
                />
              </div>
            </div>
          )}
          {provider.can_top_up && (
            <a
              href={provider.settings_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors hover:opacity-90"
              style={{ borderColor: '#FF5C3A', color: '#FF5C3A', background: 'rgba(255,92,58,0.06)' }}
            >
              <IconExternalLink className="h-3.5 w-3.5" />
              Recargar créditos
            </a>
          )}
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }} className="text-sm py-4 text-center">
          {fallbackProvider === 'openrouter' ? 'OpenRouter' : 'Replicate'} no está configurado.
        </p>
      )}
    </div>
  );
}
