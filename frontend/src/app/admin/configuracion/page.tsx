'use client';

import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

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
  services: { supabase: ServiceResult; n8n: ServiceResult; email: ServiceResult; minio: ServiceResult; };
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

interface PaymentSettings {
  bypass_ip_protection: boolean;
  ip_whitelist: string;
  landing_price: number;
  landing_original_price: number;
  footer_brand_url: string;
  currency: string;
  ai_prompt_master: string;
  ai_prompt_negative: string;
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

function IconTag({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>;
}
function IconLink({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
}
function IconCoin({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v1m0 8v1m-3-5h6m-6 0a3 3 0 006 0" /></svg>;
}
function IconBrain({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

const DEFAULT_BASE_PROMPT = `You are a professional virtual try-on AI specialized in fashion photography.
Your task: generate a single photorealistic image of the person in the selfie wearing the exact product shown in the reference image.

ABSOLUTE RULES — follow all of them without exception:
[CLOTHING REPLACEMENT — MANDATORY]
- Do NOT leave any clothing item from the original photo visible if the product replaces it.

[COMPOSITION & FRAMING]
- Maintain the exact same pose, body position, background, and spatial composition as the original photo.
- Fill every pixel of the frame with the scene — no empty space.

[OUTPUT DIMENSIONS]
- The output image MUST match the EXACT aspect ratio of the input selfie.
- NEVER add white borders, black bars, or any kind of margin.

[PRODUCT FIDELITY]
- Reproduce the garment EXACTLY as shown in the reference image: same colors, patterns, textures, logos, stitching, cuts, and fit.

[PERSON & REALISM]
- Keep the person's face, skin tone, hair, body proportions, and expression IDENTICAL to the selfie.
- Photorealistic quality only — no illustrations, no stylization.

Output: the final try-on image only. No text, no watermarks, no UI overlays.`;

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
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={active
        ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }
        : { backgroundColor: 'rgba(107,114,128,0.12)', color: '#6b7280' }}
    >
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
  minio:    { name: 'Archivos',      desc: 'MinIO Storage' },
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

  // Precio mini-landing y footer URL
  const [landingPrice, setLandingPrice] = useState<number>(650000);
  const [landingOriginalPrice, setLandingOriginalPrice] = useState<number>(900000);
  const [footerBrandUrl, setFooterBrandUrl] = useState<string>('https://lookitry.com');
  const [savingLandingConfig, setSavingLandingConfig] = useState(false);

  // Moneda del sistema
  const [currency, setCurrency] = useState<string>('COP');
  const [savingCurrency, setSavingCurrency] = useState(false);

  // Motor de IA
  const [aiPromptMaster, setAiPromptMaster] = useState<string>('');
  const [aiPromptNegative, setAiPromptNegative] = useState<string>('');
  const [savingAIConfig, setSavingAIConfig] = useState(false);

  // Créditos OpenRouter
  const [credits, setCredits] = useState<OpenRouterCredits | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  // Alertas globales
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = { 'Content-Type': 'application/json' };

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/trial-campaign`, { credentials: 'include', headers });
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
        services: { 
          supabase: { status: 'down', latency: 0 }, 
          n8n: { status: 'down', latency: 0 }, 
          email: { status: 'down', latency: 0 },
          minio: { status: 'down', latency: 0 }
        } 
      });
    } finally { setLoadingHealth(false); }
  }, []);

  const loadCredits = useCallback(async () => {
    setLoadingCredits(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/openrouter-credits`, { credentials: 'include', headers });
      if (res.ok) setCredits(await res.json());
    } catch { /* silencioso */ }
    finally { setLoadingCredits(false); }
  }, []);

