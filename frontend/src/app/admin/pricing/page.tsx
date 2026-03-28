'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatCurrency } from '@/utils/currency';
import {
  Calculator,
  CreditCard,
  Globe,
  Palette,
  RefreshCw,
  Settings,
  TrendingUp,
} from 'lucide-react';
import EnterpriseCalculator from '@/components/admin/EnterpriseCalculator';

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
type TabId = 'plans' | 'enterprise' | 'landing' | 'config';

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
      className="rounded-[2rem] border p-6 md:p-8 shadow-xl"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#FF5C3A]" />
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#FF5C3A]">
                {eyebrow}
              </span>
            </div>
          )}
          <h2
            className="font-jakarta text-xl font-extrabold tracking-tight md:text-2xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF5C3A]">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-7">{children}</div>
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
      className="rounded-[1.35rem] border px-4 py-4"
      style={{
        background: accent ? 'rgba(255,92,58,0.08)' : 'var(--bg-base)',
        borderColor: accent ? 'rgba(255,92,58,0.18)' : 'var(--border-color)',
      }}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div
        className="mt-2 text-lg font-black tracking-tight"
        style={{ color: accent ? '#FF5C3A' : 'var(--text-primary)' }}
      >
        {value}
      </div>
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
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div
        className="flex items-center gap-2 rounded-[1.15rem] border px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-[#FF5C3A]/25"
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
      </div>
      {hint && <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
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
        className="w-full rounded-[1.35rem] border px-4 py-4 text-sm font-medium leading-relaxed outline-none transition-all focus:ring-2 focus:ring-[#FF5C3A]/25"
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
    <button
      onClick={() => onSave(id, data)}
      disabled={isSaving}
      className="rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white transition-all shadow-lg"
      style={{
        background: isSaved ? '#10b981' : '#FF5C3A',
        boxShadow: isSaved ? '0 18px 40px rgba(16,185,129,0.18)' : '0 18px 40px rgba(255,92,58,0.22)',
        opacity: isSaving ? 0.72 : 1,
        cursor: isSaving ? 'not-allowed' : 'pointer',
      }}
    >
      {isSaving ? 'Guardando…' : isSaved ? 'Guardado' : 'Guardar cambios'}
    </button>
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
      className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all"
      style={{
        background: active ? 'rgba(255,92,58,0.12)' : 'var(--bg-card)',
        color: active ? '#FF5C3A' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'rgba(255,92,58,0.22)' : 'var(--border-color)'}`,
      }}
    >
      <Icon className="h-4 w-4" />
      {label}
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
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FF5C3A] border-t-transparent" />
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
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <SectionShell
        eyebrow="Pricing Control Center"
        title="Configura precios, márgenes y percepción del producto"
        description="Esta vista concentra la lógica comercial de Lookitry: planes, descuentos, TRM de referencia, métricas de rentabilidad y señales visibles en la landing."
        icon={<TrendingUp className="h-6 w-6" />}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoStat label="TRM activa" value={formatCurrency(Math.round(trmLive)).replace(' COP', '')} accent />
          <InfoStat label="Meta mensual" value={formatCurrency(metaCop)} />
          <InfoStat label="Última actualización" value={lastUpdated} />
          <InfoStat label="Acento oficial" value="#FF5C3A" />
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton id="plans" label="Suscripciones" icon={CreditCard} activeTab={activeTab} onClick={setActiveTab} />
            <TabButton id="enterprise" label="Enterprise" icon={Calculator} activeTab={activeTab} onClick={setActiveTab} />
            <TabButton id="landing" label="Mini-landing" icon={Palette} activeTab={activeTab} onClick={setActiveTab} />
            <TabButton id="config" label="Configuración & ROI" icon={Settings} activeTab={activeTab} onClick={setActiveTab} />
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#FF5C3A] transition-all"
            style={{
              background: 'rgba(255,92,58,0.08)',
              border: '1px solid rgba(255,92,58,0.18)',
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Recargar datos
          </button>
        </div>
      </SectionShell>

      {error && (
        <div
          className="flex items-center justify-between rounded-[1.5rem] border px-5 py-4 text-sm"
          style={{
            background: 'rgba(239,68,68,0.08)',
            borderColor: 'rgba(239,68,68,0.18)',
            color: '#ef4444',
          }}
        >
          <span>{error}</span>
          <button className="text-[11px] font-black uppercase tracking-[0.18em]" onClick={() => setError('')}>
            Cerrar
          </button>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="space-y-6">
          {trialPlan && (
            <div className="space-y-3">
              <PlanSection title="Plan trial" eyebrow="Onboarding" plan={trialPlan} trm={trm} meta={metaCop} costs={costsObj} onChange={setTrialPlan} />
              <div className="flex justify-end">
                <SaveBtn id="trial" data={trialPlan as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="space-y-3">
              <PlanSection title="Plan básico" eyebrow="Core SaaS" plan={basic} trm={trm} meta={metaCop} costs={costsObj} onChange={setBasic} />
              <div className="flex justify-end">
                <SaveBtn id="basic" data={basic as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
              </div>
            </div>

            <div className="space-y-3">
              <PlanSection title="Plan pro" eyebrow="Growth" plan={pro} trm={trm} meta={metaCop} costs={costsObj} onChange={setPro} />
              <div className="flex justify-end">
                <SaveBtn id="pro" data={pro as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
              </div>
            </div>
          </div>

          {enterprise && (
            <div className="space-y-3">
              <PlanSection title="Plan enterprise base" eyebrow="High volume" plan={enterprise} trm={trm} meta={metaCop} costs={costsObj} onChange={setEnterprise} />
              <div className="flex justify-end">
                <SaveBtn id="enterprise" data={enterprise as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'enterprise' && <EnterpriseCalculator />}

      {activeTab === 'landing' && miniLanding && (
        <div className="space-y-3">
          <SectionShell
            eyebrow="Upsell"
            title="Mini-landing de pago único"
            description="Controla el precio público, el valor original tachado y la narrativa de conversión para la oferta complementaria."
            icon={<Palette className="h-6 w-6" />}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <InfoStat label="Precio USD" value={`$${precioEnUSD(miniLanding.precio_unico_cop, trm)}`} accent />
              <InfoStat
                label="Descuento automático"
                value={`${miniLanding.precio_original_cop > miniLanding.precio_unico_cop
                  ? Math.round((1 - miniLanding.precio_unico_cop / miniLanding.precio_original_cop) * 100)
                  : 0}%`}
              />
              <InfoStat label="TRM aplicada" value={formatCurrency(Math.round(trm)).replace(' COP', '')} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field
                label="Precio único (COP)"
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
                label="Precio original (COP)"
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
              <Field label="Descuento automático" type="number" suffix="%" value={miniLanding.descuento_porcentaje} disabled onChange={() => {}} />
              <Field label="Subtítulo" value={miniLanding.subtitulo} onChange={v => setMiniLanding({ ...miniLanding, subtitulo: v })} />
              <div className="md:col-span-2 xl:col-span-2">
                <Field label="Texto del botón" value={miniLanding.boton_texto} onChange={v => setMiniLanding({ ...miniLanding, boton_texto: v })} />
              </div>
            </div>

            <div className="mt-6">
              <FeaturesList features={miniLanding.features} onChange={f => setMiniLanding({ ...miniLanding, features: f })} />
            </div>
          </SectionShell>

          <div className="flex justify-end">
            <SaveBtn id="mini_landing" data={miniLanding as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
          {meta && (
            <div className="space-y-3">
              <SectionShell
                eyebrow="Trial"
                title="Configuración del periodo de prueba"
                description="Parámetros operativos del onboarding para controlar duración y capacidad del trial."
                icon={<Settings className="h-6 w-6" />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Días de duración" type="number" suffix="días" value={meta.trial_days ?? 7} onChange={v => setMeta({ ...meta, trial_days: Number(v) })} />
                  <Field
                    label="Límite de productos"
                    type="number"
                    value={meta.trial_products_max ?? 1}
                    disabled
                    onChange={() => {}}
                    hint="Este valor ahora se ajusta desde la pestaña de suscripciones."
                  />
                </div>
              </SectionShell>
              <div className="flex justify-end">
                <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
              </div>
            </div>
          )}

          {descuentos && (
            <div className="space-y-3">
              <SectionShell
                eyebrow="Conversión"
                title="Descuentos por duración"
                description="Ajusta el incentivo comercial de 1, 3, 6 y 12 meses para empujar compras de mayor permanencia."
                icon={<CreditCard className="h-6 w-6" />}
              >
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Field label="1 mes" type="number" suffix="%" value={descuentos.meses_1} onChange={v => setDescuentos({ ...descuentos, meses_1: Number(v) })} />
                  <Field label="3 meses" type="number" suffix="%" value={descuentos.meses_3} onChange={v => setDescuentos({ ...descuentos, meses_3: Number(v) })} />
                  <Field label="6 meses" type="number" suffix="%" value={descuentos.meses_6} onChange={v => setDescuentos({ ...descuentos, meses_6: Number(v) })} />
                  <Field label="12 meses" type="number" suffix="%" value={descuentos.meses_12} onChange={v => setDescuentos({ ...descuentos, meses_12: Number(v) })} />
                </div>
              </SectionShell>
              <div className="flex justify-end">
                <SaveBtn id="descuentos_duracion" data={descuentos as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
              </div>
            </div>
          )}

          {meta && (
            <div className="space-y-3">
              <SectionShell
                eyebrow="ROI"
                title="Metas financieras y costo de vida"
                description="Estos valores alimentan los cálculos internos de margen, cumplimiento y excedente neto del panel administrativo."
                icon={<TrendingUp className="h-6 w-6" />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Meta de ingreso mensual"
                    type="number"
                    prefix="$"
                    value={meta.meta_ingreso_cop}
                    onChange={v => setMeta({ ...meta, meta_ingreso_cop: Number(v) })}
                    hint="Se usa para medir avance comercial y capacidad de cumplimiento."
                  />
                  <Field
                    label="Gastos personales"
                    type="number"
                    prefix="$"
                    value={meta.gastos_personales_cop}
                    onChange={v => setMeta({ ...meta, gastos_personales_cop: Number(v) })}
                    hint="Sirve para proyectar excedente real después de operación."
                  />
                </div>
              </SectionShell>
              <div className="flex justify-end">
                <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
              </div>
            </div>
          )}

          {meta && (
            <div className="space-y-3">
              <SectionShell
                eyebrow="Footer"
                title="Redes sociales de la marca"
                description="Estos enlaces se usan en el pie del sitio y deben mantener coherencia con la identidad pública de Lookitry."
                icon={<Globe className="h-6 w-6" />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Instagram" value={meta.social_instagram ?? '#'} onChange={v => setMeta({ ...meta, social_instagram: v })} />
                  <Field label="TikTok" value={meta.social_tiktok ?? '#'} onChange={v => setMeta({ ...meta, social_tiktok: v })} />
                  <Field label="YouTube" value={meta.social_youtube ?? ''} onChange={v => setMeta({ ...meta, social_youtube: v })} />
                  <Field label="X" value={meta.social_x ?? ''} onChange={v => setMeta({ ...meta, social_x: v })} />
                </div>
              </SectionShell>
              <div className="flex justify-end">
                <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
