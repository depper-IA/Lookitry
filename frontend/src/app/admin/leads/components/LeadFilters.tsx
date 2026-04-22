'use client';

import { IconX } from './LeadIcons';

interface LeadFiltersProps {
  filterCountry: string;
  filterCity: string;
  filterStatus: string;
  filterOptions: {
    cities: string[];
    countries: string[];
    businessTypes: string[];
    statuses: string[];
  };
  onFilterCountryChange: (value: string) => void;
  onFilterCityChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onClearFilters: () => void;
}

export default function LeadFilters({
  filterCountry,
  filterCity,
  filterStatus,
  filterOptions,
  onFilterCountryChange,
  onFilterCityChange,
  onFilterStatusChange,
  onClearFilters,
}: LeadFiltersProps) {
  const hasFilters = filterCountry || filterCity || filterStatus;

  return (
    <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <select
          value={filterCountry}
          onChange={(e) => onFilterCountryChange(e.target.value)}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[150px]"
        >
          <option value="">Todos los países</option>
          {filterOptions.countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterCity}
          onChange={(e) => onFilterCityChange(e.target.value)}
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[150px]"
        >
          <option value="">Todas las ciudades</option>
          {filterOptions.cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value)}
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
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-white flex items-center gap-2"
          >
            <IconX className="h-4 w-4" /> Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
