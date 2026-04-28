import React, { useState, useEffect } from 'react';

interface Country {
  code: string;
  name: string;
  prefix: string;
}

const COUNTRIES: Country[] = [
  { code: 'CO', name: 'Colombia', prefix: '+57' },
  { code: 'MX', name: 'México', prefix: '+52' },
  { code: 'AR', name: 'Argentina', prefix: '+54' },
  { code: 'ES', name: 'España', prefix: '+34' },
  { code: 'CL', name: 'Chile', prefix: '+56' },
  { code: 'PE', name: 'Perú', prefix: '+51' },
  { code: 'EC', name: 'Ecuador', prefix: '+593' },
  { code: 'VE', name: 'Venezuela', prefix: '+58' },
  { code: 'CR', name: 'Costa Rica', prefix: '+506' },
  { code: 'DO', name: 'Rep. Dominicana', prefix: '+1' },
  { code: 'US', name: 'Estados Unidos', prefix: '+1' },
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

  // Parse initial value
  useEffect(() => {
    if (value) {
      // Try to find a matching prefix
      const matchedCountry = COUNTRIES.find((c) =>
        value.startsWith(c.prefix.replace('+', ''))
      );
      if (matchedCountry) {
        setSelectedPrefix(matchedCountry.prefix);
        setLocalNumber(value.replace(matchedCountry.prefix.replace('+', ''), ''));
      } else {
        // If no match, assume it's a local number without prefix
        setLocalNumber(value);
      }
    }
  }, [value]);

  const handlePrefixChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prefix = e.target.value;
    setSelectedPrefix(prefix);
    onChange(prefix.replace('+', '') + localNumber);
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/\D/g, ''); // Only digits
    setLocalNumber(number);
    onChange(selectedPrefix.replace('+', '') + number);
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
        <select
          value={selectedPrefix}
          onChange={handlePrefixChange}
          className="rounded-2xl border px-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A] cursor-pointer min-w-[120px]"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: error ? '#ef4444' : 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.prefix}>
              {country.prefix} {country.name}
            </option>
          ))}
        </select>
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