'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import { Users } from 'lucide-react';

import LeadDetailModal from './components/LeadDetailModal';
import LeadModal from './components/LeadModal';
import LeadsTable from './components/LeadsTable';
import LeadFilters from './components/LeadFilters';
import LeadStatsCards from './components/LeadStatsCards';
import { IconPlus, IconSpinner, IconWarning } from './components/LeadIcons';
import { type Lead, type LeadStatus, type Stats } from './types';

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
      <LeadStatsCards stats={stats} />

      {/* Filters */}
      <LeadFilters
        filterCountry={filterCountry}
        filterCity={filterCity}
        filterStatus={filterStatus}
        filterOptions={filterOptions}
        onFilterCountryChange={setFilterCountry}
        onFilterCityChange={setFilterCity}
        onFilterStatusChange={setFilterStatus}
        onClearFilters={() => { setFilterCountry(''); setFilterCity(''); setFilterStatus(''); }}
      />

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
              <LeadsTable
                leads={leads}
                actionLoading={actionLoading}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onViewDetail={setDetailLead}
                onEdit={(lead) => { setEditLead(lead); setShowAddModal(true); }}
              />
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


