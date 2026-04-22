'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import { Users } from 'lucide-react';

type LeadStatus = 'new' | 'qualified' | 'contacted' | 'interested' | 'not_interested' | 'client';

interface Lead {
  id: string;
  name: string;
  business_type?: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  address?: string;
  city?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  user_ratings_total?: number;
  status: LeadStatus;
  source: string;
  notes?: string;
  created_at: string;
}

interface Stats {
  total: number;
  new: number;
  qualified: number;
  contacted: number;
  interested: number;
  not_interested: number;
  client: number;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nuevo',
  qualified: 'Cualificado',
  contacted: 'Contactado',
  interested: 'Interesado',
  not_interested: 'No interesado',
  client: 'Cliente',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: '#6b7280',
  qualified: '#3b82f6',
  contacted: '#f59e0b',
  interested: '#10b981',
  not_interested: '#ef4444',
  client: '#8b5cf6',
};

function IconPlus() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function IconMail() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function IconEdit() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function IconTrash() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function IconX() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function IconSpinner() {
  return <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function IconWarning() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}
function IconExternalLink() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
}
function IconEye() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}
function IconGlobe() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
}
function IconStar({ className = '' }: { className?: string }) {
  return <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
}
function IconPhone() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
}
function IconMapPin() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, qualified: 0, contacted: 0, interested: 0, not_interested: 0, client: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterBusinessType, setFilterBusinessType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    cities: string[];
    countries: string[];
    businessTypes: string[];
    statuses: string[];
  }>({ cities: [], countries: [], businessTypes: [], statuses: [] });
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      let url = `/api/admin/leads?`;
      if (filterCountry) url += `country=${filterCountry}&`;
      if (filterCity) url += `city=${filterCity}&`;
      if (filterBusinessType) url += `business_type=${filterBusinessType}&`;
      if (filterStatus) url += `status=${filterStatus}&`;

      const data = await adminApi.get<{ leads?: Lead[] }>(url);
      setLeads(data.leads || []);

      const statsData = await adminApi.get<Stats>('/api/admin/leads/stats');
      setStats(statsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterCountry, filterCity, filterBusinessType, filterStatus]);

  const fetchFilters = useCallback(async () => {
    try {
      const data = await adminApi.get('/admin/leads/filters');
      setFilterOptions(data);
    } catch (err: any) {
      console.error('Error loading filters', err);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchFilters();
  }, [fetchLeads, fetchFilters]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setActionLoading(leadId);
    try {
      await adminApi.patch(`/api/admin/leads/${leadId}`, { status: newStatus });
      fetchLeads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('¿Eliminar este lead?')) return;
    setActionLoading(leadId);
    try {
      await adminApi.delete(`/api/admin/leads/${leadId}`);
      fetchLeads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddOutreach = async (leadId: string, type: string) => {
    try {
      await adminApi.post(`/api/admin/leads/${leadId}/outreach`, { outreach_type: type });
      fetchLeads();
    } catch (err: any) {
      setError(err.message);
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-jakarta text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Leads
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {stats.total.toLocaleString()} leads totales
          </p>
        </div>
        <button
          onClick={() => { setEditLead(null); setShowAddModal(true); }}
          className="flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--accent)]/90"
        >
          <IconPlus /> Nuevo Lead
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gray-500/10 p-2.5">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5">
              <IconStar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.new}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nuevos</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-500/10 p-2.5">
              <IconStar className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.interested}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Interesados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <select
            value={filterCountry}
            onChange={(e) => { setFilterCountry(e.target.value); }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[150px]"
          >
            <option value="">Todos los países</option>
            {filterOptions.countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterCity}
            onChange={(e) => { setFilterCity(e.target.value); }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[150px]"
          >
            <option value="">Todas las ciudades</option>
            {filterOptions.cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[160px]"
          >
            <option value="">Todos los estados</option>
            <option value="new">Nuevo</option>
            <option value="contacted">Contactado</option>
            <option value="qualified">Cualificado</option>
            <option value="interested">Interesado</option>
            <option value="not_interested">No interesado</option>
            <option value="client">Cliente</option>
          </select>
          {(filterCountry || filterCity || filterStatus) && (
            <button
              onClick={() => { setFilterCountry(''); setFilterCity(''); setFilterStatus(''); }}
              className="rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-white flex items-center gap-2"
            >
              <IconX className="h-4 w-4" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Leads Table */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <IconWarning />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-[var(--text-muted)] mb-4" />
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No hay leads</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Comienza agregando un lead o ejecutando una búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nombre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ubicación</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Contacto</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Fuente</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    className="hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{lead.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{lead.business_type || '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {lead.city || '—'}, {lead.country}
                      </p>
                      {lead.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <IconStar className="h-3 w-3" style={{ color: '#FBBD23' }} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>{lead.email}</a>
                        )}
                        {lead.phone && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        disabled={actionLoading === lead.id}
                        className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-base)] px-2 py-1.5 text-xs font-medium outline-none"
                        style={{ color: STATUS_COLORS[lead.status], backgroundColor: `${STATUS_COLORS[lead.status]}20` }}
                      >
                        <option value="new">Nuevo</option>
                        <option value="contacted">Contactado</option>
                        <option value="qualified">Cualificado</option>
                        <option value="interested">Interesado</option>
                        <option value="not_interested">No interesado</option>
                        <option value="client">Cliente</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.source}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailLead(lead)}
                          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                          title="Ver detalle"
                        >
                          <IconEye />
                        </button>
                        <button
                          onClick={() => { setEditLead(lead); setShowAddModal(true); }}
                          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                          title="Editar"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          disabled={actionLoading === lead.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-50"
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
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
        <span>Mostrando {leads.length} leads</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { /* page prev */ }}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <IconSpinner />
          </button>
          <span>1</span>
          <button
            onClick={() => { /* page next */ }}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <IconSpinner />
          </button>
        </div>
      </div>

      {/* Modals */}
      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          onClose={() => setDetailLead(null)}
        />
      )}
      {showAddModal && (
        <LeadModal
          lead={editLead || undefined}
          onClose={() => { setShowAddModal(false); setEditLead(null); }}
          onSave={fetchLeads}
        />
      )}
    </motion.div>
  );
}

function LeadDetailModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const googleMapsUrl = lead.latitude && lead.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${lead.latitude},${lead.longitude}`
    : lead.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`
    : null;

  const phoneLink = lead.phone ? `tel:+57${lead.phone.replace(/\D/g, '')}` : null;
  const emailLink = lead.email ? `mailto:${lead.email}` : null;

  const instagramLink = lead.instagram
    ? lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`
    : null;

  const tiktokLink = lead.tiktok
    ? lead.tiktok.startsWith('http') ? lead.tiktok : `https://tiktok.com/@${lead.tiktok.replace('@', '')}`
    : null;

  const websiteLink = lead.website && !lead.website.startsWith('http')
    ? `https://${lead.website}`
    : lead.website || null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b backdrop-blur-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--bg-card) 90%, transparent)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{lead.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {lead.business_type || lead.source}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <IconX />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                style={{ backgroundColor: '#4285F4', color: '#fff' }}
              >
                <IconMapPin /> Google Maps
              </a>
            )}
            {phoneLink && (
              <a
                href={phoneLink}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                style={{ backgroundColor: '#25D366', color: '#fff' }}
              >
                <IconPhone /> Llamar
              </a>
            )}
            {emailLink && (
              <a
                href={emailLink}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                <IconMail /> Email
              </a>
            )}
            {websiteLink && (
              <a
                href={websiteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', border: '1px solid' }}
              >
                <IconGlobe /> Website
              </a>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Estado:</span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${STATUS_COLORS[lead.status]}20`, color: STATUS_COLORS[lead.status] }}
            >
              {STATUS_LABELS[lead.status]}
            </span>
          </div>

          {/* Location Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <IconMapPin />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Dirección</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{lead.address || 'No disponible'}</p>
              </div>
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <IconGlobe />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Ciudad / País</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{lead.city || '—'}, {lead.country}</p>
              </div>
            </div>
            {lead.latitude && lead.longitude && (
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Coordenadas</p>
                <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {lead.latitude.toFixed(6)}, {lead.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lead.phone && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Teléfono</p>
                  <a href={phoneLink!} className="text-sm font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.email && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Email</p>
                  <a href={emailLink!} className="text-sm font-medium hover:underline truncate block" style={{ color: 'var(--accent)' }}>
                    {lead.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Social Section */}
          {(lead.instagram || lead.tiktok || lead.website) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Redes Sociales</h3>
              <div className="flex flex-wrap gap-3">
                {lead.instagram && (
                  <a
                    href={instagramLink!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: '#E4405F20', color: '#E4405F', border: '1px solid #E4405F30' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    @{lead.instagram.replace('@', '')}
                  </a>
                )}
                {lead.tiktok && (
                  <a
                    href={tiktokLink!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: '#00000020', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.15v-3.45a4.85 4.85 0 01-1-.11z"/></svg>
                    @{lead.tiktok.replace('@', '')}
                  </a>
                )}
                {lead.website && (
                  <a
                    href={websiteLink!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <IconGlobe /> Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Rating Section */}
          {(lead.rating !== undefined || lead.user_ratings_total !== undefined) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Valoración Google</h3>
              <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                {lead.rating !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{lead.rating.toFixed(1)}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} style={{ color: star <= Math.round(lead.rating!) ? '#FBBD23' : 'var(--text-muted)' }}>
                          <IconStar />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {lead.user_ratings_total !== undefined && (
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    ({lead.user_ratings_total.toLocaleString()} reseñas)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {lead.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notas</h3>
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{lead.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Creado: {formatDate(lead.created_at)} • Fuente: {lead.source}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LeadModal({ lead, onClose, onSave }: { lead?: Lead; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: lead?.name || '',
    business_type: lead?.business_type || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    website: lead?.website || '',
    instagram: lead?.instagram || '',
    country: lead?.country || 'Colombia',
    city: lead?.city || '',
    notes: lead?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = lead ? `/api/admin/leads/${lead.id}` : `/api/admin/leads`;
      if (lead) {
        await adminApi.patch(url, form);
      } else {
        await adminApi.post(url, form);
      }
      onSave();
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{lead ? 'Editar Lead' : 'Nuevo Lead'}</h2>
          <button onClick={onClose}><IconX /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>País</label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="Colombia">Colombia</option>
                <option value="USA">USA</option>
                <option value="España">España</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Instagram</label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="@usuario"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            className="px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            {saving ? <IconSpinner /> : lead ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
