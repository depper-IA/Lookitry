'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '@/utils/currency';
import { 
  CreditCard, 
  Palette, 
  Settings, 
  TrendingUp, 
  RefreshCw,
  X,
  Globe,
  Instagram,
  Youtube,
  Twitter,
  Layout
} from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Campo editable ────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', prefix, suffix, hint, disabled,
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
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        {prefix && (
          <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 transition-opacity"
          style={{
            background: 'var(--bg-base)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
            opacity: disabled ? 0.45 : 1,
          }}
        />
        {suffix && (
          <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{suffix}</span>
        )}
      </div>
      {hint && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

// ── Lista de features ─────────────────────────────────────────────────────────

function FeaturesList({ features, onChange }: { features: string[]; onChange: (f: string[]) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        Features (una por línea)
      </label>
      <textarea
        rows={6}
        value={features.join('\n')}
        onChange={e => onChange(e.target.value.split('\n'))}
        className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 resize-none"
        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
      />
    </div>
  );
}

// ── Botón guardar (fuera del componente principal para evitar re-renders) ──────

function SaveBtn({
  id, data, saving, saved, onSave,
}: {
  id: string;
  data: Record<string, unknown>;
  saving: string | null;
  saved: string | null;
  onSave: (id: string, data: Record<string, unknown>) => void;
}) {
  const isSaving = saving === id;
  const isSaved  = saved === id;
  return (
    <button
      onClick={() => onSave(id, data)}
      disabled={isSaving}
      className="px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-[#FF5C3A]/20"
      style={{
        background: isSaved ? '#10b981' : '#FF5C3A',
        color: '#fff',
        opacity: isSaving ? 0.7 : 1,
        cursor: isSaving ? 'not-allowed' : 'pointer',
      }}
    >
      {isSaving ? 'Guardando...' : isSaved ? 'Guardado' : 'Guardar cambios'}
    </button>
  );
}

// ── Sección de plan ───────────────────────────────────────────────────────────

function PlanSection({
  title, plan, trm, meta, costs, onChange,
}: {
  title: string;
  plan: PlanConfig;
  trm: number;
  meta: number;
  costs: CostsConfig;
  onChange: (p: PlanConfig) => void;
}) {
  const usd      = precioEnUSD(plan.precio_mensual_cop, trm);
  const clientes = clientesParaMeta(meta, plan.precio_mensual_cop);
  const costosFijos = costs.costo_vps_cop + costs.costo_dominio_cop_mensual;
  const margen   = margenEstimado(
    plan.precio_mensual_cop,
    plan.generaciones_mensuales,
    costs.costo_openrouter_por_gen_cop,
    costosFijos,
    clientes,
  );

  // Cálculo automático de descuento
  const autoDiscount = plan.precio_original_cop && plan.precio_original_cop > plan.precio_mensual_cop
    ? Math.round((1 - (plan.precio_mensual_cop / plan.precio_original_cop)) * 100)
    : 0;

  return (
    <div className="rounded-[2rem] border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <h3 className="text-base font-jakarta font-bold uppercase italic" style={{ color: 'var(--text-primary)' }}>{title}</h3>

      {/* Cálculos automáticos — solo lectura */}
      <div className="grid grid-cols-4 gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Precio en USD</p>
          <p className="text-sm font-bold" style={{ color: '#FF5C3A' }}>${usd}</p>
        </div>
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Descuento auto.</p>
          <p className="text-sm font-bold" style={{ color: '#FF5C3A' }}>{autoDiscount}%</p>
        </div>
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Clientes p/meta</p>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{clientes}</p>
        </div>
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Margen/cliente</p>
          <p className="text-sm font-bold" style={{ color: margen >= 0 ? '#10b981' : '#ef4444' }}>
            {formatCurrency(Math.round(margen))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Precio mensual (COP)" type="number" prefix="$"
          value={plan.precio_mensual_cop}
          onChange={v => onChange({ ...plan, precio_mensual_cop: Number(v), descuento_porcentaje: autoDiscount })}
        />
        <Field
          label="Precio original / tachado (COP)" type="number" prefix="$"
          value={plan.precio_original_cop ?? 0}
          onChange={v => onChange({ ...plan, precio_original_cop: Number(v), descuento_porcentaje: autoDiscount })}
        />
        <Field
          label="Descuento % (Solo lectura)" type="number" suffix="%"
          value={autoDiscount}
          disabled={true}
          onChange={() => {}}
          hint="Se calcula automáticamente basado en el precio original."
        />
        <Field
          label="Máx. productos" type="number"
          value={plan.productos_max}
          onChange={v => onChange({ ...plan, productos_max: Number(v) })}
        />
        <Field
          label="Generaciones/mes" type="number"
          value={plan.generaciones_mensuales}
          onChange={v => onChange({ ...plan, generaciones_mensuales: Number(v) })}
        />
        <Field
          label="Subtítulo"
          value={plan.subtitulo}
          onChange={v => onChange({ ...plan, subtitulo: v })}
        />
        <Field
          label="Texto del botón"
          value={plan.boton_texto}
          onChange={v => onChange({ ...plan, boton_texto: v })}
        />
      </div>

      <FeaturesList features={plan.features} onChange={f => onChange({ ...plan, features: f })} />
    </div>
  );
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

// ── Página principal ──────────────────────────────────────────────────────────

export default function PricingAdminPage() {
  const [rows, setRows]             = useState<ConfigRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<string | null>(null);
  const [saved, setSaved]           = useState<string | null>(null);
  const [error, setError]           = useState('');
  const [trm, setTrm]               = useState(3700);
  const [trmAuto, setTrmAuto]       = useState(true);
  const [trmLive, setTrmLive]       = useState(3700);
  const [activeTab, setActiveTab]   = useState<'plans' | 'landing' | 'config'>('plans');

  const [basic, setBasic]               = useState<PlanConfig | null>(null);
  const [pro, setPro]                   = useState<PlanConfig | null>(null);
  const [miniLanding, setMiniLanding]   = useState<MiniLandingConfig | null>(null);
  const [descuentos, setDescuentos]     = useState<DescuentosConfig | null>(null);
  const [meta, setMeta]                 = useState<MetaConfig | null>(null);
  const [costs, setCosts]               = useState<CostsConfig | null>(null);

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
        if (row.id === 'basic')               setBasic(row.data as unknown as PlanConfig);
        if (row.id === 'pro')                 setPro(row.data as unknown as PlanConfig);
        if (row.id === 'mini_landing')        setMiniLanding(row.data as unknown as MiniLandingConfig);
        if (row.id === 'descuentos_duracion') setDescuentos(row.data as unknown as DescuentosConfig);
        if (row.id === 'meta') {
          const m = row.data as unknown as MetaConfig;
          setMeta(m);
          setTrm(m.trm_referencia);
          setTrmAuto(m.trm_auto);
          autoEnabled = m.trm_auto;
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

  useEffect(() => { load(); }, [load]);

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

  // En pricing solo usamos TRM para mostrar precio en USD — sin toggle aquí

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF5C3A]" />
      </div>
    );
  }

  if (!basic || !pro) return null;

  const costsObj = costs || { costo_vps_cop: 37000, costo_dominio_cop_mensual: 5000, costo_openrouter_por_gen_cop: 25 };
  const metaCop  = meta?.meta_ingreso_cop ?? 2000000;

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-jakarta font-black uppercase italic tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Configuración de Precios
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Los cambios se reflejan en la landing en máximo 1 hora (ISR).
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex-shrink-0"
          style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Recargar
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between p-3 rounded-lg text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span>{error}</span>
          <button className="ml-3 underline text-xs" onClick={() => setError('')}>Cerrar</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-color)' }}>
        {[
          { id: 'plans', label: 'Suscripciones', icon: CreditCard },
          { id: 'landing', label: 'Mini-Landing', icon: Palette },
          { id: 'config', label: 'Configuración & ROI', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[2px] flex items-center gap-2.5`}
            style={{
              borderColor: activeTab === tab.id ? '#FF5C3A' : 'transparent',
              color: activeTab === tab.id ? '#FF5C3A' : 'var(--text-muted)',
            }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {/* ── TAB: Suscripciones ── */}
        {activeTab === 'plans' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {basic && (
              <div className="space-y-3">
                <PlanSection title="Plan Básico" plan={basic} trm={trm} meta={metaCop} costs={costsObj} onChange={setBasic} />
                <div className="flex justify-end">
                  <SaveBtn id="basic" data={basic as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                </div>
              </div>
            )}
            {pro && (
              <div className="space-y-3">
                <PlanSection title="Plan Pro" plan={pro} trm={trm} meta={metaCop} costs={costsObj} onChange={setPro} />
                <div className="flex justify-end">
                  <SaveBtn id="pro" data={pro as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Mini-Landing ── */}
        {activeTab === 'landing' && miniLanding && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Mini-Landing (pago único)</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Precio en USD: <strong style={{ color: '#FF5C3A' }}>${precioEnUSD(miniLanding.precio_unico_cop, trm)}</strong>
                </p>
              </div>
              
              <div className="p-4 rounded-xl max-w-xs" style={{ background: 'var(--bg-base)' }}>
                <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Descuento automático</p>
                <p className="text-sm font-bold" style={{ color: '#FF5C3A' }}>
                  {miniLanding.precio_original_cop > miniLanding.precio_unico_cop 
                    ? Math.round((1 - (miniLanding.precio_unico_cop / miniLanding.precio_original_cop)) * 100) 
                    : 0}%
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Precio único (COP)" type="number" prefix="$"
                  value={miniLanding.precio_unico_cop}
                  onChange={v => {
                    const val = Number(v);
                    const desc = miniLanding.precio_original_cop > val ? Math.round((1 - (val / miniLanding.precio_original_cop)) * 100) : 0;
                    setMiniLanding({ ...miniLanding, precio_unico_cop: val, descuento_porcentaje: desc });
                  }}
                />
                <Field
                  label="Precio original / tachado (COP)" type="number" prefix="$"
                  value={miniLanding.precio_original_cop}
                  onChange={v => {
                    const val = Number(v);
                    const desc = val > miniLanding.precio_unico_cop ? Math.round((1 - (miniLanding.precio_unico_cop / val)) * 100) : 0;
                    setMiniLanding({ ...miniLanding, precio_original_cop: val, descuento_porcentaje: desc });
                  }}
                />
                <Field
                  label="Descuento % (Solo lectura)" type="number" suffix="%"
                  value={miniLanding.descuento_porcentaje}
                  disabled={true}
                  onChange={() => {}}
                  hint="Se calcula automáticamente basado en el precio original."
                />
                <Field
                  label="Subtítulo"
                  value={miniLanding.subtitulo}
                  onChange={v => setMiniLanding({ ...miniLanding, subtitulo: v })}
                />
                <Field
                  label="Texto del botón"
                  value={miniLanding.boton_texto}
                  onChange={v => setMiniLanding({ ...miniLanding, boton_texto: v })}
                />
              </div>
              <FeaturesList features={miniLanding.features} onChange={f => setMiniLanding({ ...miniLanding, features: f })} />
              <div className="flex justify-end">
                <SaveBtn id="mini_landing" data={miniLanding as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Configuración & ROI ── */}
        {activeTab === 'config' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Plan Trial */}
            {meta && (
              <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Plan Trial (Periodo de prueba)</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Configura los límites para las marcas que se registran gratis.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field
                    label="Días de duración" type="number" suffix="días"
                    value={meta.trial_days ?? 7}
                    onChange={v => setMeta({ ...meta, trial_days: Number(v) })}
                  />
                  <Field
                    label="Máx. productos activos" type="number"
                    value={meta.trial_products_max ?? 1}
                    onChange={v => setMeta({ ...meta, trial_products_max: Number(v) })}
                  />
                  <Field
                    label="Límite generaciones" type="number" suffix="gen"
                    value={meta.trial_generations_limit ?? 30}
                    onChange={v => setMeta({ ...meta, trial_generations_limit: Number(v) })}
                  />
                </div>
                <div className="flex justify-end">
                  <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                </div>
              </div>
            )}

            {/* Descuentos por duración */}
            {descuentos && (
              <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Descuentos por duración</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Ahorro aplicado según los meses de suscripción.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="1 mes" type="number" suffix="%" value={descuentos.meses_1}
                    onChange={v => setDescuentos({ ...descuentos, meses_1: Number(v) })} />
                  <Field label="3 meses" type="number" suffix="%" value={descuentos.meses_3}
                    onChange={v => setDescuentos({ ...descuentos, meses_3: Number(v) })} />
                  <Field label="6 meses" type="number" suffix="%" value={descuentos.meses_6}
                    onChange={v => setDescuentos({ ...descuentos, meses_6: Number(v) })} />
                  <Field label="12 meses" type="number" suffix="%" value={descuentos.meses_12}
                    onChange={v => setDescuentos({ ...descuentos, meses_12: Number(v) })} />
                </div>
                <div className="flex justify-end">
                  <SaveBtn id="descuentos_duracion" data={descuentos as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                </div>
              </div>
            )}

            {/* Metas de Negocio & ROI */}
            {meta && (
              <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#FF5C3A]" />
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Metas de Negocio & ROI</h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Objetivos financieros para cálculos de margen y excedentes en el panel de control.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Meta de ingreso mensual (COP)" type="number" prefix="$"
                    value={meta.meta_ingreso_cop}
                    onChange={v => setMeta({ ...meta, meta_ingreso_cop: Number(v) })}
                    hint="Usado para calcular el % de cumplimiento en el dashboard"
                  />
                  <Field
                    label="Gastos personales / Costo de vida (COP)" type="number" prefix="$"
                    value={meta.gastos_personales_cop}
                    onChange={v => setMeta({ ...meta, gastos_personales_cop: Number(v) })}
                    hint="Usado para calcular el excedente real (neto)"
                  />
                </div>
                <div className="flex justify-end">
                  <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                </div>
              </div>
            )}

            {/* Redes Sociales */}
            {meta && (
              <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#FF5C3A]" />
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Redes Sociales</h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Enlaces que aparecerán en el pie de página del sitio.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Instagram"
                    value={meta.social_instagram ?? '#'}
                    onChange={v => setMeta({ ...meta, social_instagram: v })}
                    hint="Ej: https://instagram.com/tu-marca"
                  />
                  <Field
                    label="TikTok"
                    value={meta.social_tiktok ?? '#'}
                    onChange={v => setMeta({ ...meta, social_tiktok: v })}
                    hint="Ej: https://tiktok.com/@tu-marca"
                  />
                  <Field
                    label="YouTube"
                    value={meta.social_youtube ?? ''}
                    onChange={v => setMeta({ ...meta, social_youtube: v })}
                    hint="Ej: https://youtube.com/@tu-canal"
                  />
                  <Field
                    label="X (Twitter)"
                    value={meta.social_x ?? ''}
                    onChange={v => setMeta({ ...meta, social_x: v })}
                    hint="Ej: https://x.com/tu-marca"
                  />
                </div>
                <div className="flex justify-end">
                  <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Última actualización */}
      {rows.length > 0 && (
        <p className="text-xs text-center pb-4" style={{ color: 'var(--text-muted)' }}>
          Última actualización: {new Date(rows[0].updated_at).toLocaleString('es-CO')}
        </p>
      )}

    </div>
  );
}
