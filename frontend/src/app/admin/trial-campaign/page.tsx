'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

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

function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {active ? 'Activa' : 'Inactiva'}
    </span>
  );
}

export default function TrialCampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulario nueva campaña — sin verificación de tarjeta
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDays, setFormDays] = useState(7);
  const [formGenerations, setFormGenerations] = useState(50);
  const [formEndsAt, setFormEndsAt] = useState('');

  // Configuración global de verificación de tarjeta (independiente de campaña)
  const [requireCard, setRequireCard] = useState(true);
  const [savingCard, setSavingCard] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/trial-campaign`, { headers });
      const data = await res.json();
      const list: Campaign[] = data.campaigns ?? [];
      setCampaigns(list);
      const active = data.activeCampaign ?? null;
      setActiveCampaign(active);
      // Sincronizar toggle global con la campaña activa (o la más reciente)
      const ref = active ?? list[0] ?? null;
      if (ref) setRequireCard(ref.require_card_verification);
    } catch {
      setError('Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/trial-campaign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formName,
          trial_days: formDays,
          trial_generations_limit: formGenerations,
          ends_at: formEndsAt || null,
          active: true,
          require_card_verification: requireCard,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setSuccess('Campaña creada y activada correctamente');
      setShowForm(false);
      setFormName('');
      setFormDays(7);
      setFormGenerations(50);
      setFormEndsAt('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Error al crear campaña');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCardGlobal() {
    const newVal = !requireCard;
    setSavingCard(true);
    setError('');
    setSuccess('');
    try {
      // Actualizar todas las campañas activas con el nuevo valor
      const targets = campaigns.filter(c => c.active);
      if (targets.length === 0) {
        // No hay campaña activa — solo actualizar estado local para nuevas campañas
        setRequireCard(newVal);
        setSuccess(newVal ? 'Verificación activada (se aplicará a la próxima campaña)' : 'Verificación desactivada (modo test)');
        return;
      }
      await Promise.all(targets.map(c =>
        fetch(`${API_URL}/api/admin/trial-campaign/${c.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ require_card_verification: newVal }),
        })
      ));
      setRequireCard(newVal);
      setSuccess(newVal ? 'Verificación de tarjeta activada' : 'Verificación desactivada — modo test activo');
      await load();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar verificación');
    } finally {
      setSavingCard(false);
    }
  }

  async function handleToggle(campaign: Campaign) {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/trial-campaign/${campaign.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ active: !campaign.active }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setSuccess(campaign.active ? 'Campaña desactivada' : 'Campaña activada');
      await load();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar campaña');
    } finally {
      setSaving(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-syne font-bold">Campañas de Trial</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
            Controla cuándo está disponible el período de prueba gratuito en el registro.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-[#FF5C3A] text-white text-sm font-semibold rounded-xl hover:bg-[#e04e30] transition-colors"
        >
          <IconPlus />
          Nueva campaña
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm px-4 py-3 rounded-xl">{success}</div>
      )}

      {/* Estado actual */}
      <div style={{
        borderColor: activeCampaign ? '#10b981' : 'var(--border-color)',
        background: activeCampaign ? 'rgba(16,185,129,0.06)' : 'var(--bg-hover)',
      }} className="rounded-2xl border-2 p-5">
        <div className="flex items-center gap-3">
          <div style={{
            background: activeCampaign ? 'rgba(16,185,129,0.12)' : 'var(--bg-card)',
            color: activeCampaign ? '#10b981' : 'var(--text-muted)',
          }} className="w-10 h-10 rounded-xl flex items-center justify-center">
            <IconClock />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm font-semibold">Estado actual del trial</p>
            {activeCampaign ? (
              <p className="text-sm text-emerald-500">
                Campaña activa: <span className="font-semibold">{activeCampaign.name}</span>
                {' — '}{activeCampaign.trial_days} días de prueba
                {activeCampaign.ends_at && ` — Vence: ${formatDate(activeCampaign.ends_at)}`}
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                Sin campaña activa — los nuevos registros no reciben período de prueba
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Sección independiente: Verificación de tarjeta ── */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div style={{ background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconShield />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p style={{ color: 'var(--text-primary)' }} className="text-sm font-semibold">Verificación de tarjeta</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
                  {requireCard
                    ? 'Activa — el usuario debe tokenizar una tarjeta con Wompi para activar el trial'
                    : 'Desactivada — modo test, el trial se activa sin requerir tarjeta'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleCardGlobal}
                disabled={savingCard}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 flex-shrink-0 ${
                  requireCard ? 'bg-[#FF5C3A]' : 'bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  requireCard ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }} className="text-xs mt-2 pt-2 border-t">
              Esta configuración aplica a la campaña activa y a las nuevas campañas que se creen.
            </p>
          </div>
        </div>
      </div>

      {/* Formulario nueva campaña — simplificado */}
      {showForm && (
        <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl p-6 shadow-sm">
          <h2 style={{ color: 'var(--text-primary)' }} className="text-base font-semibold mb-4">Nueva campaña de trial</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Nombre de la campaña</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ej: Lanzamiento marzo 2026"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full border rounded-xl px-3 py-2 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Días de trial</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={formDays}
                  onChange={e => setFormDays(Number(e.target.value))}
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full border rounded-xl px-3 py-2 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                />
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Generaciones incluidas</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={formGenerations}
                  onChange={e => setFormGenerations(Number(e.target.value))}
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full border rounded-xl px-3 py-2 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                />
              </div>
              <div className="col-span-2">
                <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Fecha de vencimiento de la campaña (opcional)</label>
                <input
                  type="datetime-local"
                  value={formEndsAt}
                  onChange={e => setFormEndsAt(e.target.value)}
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full border rounded-xl px-3 py-2 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                />
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs">
              La campaña se creará activa por defecto. La verificación de tarjeta se hereda de la configuración global ({requireCard ? 'activa' : 'desactivada'}).
              Cualquier campaña activa anterior se desactivará automáticamente. El trial incluye 1 producto y {formGenerations} generaciones.
            </p>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-[#FF5C3A] text-white text-sm font-semibold rounded-xl hover:bg-[#e04e30] disabled:opacity-60 transition-colors"
              >
                <IconCheck />
                {saving ? 'Guardando...' : 'Crear y activar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                className="px-4 py-2 min-h-[44px] text-sm border rounded-xl hover:opacity-80 transition-opacity"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de campañas */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="border rounded-2xl overflow-hidden shadow-sm">
        <div style={{ borderColor: 'var(--border-color)' }} className="px-6 py-4 border-b">
          <h2 style={{ color: 'var(--text-secondary)' }} className="text-sm font-semibold">Historial de campañas</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5C3A]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No hay campañas creadas aún</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="border-b">
                  <th style={{ color: 'var(--text-muted)' }} className="text-left px-6 py-3 font-semibold text-xs uppercase tracking-wide">Nombre</th>
                  <th style={{ color: 'var(--text-muted)' }} className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide">Estado</th>
                  <th style={{ color: 'var(--text-muted)' }} className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide">Días</th>
                  <th style={{ color: 'var(--text-muted)' }} className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide">Generaciones</th>
                  <th style={{ color: 'var(--text-muted)' }} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Vence</th>
                  <th style={{ color: 'var(--text-muted)' }} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide">Creada</th>
                  <th style={{ color: 'var(--text-muted)' }} className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide">Acción</th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--border-color)' }} className="divide-y">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:opacity-80 transition-opacity">
                    <td style={{ color: 'var(--text-primary)' }} className="px-6 py-3.5 font-medium">{c.name}</td>
                    <td className="px-4 py-3.5 text-center"><StatusBadge active={c.active} /></td>
                    <td style={{ color: 'var(--text-secondary)' }} className="px-4 py-3.5 text-center">{c.trial_days}d</td>
                    <td style={{ color: 'var(--text-secondary)' }} className="px-4 py-3.5 text-center">{c.trial_generations_limit ?? 50}</td>
                    <td style={{ color: 'var(--text-muted)' }} className="px-4 py-3.5">
                      {c.ends_at ? formatDate(c.ends_at) : <span style={{ color: 'var(--text-muted)' }}>Sin límite</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }} className="px-4 py-3.5">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggle(c)}
                        disabled={saving}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
                          c.active ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                        }`}
                      >
                        {c.active ? <><IconStop />Desactivar</> : <><IconCheck />Activar</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