  const loadPaymentSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, { credentials: 'include', headers });
      if (res.ok) {
        const data: PaymentSettings = await res.json();
        setBypassIp(data.bypass_ip_protection ?? false);
        setIpWhitelist(data.ip_whitelist ?? '');
        if (data.landing_price) setLandingPrice(data.landing_price);
        if (data.landing_original_price) setLandingOriginalPrice(data.landing_original_price);
        if (data.footer_brand_url) setFooterBrandUrl(data.footer_brand_url);
        if (data.currency) setCurrency(data.currency);
        if (data.ai_prompt_master) setAiPromptMaster(data.ai_prompt_master);
        if (data.ai_prompt_negative) setAiPromptNegative(data.ai_prompt_negative);
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
        method: 'POST', credentials: 'include', headers,
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
      const res = await fetch(`${API_URL}/api/admin/trial-campaign/${c.id}`, { method: 'PATCH', credentials: 'include', headers, body: JSON.stringify({ active: !c.active }) });
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
          fetch(`${API_URL}/api/admin/trial-campaign/${c.id}`, { method: 'PATCH', credentials: 'include', headers, body: JSON.stringify({ require_card_verification: newVal }) })
        ));
      }
      setRequireCard(newVal);
      flash(newVal ? 'Verificación de tarjeta activada' : 'Verificación desactivada — modo test', 'ok');
      await loadCampaigns();
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingCard(false); }
  }

  // ── Guardado Global / Específico ───────────────────────────────────────────

  async function handleGlobalSave() {
    setSavingAIConfig(true);
    setSavingLandingConfig(true);
    setSavingCurrency(true);
    setSavingWhitelist(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        method: 'PUT', credentials: 'include', headers,
        body: JSON.stringify({
          bypass_ip_protection: bypassIp,
          ip_whitelist: ipWhitelist,
          landing_price: landingPrice,
          landing_original_price: landingOriginalPrice,
          footer_brand_url: footerBrandUrl,
          currency: currency,
          ai_prompt_master: aiPromptMaster,
          ai_prompt_negative: aiPromptNegative,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error');
      flash('Configuración global guardada correctamente', 'ok');
    } catch (err: any) { flash(err.message || 'Error al guardar', 'err'); }
    finally {
      setSavingAIConfig(false);
      setSavingLandingConfig(false);
      setSavingCurrency(false);
      setSavingWhitelist(false);
    }
  }

  async function handleToggleBypass() {
    const newVal = !bypassIp;
    setSavingBypass(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        method: 'PUT', credentials: 'include', headers, body: JSON.stringify({ bypass_ip_protection: newVal }),
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
        method: 'PUT', credentials: 'include', headers, body: JSON.stringify({ ip_whitelist: ipWhitelist }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error');
      flash('Whitelist de IPs guardada', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingWhitelist(false); }
  }

  async function handleSaveLandingConfig() {
    setSavingLandingConfig(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        method: 'PUT', credentials: 'include', headers,
        body: JSON.stringify({
          landing_price: landingPrice,
          landing_original_price: landingOriginalPrice,
          footer_brand_url: footerBrandUrl,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error');
      flash('Configuración de landing guardada', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingLandingConfig(false); }
  }

  async function handleSaveCurrency() {
    setSavingCurrency(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        method: 'PUT', credentials: 'include', headers, body: JSON.stringify({ currency }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error');
      flash('Moneda del sistema guardada', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingCurrency(false); }
  }

  async function handleSaveAIConfig() {
    setSavingAIConfig(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        method: 'PUT', credentials: 'include', headers,
        body: JSON.stringify({
          ai_prompt_master: aiPromptMaster,
          ai_prompt_negative: aiPromptNegative,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error');
      flash('Configuración de IA guardada', 'ok');
    } catch (err: any) { flash(err.message || 'Error al guardar', 'err'); }
    finally { setSavingAIConfig(false); }
  }

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(DEFAULT_BASE_PROMPT);
      flash('Prompt base copiado al portapapeles', 'ok');
    } catch {
      flash('Error al copiar el prompt', 'err');
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  type SysTab = 'trial' | 'debug' | 'credits' | 'ai' | 'health';
  const [activeTab, setActiveTab] = useState<SysTab>('trial');

  const TABS: { id: SysTab; label: string; icon: React.ReactNode }[] = [
    { id: 'trial',   label: 'Trial',        icon: <IconClock className="w-4 h-4" /> },
    { id: 'debug',   label: 'Debugging',    icon: <IconShield className="w-4 h-4" /> },
    { id: 'credits', label: 'Créditos IA',  icon: <IconCreditCard className="w-4 h-4" /> },
    { id: 'ai',      label: 'Motor de IA',  icon: <IconBrain className="w-4 h-4" /> },
    { id: 'health',  label: 'Servicios',    icon: <IconServer className="w-4 h-4" /> },
  ];

  const isSaving = savingAIConfig || savingLandingConfig || savingCurrency || savingWhitelist;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">Configuración del sistema</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Campañas, debugging, landing y estado de servicios.</p>
        </div>
        <button
          onClick={handleGlobalSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60 transition-colors shadow-sm"
        >
          {isSaving
            ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />
            : <IconCheck className="w-4 h-4" />}
          Guardar cambios
        </button>
      </div>

      {/* Alertas */}
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm px-4 py-3 rounded-xl">{success}</div>}

      {/* Tabs */}
      <div style={{ borderColor: 'var(--border-color)' }} className="border-b flex gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors"
            style={activeTab === tab.id
              ? { borderColor: '#FF5C3A', color: '#FF5C3A' }
              : { borderColor: 'transparent', color: 'var(--text-muted)' }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido por tab */}
      <div className="pt-2">

      {/* ── TAB: Trial ── */}
      {activeTab === 'trial' && (
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
      )} {/* fin tab trial */}

      {/* ── TAB: Debugging ── */}
      {activeTab === 'debug' && (
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
      )} {/* fin tab debug */}

      {/* ── TAB: Landing ── */}
      {activeTab === 'landing' && (
      <Section title="URL Pública de la Empresa" icon={<IconLink className="w-4 h-4" />}>
        <div className="space-y-6">
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            Esta es la dirección pública de tu plataforma. Aparece en el footer de todas las mini-landings y es el enlace principal para tus clientes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center p-4 rounded-xl border border-dashed" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)' }}>
            <div className="flex-1">
              <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-1">URL de Marca (Footer)</label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={footerBrandUrl}
                  onChange={e => setFooterBrandUrl(e.target.value)}
                  placeholder="https://lookitry.com"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="flex-1 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm font-mono"
                />
              </div>
            </div>
            <a
              href={footerBrandUrl.startsWith('http') ? footerBrandUrl : `https://${footerBrandUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF5C3A] text-white text-sm font-bold hover:bg-[#e04e30] transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center"
            >
              <IconExternalLink className="w-4 h-4" />
              Visitar Empresa
            </a>
          </div>

          <div style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)' }} className="p-4 rounded-xl border text-center">
            <p style={{ color: 'var(--text-muted)' }} className="text-xs">
              Vista previa en mini-landings:{' '}
              <span style={{ color: 'var(--text-secondary)' }}>Probador virtual impulsado por </span>
              <span className="font-medium" style={{ color: '#FF5C3A' }}>
                {(footerBrandUrl || 'lookitry.com').replace(/^https?:\/\//, '')}
              </span>
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveLandingConfig}
              disabled={savingLandingConfig}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60 transition-colors"
            >
              {savingLandingConfig
                ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />
                : <IconCheck className="w-4 h-4" />}
              Guardar Cambios
            </button>
          </div>
        </div>
      </Section>
      )} {/* fin tab landing */}

      {/* ── TAB: Motor de IA ── */}
      {activeTab === 'ai' && (
      <div className="space-y-6">
        <Section title="Configuración del Motor de IA" icon={<IconBrain className="w-4 h-4" />}>
          <div className="space-y-6">
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">
              Define las instrucciones globales que regirán el comportamiento de la IA en todas las generaciones. 
              Estos prompts actúan como la &quot;personalidad&quot; y los &quot;límites&quot; del sistema.
            </p>

            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-2">Master Prompt (Instrucciones globales)</label>
              <textarea
                value={aiPromptMaster}
                onChange={e => setAiPromptMaster(e.target.value)}
                placeholder="Ej: Eres un experto en moda y marketing digital. Genera descripciones persuasivas..."
                rows={8}
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm resize-none"
              />
              <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-2">
                Este prompt se envía siempre al inicio de cada petición a la IA. Define el tono, estilo y conocimientos base.
              </p>
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-2">Prompt Negativo (Lo que se debe evitar)</label>
              <textarea
                value={aiPromptNegative}
                onChange={e => setAiPromptNegative(e.target.value)}
                placeholder="Ej: No uses lenguaje técnico aburrido. No menciones competidores..."
                rows={4}
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm resize-none"
              />
              <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-2">
                Instrucciones explícitas sobre qué NO debe hacer la IA bajo ninguna circunstancia.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveAIConfig}
                disabled={savingAIConfig}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60 transition-colors"
              >
                {savingAIConfig
                  ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />
                  : <IconCheck className="w-4 h-4" />}
                Guardar configuración de IA
              </button>
            </div>
          </div>
        </Section>

        <Section title="Prompt Base Predeterminado (Referencia)" icon={<IconShield className="w-4 h-4" />}>
          <div className="space-y-4">
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">
              Este es el prompt base inmutable que utiliza el backend para orquestar la generación. 
              Puedes copiarlo para usarlo como base en tu Master Prompt si deseas extenderlo.
            </p>
            <div className="relative group">
              <pre 
                style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                className="p-4 rounded-xl border text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[400px]"
              >
                {DEFAULT_BASE_PROMPT}
              </pre>
              <button
                onClick={handleCopyPrompt}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5C3A] text-white text-xs font-semibold hover:bg-[#e04e30] transition-colors shadow-lg opacity-0 group-hover:opacity-100"
              >
                <IconCopy className="w-3.5 h-3.5" />
                Copiar prompt
              </button>
            </div>
          </div>
        </Section>
      </div>
      )} {/* fin tab ai */}

      {/* ── TAB: Créditos IA ── */}
      {activeTab === 'credits' && (
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
      )} {/* fin tab credits */}

      {/* ── TAB: Servicios ── */}
      {activeTab === 'health' && (
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
      )} {/* fin tab health */}

      </div> {/* fin contenido por tab */}

    </div>
  );
}
