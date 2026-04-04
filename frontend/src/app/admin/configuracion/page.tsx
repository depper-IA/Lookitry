'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import Link from 'next/link';

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
  price_cop?: number;
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

interface SystemStats {
  ram: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  uptime: number;
  platform: string;
}

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
interface PaymentSettings {
  bypass_ip_protection: boolean;
  ip_whitelist: string;
  landing_price: number;
  landing_original_price: number;
  currency: string;
  ai_prompt_master: string;
  ai_prompt_negative: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  manual_whatsapp?: string;
  manual_email?: string;
}

interface ContactMeta {
  social_instagram: string;
  social_tiktok: string;
  social_facebook: string;
  social_youtube: string;
  replicate_api_token?: string;
  replicate_monthly_budget_usd?: number;
}

type SysTab = 'trial' | 'contact' | 'launch';

interface LaunchSettings {
  googleSiteVerification: string;
  uptimerobotStatusUrl: string;
  gaMeasurementId: string;
  referralBonusMonths: number;
  launchDiscountCode: string;
  launchDiscountPercent: number;
  launchEndDate: string;
  betaToPaidDiscount: number;
  sendLaunchEmail: boolean;
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
function IconRocket({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
  const searchParams = useSearchParams();
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
  const [trialPaymentRequired, setTrialPaymentRequired] = useState(true);
  const [savingTrialPayment, setSavingTrialPayment] = useState(false);

  // Bypass IP
  const [bypassIp, setBypassIp] = useState(false);
  const [savingBypass, setSavingBypass] = useState(false);

  // Whitelist de IPs
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [savingWhitelist, setSavingWhitelist] = useState(false);

  // Health
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(true);

  // Precio mini-landing
  const [landingPrice, setLandingPrice] = useState<number>(650000);
  const [landingOriginalPrice, setLandingOriginalPrice] = useState<number>(900000);
  const [savingPricingConfig, setSavingPricingConfig] = useState(false);

  // Meta pricing_config (id='meta') — guardamos el objeto completo para no pisar campos al actualizar
  const [pricingMeta, setPricingMeta] = useState<Record<string, any>>({});

  // Contacto y redes
  const [manualWhatsapp, setManualWhatsapp] = useState<string>('+57 310 543 6281');
  const [manualEmail, setManualEmail] = useState<string>('info@lookitry.com');
  const [contactMeta, setContactMeta] = useState<ContactMeta>({
    social_instagram: '@looki.try',
    social_tiktok: '@lookitry',
    social_facebook: '',
    social_youtube: '',
  });
  const [savingContactConfig, setSavingContactConfig] = useState(false);

  // TRM (USD/COP) — pricing_config.meta
  const [trmAuto, setTrmAuto] = useState<boolean>(true);
  const [trmReferencia, setTrmReferencia] = useState<number>(4000);
  const [savingTrm, setSavingTrm] = useState(false);
  const [replicateApiToken, setReplicateApiToken] = useState('');
  const [replicateMonthlyBudgetUsd, setReplicateMonthlyBudgetUsd] = useState('');
  const [savingReplicateConfig, setSavingReplicateConfig] = useState(false);

  // Moneda del sistema
  const [currency, setCurrency] = useState<string>('COP');
  const [savingCurrency, setSavingCurrency] = useState(false);

  // Motor de IA
  const [aiPromptMaster, setAiPromptMaster] = useState<string>('');
  const [aiPromptNegative, setAiPromptNegative] = useState<string>('');
  const [savingAIConfig, setSavingAIConfig] = useState(false);

  // Mantenimiento
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  // Créditos OpenRouter
  const [openRouterCredits, setOpenRouterCredits] = useState<ProviderCredits | null>(null);
  const [replicateCredits, setReplicateCredits] = useState<ProviderCredits | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  // Launch y Analytics
  const [launchSettings, setLaunchSettings] = useState<LaunchSettings>({
    googleSiteVerification: 'F-LW3EGCNrjEhNaAT56Qrioyo4-UD2CRWYyqgS-sExE',
    uptimerobotStatusUrl: 'https://stats.uptimerobot.com/CTEnSD7d1j',
    gaMeasurementId: 'G-F8277E4Z39',
    referralBonusMonths: 1,
    launchDiscountCode: 'LAUNCH20',
    launchDiscountPercent: 20,
    launchEndDate: '2026-04-30',
    betaToPaidDiscount: 20,
    sendLaunchEmail: false,
  });
  const [savingLaunch, setSavingLaunch] = useState(false);

  // Alertas globales
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<SysTab>('trial');
  const credits = openRouterCredits;
  const confirm = useConfirm();

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
      if (ref) setTrialPaymentRequired(ref.require_card_verification !== false && Number(ref.price_cop ?? 0) > 0);
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

  const loadSystemStats = useCallback(async () => {
    setLoadingSystem(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/system/stats`, { credentials: 'include', headers });
      if (res.ok) setSystemStats(await res.json());
    } catch { /* silencioso */ }
    finally { setLoadingSystem(false); }
  }, []);

  const loadCredits = useCallback(async () => {
    setLoadingCredits(true);
    try {
      const [openrouterRes, replicateRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/openrouter-credits`, { credentials: 'include', headers }),
        fetch(`${API_URL}/api/admin/replicate-credits`, { credentials: 'include', headers }),
      ]);

      if (openrouterRes.ok) setOpenRouterCredits(await openrouterRes.json());
      else setOpenRouterCredits(null);

      if (replicateRes.ok) setReplicateCredits(await replicateRes.json());
      else setReplicateCredits(null);
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
        if (data.landing_price !== undefined && data.landing_price !== null) setLandingPrice(data.landing_price);
        if (data.landing_original_price !== undefined && data.landing_original_price !== null) setLandingOriginalPrice(data.landing_original_price);
        if (data.currency !== undefined && data.currency !== null) setCurrency(data.currency);
        if (data.ai_prompt_master !== undefined && data.ai_prompt_master !== null) setAiPromptMaster(data.ai_prompt_master);
        if (data.ai_prompt_negative !== undefined && data.ai_prompt_negative !== null) setAiPromptNegative(data.ai_prompt_negative);
        setMaintenanceMode(data.maintenance_mode ?? false);
        setMaintenanceMessage(data.maintenance_message ?? 'Estamos realizando mejoras en nuestra plataforma. Volveremos pronto.');
        setManualWhatsapp(data.manual_whatsapp ?? '+57 310 543 6281');
        setManualEmail(data.manual_email ?? 'info@lookitry.com');
      }
    } catch { /* silencioso */ }
  }, []);

  const loadPricingMeta = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/pricing`, { credentials: 'include', headers });
      if (!res.ok) return;

      const data = await res.json();
      const metaRow = Array.isArray(data?.data)
        ? data.data.find((row: any) => row.id === 'meta')
        : null;

      if (!metaRow?.data) return;

      setPricingMeta(metaRow.data || {});

      setContactMeta({
        social_instagram: metaRow.data.social_instagram ?? '@looki.try',
        social_tiktok: metaRow.data.social_tiktok ?? '@lookitry',
        social_facebook: metaRow.data.social_facebook ?? '',
        social_youtube: metaRow.data.social_youtube ?? '',
      });
      setReplicateApiToken(metaRow.data.replicate_api_token ?? '');
      setReplicateMonthlyBudgetUsd(
        metaRow.data.replicate_monthly_budget_usd !== undefined && metaRow.data.replicate_monthly_budget_usd !== null
          ? String(metaRow.data.replicate_monthly_budget_usd)
          : ''
      );

      // TRM config
      setTrmAuto(metaRow.data.trm_auto !== false); // default true
      const rawTrm = metaRow.data.trm_referencia;
      const parsedTrm = typeof rawTrm === 'number' ? rawTrm : Number(rawTrm);
      if (parsedTrm && parsedTrm > 0) setTrmReferencia(parsedTrm);
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
    loadHealth();
    loadSystemStats();
    loadPaymentSettings();
    loadPricingMeta();
    loadCredits();
    
    // Cargar configuración de launch desde localStorage
    const saved = localStorage.getItem('launchSettings');
    if (saved) {
      try {
        setLaunchSettings(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'trial' || tab === 'contact' || tab === 'launch') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Función flash para mensajes
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
        body: JSON.stringify({ name: formName, trial_days: formDays, trial_generations_limit: formGenerations, ends_at: formEndsAt || null, active: true, require_card_verification: trialPaymentRequired }),
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

  async function handleToggleTrialPayment() {
    const newVal = !trialPaymentRequired;
    const ok = await confirm({
      title: newVal ? 'Activar pago por trial' : 'Desactivar pago por trial',
      message: newVal
        ? 'Los nuevos usuarios deberán pagar el trial para activar la prueba.'
        : 'La campaña activa permitirá trials sin pago.',
      confirmLabel: newVal ? 'Activar' : 'Desactivar',
      danger: false,
      reason: 'Este cambio afecta directamente la conversión de nuevos registros.',
    });
    if (!ok) return;
    setSavingTrialPayment(true);
    try {
      const targets = campaigns.filter(c => c.active);
      if (targets.length > 0) {
        await Promise.all(targets.map(c =>
          fetch(`${API_URL}/api/admin/trial-campaign/${c.id}`, { method: 'PATCH', credentials: 'include', headers, body: JSON.stringify({ require_card_verification: newVal }) })
        ));
      }
      setTrialPaymentRequired(newVal);
      flash(newVal ? 'Pago por prueba activado' : 'Trial gratis activado', 'ok');
      await loadCampaigns();
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingTrialPayment(false); }
  }

  // ── Guardado Global / Específico ───────────────────────────────────────────

  async function handleGlobalSave() {
    setSavingAIConfig(true);
    setSavingPricingConfig(true);
    setSavingCurrency(true);
    setSavingWhitelist(true);
    setSavingMaintenance(true);
    setSavingContactConfig(true);
    setSavingTrm(true);
    try {
      const nextMeta = {
        ...pricingMeta,
        social_instagram: contactMeta.social_instagram,
        social_tiktok: contactMeta.social_tiktok,
        social_facebook: contactMeta.social_facebook,
        social_youtube: contactMeta.social_youtube,
        trm_auto: trmAuto,
        trm_referencia: trmReferencia,
        replicate_monthly_budget_usd: replicateMonthlyBudgetUsd.trim() ? Number(replicateMonthlyBudgetUsd) : null,
      };

      const [settingsRes, pricingRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/payment-settings`, {
          method: 'PUT',
          credentials: 'include',
          headers,
          body: JSON.stringify({
            bypass_ip_protection: bypassIp,
            ip_whitelist: ipWhitelist,
            landing_price: landingPrice,
            landing_original_price: landingOriginalPrice,
            currency,
            ai_prompt_master: aiPromptMaster,
            ai_prompt_negative: aiPromptNegative,
            maintenance_mode: maintenanceMode,
            maintenance_message: maintenanceMessage,
            manual_whatsapp: manualWhatsapp,
            manual_email: manualEmail,
          }),
        }),
        fetch(`${API_URL}/api/admin/pricing`, {
          method: 'PUT',
          credentials: 'include',
          headers,
          body: JSON.stringify({
            id: 'meta',
            data: nextMeta,
          }),
        }),
      ]);
      if (!settingsRes.ok) throw new Error((await settingsRes.json()).message || 'Error');
      if (!pricingRes.ok) throw new Error((await pricingRes.json()).error || 'Error al guardar redes');
      setPricingMeta(nextMeta);
      flash('Configuración global guardada correctamente', 'ok');
    } catch (err: any) { flash(err.message || 'Error al guardar', 'err'); }
    finally {
      setSavingAIConfig(false);
      setSavingPricingConfig(false);
      setSavingCurrency(false);
      setSavingWhitelist(false);
      setSavingMaintenance(false);
      setSavingContactConfig(false);
      setSavingTrm(false);
    }
  }

  async function handleToggleBypass() {
    const newVal = !bypassIp;
    const ok = await confirm({
      title: newVal ? 'Activar bypass IP' : 'Desactivar bypass IP',
      message: newVal
        ? 'Se omitirá la verificación de IP para TODOS los registros de prueba. Esto es un riesgo de seguridad.'
        : 'Se restaurará la verificación de IP en producción.',
      confirmLabel: newVal ? 'Activar bypass' : 'Desactivar bypass',
      danger: newVal,
      reason: newVal
        ? 'Cualquier IP podrá registrar cuentas de prueba sin verificación. Solo usar en desarrollo o testing controlado.'
        : 'Se restaura la protección de IP para todos los registros.',
    });
    if (!ok) return;
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

  async function handleSavePricingConfig() {
    setSavingPricingConfig(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/pricing`, {
        method: 'PUT', credentials: 'include', headers,
        body: JSON.stringify({
          landing_price: landingPrice,
          landing_original_price: landingOriginalPrice,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Error');
      flash('Configuración de landing guardada', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingPricingConfig(false); }
  }

  async function handleSaveContactConfig() {
    setSavingContactConfig(true);
    setSavingReplicateConfig(true);
    try {
      const nextMeta = {
        ...pricingMeta,
        social_instagram: contactMeta.social_instagram,
        social_tiktok: contactMeta.social_tiktok,
        social_facebook: contactMeta.social_facebook,
        social_youtube: contactMeta.social_youtube,
        trm_auto: trmAuto,
        trm_referencia: trmReferencia,
        replicate_api_token: replicateApiToken.trim(),
        replicate_monthly_budget_usd: replicateMonthlyBudgetUsd.trim() ? Number(replicateMonthlyBudgetUsd) : null,
      };

      const [settingsRes, pricingRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/payment-settings`, {
          method: 'PUT',
          credentials: 'include',
          headers,
          body: JSON.stringify({
            manual_whatsapp: manualWhatsapp,
            manual_email: manualEmail,
          }),
        }),
        fetch(`${API_URL}/api/admin/pricing`, {
          method: 'PUT',
          credentials: 'include',
          headers,
          body: JSON.stringify({
            id: 'meta',
            data: nextMeta,
          }),
        }),
      ]);
      if (!settingsRes.ok) throw new Error((await settingsRes.json()).message || 'Error');
      if (!pricingRes.ok) throw new Error((await pricingRes.json()).error || 'Error al guardar redes');
      setPricingMeta(nextMeta);
      flash('Contacto y redes guardados', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally {
      setSavingContactConfig(false);
      setSavingReplicateConfig(false);
    }
  }

  async function handleSaveReplicateConfig() {
    setSavingReplicateConfig(true);
    try {
      const nextMeta = {
        ...pricingMeta,
        social_instagram: contactMeta.social_instagram,
        social_tiktok: contactMeta.social_tiktok,
        social_facebook: contactMeta.social_facebook,
        social_youtube: contactMeta.social_youtube,
        trm_auto: trmAuto,
        trm_referencia: trmReferencia,
        replicate_api_token: replicateApiToken.trim(),
        replicate_monthly_budget_usd: replicateMonthlyBudgetUsd.trim() ? Number(replicateMonthlyBudgetUsd) : null,
      };

      const res = await fetch(`${API_URL}/api/admin/pricing`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({ id: 'meta', data: nextMeta }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || json.error || 'Error al guardar la API key de Replicate');
      setPricingMeta(nextMeta);
      flash('API key de Replicate guardada', 'ok');
      await loadCredits();
    } catch (err: any) {
      flash(err.message || 'Error al guardar la API key de Replicate', 'err');
    } finally {
      setSavingReplicateConfig(false);
    }
  }

  async function handleSaveTrm() {
    setSavingTrm(true);
    try {
      if (!trmAuto && !(trmReferencia > 0)) {
        throw new Error('TRM de referencia inválida');
      }

      const nextMeta = {
        ...pricingMeta,
        social_instagram: contactMeta.social_instagram,
        social_tiktok: contactMeta.social_tiktok,
        social_facebook: contactMeta.social_facebook,
        social_youtube: contactMeta.social_youtube,
        trm_auto: trmAuto,
        trm_referencia: trmReferencia,
      };

      const res = await fetch(`${API_URL}/api/admin/pricing`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({ id: 'meta', data: nextMeta }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || json.error || 'Error al guardar TRM');
      setPricingMeta(nextMeta);
      flash('TRM guardada correctamente', 'ok');
    } catch (err: any) {
      flash(err.message || 'Error al guardar TRM', 'err');
    } finally {
      setSavingTrm(false);
    }
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

  const TABS: ReadonlyArray<{ id: SysTab; label: string; icon: React.ReactNode }> = [
    { id: 'trial',   label: 'Trial',        icon: <IconClock className="w-4 h-4" /> },
    { id: 'contact', label: 'Contacto y redes', icon: <IconExternalLink className="w-4 h-4" /> },
    { id: 'launch',  label: '🚀 Launch',    icon: <IconRocket className="w-4 h-4" /> },
  ];

  const isSaving = savingAIConfig || savingPricingConfig || savingCurrency || savingWhitelist || savingContactConfig || savingTrm;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">Configuración del sistema</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Campañas, debugging, contacto oficial y estado de servicios.</p>
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

      {/* ── TAB: Contacto y redes ── */}
      {activeTab === 'contact' && (
      <Section title="Contacto oficial y redes" icon={<IconExternalLink className="w-4 h-4" />}>
        <div className="space-y-6">
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            Ajusta aquí el WhatsApp, correo y perfiles sociales que deben aparecer en botones, banners, footers y modales de todo el proyecto.
          </p>

          <div
            style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}
            className="rounded-2xl border p-4 space-y-4"
          >
            <div>
              <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">Precio de mini-landing</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">
                Controla el valor de compra unica mostrado en el sitio y en los flujos comerciales.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Precio actual</label>
                <input
                  type="number"
                  min={0}
                  value={landingPrice}
                  onChange={e => setLandingPrice(Number(e.target.value || 0))}
                  placeholder="650000"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
                />
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Precio comparativo</label>
                <input
                  type="number"
                  min={0}
                  value={landingOriginalPrice}
                  onChange={e => setLandingOriginalPrice(Number(e.target.value || 0))}
                  placeholder="900000"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSavePricingConfig}
                disabled={savingPricingConfig}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60 transition-colors"
              >
                {savingPricingConfig
                  ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />
                  : <IconCheck className="w-4 h-4" />}
                Guardar precio
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">WhatsApp principal</label>
              <input
                type="text"
                value={manualWhatsapp}
                onChange={e => setManualWhatsapp(e.target.value)}
                placeholder="+57 310 543 6281"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Email principal</label>
              <input
                type="email"
                value={manualEmail}
                onChange={e => setManualEmail(e.target.value)}
                placeholder="info@lookitry.com"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Instagram</label>
              <input
                type="text"
                value={contactMeta.social_instagram}
                onChange={e => setContactMeta(prev => ({ ...prev, social_instagram: e.target.value }))}
                placeholder="@looki.try"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">TikTok</label>
              <input
                type="text"
                value={contactMeta.social_tiktok}
                onChange={e => setContactMeta(prev => ({ ...prev, social_tiktok: e.target.value }))}
                placeholder="@lookitry"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Facebook</label>
              <input
                type="text"
                value={contactMeta.social_facebook}
                onChange={e => setContactMeta(prev => ({ ...prev, social_facebook: e.target.value }))}
                placeholder="lookitry"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
              />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">YouTube</label>
              <input
                type="text"
                value={contactMeta.social_youtube}
                onChange={e => setContactMeta(prev => ({ ...prev, social_youtube: e.target.value }))}
                placeholder="@lookitry"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveContactConfig}
              disabled={savingContactConfig}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60 transition-colors"
            >
              {savingContactConfig
                ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />
                : <IconCheck className="w-4 h-4" />}
              Guardar Cambios
            </button>
          </div>
        </div>
      </Section>
      )} {/* fin tab contact */}

      {/* ── TAB: Launch ── */}
      {activeTab === 'launch' && (
      <Section title="🚀 Configuración de Launch" icon={<IconRocket className="w-4 h-4" />}>
        <div className="space-y-6">
          
          {/* SEO y Analytics */}
          <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
            <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold mb-4">SEO y Analytics</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Google Site Verification</label>
                <input
                  type="text"
                  value={launchSettings.googleSiteVerification}
                  onChange={e => setLaunchSettings(prev => ({ ...prev, googleSiteVerification: e.target.value }))}
                  placeholder="Código de verificación Google"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm font-mono"
                />
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">GA4 Measurement ID</label>
                <input
                  type="text"
                  value={launchSettings.gaMeasurementId}
                  onChange={e => setLaunchSettings(prev => ({ ...prev, gaMeasurementId: e.target.value }))}
                  placeholder="G-XXXXXXXXXX"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">UptimeRobot Status URL</label>
                <input
                  type="url"
                  value={launchSettings.uptimerobotStatusUrl}
                  onChange={e => setLaunchSettings(prev => ({ ...prev, uptimerobotStatusUrl: e.target.value }))}
                  placeholder="https://stats.uptimerobot.com/..."
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Programa de Referidos */}
          <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
            <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold mb-4">Programa de Referidos</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Meses de bonus por referido</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={launchSettings.referralBonusMonths}
                  onChange={e => setLaunchSettings(prev => ({ ...prev, referralBonusMonths: Number(e.target.value) }))}
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
                />
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">Meses gratis para ambos (referente y referido)</p>
              </div>
            </div>
          </div>

          {/* Lanzamiento */}
          <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
            <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold mb-4">Campaña de Lanzamiento</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Código de descuento</label>
                <input
                  type="text"
                  value={launchSettings.launchDiscountCode}
                  onChange={e => setLaunchSettings(prev => ({ ...prev, launchDiscountCode: e.target.value.toUpperCase() }))}
                  placeholder="LAUNCH20"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm font-mono"
                />
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">% Descuento</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={launchSettings.launchDiscountPercent}
                  onChange={e => setLaunchSettings(prev => ({ ...prev, launchDiscountPercent: Number(e.target.value) }))}
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
                />
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Fecha fin</label>
                <input
                  type="date"
                  value={launchSettings.launchEndDate}
                  onChange={e => setLaunchSettings(prev => ({ ...prev, launchEndDate: e.target.value }))}
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
                />
              </div>
            </div>
          </div>

          {/* Beta to Paid */}
          <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
            <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold mb-4">Conversión Beta → Paid</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Descuento para marcas beta (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={launchSettings.betaToPaidDiscount}
                  onChange={e => setLaunchSettings(prev => ({ ...prev, betaToPaidDiscount: Number(e.target.value) }))}
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm"
                />
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">Descuento especial para las 120+ marcas beta</p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={async () => {
                setSavingLaunch(true);
                try {
                  // Guardar en backend
                  await fetch(`${API_URL}/api/admin/payment-settings`, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ga_measurement_id: launchSettings.gaMeasurementId,
                      google_site_verification: launchSettings.googleSiteVerification,
                    }),
                  });
                  
                  // Guardar en localStorage para referencias rápidas
                  localStorage.setItem('launchSettings', JSON.stringify(launchSettings));
                  
                  flash('Configuración guardada correctamente', 'ok');
                } catch {
                  flash('Error al guardar', 'err');
                } finally {
                  setSavingLaunch(false);
                }
              }}
              disabled={savingLaunch}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60 transition-colors"
            >
              {savingLaunch
                ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />
                : <IconCheck className="w-4 h-4" />}
              Guardar Configuración
            </button>
            <a
              href={launchSettings.uptimerobotStatusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-[var(--bg-hover)] transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <IconExternalLink className="w-4 h-4" />
              Ver Status Page
            </a>
          </div>

        </div>
      </Section>
      )} {/* fin tab launch */}

      </div>
    </div>
  );
}

