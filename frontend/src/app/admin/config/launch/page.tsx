'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

function IconRocket({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>; }
function IconCheck({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>; }
function IconExternalLink({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>; }

export default function ConfigLaunchPage() {
  const [settings, setSettings] = useState({
    googleSiteVerification: 'F-LW3EGCNrjEhNaAT56Qrioyo4-UD2CRWYyqgS-sExE',
    uptimerobotStatusUrl: 'https://stats.uptimerobot.com/CTEnSD7d1j',
    gaMeasurementId: 'G-F8277E4Z39',
    launchDiscountCode: 'LAUNCH20',
    launchDiscountPercent: 20,
    launchEndDate: '2026-04-30',
    betaToPaidDiscount: 20,
    sendLaunchEmail: false,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  function flash(msg: string, type: 'ok' | 'err') {
    if (type === 'ok') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  }

  useEffect(() => {
    const saved = localStorage.getItem('launchSettings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch {}
    }
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem('launchSettings', JSON.stringify(settings));
      flash('Configuración de launch guardada', 'ok');
    } catch { flash('Error al guardar', 'err'); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Link href="/admin/config" className="text-sm" style={{ color: 'var(--text-muted)' }}>Configuración</Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">🚀 Launch</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">SEO, analytics, código de descuento y campaña de lanzamiento.</p>
      </div>

      {success && <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>{success}</div>}
      {error && <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>{error}</div>}

      <Section title="SEO y Analytics" icon={<IconExternalLink className="w-4 h-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Google Site Verification</label>
            <input type="text" value={settings.googleSiteVerification} onChange={e => setSettings(p => ({ ...p, googleSiteVerification: e.target.value }))} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm font-mono" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">GA4 Measurement ID</label>
            <input type="text" value={settings.gaMeasurementId} onChange={e => setSettings(p => ({ ...p, gaMeasurementId: e.target.value }))} placeholder="G-XXXXXXXXXX" className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm font-mono" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div className="md:col-span-2">
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">UptimeRobot Status URL</label>
            <input type="url" value={settings.uptimerobotStatusUrl} onChange={e => setSettings(p => ({ ...p, uptimerobotStatusUrl: e.target.value }))} placeholder="https://stats.uptimerobot.com/..." className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm font-mono" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
        </div>
      </Section>

      <Section title="Programa de Referidos" icon={<IconRocket className="w-4 h-4" />}>
        <div style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }} className="w-full rounded-xl border px-3 py-3 text-sm font-semibold">
          500 créditos extra solo para el referente
        </div>
        <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">Se acredita automáticamente cuando el referido completa su primer pago mensual.</p>
      </Section>

      <Section title="Campaña de Lanzamiento" icon={<IconRocket className="w-4 h-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Código de descuento</label>
            <input type="text" value={settings.launchDiscountCode} onChange={e => setSettings(p => ({ ...p, launchDiscountCode: e.target.value.toUpperCase() }))} placeholder="LAUNCH20" className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm font-mono" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">% Descuento</label>
            <input type="number" min={0} max={100} value={settings.launchDiscountPercent} onChange={e => setSettings(p => ({ ...p, launchDiscountPercent: Number(e.target.value) }))} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }} className="block text-xs font-semibold uppercase tracking-wide mb-2">Fecha fin</label>
            <input type="date" value={settings.launchEndDate} onChange={e => setSettings(p => ({ ...p, launchEndDate: e.target.value }))} className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5C3A] text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C3A] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60">
            {saving ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" /> : <IconCheck className="w-4 h-4" />} Guardar launch
          </button>
        </div>
      </Section>
    </div>
  );
}
