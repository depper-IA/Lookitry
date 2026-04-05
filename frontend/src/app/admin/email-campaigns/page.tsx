'use client';

import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

type CampaignStatus = 'draft' | 'scheduled' | 'processing' | 'completed' | 'cancelled';
type FilterType = 'all' | 'trial' | 'paid' | 'plan';

interface CampaignStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  html_template: string;
  status: CampaignStatus;
  scheduled_at: string | null;
  filter_type: FilterType;
  filter_plan?: string;
  filter_created_after?: string;
  created_by: string;
  created_at: string;
  stats: CampaignStats;
}

interface CreateForm {
  name: string;
  subject: string;
  htmlTemplate: string;
  filterType: FilterType;
  filterPlan: string;
  filterCreatedAfter: string;
}

interface QuotaInfo {
  dailyLimit: number;
  remaining: number;
  resetHour: number;
}

function IconPlus() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function IconMail() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function IconPlay() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function IconClock() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function IconX() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconTrash() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function IconEye() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}
function IconCheck() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}
function IconSpinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function IconWarning() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  processing: 'Enviando',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: '#6b7280',
  scheduled: '#f59e0b',
  processing: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
};

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'Todas las marcas',
  trial: 'Solo Trial',
  paid: 'Solo Pagadas',
  plan: 'Plan específico',
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [quota, setQuota] = useState<QuotaInfo>({ dailyLimit: 300, remaining: 300, resetHour: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previews, setPreviews] = useState<Array<{ email: string; html: string }>>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [form, setForm] = useState<CreateForm>({
    name: '',
    subject: '',
    htmlTemplate: getDefaultTemplate(),
    filterType: 'all',
    filterPlan: '',
    filterCreatedAfter: '',
  });

  function getDefaultTemplate() {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px">
          <tr>
            <td style="background:#0a0a0a;padding:30px 40px;border-radius:16px 16px 0 0;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700">Lookitry</h1>
              <p style="margin:8px 0 0;color:#FF5C3A;font-size:12px;font-weight:600;letter-spacing:0.1em">VIRTUAL TRY-ON</p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px">
              <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 20px">Hola <strong>{{firstName}}</strong>,</p>
              <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 20px">Tenemos algo especial que contarte...</p>
              <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 20px">Tu marca <strong>{{brandName}}</strong> es importante para nosotros.</p>
              <div style="background:#f9f9f9;padding:24px;border-radius:12px;margin:30px 0;text-align:center">
                <p style="margin:0;color:#FF5C3A;font-size:20px;font-weight:700">LOOKITRY20</p>
                <p style="margin:8px 0 0;color:#666666;font-size:13px">20% de descuento en tu primer año</p>
              </div>
              <p style="color:#666666;font-size:13px;margin:20px 0 0">El equipo de Lookitry</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  const fetchCampaigns = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/email-campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error cargando campañas');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setQuota(data.remainingDailyQuota ? { dailyLimit: 300, remaining: data.remainingDailyQuota, resetHour: 0 } : quota);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.htmlTemplate.trim()) {
      setError('Nombre, asunto y template son requeridos');
      return;
    }
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/email-campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error creando campaña');
      }
      setShowModal(false);
      setForm({ name: '', subject: '', htmlTemplate: getDefaultTemplate(), filterType: 'all', filterPlan: '', filterCreatedAfter: '' });
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLaunch = async (id: string) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/email-campaigns/${id}/launch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error iniciando campaña');
      }
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSchedule = async (id: string) => {
    const scheduledAt = prompt('Fecha y hora de envío (YYYY-MM-DDTHH:MM):', new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    if (!scheduledAt) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/email-campaigns/${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scheduledAt }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error programando campaña');
      }
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta campaña?')) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/email-campaigns/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error cancelando campaña');
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta campaña? Esta acción no se puede deshacer.')) return;
    setActionLoading(id);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/email-campaigns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error eliminando campaña');
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreview = async (id: string) => {
    setShowPreviewModal(id);
    setLoadingPreview(true);
    setPreviews([]);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/email-campaigns/${id}/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error cargando preview');
      const data = await res.json();
      setPreviews(data.previews || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0a0a0a]">Email Campaigns</h1>
          <p className="text-sm text-[#999] mt-1">
            Cuota diaria: <span className="text-[#FF5C3A] font-semibold">{quota.remaining}/{quota.dailyLimit}</span> emails restantes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF5C3A] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <IconPlus />
          Nueva Campaña
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <IconWarning />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><IconX /></button>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-[#e5e5e5]">
          <IconMail />
          <p className="text-[#999] mt-2">No hay campañas todavía</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-[#FF5C3A] hover:underline"
          >
            Crear la primera campaña
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#e5e5e5] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#e5e5e5]">
                <th className="text-left px-4 py-3 text-sm font-medium text-[#666]">Nombre</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#666]">Asunto</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#666]">Estado</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#666]">Progreso</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-[#666]">Programada</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-[#666]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0a0a0a]">{campaign.name}</p>
                    <p className="text-xs text-[#999]">{FILTER_LABELS[campaign.filter_type]}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#666] max-w-[200px] truncate">{campaign.subject}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${STATUS_COLORS[campaign.status]}20`, color: STATUS_COLORS[campaign.status] }}
                    >
                      {STATUS_LABELS[campaign.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {campaign.status === 'processing' ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#e5e5e5] rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-[#FF5C3A] transition-all"
                            style={{ width: `${campaign.stats.total > 0 ? (campaign.stats.sent / campaign.stats.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#999]">
                          {campaign.stats.sent}/{campaign.stats.total}
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-4 text-xs text-[#999]">
                        <span className="text-[#10b981]">{campaign.stats.sent} env</span>
                        <span className="text-[#3b82f6]">{campaign.stats.opened} ab</span>
                        <span className="text-[#8b5cf6]">{campaign.stats.clicked} cl</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#666]">{formatDate(campaign.scheduled_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePreview(campaign.id)}
                        className="p-2 text-[#999] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                        title="Previsualizar"
                      >
                        <IconEye />
                      </button>
                      {campaign.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleLaunch(campaign.id)}
                            disabled={actionLoading === campaign.id}
                            className="p-2 text-[#10b981] hover:bg-[#f0fdf4] rounded-lg transition-colors disabled:opacity-50"
                            title="Enviar ahora"
                          >
                            {actionLoading === campaign.id ? <IconSpinner /> : <IconPlay />}
                          </button>
                          <button
                            onClick={() => handleSchedule(campaign.id)}
                            disabled={actionLoading === campaign.id}
                            className="p-2 text-[#f59e0b] hover:bg-[#fffbeb] rounded-lg transition-colors disabled:opacity-50"
                            title="Programar"
                          >
                            <IconClock />
                          </button>
                        </>
                      )}
                      {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                        <button
                          onClick={() => handleCancel(campaign.id)}
                          disabled={actionLoading === campaign.id}
                          className="p-2 text-[#ef4444] hover:bg-[#fef2f2] rounded-lg transition-colors disabled:opacity-50"
                          title="Cancelar"
                        >
                          <IconX />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        disabled={actionLoading === campaign.id}
                        className="p-2 text-[#999] hover:text-[#ef4444] hover:bg-[#fef2f2] rounded-lg transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#e5e5e5]">
              <h2 className="text-lg font-bold text-[#0a0a0a]">Nueva Campaña de Email</h2>
              <button onClick={() => setShowModal(false)}><IconX /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Nombre de la campaña *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ej: Lanzamiento Abril 2026"
                  className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Asunto del email *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="ej: Lookitry: Gran noticia para ti"
                  className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Destinatarios</label>
                <select
                  value={form.filterType}
                  onChange={(e) => setForm({ ...form, filterType: e.target.value as FilterType })}
                  className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
                >
                  <option value="all">Todas las marcas</option>
                  <option value="trial">Solo marcas en Trial</option>
                  <option value="paid">Solo marcas con plan pagado</option>
                  <option value="plan">Plan específico</option>
                </select>
              </div>
              {form.filterType === 'plan' && (
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">Nombre del plan</label>
                  <input
                    type="text"
                    value={form.filterPlan}
                    onChange={(e) => setForm({ ...form, filterPlan: e.target.value })}
                    placeholder="ej: BASIC, PRO, ENTERPRISE"
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
                  />
                </div>
              )}
              {form.filterType === 'all' && (
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">Solo marcas creadas después de</label>
                  <input
                    type="date"
                    value={form.filterCreatedAfter}
                    onChange={(e) => setForm({ ...form, filterCreatedAfter: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A]"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Template HTML *</label>
                <p className="text-xs text-[#999] mb-2">Variables disponibles: {'{{firstName}}'}, {'{{brandName}}'}, {'{{email}}'}, {'{{plan}}'}</p>
                <textarea
                  value={form.htmlTemplate}
                  onChange={(e) => setForm({ ...form, htmlTemplate: e.target.value })}
                  rows={15}
                  className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-[#0a0a0a] focus:outline-none focus:border-[#FF5C3A] font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#e5e5e5]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-[#666] hover:text-[#0a0a0a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-[#FF5C3A] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Crear Campaña
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#e5e5e5]">
              <h2 className="text-lg font-bold text-[#0a0a0a]">Previsualización</h2>
              <button onClick={() => setShowPreviewModal(null)}><IconX /></button>
            </div>
            <div className="p-6">
              {loadingPreview ? (
                <div className="flex justify-center py-8"><IconSpinner /></div>
              ) : previews.length > 0 ? (
                <div className="space-y-6">
                  {previews.map((preview, idx) => (
                    <div key={idx}>
                      <p className="text-sm text-[#999] mb-2">{preview.email}</p>
                      <div
                        className="border border-[#e5e5e5] rounded-lg p-4 bg-[#fafafa]"
                        dangerouslySetInnerHTML={{ __html: preview.html }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[#999]">No hay previews disponibles</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
