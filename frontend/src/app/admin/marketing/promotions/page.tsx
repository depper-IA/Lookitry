'use client';

import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PromoType = 'modal_timer' | 'coupon' | 'banner' | 'plan_override' | 'launch_offer';

interface Promotion {
  id: string;
  type: PromoType;
  name: string;
  config: Record<string, unknown>;
  active: boolean;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: 'pct' | 'fixed';
  discount_value: number;
  max_uses?: number;
  uses_count: number;
  expires_at?: string;
  plan_ids: string[];
  active: boolean;
  created_at: string;
}

// ── Iconos ────────────────────────────────────────────────────────────────────

function IconPlus() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function IconEdit() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function IconTrash() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function IconTag() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
}
function IconMegaphone() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
}
function IconClose() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconSpinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PromoType, string> = {
  modal_timer:   'Modal con countdown',
  coupon:        'Cupón',
  banner:        'Banner superior',
  plan_override: 'Precio especial por plan',
  launch_offer:  'Oferta de lanzamiento',
};

const TYPE_COLORS: Record<PromoType, string> = {
  modal_timer:   '#6366f1',
  coupon:        '#10b981',
  banner:        '#f59e0b',
  plan_override: '#FF5C3A',
  launch_offer:  '#ec4899',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Toggle usa variables CSS para ser compatible con modo light y dark
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0"
      style={{ backgroundColor: checked ? '#FF5C3A' : 'var(--border-color)' }}
      role="switch"
      aria-checked={checked}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

// ── Inputs con variables CSS (compatibles con light/dark) ─────────────────────

const inputCls = [
  'w-full rounded-lg px-3 py-2 text-[13px] focus:outline-none transition-colors',
  'focus:ring-1 focus:ring-[#FF5C3A]',
].join(' ');

const inputStyle = {
  backgroundColor: 'var(--bg-base)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
};

// ── Formulario de promoción ───────────────────────────────────────────────────

const EMPTY_PROMO: Omit<Promotion, 'id' | 'created_at'> = {
  type: 'banner',
  name: '',
  config: {},
  active: false,
  starts_at: undefined,
  ends_at: undefined,
};

function Field({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inputCls} style={inputStyle} />
    </div>
  );
}

