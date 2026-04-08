'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { MapPin } from 'lucide-react';

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
  });
}

export function PublicTopbar() {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    setTime(getCurrentTime());
    setDate(getCurrentDate());

    const interval = setInterval(() => {
      setTime(getCurrentTime());
      setDate(getCurrentDate());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-center px-6 h-9"
      style={{
        backgroundColor: 'var(--bg-base)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center gap-5">
        {/* Location */}
        <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
          <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="text-[11px] font-medium tracking-wide">Cali, Colombia</span>
        </div>

        {/* Divider */}
        <div className="w-px h-3.5" style={{ backgroundColor: 'var(--border-color)' }} />

        {/* Time */}
        {time && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
              {time}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>|</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {date}
            </span>
          </div>
        )}
      </div>

      {/* ThemeToggle - positioned absolutely right */}
      <div className="absolute right-4">
        <ThemeToggle />
      </div>
    </header>
  );
}