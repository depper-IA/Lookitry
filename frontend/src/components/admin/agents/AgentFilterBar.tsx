'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Search, X } from 'lucide-react';

interface FiltersState {
  agent: string;
  status: string;
  startDate: string;
  endDate: string;
  taskType: string;
}

interface AgentFilterBarProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  onExport: () => void;
  agents: string[];
  taskTypes: string[];
  loading?: boolean;
}

export function AgentFilterBar({
  filters,
  onFiltersChange,
  onExport,
  agents,
  taskTypes,
  loading,
}: AgentFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (key: keyof FiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      agent: '',
      status: '',
      startDate: '',
      endDate: '',
      taskType: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por agente..."
            value={filters.agent}
            onChange={(e) => handleChange('agent', e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* Quick filters */}
        <select
          value={filters.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="h-11 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
          style={{ color: 'var(--text-primary)' }}
        >
          <option value="">Todos los status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="h-11 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 text-sm font-medium transition-colors hover:border-[var(--accent)]/30"
          style={{ color: 'var(--text-primary)' }}
        >
          Más filtros
        </button>

        {/* Export button */}
        <button
          onClick={onExport}
          disabled={loading}
          className="flex h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-sm font-bold text-white transition-all hover:bg-[#e64d2e] disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex h-11 items-center gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 text-sm transition-colors hover:border-[var(--accent)]/30"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4"
        >
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Desde
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="h-10 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Hasta
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="h-10 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Agente
            </label>
            <select
              value={filters.agent}
              onChange={(e) => handleChange('agent', e.target.value)}
              className="h-10 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            >
              <option value="">Todos</option>
              {agents.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Tipo
            </label>
            <select
              value={filters.taskType}
              onChange={(e) => handleChange('taskType', e.target.value)}
              className="h-10 rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3 text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            >
              <option value="">Todos</option>
              {taskTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
}