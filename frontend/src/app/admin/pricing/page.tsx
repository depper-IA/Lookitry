'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '@/utils/currency';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PlanConfig {
  precio_mensual_cop: number;
  productos_max: number;
  generaciones_mensuales: number;
  subtitulo: string;
  boton_texto: string;
  boton_texto_sin_trial?: string;
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
  meta_mensual_cop: number;
  trm_referencia: number;
  trm_auto: boolean;
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

function margenEstimado(precio: number, generaciones: number, costoGen: number, costosFijos: number, clientes: number) {
  const costoIA = generaciones * costoGen;
  const fijoProrr = clientes > 0 ? costosFijos / clientes : 0;
  return precio - costoIA - fijoProrr;
}

// ── Componente campo editable ─────────────────────────────────────────────────

function Field({
  label, value, onChange, type = 'text', prefix, suffix, hint,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#FF5C3A]/40"
          style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
        {suffix && <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

// ── Componente lista de features ──────────────────────────────────────────────

function FeaturesList({
  features, onChange,
}: {
  features: string[];
  onChange: (f: string[]) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Features (una por línea)</label>
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
  const usd = precioEnUSD(plan.precio_mensual_cop, trm);
  const clientes = clientesParaMeta(meta, plan.precio_mensual_cop);
  const costosFijos = costs.costo_vps_cop + costs.costo_dominio_cop_mensual;
  const margen = margenEstimado(plan.precio_mensual_cop, plan.generaciones_mensuales, costs.costo_openrouter_por_gen_cop, costosFijos, clientes);

  return (
    <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>

      {/* Cálculos automáticos */}
      <div className="grid grid-cols-3 gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-base)' }}>
        <div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Precio en USD</p>
          <p className="text-sm font-semibold" style={{ color: '#FF5C3A' }}>${usd}</p>
        </div>
        <div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Clientes p/meta</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{clientes}</p>
        </div>
        <div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Margen/cliente</p>
          <p className="text-sm font-semibold" style={{ color: margen >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(Math.round(margen))}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Precio mensual (COP)" type="number" value={plan.precio_mensual_cop}
          onChange={v => onChange({ ...plan, precio_mensual_cop: Number(v) })} prefix="$" />
        <Field label="Máx. productos" type="number" value={plan.productos_max}
          onChange={v => onChange({ ...plan, productos_max: Number(v) })} />
        <Field label="Generaciones/mes" type="number" value={plan.generaciones_mensuales}
          onChange={v => onChange({ ...plan, generaciones_mensuales: Number(v) })} />
        <Field label="Subtítulo" value={plan.subtitulo}
          onChange={v => onChange({ ...plan, subtitulo: v })} />
        <Field label="Texto botón (con trial)" value={plan.boton_texto}
          onChange={v => onChange({ ...plan, boton_texto: v })} />
        <Field label="Texto botón (sin trial)" value={plan.boton_texto_sin_trial ?? ''}
          onChange={v => onChange({ ...plan, boton_texto_sin_trial: v })} />
      </div>

      <FeaturesList features={plan.features} onChange={f => onChange({ ...plan, features: f })} />
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PricingAdminPage() {
  const [rows, setRows]       = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<string | null>(null);
  const [saved, setSaved]     = useState<string | null>(null);
  const [error, setError]     = useState('');
  const [trm, setTrm]         = useState(3700);
  const [trmAuto, setTrmAuto] = useState(true);

  // Estado local de cada sección
  const [basic, setBasic]         = useState<PlanConfig | null>(null);
  const [pro, setPro]             = useState<PlanConfig | null>(null);
  const [miniLanding, setMiniLanding] = useState<MiniLandingConfig | null>(null);
  const [meta, setMeta]           = useState<MetaConfig | null>(null);
  const [costs, setCosts]         = useState<CostsConfig | null>(null);
  const [descuentos, setDescuentos] = useState<DescuentosConfig | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pricingRes, trmRes] = await Promise.all([
        fetch('/api/pricing'),
        fetch('/api/pricing/trm'),
      ]);
      if (!pricingRes.ok) throw new Error('Error al cargar precios');
      const json = await pricingRes.json();
      if (!json.ok) throw new Error(json.error);
      setRows(json.data);

      for (const row of json.data as ConfigRow[]) {
        if (row.id === 'basic')              setBasic(row.data as unknown as PlanConfig);
        if (row.id === 'pro')                setPro(row.data as unknown as PlanConfig);
        if (row.id === 'mini_landing')       setMiniLanding(row.data as unknown as MiniLandingConfig);
        if (row.id === 'meta')               { const m = row.data as unknown as MetaConfig; setMeta(m); setTrm(m.trm_referencia); setTrmAuto(m.trm_auto); }
        if (row.id === 'costs')              setCosts(row.data as unknown as CostsConfig);
        if (row.id === 'descuentos_duracion') setDescuentos(row.data as unknown as DescuentosConfig);
      }

      if (trmRes.ok) {
        const trmJson = await trmRes.json();
        if (trmJson.trm && trmAuto) setTrm(trmJson.trm);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [trmAuto]);

  useEffect(() => { load(); }, [load]);

  async function save(id: string, data: Record<string, unknown>) {
    setSaving(id);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, data }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setSaved(id);
      setTimeout(() => setSaved(null), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(null);
    }
  }

  function SaveBtn({ id, data }: { id: string; data: Record<string, unknown> }) {
    const isSaving = saving === id;
    const isSaved  = saved === id;
    return (
      <button
        onClick={() => save(id, data)}
        disabled={isSaving}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          background: isSaved ? '#10b981' : '#FF5C3A',
          color: '#fff',
          opacity: isSaving ? 0.7 : 1,
        }}
      >
        {isSaving ? 'Guardando...' : isSaved ? 'Guardado' : 'Guardar cambios'}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF5C3A]" />
      </div>
    );
  }

  const metaCop  = meta?.meta_mensual_cop ?? 1400000;
  const costsObj = costs ?? { costo_vps_cop: 37000, costo_dominio_cop_mensual: 5000, costo_openrouter_por_gen_cop: 25 };

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-jakarta, var(--font-syne))' }}>
          Configuración de Precios
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Los cambios se reflejan en la landing en máximo 1 hora (ISR). TRM actual: <strong style={{ color: '#FF5C3A' }}>{formatCurrency(trm)} COP/USD</strong>
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          {error}
          <button className="ml-3 underline" onClick={() => setError('')}>Cerrar</button>
        </div>
      )}

      {/* TRM y Meta */}
      {meta && (
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Meta mensual y TRM</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Meta mensual (COP)" type="number" value={meta.meta_mensual_cop} prefix="$"
              onChange={v => setMeta({ ...meta, meta_mensual_cop: Number(v) })} />
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>TRM de referencia (COP/USD)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={trm}
                  disabled={trmAuto}
                  onChange={e => { setTrm(Number(e.target.value)); setMeta({ ...meta, trm_referencia: Number(e.target.value) }); }}
                  className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-[#FF5C3A]/40"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', opacity: trmAuto ? 0.5 : 1 }}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => { const next = !trmAuto; setTrmAuto(next); setMeta({ ...meta, trm_auto: next }); }}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  style={{ background: trmAuto ? '#FF5C3A' : 'var(--border-color)' }}
                  aria-label="Toggle TRM automático"
                >
                  <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                    style={{ transform: trmAuto ? 'translateX(18px)' : 'translateX(2px)' }} />
                </button>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {trmAuto ? 'Automático (Superfinanciera Colombia)' : 'Manual'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} />
          </div>
        </div>
      )}

      {/* Plan Básico */}
      {basic && (
        <div className="space-y-3">
          <PlanSection title="Plan Básico" plan={basic} trm={trm} meta={metaCop} costs={costsObj} onChange={setBasic} />
          <div className="flex justify-end">
            <SaveBtn id="basic" data={basic as unknown as Record<string, unknown>} />
          </div>
        </div>
      )}

      {/* Plan Pro */}
      {pro && (
        <div className="space-y-3">
          <PlanSection title="Plan Pro" plan={pro} trm={trm} meta={metaCop} costs={costsObj} onChange={setPro} />
          <div className="flex justify-end">
            <SaveBtn id="pro" data={pro as unknown as Record<string, unknown>} />
          </div>
        </div>
      )}

      {/* Mini-Landing */}
      {miniLanding && (
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Mini-Landing (pago único)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Precio único (COP)" type="number" value={miniLanding.precio_unico_cop} prefix="$"
              onChange={v => setMiniLanding({ ...miniLanding, precio_unico_cop: Number(v) })} />
            <Field label="Precio original / tachado (COP)" type="number" value={miniLanding.precio_original_cop} prefix="$"
              onChange={v => setMiniLanding({ ...miniLanding, precio_original_cop: Number(v) })} />
            <Field label="Descuento %" type="number" value={miniLanding.descuento_porcentaje} suffix="%"
              onChange={v => setMiniLanding({ ...miniLanding, descuento_porcentaje: Number(v) })}
              hint="Se muestra como badge en la tarjeta" />
            <Field label="Subtítulo" value={miniLanding.subtitulo}
              onChange={v => setMiniLanding({ ...miniLanding, subtitulo: v })} />
            <Field label="Texto del botón" value={miniLanding.boton_texto}
              onChange={v => setMiniLanding({ ...miniLanding, boton_texto: v })} />
          </div>
          <FeaturesList features={miniLanding.features} onChange={f => setMiniLanding({ ...miniLanding, features: f })} />
          <div className="flex justify-end">
            <SaveBtn id="mini_landing" data={miniLanding as unknown as Record<string, unknown>} />
          </div>
        </div>
      )}

      {/* Costos operativos */}
      {costs && (
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Costos operativos</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Usados para calcular ROI, margen y punto de equilibrio en el dashboard de ingresos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="VPS Hostinger (COP/mes)" type="number" value={costs.costo_vps_cop} prefix="$"
              onChange={v => setCosts({ ...costs, costo_vps_cop: Number(v) })} />
            <Field label="Dominio (COP/mes)" type="number" value={costs.costo_dominio_cop_mensual} prefix="$"
              onChange={v => setCosts({ ...costs, costo_dominio_cop_mensual: Number(v) })} />
            <Field label="OpenRouter por generación (COP)" type="number" value={costs.costo_openrouter_por_gen_cop} prefix="$"
              onChange={v => setCosts({ ...costs, costo_openrouter_por_gen_cop: Number(v) })} />
          </div>
          <Field label="Notas" value={costs.notas ?? ''}
            onChange={v => setCosts({ ...costs, notas: v })} />
          <div className="flex justify-end">
            <SaveBtn id="costs" data={costs as unknown as Record<string, unknown>} />
          </div>
        </div>
      )}

      {/* Descuentos por duración */}
      {descuentos && (
        <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Descuentos por duración de suscripción</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="1 mes (%)" type="number" value={descuentos.meses_1} suffix="%"
              onChange={v => setDescuentos({ ...descuentos, meses_1: Number(v) })} />
            <Field label="3 meses (%)" type="number" value={descuentos.meses_3} suffix="%"
              onChange={v => setDescuentos({ ...descuentos, meses_3: Number(v) })} />
            <Field label="6 meses (%)" type="number" value={descuentos.meses_6} suffix="%"
              onChange={v => setDescuentos({ ...descuentos, meses_6: Number(v) })} />
            <Field label="12 meses (%)" type="number" value={descuentos.meses_12} suffix="%"
              onChange={v => setDescuentos({ ...descuentos, meses_12: Number(v) })} />
          </div>
          <div className="flex justify-end">
            <SaveBtn id="descuentos_duracion" data={descuentos as unknown as Record<string, unknown>} />
          </div>
        </div>
      )}

      {/* Info última actualización */}
      {rows.length > 0 && (
        <p className="text-xs text-center pb-4" style={{ color: 'var(--text-muted)' }}>
          Última actualización: {new Date(rows[0].updated_at).toLocaleString('es-CO')}
        </p>
      )}

    </div>
  );
}
