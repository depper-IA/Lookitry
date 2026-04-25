'use client';

import { motion } from 'framer-motion';
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

const STATUSES = ['new', 'contacted', 'qualified', 'interested', 'not_interested', 'client'];
const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Cualificado',
  interested: 'Interesado',
  not_interested: 'No interesado',
  client: 'Cliente',
};

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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Status Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((status) => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onFilterStatusChange(filterStatus === status ? '' : status)}
              animate={filterStatus === status ? {
                backgroundColor: "#FF5C3A",
                color: "white"
              } : {
                backgroundColor: "#1a1a1a",
                color: "gray"
              }}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors border border-[var(--border-color)]"
            >
              {STATUS_LABELS[status]}
            </motion.button>
          ))}
        </div>

        {/* Country & City selects */}
        <div className="flex gap-3 flex-wrap lg:flex-nowrap">
          <motion.select
            value={filterCountry}
            onChange={(e) => onFilterCountryChange(e.target.value)}
            whileFocus={{ scale: 1.01, borderColor: "#FF5C3A" }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[150px] transition-all"
          >
            <option value="">Todos los países</option>
            {filterOptions.countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </motion.select>
          <motion.select
            value={filterCity}
            onChange={(e) => onFilterCityChange(e.target.value)}
            whileFocus={{ scale: 1.01, borderColor: "#FF5C3A" }}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none min-w-[150px] transition-all"
          >
            <option value="">Todas las ciudades</option>
            {filterOptions.cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </motion.select>
        </div>

        {hasFilters && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearFilters}
            className="rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-white flex items-center gap-2 ml-auto"
          >
            <IconX className="h-4 w-4" /> Limpiar
          </motion.button>
        )}
      </div>
    </div>
  );
}
