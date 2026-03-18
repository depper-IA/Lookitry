'use client';

import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  active: boolean;
  trial_days: number;
  trial_generations_limit: number;
  ends_at: string | null;
  require_card_verification: boolean;
  created_by: string;
  created_at: string;
}

type ServiceStatus = 'ok' | 'degraded' | 'down' | 'loading';
interface ServiceResult { status: ServiceStatus; latency: number; }
interface HealthData {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  services: { supabase: ServiceResult; n8n: ServiceResult; email: ServiceResult; };
}

interface OpenRouterCredits {
  label: string | null;
  usage: number;
  limit: number | null;
  balance: number | null;
  is_free_tier: boolean;
  usage_percent: number | null;
  estimated_generations_remaining: number | null;
  cost_per_generation: number;
  low_balance_alert: boolean;
  critical_balance_alert: boolean;
}

// ── Iconos ────────────────────────────────────────────────────────────────────

function IconClock({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function IconShield({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
function IconPlus({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}
function IconCheck({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}
function IconStop({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>;
}
function IconEdit({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function IconRefresh({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function IconServer({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;
}
function IconCreditCard({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function IconAlertTriangle({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}
function IconExternalLink({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
}
function IconGlobe({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>;
}
function IconWifi({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>;
}
// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 flex-shrink-0 ${value ? 'bg-[#FF5C3A]' : 'bg-gray-500'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ── Badge campaña ─────────────────────────────────────────────────────────────

function CampaignBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {active ? 'Activa' : 'Inactiva'}
    </span>
  );
}

// ── Health helpers ────────────────────────────────────────────────────────────

function HealthDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = { ok: 'bg-emerald-500', degraded: 'bg-amber-500', down: 'bg-red-500', loading: 'bg-gray-400 animate-pulse' };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`} />;
}

const SERVICE_LABELS: Record<string, { name: string; desc: string }> = {
  supabase: { name: 'Base de datos', desc: 'Supabase PostgreSQL' },
  n8n:      { name: 'Motor de IA',   desc: 'n8n Webhook' },
  email:    { name: 'Email',         desc: 'Servidor SMTP' },
};

function formatUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

// ── Sección wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border shadow-sm overflow-hidden">
      <div style={{ borderColor: 'var(--border-color)' }} className="flex items-center gap-3 px-6 py-4 border-b">
        <div style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h2 style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SystemConfigPage() {
  // Campañas
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDays, setFormDays] = useState(7);
  const [formGenerations, setFormGenerations] = useState(50);
  const [formEndsAt, setFormEndsAt] = useState('');

  // Verificación de tarjeta
  const [requireCard, setRequireCard] = useState(true);
  const [savingCard, setSavingCard] = useState(false);

  // Bypass IP
  const [bypassIp, setBypassIp] = useState(false);
  const [savingBypass, setSavingBypass] = useState(false);

  // Whitelist de IPs
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [savingWhitelist, setSavingWhitelist] = useState(false);

  // Health
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Créditos OpenRouter
  const [credits, setCredits] = useState<OpenRouterCredits | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  // Alertas globales
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/trial-campaign`, { headers });
      const data = await res.json();
      const list: Campaign[] = data.campaigns ?? [];
      setCampaigns(list);
      const active = data.activeCampaign ?? null;
      setActiveCampaign(active);
      const ref = active ?? list[0] ?? null;
      if (ref) setRequireCard(ref.require_card_verification);
    } catch { setError('Error al cargar campañas'); }
    finally { setLoadingCampaigns(false); }
  }, []);

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch(`${API_URL}/health`);
      setHealth(await res.json());
    } catch {
      setHealth({ status: 'down', timestamp: new Date().toISOString(), uptime: 0,
        services: { supabase: { status: 'down', latency: 0 }, n8n: { status: 'down', latency: 0 }, email: { status: 'down', latency: 0 } } });
    } finally { setLoadingHealth(false); }
  }, []);

  const loadCredits = useCallback(async () => {
    setLoadingCredits(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/openrouter-credits`, { headers });
      if (res.ok) setCredits(await res.json());
    } catch { /* silencioso */ }
    finally { setLoadingCredits(false); }
  }, []);

  const loadPaymentSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBypassIp(data.bypass_ip_protection ?? false);
        setIpWhitelist(data.ip_whitelist ?? '');
      }
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    loadCampaigns();
    loadHealth();
    loadPaymentSettings();
    loadCredits();
  }, []);

  function flash(msg: string, type: 'ok' | 'err') {
    if (type === 'ok') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  }

  // ── Acciones campañas ──────────────────────────────────────────────────────

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSavingCampaign(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/trial-campaign`, {
        method: 'POST', headers,
        body: JSON.stringify({ name: formName, trial_days: formDays, trial_generations_limit: formGenerations, ends_at: formEndsAt || null, active: true, require_card_verification: requireCard }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      flash('Campaña creada y activada', 'ok');
      setShowForm(false); setFormName(''); setFormDays(7); setFormGenerations(50); setFormEndsAt('');
      await loadCampaigns();
    } catch (err: any) { flash(err.message || 'Error al crear campaña', 'err'); }
    finally { setSavingCampaign(false); }
  }

  async function handleToggleCampaign(c: Campaign) {
    setSavingCampaign(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/trial-campaign/${c.id}`, { method: 'PATCH', headers, body: JSON.stringify({ active: !c.active }) });
      if (!res.ok) throw new Error((await res.json()).message);
      flash(c.active ? 'Campaña desactivada' : 'Campaña activada', 'ok');
      await loadCampaigns();
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingCampaign(false); }
  }

  // ── Verificación de tarjeta ────────────────────────────────────────────────

  async function handleToggleCard() {
    const newVal = !requireCard;
    setSavingCard(true);
    try {
      const targets = campaigns.filter(c => c.active);
      if (targets.length > 0) {
        await Promise.all(targets.map(c =>
          fetch(`${API_URL}/api/admin/trial-campaign/${c.id}`, { method: 'PATCH', headers, body: JSON.stringify({ require_card_verification: newVal }) })
        ));
      }
      setRequireCard(newVal);
      flash(newVal ? 'Verificación de tarjeta activada' : 'Verificación desactivada — modo test', 'ok');
      await loadCampaigns();
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingCard(false); }
  }

  // ── Bypass IP ──────────────────────────────────────────────────────────────

  async function handleToggleBypass() {
    const newVal = !bypassIp;
    setSavingBypass(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        method: 'PUT', headers, body: JSON.stringify({ bypass_ip_protection: newVal }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error');
      setBypassIp(newVal);
      flash(newVal ? 'Bypass IP activado — modo test' : 'Bypass IP desactivado', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingBypass(false); }
  }

  async function handleSaveWhitelist() {
    setSavingWhitelist(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        method: 'PUT', headers, body: JSON.stringify({ ip_whitelist: ipWhitelist }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error');
      flash('Whitelist de IPs guardada', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingWhitelist(false); }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-syne font-bold">Configuración del sistema</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Campañas, debugging, páginas inactivas y estado de servicios.</p>
        </div>
      </div>

      {/* Alertas */}
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm px-4 py-3 rounded-xl">{success}</div>}

      {/* ── SECCIÓN 1: Campañas de trial ── */}
      <Section title="Campañas de trial" icon={<IconClock className="w-4 h-4" />}>
        <div className="space-y-4">
          {/* Estado actual */}
          <div style={{ borderColor: activeCampaign ? '#10b981' : 'var(--border-color)', background: activeCampaign ? 'rgba(16,185,129,0.06)' : 'var(--bg-hover)' }} className="rounded-xl border-2 p-4">
            <div className="flex items-center gap-3">
              <div style={{ background: activeCampaign ? 'rgba(16,185,129,0.12)' : 'var(--bg-card)', color: activeCampaign ? '#10b981' : 'var(--text-muted)' }} className="w-8 h-8 rounded-lg flex items-center justify-center">
                <IconClock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-semibold uppercase tracking-wide">Estado actual</p>
                {activeCampaign ? (
                  <p className="text-sm text-emerald-500 mt-0.5">
                    <span className="font-semibold">{activeCampaign.name}</span>
                    {' — '}{activeCampaign.trial_days} días · {activeCampaign.trial_generations_limit} generaciones
                    {activeCampaign.ends_at && ` · Vence: ${formatDate(activeCampaign.ends_at)}`}
                  </p>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-0.5">Sin campaña activa — nuevos registros sin período de prueba</p>
                )}
              </div>
              <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF5C3A] text-white text-xs font-semibold hover:bg-[#e04e30] transition-colors">
                <IconPlus className="w-3.5 h-3.5" /> Nueva
              </button>
            </div>
          </div>

          {/* Formulario nueva campaña */}
          {showForm && (
            <form onSubmit={handleCreateCampaign} className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)' }}>
              <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">Nueva campaña</p>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nombre de la campaña" required
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">Días</label>
                  <input type="number" min={1} max={90} value={formDays} onChange={e => setFormDays(Number(e.target.value))}
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">Generaciones</label>
                  <input type="number" min={1} max={500} value={formGenerations} onChange={e => setFormGenerations(Number(e.target.value))}
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-medium mb-1">Vence (opcional)</label>
                  <input type="datetime-local" value={formEndsAt} onChange={e => setFormEndsAt(e.target.value)}
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingCampaign} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF5C3A] text-white text-xs font-semibold hover:bg-[#e04e30] disabled:opacity-60 transition-colors">
                  <IconCheck className="w-3.5 h-3.5" /> {savingCampaign ? 'Guardando...' : 'Crear y activar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} className="px-3 py-2 text-xs border rounded-xl hover:opacity-80 transition-opacity">Cancelar</button>
              </div>
            </form>
          )}

          {/* Tabla de campañas */}
          {loadingCampaigns ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-[#FF5C3A]" /></div>
          ) : campaigns.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }} className="text-sm text-center py-6">No hay campañas creadas</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="border-b">
                    {['Nombre', 'Estado', 'Días', 'Gen.', 'Vence', 'Acción'].map(h => (
                      <th key={h} style={{ color: 'var(--text-muted)' }} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ borderColor: 'var(--border-color)' }} className="divide-y">
                  {campaigns.map(c => (
                    <tr key={c.id} className="hover:opacity-90 transition-opacity">
                      <td style={{ color: 'var(--text-primary)' }} className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3"><CampaignBadge active={c.active} /></td>
                      <td style={{ color: 'var(--text-secondary)' }} className="px-4 py-3">{c.trial_days}d</td>
                      <td style={{ color: 'var(--text-secondary)' }} className="px-4 py-3">{c.trial_generations_limit}</td>
                      <td style={{ color: 'var(--text-muted)' }} className="px-4 py-3">{c.ends_at ? formatDate(c.ends_at) : '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleCampaign(c)} disabled={savingCampaign}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${c.active ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}>
                          {c.active ? <><IconStop className="w-3 h-3" />Desactivar</> : <><IconCheck className="w-3 h-3" />Activar</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>

      {/* ── SECCIÓN 2: Debugging / Toggles ── */}
      <Section title="Configuración de debugging" icon={<IconShield className="w-4 h-4" />}>
        <div className="space-y-4">

          {/* Verificación de tarjeta */}
          <div className="flex items-start justify-between gap-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex-1">
              <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">Verificación de tarjeta (trial)</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
                {requireCard
                  ? 'Activa — el usuario debe tokenizar una tarjeta con Wompi para activar el trial'
                  : 'Desactivada — modo test, el trial se activa sin requerir tarjeta'}
              </p>
            </div>
            <Toggle value={requireCard} onChange={handleToggleCard} disabled={savingCard} />
          </div>

          {/* Bypass IP */}
          <div className="flex items-start justify-between gap-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex-1">
              <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">Bypass verificación de IP</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
                {bypassIp
                  ? 'Activo — se omite la verificación de IP para todos los registros de prueba'
                  : 'Inactivo — verificación de IP habilitada en producción'}
              </p>
            </div>
            <Toggle value={bypassIp} onChange={handleToggleBypass} disabled={savingBypass} />
          </div>

          {/* Whitelist de IPs */}
          <div className="pt-1">
            <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold mb-1">Whitelist de IPs para pruebas</p>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs mb-3">
              IPs que siempre pueden registrar cuentas de prueba sin importar el bypass global. Separa con comas. Ej: <span className="font-mono">190.24.1.1, 181.55.2.3</span>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={ipWhitelist}
                onChange={e => setIpWhitelist(e.target.value)}
                placeholder="190.24.1.1, 181.55.2.3"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="flex-1 border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
              />
              <button
                onClick={handleSaveWhitelist}
                disabled={savingWhitelist}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60 transition-colors"
              >
                {savingWhitelist
                  ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />
                  : <IconCheck className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>

        </div>
      </Section>

      {/* ── SECCIÓN 3: Créditos OpenRouter ── */}
      <Section title="Créditos OpenRouter" icon={<IconCreditCard className="w-4 h-4" />}>
        <div className="space-y-4">
          {/* Alertas */}
          {credits?.critical_balance_alert && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <IconAlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500 font-semibold">Balance crítico — menos de $5 USD disponibles. Recarga ahora para evitar interrupciones.</p>
            </div>
          )}
          {!credits?.critical_balance_alert && credits?.low_balance_alert && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <IconAlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-500 font-semibold">Balance bajo — queda menos del 20% del límite. Considera recargar pronto.</p>
            </div>
          )}

          {loadingCredits ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-[#FF5C3A]" /></div>
          ) : credits ? (
            <>
              {/* Métricas principales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Balance disponible', value: credits.balance !== null ? `$${credits.balance.toFixed(2)}` : '—', sub: 'USD restantes', color: credits.critical_balance_alert ? 'text-red-500' : credits.low_balance_alert ? 'text-amber-500' : 'text-emerald-500' },
                  { label: 'Uso acumulado', value: `$${credits.usage.toFixed(2)}`, sub: 'USD gastados', color: 'var(--text-primary)' },
                  { label: 'Límite total', value: credits.limit !== null ? `$${credits.limit.toFixed(2)}` : 'Sin límite', sub: 'USD comprados', color: 'var(--text-primary)' },
                  { label: 'Generaciones restantes', value: credits.estimated_generations_remaining !== null ? credits.estimated_generations_remaining.toLocaleString() : '—', sub: `~$${credits.cost_per_generation}/gen`, color: 'var(--text-primary)' },
                ].map(m => (
                  <div key={m.label} style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs font-medium mb-1">{m.label}</p>
                    <p className={`text-xl font-bold font-mono ${typeof m.color === 'string' && m.color.startsWith('text-') ? m.color : ''}`} style={typeof m.color === 'string' && !m.color.startsWith('text-') ? { color: m.color } : {}}>{m.value}</p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* Barra de progreso */}
              {credits.usage_percent !== null && credits.limit !== null && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium">Uso del crédito comprado</p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs font-mono">{credits.usage_percent}%</p>
                  </div>
                  <div style={{ background: 'var(--bg-hover)' }} className="w-full h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${credits.critical_balance_alert ? 'bg-red-500' : credits.low_balance_alert ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${credits.usage_percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs">$0</p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs">${credits.limit.toFixed(0)}</p>
                  </div>
                </div>
              )}

              {/* Referencia de costos */}
              <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
                <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-semibold uppercase tracking-wide mb-3">Referencia de escalabilidad</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { escenario: '10 marcas × 50 gen/mes', costo: '$19.50/mes' },
                    { escenario: '50 marcas × 50 gen/mes', costo: '$97.50/mes' },
                    { escenario: '100 marcas × 50 gen/mes', costo: '$195/mes' },
                    { escenario: '100 marcas × 100 gen/mes', costo: '$390/mes' },
                    { escenario: '100 marcas × 200 gen/mes', costo: '$780/mes' },
                    { escenario: 'Buffer recomendado', costo: '$50–100 extra' },
                  ].map(r => (
                    <div key={r.escenario} className="flex justify-between gap-2">
                      <span style={{ color: 'var(--text-muted)' }}>{r.escenario}</span>
                      <span style={{ color: 'var(--text-primary)' }} className="font-mono font-semibold flex-shrink-0">{r.costo}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-3">
                <button
                  onClick={loadCredits}
                  disabled={loadingCredits}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-hover)' }}
                >
                  <IconRefresh className={`w-3.5 h-3.5 ${loadingCredits ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
                <a
                  href="https://openrouter.ai/credits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF5C3A] text-white text-xs font-semibold hover:bg-[#e04e30] transition-colors"
                >
                  <IconExternalLink className="w-3.5 h-3.5" />
                  Recargar en OpenRouter
                </a>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }} className="text-sm text-center py-6">No se pudo obtener información de créditos</p>
          )}
        </div>
      </Section>

      {/* ── SECCIÓN 4: Estado del sistema ── */}
      <Section title="Estado del sistema" icon={<IconServer className="w-4 h-4" />}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {health && (
              <div className="flex items-center gap-2">
                <HealthDot status={health.status} />
                <span style={{ color: 'var(--text-secondary)' }} className="text-sm">
                  {health.status === 'ok' ? 'Todos los servicios operativos' : health.status === 'degraded' ? 'Algunos servicios con problemas' : 'Sistema no disponible'}
                </span>
                <span style={{ color: 'var(--text-muted)' }} className="text-xs">· Uptime: {formatUptime(health.uptime)}</span>
              </div>
            )}
            <button onClick={loadHealth} disabled={loadingHealth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-hover)' }}>
              <IconRefresh className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
              Verificar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {health
              ? Object.entries(health.services).map(([key, svc]) => {
                  const info = SERVICE_LABELS[key] || { name: key, desc: '' };
                  return (
                    <div key={key} style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">{info.name}</p>
                          <p style={{ color: 'var(--text-muted)' }} className="text-xs">{info.desc}</p>
                        </div>
                        <HealthDot status={svc.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${svc.status === 'ok' ? 'text-emerald-500' : svc.status === 'degraded' ? 'text-amber-500' : 'text-red-500'}`}>
                          {svc.status === 'ok' ? 'Operativo' : svc.status === 'degraded' ? 'Degradado' : 'Caído'}
                        </span>
                        {svc.latency > 0 && <span style={{ color: 'var(--text-muted)' }} className="text-xs font-mono">{svc.latency}ms</span>}
                      </div>
                    </div>
                  );
                })
              : [1, 2, 3].map(i => (
                  <div key={i} style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4 animate-pulse">
                    <div style={{ background: 'var(--bg-card)' }} className="h-4 rounded w-1/2 mb-2" />
                    <div style={{ background: 'var(--bg-card)' }} className="h-3 rounded w-3/4" />
                  </div>
                ))
            }
          </div>
        </div>
      </Section>

    </div>
  );
}
