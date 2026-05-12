'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatCurrency } from '@/utils/currency';
import {
  CreditCard,
  Globe,
  Palette,
  RefreshCw,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanConfig {
  precio_mensual_cop: number;
  precio_original_cop?: number;
  descuento_porcentaje?: number;
  productos_max: number;
  generaciones_mensuales: number;
  subtitulo: string;
  boton_texto: string;
  features: string[];
  features_excluidas?: string[];
}

interface MiniLandingConfig {
  precio_unico_cop: number;
  precio_original_cop: number;
  descuento_porcentaje: number;
  subtitulo: string;
  boton_texto: string;
  features: string[];
}

interface MetaConfig {
  gastos_personales_cop: number;
  meta_ingreso_cop: number;
  trm_referencia: number;
  trm_auto: boolean;
  trial_days?: number;
  trial_generations_limit?: number;
  trial_products_max?: number;
  social_instagram?: string;
  social_tiktok?: string;
  social_youtube?: string;
  social_x?: string;
}

interface CostsConfig {
  costo_vps_cop: number;
  costo_dominio_cop_mensual: number;
  costo_openrouter_por_gen_cop: number;
  notas?: string;
}

interface DescuentosConfig {
  meses_1: number;
  meses_3: number;
  meses_6: number;
  meses_12: number;
}

type ConfigRow = { id: string; data: Record<string, unknown>; updated_at: string };
type TabId = 'plans' | 'landing' | 'config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

function clientesParaMeta(meta: number, precio: number) {
  return precio > 0 ? Math.ceil(meta / precio) : 0;
}

function precioEnUSD(cop: number, trm: number) {
  return trm > 0 ? (cop / trm).toFixed(2) : '—';
}

function margenEstimado(
  precio: number,
  generaciones: number,
  costoGen: number,
  costosFijos: number,
  clientes: number,
) {
  const costoIA = generaciones * costoGen;
  const fijoProrr = clientes > 0 ? costosFijos / clientes : 0;
  return precio - costoIA - fijoProrr;
}

function SectionShell({
  eyebrow,
  title,
  description,
  children,
  icon,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[2.5rem] border p-6 md:p-10 shadow-2xl transition-all"
      style={{ 
        background: 'var(--bg-card)', 
        borderColor: 'var(--border-color)',
        boxShadow: '0 24px 60px -12px rgba(0,0,0,0.25)' 
      }}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.28em] text-[var(--accent)]">
                {eyebrow}
              </span>
            </div>
          )}
          <h2
            className="font-jakarta text-2xl font-black tracking-tight md:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-3 max-w-3xl text-[15px] font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)] shadow-inner">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-10">{children}</div>
    </section>
  );
}

function InfoStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="group rounded-[1.5rem] border px-5 py-5 transition-all hover:scale-[1.02]"
      style={{
        background: accent ? 'linear-gradient(135deg, rgba(255,92,58,0.12) 0%, rgba(255,92,58,0.04) 100%)' : 'var(--bg-base)',
        borderColor: accent ? 'rgba(255,92,58,0.25)' : 'var(--border-color)',
      }}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div
        className="mt-2.5 text-xl font-black tracking-tight"
        style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)' }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className={`text-sm font-black tracking-tight ${accent ? 'text-[var(--accent)]' : ''}`} style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  prefix,
  suffix,
  hint,
  disabled,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  prefix?: string;
  suffix?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <motion.label
        className="block text-[10px] font-black uppercase tracking-[0.22em]"
        style={{ color: 'var(--text-muted)' }}
        whileHover={{ color: '#FF5C3A' }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.label>
      <motion.div
        className="flex items-center gap-2 rounded-[1.15rem] border px-4 py-3 transition-all focus-within:scale-[1.01] focus-within:border-[#FF5C3A] focus-within:shadow-[0_0_0_3px_rgba(255,92,58,0.15)]"
        style={{
          background: 'var(--bg-base)',
          borderColor: disabled ? 'rgba(255,255,255,0.04)' : 'var(--border-color)',
          opacity: disabled ? 0.65 : 1,
        }}
      >
        {prefix && <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{prefix}</span>}
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        {suffix && <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
      </motion.div>
      {hint && <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </motion.div>
  );
}

function FeaturesList({ features, onChange }: { features: string[]; onChange: (f: string[]) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
        Features
      </label>
      <textarea
        rows={6}
        value={features.join('\n')}
        onChange={e => onChange(e.target.value.split('\n'))}
        className="w-full rounded-[1.35rem] border px-4 py-4 text-sm font-medium leading-relaxed outline-none transition-all focus:ring-2 focus:ring-[var(--accent)]/25"
        style={{
          background: 'var(--bg-base)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      />
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Una feature por línea. Se mostrará en el panel y en la landing de precios.
      </p>
    </div>
  );
}

function SaveBtn({
  id,
  data,
  saving,
  saved,
  onSave,
}: {
  id: string;
  data: Record<string, unknown>;
  saving: string | null;
  saved: string | null;
  onSave: (id: string, data: Record<string, unknown>) => void;
}) {
  const isSaving = saving === id;
  const isSaved = saved === id;

  return (
    <motion.button
      onClick={() => onSave(id, data)}
      disabled={isSaving}
      whileHover={{ scale: isSaving ? 1 : 1.02 }}
      whileTap={{ scale: isSaving ? 1 : 0.98 }}
      className="relative overflow-hidden rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-lg"
      style={{
        background: isSaved ? '#10b981' : 'var(--accent)',
        boxShadow: isSaved ? '0 18px 40px rgba(16,185,129,0.18)' : '0 18px 40px rgba(255,92,58,0.22)',
        opacity: isSaving ? 0.72 : 1,
        cursor: isSaving ? 'not-allowed' : 'pointer',
      }}
    >
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.span
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            Guardando…
          </motion.span>
        ) : isSaved ? (
          <motion.span
            key="saved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Guardado
          </motion.span>
        ) : (
          <motion.span
            key="save"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Guardar cambios
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function TabButton({
  id,
  label,
  icon: Icon,
  activeTab,
  onClick,
}: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeTab: TabId;
  onClick: (id: TabId) => void;
}) {
  const active = activeTab === id;
  return (
    <button
      onClick={() => onClick(id)}
      className="group flex w-full items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-300 xl:p-5"
      style={{
        background: active 
          ? 'linear-gradient(90deg, rgba(255,92,58,0.15) 0%, rgba(255,92,58,0.02) 100%)' 
          : 'var(--bg-card)',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        borderColor: active ? 'rgba(255,92,58,0.3)' : 'var(--border-color)',
        boxShadow: active ? '0 10px 30px -10px rgba(255,92,58,0.15)' : 'none',
      }}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${active ? 'bg-[var(--accent)] text-white' : 'bg-base border-border text-muted-foreground group-hover:bg-accent'}`}
          style={{
            borderColor: active ? 'var(--accent)' : 'var(--border-color)',
            background: active ? 'var(--accent)' : 'var(--bg-base)',
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[13px] font-extrabold tracking-tight">{label}</span>
          <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{active ? 'Seleccionado' : 'Configurar'}</span>
        </div>
      </div>
      <div className={`h-2 w-2 rounded-full transition-all duration-500 ${active ? 'bg-[var(--accent)] scale-125 shadow-[0_0_10px_var(--accent)]' : 'bg-transparent scale-0'}`} />
    </button>
  );
}

function PlanSection({
  title,
  eyebrow,
  plan,
  trm,
  meta,
  costs,
  onChange,
}: {
  title: string;
  eyebrow: string;
  plan: PlanConfig;
  trm: number;
  meta: number;
  costs: CostsConfig;
  onChange: (p: PlanConfig) => void;
}) {
  const usd = precioEnUSD(plan.precio_mensual_cop, trm);
  const clientes = clientesParaMeta(meta, plan.precio_mensual_cop);
  const costosFijos = costs.costo_vps_cop + costs.costo_dominio_cop_mensual;
  const margen = margenEstimado(
    plan.precio_mensual_cop,
    plan.generaciones_mensuales,
    costs.costo_openrouter_por_gen_cop,
    costosFijos,
    clientes,
  );
  const autoDiscount = plan.precio_original_cop && plan.precio_original_cop > plan.precio_mensual_cop
    ? Math.round((1 - plan.precio_mensual_cop / plan.precio_original_cop) * 100)
    : 0;

  return (
    <SectionShell
      eyebrow={eyebrow}
      title={title}
      description="Ajusta precio, capacidad y narrativa comercial sin salir del panel administrativo."
      icon={<CreditCard className="h-6 w-6" />}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoStat label="Precio USD" value={`$${usd}`} accent />
        <InfoStat label="Descuento auto" value={`${autoDiscount}%`} />
        <InfoStat label="Clientes p/meta" value={`${clientes}`} />
        <InfoStat label="Margen cliente" value={formatCurrency(Math.round(margen))} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field
          label="Precio mensual (COP)"
          type="number"
          prefix="$"
          value={plan.precio_mensual_cop}
          onChange={v => onChange({ ...plan, precio_mensual_cop: Number(v), descuento_porcentaje: autoDiscount })}
        />
        <Field
          label="Precio original (COP)"
          type="number"
          prefix="$"
          value={plan.precio_original_cop ?? 0}
          onChange={v => onChange({ ...plan, precio_original_cop: Number(v), descuento_porcentaje: autoDiscount })}
        />
        <Field
          label="Descuento automático"
          type="number"
          suffix="%"
          value={autoDiscount}
          disabled
          onChange={() => {}}
          hint="Se calcula automáticamente según el precio original."
        />
        <Field
          label="Máximo de productos"
          type="number"
          value={plan.productos_max}
          onChange={v => onChange({ ...plan, productos_max: Number(v) })}
        />
        <Field
          label="Generaciones por mes"
          type="number"
          value={plan.generaciones_mensuales}
          onChange={v => onChange({ ...plan, generaciones_mensuales: Number(v) })}
        />
        <Field
          label="Subtítulo comercial"
          value={plan.subtitulo}
          onChange={v => onChange({ ...plan, subtitulo: v })}
        />
        <div className="md:col-span-2 xl:col-span-3">
          <Field
            label="Texto del botón"
            value={plan.boton_texto}
            onChange={v => onChange({ ...plan, boton_texto: v })}
          />
        </div>
      </div>

      <div className="mt-6">
        <FeaturesList features={plan.features} onChange={f => onChange({ ...plan, features: f })} />
      </div>
    </SectionShell>
  );
}

export default function PricingAdminPage() {
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [trm, setTrm] = useState(3700);
  const [trmLive, setTrmLive] = useState(3700);
  const [activeTab, setActiveTab] = useState<TabId>('plans');

  const [basic, setBasic] = useState<PlanConfig | null>(null);
  const [pro, setPro] = useState<PlanConfig | null>(null);
  const [enterprise, setEnterprise] = useState<PlanConfig | null>(null);
  const [trialPlan, setTrialPlan] = useState<PlanConfig | null>(null);
  const [miniLanding, setMiniLanding] = useState<MiniLandingConfig | null>(null);
  const [descuentos, setDescuentos] = useState<DescuentosConfig | null>(null);
  const [meta, setMeta] = useState<MetaConfig | null>(null);
  const [costs, setCosts] = useState<CostsConfig | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pricingRes, trmRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/pricing`, { credentials: 'include' }),
        fetch('/api/pricing/trm'),
      ]);

      if (!pricingRes.ok) throw new Error('Error al cargar precios');
      const json = await pricingRes.json();
      if (!json.ok) throw new Error(json.error ?? 'Error desconocido');

      setRows(json.data);

      let autoEnabled = true;
      for (const row of json.data as ConfigRow[]) {
        if (row.id === 'basic') setBasic(row.data as unknown as PlanConfig);
        if (row.id === 'pro') setPro(row.data as unknown as PlanConfig);
        if (row.id === 'enterprise') setEnterprise(row.data as unknown as PlanConfig);
        if (row.id === 'trial') setTrialPlan(row.data as unknown as PlanConfig);
        if (row.id === 'mini_landing') setMiniLanding(row.data as unknown as MiniLandingConfig);
        if (row.id === 'descuentos_duracion') setDescuentos(row.data as unknown as DescuentosConfig);
        if (row.id === 'meta') {
          const metaRow = row.data as unknown as MetaConfig;
          setMeta(metaRow);
          setTrm(metaRow.trm_referencia);
          autoEnabled = metaRow.trm_auto;
        }
        if (row.id === 'costs' || row.id === 'costos_operativos') {
          setCosts(row.data as unknown as CostsConfig);
        }
      }

      if (trmRes.ok) {
        const trmJson = await trmRes.json();
        if (trmJson.trm) {
          setTrmLive(trmJson.trm);
          if (autoEnabled) setTrm(trmJson.trm);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = useCallback(async (id: string, data: Record<string, unknown>) => {
    setSaving(id);
    try {
      const res = await fetch(`${API_URL}/api/admin/pricing`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, data }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error al guardar');
      setSaved(id);
      setTimeout(() => setSaved(null), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
            Cargando pricing
          </p>
        </div>
      </div>
    );
  }

  if (!basic || !pro) return null;

  const costsObj = costs || {
    costo_vps_cop: 37000,
    costo_dominio_cop_mensual: 5000,
    costo_openrouter_por_gen_cop: 25,
  };
  const metaCop = meta?.meta_ingreso_cop ?? 2000000;
  const lastUpdated = rows.length > 0 ? new Date(rows[0].updated_at).toLocaleString('es-CO') : 'Sin registro';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto max-w-screen-2xl px-4 pb-20 md:px-6"
    >
      {/* Header Minimalista con Estadísticas */}
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b pb-8" style={{ borderColor: 'var(--border-color)' }}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Pricing Dashboard</span>
          </div>
          <h1 className="font-jakarta text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Estructura Comercial
          </h1>
          <p className="max-w-xl text-sm font-medium leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Control maestro de precios, márgenes de utilidad y configuración técnica de planes.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <MiniStat label="TRM de Referencia" value={formatCurrency(Math.round(trmLive)).replace(' COP', '')} accent />
          <MiniStat label="Meta Mensual" value={formatCurrency(metaCop)} />
          <MiniStat label="Última Sincro" value={lastUpdated.split(',')[0]} />
          <div className="h-10 w-[1px] bg-border hidden md:block" />
          <button
            onClick={load}
            className="group inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)] transition-all hover:bg-[var(--accent)]/5 active:scale-95"
            style={{
              background: 'rgba(255,92,58,0.06)',
              border: '1px solid rgba(255,92,58,0.15)',
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
            Sincronizar
          </button>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-10 2xl:flex-row-reverse 2xl:items-start">
        {/* Navegación Vertical a la Derecha */}
        <div className="w-full shrink-0 space-y-6 2xl:w-80">
          <div className="sticky top-10 space-y-6">
            <div className="space-y-2 px-1">
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                Secciones Disponibles
              </h3>
              <div className="space-y-2.5">
                <TabButton id="plans" label="Suscripciones" icon={CreditCard} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton id="landing" label="Mini-landing" icon={Palette} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton id="config" label="Configuración & ROI" icon={Settings} activeTab={activeTab} onClick={setActiveTab} />
              </div>
            </div>

            {/* Hint Box */}
            <div className="rounded-3xl border p-6" style={{ background: 'rgba(255,92,58,0.03)', borderColor: 'rgba(255,92,58,0.1)' }}>
              <TrendingUp className="mb-3 h-5 w-5 text-[var(--accent)]" />
              <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Recuerda que los cambios en precios afectan directamente a la landing y el checkout público.
              </p>
            </div>
          </div>
        </div>

        {/* Área de Visualización y Edición a la Izquierda */}
        <div className="min-w-0 flex-grow">
          {error && (
            <div
              className="mb-8 flex items-center justify-between rounded-3xl border px-6 py-5 text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.18)',
                color: '#ef4444',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold">{error}</span>
              </div>
              <button className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 hover:opacity-100" onClick={() => setError('')}>
                Cerrar
              </button>
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === 'plans' && (
              <div className="space-y-12">
                {trialPlan && (
                  <div className="space-y-4">
                    <PlanSection title="Plan Trial" eyebrow="Onboarding Experience" plan={trialPlan} trm={trm} meta={metaCop} costs={costsObj} onChange={setTrialPlan} />
                    <div className="flex justify-end pr-4">
                      <SaveBtn id="trial" data={trialPlan as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-12 xl:grid-cols-2">
                  <div className="space-y-4">
                    <PlanSection title="Plan Básico" eyebrow="SaaS Entry Tier" plan={basic} trm={trm} meta={metaCop} costs={costsObj} onChange={setBasic} />
                    <div className="flex justify-end pr-4">
                      <SaveBtn id="basic" data={basic as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <PlanSection title="Plan Pro" eyebrow="Growth & Performance" plan={pro} trm={trm} meta={metaCop} costs={costsObj} onChange={setPro} />
                    <div className="flex justify-end pr-4">
                      <SaveBtn id="pro" data={pro as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                    </div>
                  </div>
                </div>

                {enterprise && (
                  <div className="space-y-4">
                    <PlanSection title="Plan Enterprise" eyebrow="Unlimited Potential" plan={enterprise} trm={trm} meta={metaCop} costs={costsObj} onChange={setEnterprise} />
                    <div className="flex justify-end pr-4">
                      <SaveBtn id="enterprise" data={enterprise as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'landing' && miniLanding && (
              <div className="space-y-4">
                <SectionShell
                  eyebrow="Upsell Channel"
                  title="Estrategia de Mini-landing"
                  description="Optimiza el precio único y los mensajes de conversión para la oferta complementaria de mini-sitios personalizados."
                  icon={<Palette className="h-6 w-6" />}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InfoStat label="Precio USD Ref." value={`$${precioEnUSD(miniLanding.precio_unico_cop, trm)}`} accent />
                    <InfoStat
                      label="Descuento Calculado"
                      value={`${miniLanding.precio_original_cop > miniLanding.precio_unico_cop
                        ? Math.round((1 - miniLanding.precio_unico_cop / miniLanding.precio_original_cop) * 100)
                        : 0}%`}
                    />
                    <InfoStat label="TRM Aplicada" value={formatCurrency(Math.round(trm)).replace(' COP', '')} />
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <Field
                      label="Precio Único (COP)"
                      type="number"
                      prefix="$"
                      value={miniLanding.precio_unico_cop}
                      onChange={v => {
                        const val = Number(v);
                        const desc = miniLanding.precio_original_cop > val
                          ? Math.round((1 - val / miniLanding.precio_original_cop) * 100)
                          : 0;
                        setMiniLanding({ ...miniLanding, precio_unico_cop: val, descuento_porcentaje: desc });
                      }}
                    />
                    <Field
                      label="Precio Original (COP)"
                      type="number"
                      prefix="$"
                      value={miniLanding.precio_original_cop}
                      onChange={v => {
                        const val = Number(v);
                        const desc = val > miniLanding.precio_unico_cop
                          ? Math.round((1 - miniLanding.precio_unico_cop / val) * 100)
                          : 0;
                        setMiniLanding({ ...miniLanding, precio_original_cop: val, descuento_porcentaje: desc });
                      }}
                    />
                    <Field label="Descuento Automático" type="number" suffix="%" value={miniLanding.descuento_porcentaje} disabled onChange={() => {}} />
                    <Field label="Subtítulo de Oferta" value={miniLanding.subtitulo} onChange={v => setMiniLanding({ ...miniLanding, subtitulo: v })} />
                    <div className="md:col-span-2">
                      <Field label="Texto del Botón" value={miniLanding.boton_texto} onChange={v => setMiniLanding({ ...miniLanding, boton_texto: v })} />
                    </div>
                  </div>

                  <div className="mt-8">
                    <FeaturesList features={miniLanding.features} onChange={f => setMiniLanding({ ...miniLanding, features: f })} />
                  </div>
                </SectionShell>

                <div className="flex justify-end pr-4">
                  <SaveBtn id="mini_landing" data={miniLanding as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-10">
                {meta && (
                  <div className="space-y-4">
                    <SectionShell
                      eyebrow="Onboarding Control"
                      title="Periodo de Prueba IA"
                      description="Gestión de durabilidad y privilegios para nuevos registros durante su fase de evaluación."
                      icon={<Settings className="h-6 w-6" />}
                    >
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="Duración del Trial" type="number" suffix="días corridos" value={meta.trial_days ?? 7} onChange={v => setMeta({ ...meta, trial_days: Number(v) })} />
                        <Field
                          label="Capacidad del Trial"
                          type="number"
                          value={meta.trial_products_max ?? 1}
                          disabled
                          onChange={() => {}}
                          hint="Se define globalmente en la configuración de la base de datos."
                        />
                      </div>
                    </SectionShell>
                    <div className="flex justify-end pr-4">
                      <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                    </div>
                  </div>
                )}

                {descuentos && (
                  <div className="space-y-4">
                    <SectionShell
                      eyebrow="Conversion Engine"
                      title="Escalera de Retención"
                      description="Configura los incentivos de precios por volumen de meses para fomentar planes semestrales y anuales."
                      icon={<CreditCard className="h-6 w-6" />}
                    >
                      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        <Field label="Mensual (Base)" type="number" suffix="%" value={descuentos.meses_1} onChange={v => setDescuentos({ ...descuentos, meses_1: Number(v) })} />
                        <Field label="Trimestral" type="number" suffix="%" value={descuentos.meses_3} onChange={v => setDescuentos({ ...descuentos, meses_3: Number(v) })} />
                        <Field label="Semestral" type="number" suffix="%" value={descuentos.meses_6} onChange={v => setDescuentos({ ...descuentos, meses_6: Number(v) })} />
                        <Field label="Anual" type="number" suffix="%" value={descuentos.meses_12} onChange={v => setDescuentos({ ...descuentos, meses_12: Number(v) })} />
                      </div>
                    </SectionShell>
                    <div className="flex justify-end pr-4">
                      <SaveBtn id="descuentos_duracion" data={descuentos as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                    </div>
                  </div>
                )}

                {meta && (
                  <div className="space-y-4">
                    <SectionShell
                      eyebrow="ROI Master"
                      title="Proyecciones y Salud Financiera"
                      description="Métricas de meta de facturación y gastos fijos para calcular la rentabilidad neta por cliente."
                      icon={<TrendingUp className="h-6 w-6" />}
                    >
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field
                          label="Meta de Ingreso Global"
                          type="number"
                          prefix="$"
                          value={meta.meta_ingreso_cop}
                          onChange={v => setMeta({ ...meta, meta_ingreso_cop: Number(v) })}
                          hint="Valor objetivo para alcanzar el equilibrio comercial."
                        />
                        <Field
                          label="Gastos de Operación"
                          type="number"
                          prefix="$"
                          value={meta.gastos_personales_cop}
                          onChange={v => setMeta({ ...meta, gastos_personales_cop: Number(v) })}
                          hint="Incluye VPS, servicios de terceros y mantenimiento."
                        />
                      </div>
                    </SectionShell>
                    <div className="flex justify-end pr-4">
                      <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                    </div>
                  </div>
                )}

                {meta && (
                  <div className="space-y-4">
                    <SectionShell
                      eyebrow="Branding Presence"
                      title="Conectividad Social"
                      description="URLs oficiales de Lookitry que se despliegan en correos, facturas y pie de página."
                      icon={<Globe className="h-6 w-6" />}
                    >
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="Instagram Oficial" value={meta.social_instagram ?? '#'} onChange={v => setMeta({ ...meta, social_instagram: v })} />
                        <Field label="TikTok Oficial" value={meta.social_tiktok ?? '#'} onChange={v => setMeta({ ...meta, social_tiktok: v })} />
                        <Field label="YouTube" value={meta.social_youtube ?? ''} onChange={v => setMeta({ ...meta, social_youtube: v })} />
                        <Field label="X (Twitter)" value={meta.social_x ?? ''} onChange={v => setMeta({ ...meta, social_x: v })} />
                      </div>
                    </SectionShell>
                    <div className="flex justify-end pr-4">
                      <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
