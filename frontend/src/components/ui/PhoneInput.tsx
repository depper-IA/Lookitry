import React, { useState, useEffect, useRef } from 'react';

// FlagBadge con emoji de bandera
function FlagBadge({ flag }: { flag: string }) {
  return (
    <span className="text-base leading-none flex-shrink-0" role="img" aria-label="flag">
      {flag}
    </span>
  );
}

interface Country {
  code: string;
  flag: string;
  name: string;
  prefix: string;
}

const COUNTRIES: Country[] = [
  // América del Norte
  { code: 'US', flag: '🇺🇸', name: 'Estados Unidos', prefix: '+1' },
  { code: 'CA', flag: '🇨🇦', name: 'Canadá', prefix: '+1' },
  // América Central
  { code: 'MX', flag: '🇲🇽', name: 'México', prefix: '+52' },
  { code: 'BZ', flag: '🇧🇿', name: 'Belice', prefix: '+501' },
  { code: 'CR', flag: '🇨🇷', name: 'Costa Rica', prefix: '+506' },
  { code: 'SV', flag: '🇸🇻', name: 'El Salvador', prefix: '+503' },
  { code: 'GT', flag: '🇬🇹', name: 'Guatemala', prefix: '+502' },
  { code: 'HN', flag: '🇭🇳', name: 'Honduras', prefix: '+504' },
  { code: 'NI', flag: '🇳🇮', name: 'Nicaragua', prefix: '+505' },
  { code: 'PA', flag: '🇵🇦', name: 'Panamá', prefix: '+507' },
  // Caribe
  { code: 'AG', flag: '🇦🇬', name: 'Antigua y Barbuda', prefix: '+1' },
  { code: 'BS', flag: '🇧🇸', name: 'Bahamas', prefix: '+1' },
  { code: 'BB', flag: '🇧🇧', name: 'Barbados', prefix: '+1' },
  { code: 'CU', flag: '🇨🇺', name: 'Cuba', prefix: '+53' },
  { code: 'DM', flag: '🇩🇲', name: 'Dominica', prefix: '+1' },
  { code: 'DO', flag: '🇩🇴', name: 'República Dominicana', prefix: '+1' },
  { code: 'GD', flag: '🇬🇩', name: 'Granada', prefix: '+1' },
  { code: 'HT', flag: '🇭🇹', name: 'Haití', prefix: '+509' },
  { code: 'JM', flag: '🇯🇲', name: 'Jamaica', prefix: '+1' },
  { code: 'KN', flag: '🇰🇳', name: 'San Cristóbal y Nieves', prefix: '+1' },
  { code: 'VC', flag: '🇻🇨', name: 'San Vicente y las Granadinas', prefix: '+1' },
  { code: 'LC', flag: '🇱🇨', name: 'Santa Lucía', prefix: '+1' },
  { code: 'TT', flag: '🇹🇹', name: 'Trinidad y Tobago', prefix: '+1' },
  // América del Sur
  { code: 'AR', flag: '🇦🇷', name: 'Argentina', prefix: '+54' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivia', prefix: '+591' },
  { code: 'BR', flag: '🇧🇷', name: 'Brasil', prefix: '+55' },
  { code: 'CL', flag: '🇨🇱', name: 'Chile', prefix: '+56' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia', prefix: '+57' },
  { code: 'EC', flag: '🇪🇨', name: 'Ecuador', prefix: '+593' },
  { code: 'GY', flag: '🇬🇾', name: 'Guyana', prefix: '+592' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguay', prefix: '+595' },
  { code: 'PE', flag: '🇵🇪', name: 'Perú', prefix: '+51' },
  { code: 'SR', flag: '🇸🇷', name: 'Surinam', prefix: '+597' },
  { code: 'UY', flag: '🇺🇾', name: 'Uruguay', prefix: '+598' },
  { code: 'VE', flag: '🇻🇪', name: 'Venezuela', prefix: '+58' },
  // España
  { code: 'ES', flag: '🇪🇸', name: 'España', prefix: '+34' },
];

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function PhoneInput({
  label,
  value,
  onChange,
  placeholder = 'Ej: 3105436281',
  error,
  className = '',
}: PhoneInputProps) {
  const [selectedPrefix, setSelectedPrefix] = useState('+57');
  const [localNumber, setLocalNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.prefix === selectedPrefix) || COUNTRIES[0];

  const filteredCountries = COUNTRIES.filter((country) => {
    const query = searchQuery.toLowerCase();
    return (
      country.name.toLowerCase().includes(query) ||
      country.prefix.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  });

  // Parse initial value
  useEffect(() => {
    if (value) {
      const matchedCountry = COUNTRIES.find((c) =>
        value.startsWith(c.prefix.replace('+', ''))
      );
      if (matchedCountry) {
        setSelectedPrefix(matchedCountry.prefix);
        setLocalNumber(value.replace(matchedCountry.prefix.replace('+', ''), ''));
      } else {
        setLocalNumber(value);
      }
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handlePrefixChange = (prefix: string) => {
    setSelectedPrefix(prefix);
    setIsOpen(false);
    setSearchQuery('');
    onChange(prefix.replace('+', '') + localNumber);
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/\D/g, '');
    setLocalNumber(number);
    onChange(selectedPrefix.replace('+', '') + number);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          className="block text-xs font-bold uppercase tracking-[0.18em] mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </label>
      )}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
        {/* Custom Country Selector */}
        <div ref={dropdownRef} className="relative w-full sm:w-[140px] flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-2xl border px-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent cursor-pointer flex items-center gap-2 transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: error ? '#ef4444' : 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <FlagBadge flag={selectedCountry.flag} />
            <span className="flex-1 text-left truncate">{selectedCountry.prefix}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} flex-shrink-0`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown - Responsive with max-height and scroll */}
          {isOpen && (
            <div
              className="absolute z-[100] mt-1 left-0 right-0 sm:min-w-[200px] rounded-xl border shadow-xl overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              {/* Search Input */}
              <div className="p-2 border-b sticky top-0 z-10" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar país..."
                  className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-accent/40"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Country List */}
              <div
                className="max-h-[60vh] overflow-y-auto"
                role="listbox"
                aria-label="Seleccionar país"
              >
                {filteredCountries.length === 0 ? (
                  <div
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Sin resultados
                  </div>
                ) : (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handlePrefixChange(country.prefix)}
                      className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:opacity-80 transition-colors ${
                        country.prefix === selectedPrefix ? 'bg-accent/10' : ''
                      }`}
                      style={{
                        color: 'var(--text-primary)',
                      }}
                      role="option"
                      aria-selected={country.prefix === selectedPrefix}
                    >
                      <FlagBadge flag={country.flag} />
                      <span className="flex-1 text-left">{country.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{country.prefix}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={localNumber}
          onChange={handleLocalChange}
          placeholder={placeholder}
          className="flex-1 min-w-0 rounded-2xl border bg-[var(--bg-input)] px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          style={{
            borderColor: error ? '#ef4444' : 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
