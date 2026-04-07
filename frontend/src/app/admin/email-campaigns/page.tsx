'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/services/adminApi';
import { Toast, ToastType } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type CampaignStatus = 'draft' | 'scheduled' | 'processing' | 'completed' | 'cancelled';
type FilterType = 'all' | 'trial' | 'paid' | 'plan' | 'leads';

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
  filterCity: string;
  filterCountry: string;
  filterBusinessType: string;
  filterStatus: string;
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
function IconSend({ className }: { className?: string }) {
  return <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
}
function IconSettings({ className }: { className?: string }) {
  return <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
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
  leads: 'Prospectos (Leads)',
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
    filterCity: '',
    filterCountry: '',
    filterBusinessType: '',
    filterStatus: '',
  });
  
  const [filterOptions, setFilterOptions] = useState<{
    cities: string[];
    countries: string[];
    businessTypes: string[];
    statuses: string[];
  }>({ cities: [], countries: [], businessTypes: [], statuses: [] });
  const [showTestModal, setShowTestModal] = useState<{ id: string } | null>(null);
  const [testEmail, setTestEmail] = useState('soporte@lookitry.com');
  const [showTestingCenter, setShowTestingCenter] = useState(false);
  const [testAdHoc, setTestAdHoc] = useState({ subject: 'Prueba de Diseño - Lookitry', html: '', email: 'soporte@lookitry.com' });
  const [testLoading, setTestLoading] = useState(false);

  // UI States
  const [toast, setToast] = useState<{ show: boolean; message: string; type: ToastType }>({
    show: false,
    message: '',
    type: 'info'
  });
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    type: 'delete' | 'cancel'; 
    id: string | null 
  }>({
    isOpen: false,
    type: 'delete',
    id: null
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ show: true, message, type });
  };

  function getDefaultTemplate() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LOOKITRY - Revolucionando tu Tienda</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #050505; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050505; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header con Logo -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="font-size: 32px; font-weight: 800; letter-spacing: -1.5px; color: #ffffff; font-family: Arial, sans-serif;">
                Look<span style="color: #FF5C3A;">itry</span>
              </div>
              <div style="color: #666; font-size: 11px; margin-top: 8px; text-transform: uppercase; letter-spacing: 3px; font-weight: 600;">Virtual Try-On Experience</div>
            </td>
          </tr>

          <!-- Hero / Contenido Principal -->
          <tr>
            <td style="padding: 20px 40px 40px 40px;">
              <h1 style="font-size: 34px; font-weight: 800; line-height: 1.1; margin-top: 0; color: #ffffff; letter-spacing: -0.5px;">
                ¡Hola {{firstName}}! <span style="color: #FF5C3A;">Prepárate</span> para el futuro.
              </h1>
              <p style="color: #999999; font-size: 17px; line-height: 1.6; margin-bottom: 35px;">
                Imagina que tus clientes puedan probarse toda tu colección en segundos, directamente desde tu tienda. <strong>Lookitry</strong> convierte la duda en una compra inmediata.
              </p>
              
              <!-- Tarjeta de Beneficios -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 40px; background-color: #141414; border-radius: 16px; border: 1px solid #222;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" style="text-align: center; border-right: 1px solid #222;">
                          <div style="font-size: 24px; margin-bottom: 8px;">🚀</div>
                          <div style="color: #ffffff; font-size: 12px; font-weight: 800; text-transform: uppercase;">Ventas +30%</div>
                        </td>
                        <td width="33%" style="text-align: center; border-right: 1px solid #222;">
                          <div style="font-size: 24px; margin-bottom: 8px;">📉</div>
                          <div style="color: #ffffff; font-size: 12px; font-weight: 800; text-transform: uppercase;">Devolución -20%</div>
                        </td>
                        <td width="33%" style="text-align: center;">
                          <div style="font-size: 24px; margin-bottom: 8px;">✨</div>
                          <div style="color: #ffffff; font-size: 12px; font-weight: 800; text-transform: uppercase;">Engagement</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 16px; line-height: 1.6; margin-bottom: 35px; text-align: center;">
                Estamos invitando a un grupo selecto de marcas a probar nuestra tecnología antes que nadie. ¿Te gustaría que <strong>{{brandName}}</strong> lidere esta revolución?
              </p>

              <!-- Botón de Acción (Call to Action) -->
              <div style="text-align: center;">
                <a href="https://lookitry.com" style="display: inline-block; background-color: #FF5C3A; color: #ffffff; padding: 20px 50px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 18px; box-shadow: 0 8px 25px rgba(255, 92, 58, 0.35);">
                  DESCUBRIR LOOKITRY
                </a>
              </div>
            </td>
          </tr>

          <!-- Divisor Sutil -->
          <tr>
             <td style="padding: 0 40px;">
               <div style="height: 1px; background: linear-gradient(90deg, transparent, #222, transparent);"></div>
             </td>
          </tr>

          <!-- Footer con Unsubscribe -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              <p style="color: #444444; font-size: 12px; line-height: 1.5; margin: 0;">
                Este correo fue enviado desde <strong>Lookitry</strong>.<br>
                Tecnología de punta para marcas que no conocen límites.<br>
                Medellín, Colombia.
              </p>
              <div style="margin-top: 25px;">
                <a href="#" style="color: #666; text-decoration: none; font-size: 11px; margin: 0 10px;">Darse de baja</a>
                <span style="color: #333;">|</span>
                <a href="#" style="color: #666; text-decoration: none; font-size: 11px; margin: 0 10px;">Privacidad</a>
              </div>
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
      const data = await adminApi.get('/admin/email-campaigns');
      setCampaigns(data.campaigns || []);
      if (data.remainingDailyQuota !== undefined) {
        setQuota(prev => ({ ...prev, remaining: data.remainingDailyQuota }));
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando campañas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilters = useCallback(async () => {
    try {
      const data = await adminApi.get('/admin/leads/filters');
      setFilterOptions(data);
    } catch (err: any) {
      console.error('Error loading filters', err);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchFilters();
  }, [fetchCampaigns, fetchFilters]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.htmlTemplate.trim()) {
      setError('Nombre, asunto y template son requeridos');
      return;
    }
    try {
      await adminApi.post('/admin/email-campaigns', {
        ...form,
        filterCity: form.filterCity || undefined,
        filterCountry: form.filterCountry || undefined,
        filterBusinessType: form.filterBusinessType || undefined,
        filterStatus: form.filterStatus || undefined,
      });
      setShowModal(false);
      setForm({ name: '', subject: '', htmlTemplate: getDefaultTemplate(), filterType: 'all', filterPlan: '', filterCreatedAfter: '', filterCity: '', filterCountry: '', filterBusinessType: '', filterStatus: '' });
      showToast('Campaña creada con éxito.', 'success');
      fetchCampaigns();
    } catch (err: any) {
      showToast('Error creando campaña: ' + err.message, 'error');
    }
  };

  const handleLaunch = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.post(`/admin/email-campaigns/${id}/launch`);
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message || 'Error iniciando campaña');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSchedule = async (id: string) => {
    const scheduledAt = prompt('Fecha y hora de envío (YYYY-MM-DDTHH:MM):', new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    if (!scheduledAt) return;
    setActionLoading(id);
    try {
      await adminApi.post(`/admin/email-campaigns/${id}/schedule`, { scheduledAt });
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message || 'Error programando campaña');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelClick = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'cancel', id });
  };

  const handleDeleteClick = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'delete', id });
  };

  const handleConfirmAction = async () => {
    const { id, type } = confirmModal;
    if (!id) return;

    setActionLoading(id);
    try {
      if (type === 'cancel') {
        await adminApi.post(`/admin/email-campaigns/${id}/cancel`);
        showToast('Campaña cancelada.', 'info');
      } else {
        await adminApi.delete(`/admin/email-campaigns/${id}`);
        showToast('Campaña eliminada.', 'success');
      }
      fetchCampaigns();
    } catch (err: any) {
      showToast(`Error al ${type === 'cancel' ? 'cancelar' : 'eliminar'}: ${err.message}`, 'error');
    } finally {
      setActionLoading(null);
      setConfirmModal({ isOpen: false, type: 'delete', id: null });
    }
  };

  const handlePreview = async (id: string) => {
    setShowPreviewModal(id);
    setLoadingPreview(true);
    setPreviews([]);
    try {
      const data = await adminApi.post(`/admin/email-campaigns/${id}/preview`);
      setPreviews(data.previews || []);
    } catch (err: any) {
      setError(err.message || 'Error cargando preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendTest = async (id: string, email: string) => {
    if (!email) return;
    
    setActionLoading(id);
    try {
      await adminApi.post(`/admin/email-campaigns/${id}/test`, { email });
      setShowTestModal(null);
      showToast('Email de prueba enviado con éxito.', 'success');
    } catch (err: any) {
      showToast('Error enviando email de prueba: ' + err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendAdHocTest = async () => {
    const { subject, html, email } = testAdHoc;
    if (!email || !subject) {
      showToast('Asunto y Email son requeridos', 'warning');
      return;
    }
    
    setTestLoading(true);
    try {
      await adminApi.post('/admin/email-campaigns/test-ad-hoc', { subject, htmlTemplate: html || getDefaultTemplate(), email });
      showToast('Email de prueba ad-hoc enviado con éxito.', 'success');
    } catch (err: any) {
      showToast('Error enviando email: ' + err.message, 'error');
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestInModal = async () => {
    const email = prompt('¿A qué correo enviamos la prueba?', testEmail);
    if (!email) return;
    setTestEmail(email);
    handleSendAdHocTest();
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Email Campaigns</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Cuota diaria: <span className="font-semibold" style={{ color: 'var(--accent)' }}>{quota.remaining}/{quota.dailyLimit}</span> emails restantes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          <IconPlus />
          Nueva Campaña
        </button>
      </div>

      {/* Centro de Pruebas Rápido */}
      <div className="mb-6">
        <button
          onClick={() => setShowTestingCenter(!showTestingCenter)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors mb-4"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
        >
          <IconMail />
          {showTestingCenter ? 'Ocultar Centro de Pruebas' : 'Abrir Centro de Pruebas (Quick Test)'}
        </button>

        {showTestingCenter && (
          <div className="p-6 rounded-xl border mb-6 transition-all animate-in fade-in slide-in-from-top-4 duration-300" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span className="p-1 rounded bg-[#FF5C3A20] text-[#FF5C3A]"><IconMail /></span>
                Centro de Pruebas Ad-hoc
              </h3>
              <button 
                onClick={() => setShowTestingCenter(false)}
                className="p-2 rounded-full hover:bg-black/10 transition-colors"
              >
                <IconX />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Envía un correo de prueba rápido sin necesidad de crear una campaña. Útil para verificar el renderizado y variables.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Asunto de Prueba</label>
                <input
                  type="text"
                  value={testAdHoc.subject}
                  onChange={e => setTestAdHoc({ ...testAdHoc, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Correo de Destino</label>
                <input
                  type="email"
                  value={testAdHoc.email}
                  onChange={e => setTestAdHoc({ ...testAdHoc, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>HTML del Template</label>
              <textarea
                value={testAdHoc.html}
                onChange={e => setTestAdHoc({ ...testAdHoc, html: e.target.value })}
                rows={6}
                placeholder="Pega aquí tu HTML..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none font-mono text-xs"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSendAdHocTest}
                disabled={testLoading}
                className="px-6 py-2 rounded-lg bg-[#FF5C3A] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {testLoading ? <IconSpinner /> : <IconMail />}
                Enviar Prueba Instantánea
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg border flex items-center gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
          <IconWarning />
          <span style={{ color: '#ef4444' }}>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><IconX /></button>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center py-12 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <IconMail />
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>No hay campañas todavía</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            Crear la primera campaña
          </button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Nombre</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Asunto</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Estado</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Progreso</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Programada</th>
                <th className="text-right px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b last:border-0 transition-colors" style={{ borderColor: 'var(--border-color)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{campaign.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{FILTER_LABELS[campaign.filter_type]}</p>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>{campaign.subject}</td>
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
                        <div className="flex-1 h-2 rounded-full overflow-hidden max-w-[100px]" style={{ backgroundColor: 'var(--border-color)' }}>
                          <div
                            className="h-full transition-all"
                            style={{ width: `${campaign.stats.total > 0 ? (campaign.stats.sent / campaign.stats.total) * 100 : 0}%`, backgroundColor: 'var(--accent)' }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {campaign.stats.sent}/{campaign.stats.total}
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span style={{ color: '#10b981' }}>{campaign.stats.sent} env</span>
                        <span style={{ color: '#3b82f6' }}>{campaign.stats.opened} ab</span>
                        <span style={{ color: '#8b5cf6' }}>{campaign.stats.clicked} cl</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(campaign.scheduled_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePreview(campaign.id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title="Previsualizar"
                      >
                        <IconEye />
                      </button>
                      <button
                        onClick={() => setShowTestModal({ id: campaign.id })}
                        disabled={actionLoading === campaign.id}
                        className="p-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{ color: 'var(--accent)' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title="Enviar email de prueba"
                      >
                        <IconMail />
                      </button>
                      {campaign.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleLaunch(campaign.id)}
                            disabled={actionLoading === campaign.id}
                            className="p-2 rounded-lg transition-colors disabled:opacity-50"
                            style={{ color: '#10b981' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            title="Enviar ahora"
                          >
                            {actionLoading === campaign.id ? <IconSpinner /> : <IconPlay />}
                          </button>
                          <button
                            onClick={() => handleSchedule(campaign.id)}
                            disabled={actionLoading === campaign.id}
                            className="p-2 rounded-lg transition-colors disabled:opacity-50"
                            style={{ color: '#f59e0b' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            title="Programar"
                          >
                            <IconClock />
                          </button>
                        </>
                      )}
                      {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                        <button
                          onClick={() => handleCancelClick(campaign.id)}
                          disabled={actionLoading === campaign.id}
                          className="p-2 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: '#ef4444' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="Cancelar"
                        >
                          <IconX />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(campaign.id)}
                        disabled={actionLoading === campaign.id}
                        className="p-2 rounded-lg transition-colors disabled:opacity-50"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Nueva Campaña de Email</h2>
              <button onClick={() => setShowModal(false)}><IconX /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre de la campaña *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ej: Lanzamiento Abril 2026"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Asunto del email *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="ej: Lookitry: Gran noticia para ti"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Destinatarios</label>
                <select
                  value={form.filterType}
                  onChange={(e) => setForm({ ...form, filterType: e.target.value as FilterType })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="all">Todas las marcas</option>
                  <option value="trial">Solo marcas en Trial</option>
                  <option value="paid">Solo marcas con plan pagado</option>
                  <option value="plan">Plan específico</option>
                  <option value="leads">Prospectos (Leads)</option>
                </select>
              </div>
              {form.filterType === 'plan' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre del plan</label>
                  <input
                    type="text"
                    value={form.filterPlan}
                    onChange={(e) => setForm({ ...form, filterPlan: e.target.value })}
                    placeholder="ej: BASIC, PRO, ENTERPRISE"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}
              {form.filterType === 'all' && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Solo marcas creadas después de</label>
                  <input
                    type="date"
                    value={form.filterCreatedAfter}
                    onChange={(e) => setForm({ ...form, filterCreatedAfter: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              )}
              {form.filterType === 'leads' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>País</label>
                    <select
                      value={form.filterCountry}
                      onChange={(e) => setForm({ ...form, filterCountry: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Cualquier país</option>
                      {filterOptions.countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ciudad</label>
                    <select
                      value={form.filterCity}
                      onChange={(e) => setForm({ ...form, filterCity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Cualquier ciudad</option>
                      {filterOptions.cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tipo de Negocio</label>
                    <select
                      value={form.filterBusinessType}
                      onChange={(e) => setForm({ ...form, filterBusinessType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Cualquier tipo</option>
                      {filterOptions.businessTypes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Estado del Lead</label>
                    <select
                      value={form.filterStatus}
                      onChange={(e) => setForm({ ...form, filterStatus: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Cualquier estado</option>
                      {filterOptions.statuses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Template HTML *</label>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Variables disponibles: {'{{firstName}}'}, {'{{brandName}}'}, {'{{email}}'}, {'{{plan}}'}</p>
                <textarea
                  value={form.htmlTemplate}
                  onChange={(e) => setForm({ ...form, htmlTemplate: e.target.value })}
                  rows={15}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none font-mono text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={handleTestInModal}
                disabled={testLoading}
                className="px-4 py-2 border rounded-lg hover:bg-opacity-10 transition-colors flex items-center gap-2 text-sm"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                {testLoading ? <IconSpinner /> : <IconMail />}
                Probar Template
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 transition-colors text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm font-bold"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                Crear Campaña
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Previsualización</h2>
              <button onClick={() => setShowPreviewModal(null)}><IconX /></button>
            </div>
            <div className="p-6">
              {loadingPreview ? (
                <div className="flex justify-center py-8"><IconSpinner /></div>
              ) : previews.length > 0 ? (
                <div className="space-y-6">
                  {previews.map((preview, idx) => (
                    <div key={idx}>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{preview.email}</p>
                      <div
                        className="border rounded-lg p-4"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-base)' }}
                        dangerouslySetInnerHTML={{ __html: preview.html }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center" style={{ color: 'var(--text-muted)' }}>No hay previews disponibles</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showTestModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl max-w-md w-full border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Enviar Email de Prueba</h2>
              <button onClick={() => setShowTestModal(null)}><IconX /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Se enviará una previsualización de la campaña a este correo para que verifiques el diseño.
            </p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="ej: tu@email.com"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none mb-4"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTestModal(null)}
                className="px-4 py-2 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSendTest(showTestModal.id, testEmail)}
                disabled={actionLoading === showTestModal.id}
                className="px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                {actionLoading === showTestModal.id ? <IconSpinner /> : <IconMail />}
                Enviar Prueba
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern UI Components */}
      <Toast 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={confirmModal.type === 'delete' ? 'Eliminar Campaña' : 'Cancelar Envío'}
        message={confirmModal.type === 'delete' 
          ? '¿Estás seguro de que quieres eliminar esta campaña? Esta acción no se puede deshacer.' 
          : '¿Estás seguro de que quieres cancelar el envío programado de esta campaña?'}
        confirmLabel={confirmModal.type === 'delete' ? 'Eliminar' : 'Confirmar Cancelación'}
        variant={confirmModal.type === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
}