function CreditMetric({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
      <p style={{ color: 'var(--text-muted)' }} className="mb-1 text-xs font-medium">{label}</p>
      <p className="text-xl font-bold font-mono" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
      <p style={{ color: 'var(--text-muted)' }} className="mt-0.5 text-xs">{sub}</p>
    </div>
  );
}

function CreditProviderCard({
  provider,
  loading,
  onRefresh,
  fallbackProvider,
}: {
  provider: ProviderCredits | null;
  loading: boolean;
  onRefresh: () => void;
  fallbackProvider: 'openrouter' | 'replicate';
}) {
  const providerKey = provider?.provider || fallbackProvider;
  const providerName = providerKey === 'replicate' ? 'Replicate' : 'OpenRouter';
  const providerAction = providerKey === 'replicate'
    ? 'Ir a billing de Replicate'
    : 'Ir a créditos de OpenRouter';
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
              sub="Presupuesto o cupo"
            />
            <CreditMetric
              label="Generaciones restantes"
              value={provider.estimated_generations_remaining !== null ? provider.estimated_generations_remaining.toLocaleString() : 'No disponible'}
              sub={`~$${provider.cost_per_generation}/gen`}
            />
          </div>

          {provider.usage_percent !== null && provider.limit !== null ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p style={{ color: 'var(--text-secondary)' }} className="text-xs font-medium">Consumo del proveedor</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs font-mono">{provider.usage_percent}%</p>
              </div>
              <div style={{ background: 'var(--bg-hover)' }} className="h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${provider.critical_balance_alert ? 'bg-red-500' : provider.low_balance_alert ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${provider.usage_percent}%` }}
                />
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }} className="rounded-xl border p-4 text-sm">
              Este proveedor no está entregando porcentaje de uso consumible desde la API. El panel mantiene la tarjeta operativa y muestra el estado de configuración.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
              <p style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold uppercase tracking-wide">Estado</p>
              <p style={{ color: 'var(--text-primary)' }} className="mt-2 text-sm font-semibold">
                {provider.status === 'ok' ? 'Cuenta validada' : provider.status === 'partial' ? 'Cuenta parcial' : 'No configurado'}
              </p>
              {provider.label && (
                <p style={{ color: 'var(--text-muted)' }} className="mt-1 text-xs">Referencia: {provider.label}</p>
              )}
            </div>
            <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="rounded-xl border p-4">
              <p style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold uppercase tracking-wide">Configuración y recarga</p>
              <p style={{ color: 'var(--text-primary)' }} className="mt-2 text-sm font-semibold">
                {provider.can_top_up ? 'Listo para recarga o ajuste de límites' : 'Sin acción de recarga disponible'}
              </p>
              <p style={{ color: 'var(--text-muted)' }} className="mt-1 text-xs">
                Usa el acceso rápido para revisar billing, API key o presupuesto mensual.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)' }} className="py-6 text-sm text-center">No se pudo obtener información de este proveedor.</p>
      )}
    </div>
  );
}