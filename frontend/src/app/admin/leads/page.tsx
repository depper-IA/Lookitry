'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';

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
  const [filterStatus, setFilterStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      let url = `/api/admin/leads?`;
      if (filterCountry) url += `country=${filterCountry}&`;
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
  }, [filterCountry, filterStatus]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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
      className="space-y-5"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-jakarta font-bold tracking-tight">Leads</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
            Total: <span className="font-semibold">{stats.total}</span> leads
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          <IconPlus />
          Agregar Lead
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {(['new', 'qualified', 'contacted', 'interested', 'not_interested', 'client'] as LeadStatus[]).map((status) => (
          <div
            key={status}
            className="rounded-2xl border p-4 cursor-pointer transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: filterStatus === status ? 'var(--accent)' : 'var(--border-color)' }}
            onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
          >
            <p className="text-2xl font-bold" style={{ color: STATUS_COLORS[status] }}>{stats[status]}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{STATUS_LABELS[status]}</p>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="flex gap-4"
      >
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-input)' }}
        >
          <option value="">Todos los países</option>
          <option value="Colombia">Colombia</option>
          <option value="USA">USA</option>
          <option value="España">España</option>
        </select>
        {filterStatus && (
          <button
            onClick={() => setFilterStatus('')}
            className="px-3 py-2 text-sm transition-colors rounded-xl border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
          >
            Limpiar filtro ×
          </button>
        )}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border flex items-center gap-3"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
        >
          <IconWarning />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><IconX /></button>
        </motion.div>
      )}

      {leads.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="text-center py-12 rounded-2xl border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div style={{ color: 'var(--text-muted)' }}><IconMail /></div>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>No hay leads</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)' }}
          >
            Agregar el primero
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Nombre</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Ubicación</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Contacto</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Estado</th>
                <th className="text-left px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Fecha</th>
                <th className="text-right px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b last:border-0 transition-colors" style={{ borderColor: 'var(--border-color)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{lead.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.business_type || lead.source}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-[#666]">
                      <IconMapPin />
                      {lead.city}, {lead.country}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <IconMail /> {lead.email}
                        </a>
                      )}
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <IconPhone /> {lead.phone}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                      disabled={actionLoading === lead.id}
                      className="px-2 py-1 text-xs rounded-full border-0 cursor-pointer"
                      style={{ backgroundColor: `${STATUS_COLORS[lead.status]}20`, color: STATUS_COLORS[lead.status] }}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#666]">{formatDate(lead.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {lead.instagram && (
                        <a
                          href={`https://instagram.com/${lead.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#999] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                          title="Ir a Instagram"
                        >
                          <IconExternalLink />
                        </a>
                      )}
                      <button
                        onClick={() => handleAddOutreach(lead.id, 'email')}
                        className="p-2 text-[#999] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                        title="Marcar email enviado"
                      >
                        <IconMail />
                      </button>
                      <button
                        onClick={() => setEditLead(lead)}
                        className="p-2 text-[#999] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                        title="Editar"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        disabled={actionLoading === lead.id}
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
        </motion.div>
      )}

      {showAddModal && (
        <LeadModal onClose={() => setShowAddModal(false)} onSave={fetchLeads} />
      )}

      {editLead && (
        <LeadModal lead={editLead} onClose={() => setEditLead(null)} onSave={fetchLeads} />
      )}
    </motion.div>
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
