'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border shadow-sm overflow-hidden">
      <div style={{ borderColor: 'var(--border-color)' }} className="flex items-center gap-3 px-6 py-4 border-b">
        <div style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">{icon}</div>
        <h2 style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function IconExternalLink({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>; }
function IconCheck({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>; }

export default function ConfigContactPage() {
  const [landingPrice, setLandingPrice] = useState(650000);
  const [landingOriginalPrice, setLandingOriginalPrice] = useState(900000);
  const [savingPrice, setSavingPrice] = useState(false);
  const [manualWhatsapp, setManualWhatsapp] = useState('+57 310 543 6281');
  const [manualEmail, setManualEmail] = useState('info@lookitry.com');
  const [social_instagram, setSocialInstagram] = useState('@looki.try');
  const [social_tiktok, setSocialTiktok] = useState('@lookitry');
  const [social_facebook, setSocialFacebook] = useState('');
  const [social_youtube, setSocialYoutube] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [trmAuto, setTrmAuto] = useState(true);
  const [trmReferencia, setTrmReferencia] = useState(4000);
  const [savingTrm, setSavingTrm] = useState(false);
  const [replicateApiToken, setReplicateApiToken] = useState('');
  const [replicateMonthlyBudgetUsd, setReplicateMonthlyBudgetUsd] = useState('');
  const [pricingMeta, setPricingMeta] = useState<Record<string, any>>({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  function flash(msg: string, type: 'ok' | 'err') {
    if (type === 'ok') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  }

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, pricingRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/payment-settings`, { credentials: 'include' }),
          fetch(`${API_URL}/api/admin/pricing`, { credentials: 'include' }),
        ]);
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setLandingPrice(s.landing_price ?? 650000);
          setLandingOriginalPrice(s.landing_original_price ?? 900000);
          setManualWhatsapp(s.manual_whatsapp ?? '+57 310 543 6281');
          setManualEmail(s.manual_email ?? 'info@lookitry.com');
        }
        if (pricingRes.ok) {
          const p = await pricingRes.json();
          const metaRow = Array.isArray(p?.data) ? p.data.find((r: any) => r.id === 'meta') : null;
          if (metaRow?.data) {
            setPricingMeta(metaRow.data);
            setSocialInstagram(metaRow.data.social_instagram ?? '@looki.try');
            setSocialTiktok(metaRow.data.social_tiktok ?? '@lookitry');
            setSocialFacebook(metaRow.data.social_facebook ?? '');
            setSocialYoutube(metaRow.data.social_youtube ?? '');
            setReplicateApiToken(metaRow.data.replicate_api_token ?? '');
            setReplicateMonthlyBudgetUsd(metaRow.data.replicate_monthly_budget_usd !== undefined && metaRow.data.replicate_monthly_budget_usd !== null ? String(metaRow.data.replicate_monthly_budget_usd) : '');
            setTrmAuto(metaRow.data.trm_auto !== false);
            const rawTrm = metaRow.data.trm_referencia;
            if (rawTrm && Number(rawTrm) > 0) setTrmReferencia(Number(rawTrm));
          }
        }
      } catch {}
    }
    load();
  }, []);

  async function handleSavePrice() {
    setSavingPrice(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/pricing`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landing_price: landingPrice, landing_original_price: landingOriginalPrice }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      flash('Precios guardados', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingPrice(false); }
  }

  async function handleSaveContact() {
    setSavingContact(true);
    try {
      const nextMeta = {
        ...pricingMeta,
        social_instagram, social_tiktok, social_facebook, social_youtube,
        trm_auto: trmAuto, trm_referencia: trmReferencia,
        replicate_api_token: replicateApiToken.trim(),
        replicate_monthly_budget_usd: replicateMonthlyBudgetUsd.trim() ? Number(replicateMonthlyBudgetUsd) : null,
      };
      const [settingsRes, pricingRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/payment-settings`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ manual_whatsapp: manualWhatsapp, manual_email: manualEmail }) }),
        fetch(`${API_URL}/api/admin/pricing`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'meta', data: nextMeta }) }),
      ]);
      if (!settingsRes.ok) throw new Error((await settingsRes.json()).message || 'Error');
      if (!pricingRes.ok) throw new Error((await pricingRes.json()).error || 'Error');
      setPricingMeta(nextMeta);
      flash('Contacto y redes guardados', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingContact(false); }
  }

  async function handleSaveTrm() {
    setSavingTrm(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/pricing`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'meta', data: { ...pricingMeta, trm_auto: trmAuto, trm_referencia: trmReferencia } }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      flash('TRM guardada', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingTrm(false); }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Link href="/admin/config" className="text-sm" style={{ color: 'var(--text-muted)' }}>Configuración</Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">Contacto y precios</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">WhatsApp, email, redes sociales y precio de landing.</p>
      </div>

      {success && <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>{success}</div>}
      {error && <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>{error}</div>}

      <Section title="Precio de mini-landing" icon={<IconExternalLink className="w-4 h-4" />}>
        <div className="space-y-4">
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">Valor de compra única mostrado en el sitio y flujos comerciales.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Precio actual (COP)</label>
              <input type="number" min={0} value={landingPrice} onChange={e => setLandingPrice(Number(e.target.value || 0))} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Precio comparativo (COP)</label>
              <input type="number" min={0} value={landingOriginalPrice} onChange={e => setLandingOriginalPrice(Number(e.target.value || 0))} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSavePrice} disabled={savingPrice} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60">
              {savingPrice ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" /> : <IconCheck className="w-4 h-4" />} Guardar precio
            </button>
          </div>
        </div>
      </Section>

      <Section title="Contacto oficial" icon={<IconExternalLink className="w-4 h-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">WhatsApp</label>
            <input type="text" value={manualWhatsapp} onChange={e => setManualWhatsapp(e.target.value)} placeholder="+57 310 543 6281" className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Email</label>
            <input type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="info@lookitry.com" className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Instagram</label>
            <input type="text" value={social_instagram} onChange={e => setSocialInstagram(e.target.value)} placeholder="@looki.try" className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">TikTok</label>
            <input type="text" value={social_tiktok} onChange={e => setSocialTiktok(e.target.value)} placeholder="@lookitry" className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Facebook</label>
            <input type="text" value={social_facebook} onChange={e => setSocialFacebook(e.target.value)} placeholder="" className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">YouTube</label>
            <input type="text" value={social_youtube} onChange={e => setSocialYoutube(e.target.value)} placeholder="" className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSaveContact} disabled={savingContact} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60">
            {savingContact ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" /> : <IconCheck className="w-4 h-4" />} Guardar contacto
          </button>
        </div>
      </Section>

      <Section title="TRM (USD/COP)" icon={<IconExternalLink className="w-4 h-4" />}>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={trmAuto} onChange={e => setTrmAuto(e.target.checked)} className="w-4 h-4 rounded" />
            <span style={{ color: 'var(--text-primary)' }} className="text-sm">Automática (tomada de external API)</span>
          </label>
        </div>
        {!trmAuto && (
          <div className="flex items-end gap-4">
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">TRM manual</label>
              <input type="number" min={1} value={trmReferencia} onChange={e => setTrmReferencia(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </div>
            <button onClick={handleSaveTrm} disabled={savingTrm} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60">
              {savingTrm ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" /> : <IconCheck className="w-4 h-4" />} Guardar TRM
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}