function PromoForm({ initial, onSave, onCancel, saving }: {
  initial: Omit<Promotion, 'id' | 'created_at'>;
  onSave: (data: Omit<Promotion, 'id' | 'created_at'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const setConfig = (k: string, v: unknown) => setForm(f => ({ ...f, config: { ...f.config, [k]: v } }));
  const cfg = form.config as Record<string, string | number>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Nombre interno</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Oferta Black Friday" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Tipo</label>
          <select value={form.type} onChange={e => set('type', e.target.value as PromoType)} className={inputCls} style={inputStyle}>
            {(Object.keys(TYPE_LABELS) as PromoType[]).map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Inicio (opcional)</label>
          <input type="datetime-local" value={form.starts_at ? form.starts_at.slice(0, 16) : ''} onChange={e => set('starts_at', e.target.value ? new Date(e.target.value).toISOString() : undefined)} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Fin (opcional)</label>
          <input type="datetime-local" value={form.ends_at ? form.ends_at.slice(0, 16) : ''} onChange={e => set('ends_at', e.target.value ? new Date(e.target.value).toISOString() : undefined)} className={inputCls} style={inputStyle} />
        </div>
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Configuración — {TYPE_LABELS[form.type]}</p>

        {(form.type === 'modal_timer' || form.type === 'launch_offer') && (<>
          <Field label="Título del modal" value={String(cfg.title ?? '')} onChange={v => setConfig('title', v)} />
          <Field label="Descripción" value={String(cfg.description ?? '')} onChange={v => setConfig('description', v)} />
          <Field label="Texto del botón CTA" value={String(cfg.cta_text ?? '')} onChange={v => setConfig('cta_text', v)} />
          <Field label="URL del CTA" value={String(cfg.cta_url ?? '/checkout')} onChange={v => setConfig('cta_url', v)} />
          <Field label="Delay antes de mostrar (segundos)" value={String(cfg.delay_seconds ?? '5')} onChange={v => setConfig('delay_seconds', Number(v))} type="number" />
        </>)}

        {form.type === 'banner' && (<>
          <Field label="Texto del banner" value={String(cfg.text ?? '')} onChange={v => setConfig('text', v)} />
          <Field label="Color de fondo (hex)" value={String(cfg.bg_color ?? '#FF5C3A')} onChange={v => setConfig('bg_color', v)} />
          <Field label="Color de texto (hex)" value={String(cfg.text_color ?? '#ffffff')} onChange={v => setConfig('text_color', v)} />
          <Field label="Texto del CTA (opcional)" value={String(cfg.cta_text ?? '')} onChange={v => setConfig('cta_text', v)} />
          <Field label="URL del CTA (opcional)" value={String(cfg.cta_url ?? '')} onChange={v => setConfig('cta_url', v)} />
        </>)}

        {form.type === 'plan_override' && (<>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Plan</label>
            <select value={String(cfg.plan ?? 'BASIC')} onChange={e => setConfig('plan', e.target.value)} className={inputCls} style={inputStyle}>
              <option value="BASIC">Básico</option>
              <option value="PRO">Pro</option>
            </select>
          </div>
          <Field label="Precio especial (COP/mes)" value={String(cfg.override_price ?? '')} onChange={v => setConfig('override_price', Number(v))} type="number" />
          <Field label="Precio original tachado (COP/mes)" value={String(cfg.original_price ?? '')} onChange={v => setConfig('original_price', Number(v))} type="number" />
          <Field label="Etiqueta (ej: Oferta de lanzamiento)" value={String(cfg.label ?? '')} onChange={v => setConfig('label', v)} />
        </>)}

        {form.type === 'coupon' && (
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Los cupones se gestionan en la sección de Cupones más abajo.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Toggle checked={form.active} onChange={v => set('active', v)} />
        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Activa esta promoción inmediatamente</span>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={() => onSave(form)} disabled={saving || !form.name.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-50" style={{ backgroundColor: '#FF5C3A' }}>
          {saving && <IconSpinner />}Guardar
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[13px] transition-colors" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
        >Cancelar</button>
      </div>
    </div>
  );
}

// ── Formulario de cupón ───────────────────────────────────────────────────────

const EMPTY_COUPON: Omit<Coupon, 'id' | 'created_at' | 'uses_count'> = {
  code: '',
  discount_type: 'pct',
  discount_value: 10,
  max_uses: undefined,
  expires_at: undefined,
  plan_ids: [],
  active: true,
};

function CouponForm({ initial, onSave, onCancel, saving }: {
  initial: Omit<Coupon, 'id' | 'created_at' | 'uses_count'>;
  onSave: (data: Omit<Coupon, 'id' | 'created_at' | 'uses_count'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Código</label>
          <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="BLACKFRIDAY20" className={`${inputCls} font-mono`} style={inputStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Tipo de descuento</label>
          <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} className={inputCls} style={inputStyle}>
            <option value="pct">Porcentaje (%)</option>
            <option value="fixed">Monto fijo (COP)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
            Valor {form.discount_type === 'pct' ? '(%)' : '(COP)'}
          </label>
          <input type="number" value={form.discount_value} onChange={e => set('discount_value', Number(e.target.value))} className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Usos máximos (vacío = ilimitado)</label>
          <input type="number" value={form.max_uses ?? ''} onChange={e => set('max_uses', e.target.value ? Number(e.target.value) : undefined)} placeholder="Ilimitado" className={inputCls} style={inputStyle} />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Fecha de expiración (opcional)</label>
        <input type="datetime-local" value={form.expires_at ? form.expires_at.slice(0, 16) : ''} onChange={e => set('expires_at', e.target.value ? new Date(e.target.value).toISOString() : undefined)} className={inputCls} style={inputStyle} />
      </div>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Planes aplicables (vacío = todos)</label>
        <div className="flex gap-2">
          {['BASIC', 'PRO', 'LANDING'].map(p => {
            const active = form.plan_ids.includes(p);
            return (
              <button key={p} onClick={() => set('plan_ids', active ? form.plan_ids.filter(x => x !== p) : [...form.plan_ids, p])}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                style={{
                  border: `1px solid ${active ? '#FF5C3A' : 'var(--border-color)'}`,
                  backgroundColor: active ? 'rgba(255,92,58,0.1)' : 'var(--bg-hover)',
                  color: active ? '#FF5C3A' : 'var(--text-secondary)',
                }}
              >{p}</button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Toggle checked={form.active} onChange={v => set('active', v)} />
        <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Cupón activo</span>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)} disabled={saving || !form.code.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-50" style={{ backgroundColor: '#FF5C3A' }}>
          {saving && <IconSpinner />}Guardar cupón
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[13px] transition-colors" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
        >Cancelar</button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'promos' | 'coupons'>('promos');

  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [savingPromo, setSavingPromo] = useState(false);

  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);

  const [error, setError] = useState('');

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('adminToken') ?? '' : '';

  const loadPromos = useCallback(async () => {
    const token = getToken();
    const res = await fetch('/api/admin/promotions', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setPromos(d.data ?? []); }
  }, []);

  const loadCoupons = useCallback(async () => {
    const token = getToken();
    const res = await fetch(`${API_URL}/api/admin/coupons`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setCoupons(d.data ?? []); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPromos(), loadCoupons()]).finally(() => setLoading(false));
  }, [loadPromos, loadCoupons]);

  // ── CRUD Promociones ──

  const handleSavePromo = async (data: Omit<Promotion, 'id' | 'created_at'>) => {
    setSavingPromo(true); setError('');
    try {
      const token = getToken();
      const isEdit = !!editingPromo;
      const url = isEdit ? `/api/admin/promotions/${editingPromo!.id}` : '/api/admin/promotions';
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar');
      setShowPromoForm(false); setEditingPromo(null); await loadPromos();
    } catch (e: any) { setError(e.message); } finally { setSavingPromo(false); }
  };

  const handleTogglePromo = async (promo: Promotion) => {
    const token = getToken();
    await fetch(`/api/admin/promotions/${promo.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !promo.active }) });
    await loadPromos();
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    const token = getToken();
    await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await loadPromos();
  };

  // ── CRUD Cupones ──

  const handleSaveCoupon = async (data: Omit<Coupon, 'id' | 'created_at' | 'uses_count'>) => {
    setSavingCoupon(true); setError('');
    try {
      const token = getToken();
      const isEdit = !!editingCoupon;
      const url = isEdit ? `${API_URL}/api/admin/coupons/${editingCoupon!.id}` : `${API_URL}/api/admin/coupons`;
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar');
      setShowCouponForm(false); setEditingCoupon(null); await loadCoupons();
    } catch (e: any) { setError(e.message); } finally { setSavingCoupon(false); }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    const token = getToken();
    await fetch(`${API_URL}/api/admin/coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await loadCoupons();
  };

  // ── Render ──

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,92,58,0.15)', color: '#FF5C3A' }}>
            <IconMegaphone />
          </div>
          <div>
            <h1 className="font-syne font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Promociones</h1>
            <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Modales, banners, cupones y precios especiales</p>
          </div>
        </div>
        <button
          onClick={() => { setShowPromoForm(true); setEditingPromo(null); setTab('promos'); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#FF5C3A' }}
        >
          <IconPlus />Nueva promoción
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg px-4 py-3 flex items-center justify-between text-[12px]"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          {error}
          <button onClick={() => setError('')}><IconClose /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {(['promos', 'coupons'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{ backgroundColor: tab === t ? '#FF5C3A' : 'transparent', color: tab === t ? '#fff' : 'var(--text-secondary)' }}
          >
            {t === 'promos' ? 'Promociones' : 'Cupones'}
          </button>
        ))}
      </div>

      {/* ── TAB: Promociones ── */}
      {tab === 'promos' && (
        <div className="space-y-4">
          {showPromoForm && (
            <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <p className="font-syne font-semibold text-[15px] mb-4" style={{ color: 'var(--text-primary)' }}>
                {editingPromo ? 'Editar promoción' : 'Nueva promoción'}
              </p>
              <PromoForm
                initial={editingPromo
                  ? { type: editingPromo.type, name: editingPromo.name, config: editingPromo.config, active: editingPromo.active, starts_at: editingPromo.starts_at, ends_at: editingPromo.ends_at }
                  : EMPTY_PROMO}
                onSave={handleSavePromo}
                onCancel={() => { setShowPromoForm(false); setEditingPromo(null); }}
                saving={savingPromo}
              />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12" style={{ color: 'var(--text-muted)' }}><IconSpinner /></div>
          ) : promos.length === 0 ? (
            <div className="text-center py-16 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <div className="flex justify-center mb-3"><IconTag /></div>
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>No hay promociones. Crea la primera.</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Nombre', 'Tipo', 'Vigencia', 'Activa', ''].map((h, i) => (
                      <th key={i} className={`px-5 py-3 font-semibold text-[11px] uppercase tracking-wide ${i === 3 ? 'text-center' : 'text-left'}`} style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {promos.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                    >
                      <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: TYPE_COLORS[p.type] }}>
                          {TYPE_LABELS[p.type]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        {p.ends_at ? `Hasta ${formatDate(p.ends_at)}` : 'Sin fecha límite'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Toggle checked={p.active} onChange={() => handleTogglePromo(p)} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => { setEditingPromo(p); setShowPromoForm(true); }} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                            title="Editar"><IconEdit /></button>
                          <button onClick={() => handleDeletePromo(p.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                            title="Eliminar"><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Cupones ── */}
      {tab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setShowCouponForm(true); setEditingCoupon(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#10b981' }}
            >
              <IconPlus />Nuevo cupón
            </button>
          </div>

          {showCouponForm && (
            <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <p className="font-syne font-semibold text-[15px] mb-4" style={{ color: 'var(--text-primary)' }}>
                {editingCoupon ? 'Editar cupón' : 'Nuevo cupón'}
              </p>
              <CouponForm
                initial={editingCoupon
                  ? { code: editingCoupon.code, discount_type: editingCoupon.discount_type, discount_value: editingCoupon.discount_value, max_uses: editingCoupon.max_uses, expires_at: editingCoupon.expires_at, plan_ids: editingCoupon.plan_ids, active: editingCoupon.active }
                  : EMPTY_COUPON}
                onSave={handleSaveCoupon}
                onCancel={() => { setShowCouponForm(false); setEditingCoupon(null); }}
                saving={savingCoupon}
              />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12" style={{ color: 'var(--text-muted)' }}><IconSpinner /></div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>No hay cupones. Crea el primero.</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Código', 'Descuento', 'Usos', 'Expira', 'Planes', 'Activo', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                    >
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: '#10b981' }}>{c.code}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                        {c.discount_type === 'pct' ? `${c.discount_value}%` : `$${c.discount_value.toLocaleString('es-CO')}`}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ''}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{formatDate(c.expires_at)}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        {c.plan_ids.length ? c.plan_ids.join(', ') : 'Todos'}
                      </td>
                      <td className="px-4 py-3">
                        <Toggle checked={c.active} onChange={async () => {
                          const token = getToken();
                          await fetch(`${API_URL}/api/admin/coupons/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !c.active }) });
                          await loadCoupons();
                        }} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditingCoupon(c); setShowCouponForm(true); }} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                          ><IconEdit /></button>
                          <button onClick={() => handleDeleteCoupon(c.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
                          ><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
