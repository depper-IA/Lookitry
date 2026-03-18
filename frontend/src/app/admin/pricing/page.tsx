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
      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
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

  return (
    <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>

      {/* Cálculos automáticos — solo lectura */}
      <div className="grid grid-cols-3 gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
        <div>
          <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Precio en USD</p>
          <p className="text-sm font-bold" style={{ color: '#FF5C3A' }}>${usd}</p>
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
          onChange={v => onChange({ ...plan, precio_mensual_cop: Number(v) })}
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
          label="Texto botón (con trial)"
          value={plan.boton_texto}
          onChange={v => onChange({ ...plan, boton_texto: v })}
        />
        <Field
          label="Texto botón (sin trial)"
          value={plan.boton_texto_sin_trial ?? ''}
          onChange={v => onChange({ ...plan, boton_texto_sin_trial: v })}
        />
      </div>

      <FeaturesList features={plan.features} onChange={f => onChange({ ...plan, features: f })} />
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PricingAdminPage() {
  const [rows, setRows]             = useState<ConfigRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<string | null>(null);
  const [saved, setSaved]           = useState<string | null>(null);
  const [error, setError]           = useState('');
  const [trm, setTrm]               = useState(3700);
  const [trmAuto, setTrmAuto]       = useState(true);
  const [trmLive, setTrmLive]       = useState(3700); // TRM real de la API

  const [basic, setBasic]               = useState<PlanConfig | null>(null);
  const [pro, setPro]                   = useState<PlanConfig | null>(null);
  const [miniLanding, setMiniLanding]   = useState<MiniLandingConfig | null>(null);
  const [meta, setMeta]                 = useState<MetaConfig | null>(null);
  const [costs, setCosts]               = useState<CostsConfig | null>(null);
  const [descuentos, setDescuentos]     = useState<DescuentosConfig | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pricingRes, trmRes] = await Promise.all([
        fetch('/api/pricing'),
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
        if (row.id === 'costs')               setCosts(row.data as unknown as CostsConfig);
        if (row.id === 'descuentos_duracion') setDescuentos(row.data as unknown as DescuentosConfig);
        if (row.id === 'meta') {
          const m = row.data as unknown as MetaConfig;
          setMeta(m);
          setTrm(m.trm_referencia);
          setTrmAuto(m.trm_auto);
          autoEnabled = m.trm_auto;
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
  }, []);

  const toggleTrmAuto = useCallback(() => {
    const next = !trmAuto;
    setTrmAuto(next);
    if (next) setTrm(trmLive); // al activar auto, usar el valor live
    setMeta(prev => prev ? { ...prev, trm_auto: next, trm_referencia: next ? trmLive : trm } : prev);
  }, [trmAuto, trmLive, trm]);

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>
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

      {/* ── Meta mensual y TRM ── */}
      {meta && (
        <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Meta mensual y TRM</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Usados para calcular % de cumplimiento y conversiones en USD en el dashboard de ROI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Meta mensual (COP)" type="number" prefix="$"
              value={meta.meta_mensual_cop}
              onChange={v => setMeta({ ...meta, meta_mensual_cop: Number(v) })}
            />
            <Field
              label="TRM de referencia (COP/USD)" type="number"
              value={trm}
              disabled={trmAuto}
              onChange={v => {
                const n = Number(v);
                setTrm(n);
                setMeta({ ...meta, trm_referencia: n });
              }}
              hint={trmAuto ? `Automático — valor actual: ${trmLive.toLocaleString('es-CO')} COP/USD` : 'Valor manual editable'}
            />
          </div>

          {/* Toggle TRM automático */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-base)' }}>
            <button
              onClick={toggleTrmAuto}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
              style={{ background: trmAuto ? '#FF5C3A' : 'var(--border-color)' }}
              aria-label="Toggle TRM automático"
            >
              <span
                className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                style={{ transform: trmAuto ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </button>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                TRM automático
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {trmAuto
                  ? 'Se actualiza diariamente desde la Superfinanciera Colombia (datos.gov.co)'
                  : 'Desactivado — el valor se toma del campo manual'}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <SaveBtn id="meta" data={meta as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
          </div>
        </div>
      )}

      {/* ── Plan Básico ── */}
      {basic && (
        <div className="space-y-3">
          <PlanSection title="Plan Básico" plan={basic} trm={trm} meta={metaCop} costs={costsObj} onChange={setBasic} />
          <div className="flex justify-end">
            <SaveBtn id="basic" data={basic as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
          </div>
        </div>
      )}

      {/* ── Plan Pro ── */}
      {pro && (
        <div className="space-y-3">
          <PlanSection title="Plan Pro" plan={pro} trm={trm} meta={metaCop} costs={costsObj} onChange={setPro} />
          <div className="flex justify-end">
            <SaveBtn id="pro" data={pro as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
          </div>
        </div>
      )}

      {/* ── Mini-Landing ── */}
      {miniLanding && (
        <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Mini-Landing (pago único)</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Precio en USD: <strong style={{ color: '#FF5C3A' }}>${precioEnUSD(miniLanding.precio_unico_cop, trm)}</strong>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Precio único (COP)" type="number" prefix="$"
              value={miniLanding.precio_unico_cop}
              onChange={v => setMiniLanding({ ...miniLanding, precio_unico_cop: Number(v) })}
            />
            <Field
              label="Precio original / tachado (COP)" type="number" prefix="$"
              value={miniLanding.precio_original_cop}
              onChange={v => setMiniLanding({ ...miniLanding, precio_original_cop: Number(v) })}
            />
            <Field
              label="Descuento %" type="number" suffix="%"
              value={miniLanding.descuento_porcentaje}
              onChange={v => setMiniLanding({ ...miniLanding, descuento_porcentaje: Number(v) })}
              hint="Se muestra como badge en la tarjeta de la landing"
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
      )}

      {/* ── Costos operativos ── */}
      {costs && (
        <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Costos operativos</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Usados para calcular ROI, margen y punto de equilibrio en el dashboard de ingresos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="VPS Hostinger (COP/mes)" type="number" prefix="$"
              value={costs.costo_vps_cop}
              onChange={v => setCosts({ ...costs, costo_vps_cop: Number(v) })}
            />
            <Field
              label="Dominio (COP/mes)" type="number" prefix="$"
              value={costs.costo_dominio_cop_mensual}
              onChange={v => setCosts({ ...costs, costo_dominio_cop_mensual: Number(v) })}
            />
            <Field
              label="OpenRouter por generación (COP)" type="number" prefix="$"
              value={costs.costo_openrouter_por_gen_cop}
              onChange={v => setCosts({ ...costs, costo_openrouter_por_gen_cop: Number(v) })}
            />
          </div>
          <Field
            label="Notas"
            value={costs.notas ?? ''}
            onChange={v => setCosts({ ...costs, notas: v })}
          />
          <div className="flex justify-end">
            <SaveBtn id="costs" data={costs as unknown as Record<string, unknown>} saving={saving} saved={saved} onSave={handleSave} />
          </div>
        </div>
      )}

      {/* ── Descuentos por duración ── */}
      {descuentos && (
        <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Descuentos por duración de suscripción</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Se aplican al precio mensual en el checkout según el período elegido.
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

      {/* Última actualización */}
      {rows.length > 0 && (
        <p className="text-xs text-center pb-4" style={{ color: 'var(--text-muted)' }}>
          Última actualización: {new Date(rows[0].updated_at).toLocaleString('es-CO')}
        </p>
      )}

    </div>
  );
}
