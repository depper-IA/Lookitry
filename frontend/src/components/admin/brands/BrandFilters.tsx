'use client';

import { Brand } from '@/app/admin/brands/page';
import { ArrowUpDown } from 'lucide-react';

type FilterPlan = 'all' | 'TRIAL' | 'BASIC' | 'PRO' | 'LANDING';
type FilterTrial = 'all' | 'trial' | 'active' | 'suspended';
type SortField = 'name' | 'email' | 'plan' | 'status' | 'products' | 'generations';

interface BrandFiltersProps {
  brands: Brand[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterPlan: FilterPlan;
  onFilterPlanChange: (v: FilterPlan) => void;
  filterTrial: FilterTrial;
  onFilterTrialChange: (v: FilterTrial) => void;
  sortField: SortField;
  onSortFieldChange: (v: SortField) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: () => void;
  onShowCreate: () => void;
}

export function BrandFilters({
  brands,
  searchTerm,
  onSearchChange,
  filterPlan,
  onFilterPlanChange,
  filterTrial,
  onFilterTrialChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  onShowCreate,
}: BrandFiltersProps) {
  const trialCount = brands.filter(b => b.plan === 'TRIAL').length;
  const activeCount = brands.filter(b => b.subscription_status === 'active' || b.subscription_status === 'expiring_soon').length;
  const suspendedCount = brands.filter(b => b.subscription_status === 'suspended' || b.subscription_status === 'expired').length;

  const planButtons: { value: FilterPlan; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: brands.length },
    { value: 'TRIAL', label: 'TRIAL', count: brands.filter(b => b.plan === 'TRIAL').length },
    { value: 'BASIC', label: 'BASIC', count: brands.filter(b => b.plan === 'BASIC').length },
    { value: 'PRO', label: 'PRO', count: brands.filter(b => b.plan === 'PRO').length },
    { value: 'LANDING', label: 'LANDING', count: brands.filter(b => b.plan === 'LANDING').length },
  ];

  const trialButtons: { value: FilterTrial; label: string; count?: number }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'trial', label: 'En prueba', count: trialCount },
    { value: 'active', label: 'Activos', count: activeCount },
    { value: 'suspended', label: 'Suspendidos', count: suspendedCount },
  ];

  return (
    <div className="rounded-[2rem] border p-4 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      {/* Search */}
      <div>
        <label htmlFor="brand-search" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Buscar por nombre, email o slug
        </label>
        <input
          id="brand-search"
          type="text"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Buscar..."
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A]"
          style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Plan filter */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Filtrar por plan</label>
        <div className="flex gap-2 flex-wrap">
          {planButtons.map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => onFilterPlanChange(value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: filterPlan === value ? '#FF5C3A' : 'var(--bg-base)',
                color: filterPlan === value ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${filterPlan === value ? '#FF5C3A' : 'var(--border-color)'}`,
              }}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Filtrar por estado</label>
        <div className="flex gap-2 flex-wrap">
          {trialButtons.map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => onFilterTrialChange(value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: filterTrial === value ? '#FF5C3A' : 'var(--bg-base)',
                color: filterTrial === value ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${filterTrial === value ? '#FF5C3A' : 'var(--border-color)'}`,
              }}
            >
              {label}{count !== undefined ? ` (${count})` : ''}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
