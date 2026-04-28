import React, { useState, useEffect, useRef } from 'react';

interface Country {
  code: string;
  name: string;
  prefix: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  // América del Norte
  { code: 'US', name: 'Estados Unidos', prefix: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', prefix: '+1', flag: '🇨🇦' },
  // América Central
  { code: 'MX', name: 'México', prefix: '+52', flag: '🇲🇽' },
  { code: 'BZ', name: 'Belice', prefix: '+501', flag: '🇧🇿' },
  { code: 'CR', name: 'Costa Rica', prefix: '+506', flag: '🇨🇷' },
  { code: 'SV', name: 'El Salvador', prefix: '+503', flag: '🇸🇻' },
  { code: 'GT', name: 'Guatemala', prefix: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', prefix: '+504', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', prefix: '+505', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá', prefix: '+507', flag: '🇵🇦' },
  // Caribe
  { code: 'AG', name: 'Antigua y Barbuda', prefix: '+1', flag: '🇦🇬' },
  { code: 'BS', name: 'Bahamas', prefix: '+1', flag: '🇧🇸' },
  { code: 'BB', name: 'Barbados', prefix: '+1', flag: '🇧🇧' },
  { code: 'CU', name: 'Cuba', prefix: '+53', flag: '🇨🇺' },
  { code: 'DM', name: 'Dominica', prefix: '+1', flag: '🇩🇲' },
  { code: 'DO', name: 'República Dominicana', prefix: '+1', flag: '🇩🇴' },
  { code: 'GD', name: 'Granada', prefix: '+1', flag: '🇬🇩' },
  { code: 'HT', name: 'Haití', prefix: '+509', flag: '🇭🇹' },
  { code: 'JM', name: 'Jamaica', prefix: '+1', flag: '🇯🇲' },
  { code: 'KN', name: 'San Cristóbal y Nieves', prefix: '+1', flag: '🇰🇳' },
  { code: 'VC', name: 'San Vicente y las Granadinas', prefix: '+1', flag: '🇻🇨' },
  { code: 'LC', name: 'Santa Lucía', prefix: '+1', flag: '🇱🇨' },
  { code: 'TT', name: 'Trinidad y Tobago', prefix: '+1', flag: '🇹🇹' },
  // América del Sur
  { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', prefix: '+591', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', prefix: '+55', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', prefix: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', prefix: '+57', flag: '🇨🇴' },
  { code: 'EC', name: 'Ecuador', prefix: '+593', flag: '🇪🇨' },
  { code: 'GY', name: 'Guyana', prefix: '+592', flag: '🇬🇾' },
  { code: 'PY', name: 'Paraguay', prefix: '+595', flag: '🇵🇾' },
  { code: 'PE', name: 'Perú', prefix: '+51', flag: '🇵🇪' },
  { code: 'SR', name: 'Surinam', prefix: '+597', flag: '🇸🇷' },
  { code: 'UY', name: 'Uruguay', prefix: '+598', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', prefix: '+58', flag: '🇻🇪' },
  // España
  { code: 'ES', name: 'España', prefix: '+34', flag: '🇪🇸' },
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
      <div className="flex gap-2">
        {/* Custom Country Selector */}
        <div ref={dropdownRef} className="relative min-w-[140px]">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-2xl border px-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A] cursor-pointer flex items-center gap-2 transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: error ? '#ef4444' : 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="text-base">{selectedCountry.flag}</span>
            <span className="flex-1 text-left">{selectedCountry.prefix}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div
              className="absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              {/* Search Input */}
              <div className="p-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar país..."
                  className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Country List */}
              <div
                className="max-h-64 overflow-y-auto"
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
                        country.prefix === selectedPrefix ? 'bg-[#FF5C3A]/10' : ''
                      }`}
                      style={{
                        color: 'var(--text-primary)',
                      }}
                      role="option"
                      aria-selected={country.prefix === selectedPrefix}
                    >
                      <span className="text-base">{country.flag}</span>
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
          className="flex-1 min-w-0 rounded-2xl border bg-[var(--bg-input)] px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A]"
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
