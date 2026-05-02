'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'lookitry-recent-colors';
const MAX_RECENT = 8;

// WCAG relative luminance formula
function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(v => {
    const n = parseInt(v, 16) / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Contrast ratio vs white
function getContrastVsWhite(hex: string): number {
  const L1 = getLuminance('#ffffff');
  const L2 = getLuminance(hex);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ContrastBadge({ color }: { color: string }) {
  const ratio = getContrastVsWhite(color);
  const ratioStr = ratio.toFixed(1);

  if (ratio >= 4.5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
        <Check size={8} />{ratioStr}:1
      </span>
    );
  }
  if (ratio >= 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
        <AlertTriangle size={8} />{ratioStr}:1
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-500/20">
      {ratioStr}:1
    </span>
  );
}

// Gradient mesh canvas — creates a subtle gradient blob around the color
function GradientPreview({ color }: { color: string }) {
  return (
    <div
      className="w-full h-16 rounded-xl overflow-hidden border border-[var(--border-color)] shadow-inner relative"
      style={{
        background: `
          radial-gradient(circle at 30% 30%, ${color}40 0%, transparent 50%),
          radial-gradient(circle at 70% 70%, ${color}20 0%, transparent 50%),
          linear-gradient(135deg, ${color}15 0%, transparent 50%),
          var(--bg-input)
        `
      }}
    />
  );
}

interface PremiumColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  tooltip?: string;
  className?: string;
}

export function PremiumColorPicker({
  value,
  onChange,
  label,
  tooltip,
  className = '',
}: PremiumColorPickerProps) {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [hexInput, setHexInput] = useState(value);

  // Load recent colors from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentColors(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync hex input when value changes externally
  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const addToRecent = useCallback((color: string) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
      const next = [color, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    setHexInput(newColor);
    addToRecent(newColor);
  };

  const handleHexInput = (raw: string) => {
    setHexInput(raw);
    // Auto-fix: add # if missing, validate on blur
  };

  const handleHexBlur = () => {
    let fixed = hexInput.trim();
    if (!fixed.startsWith('#')) fixed = '#' + fixed;
    // Validate 6 or 3 char hex
    const match = fixed.match(/^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/);
    if (match) {
      const hex = match[1];
      const full = hex.length === 3
        ? hex.split('').map(c => c + c).join('')
        : hex;
      onChange('#' + full.toUpperCase());
      setHexInput('#' + full.toUpperCase());
      addToRecent('#' + full.toUpperCase());
    } else {
      // Reset to current value
      setHexInput(value);
    }
  };

  const handleHexKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block leading-none opacity-80">
            {label}
          </label>
          {tooltip && (
            <div className="group/tooltip relative inline-block">
              <div className="w-4 h-4 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#FF5C3A] cursor-help transition-all shadow-sm">
                <span className="text-[8px] font-black">i</span>
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-xl z-50 pointer-events-none">
                <p className="text-[10px] leading-relaxed text-[var(--text-primary)] font-semibold">{tooltip}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-[var(--border-color)]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gradient preview */}
      <GradientPreview color={value} />

      {/* Color input + hex */}
      <div className="flex items-center gap-3 bg-[var(--bg-input)] p-2 rounded-2xl border border-[var(--border-color)] shadow-inner group/color transition-all active:scale-[0.98]">
        <input
          type="color"
          value={value}
          onChange={e => handleColorChange(e.target.value)}
          className="w-11 h-11 rounded-xl overflow-hidden cursor-pointer border-0 bg-transparent flex-shrink-0 shadow-lg transition-transform hover:scale-105 active:scale-95"
        />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <input
            type="text"
            value={hexInput}
            onChange={e => handleHexInput(e.target.value)}
            onBlur={handleHexBlur}
            onKeyDown={handleHexKeyDown}
            className="flex-1 min-w-0 bg-transparent border-0 text-xs font-black font-mono text-[var(--text-primary)] outline-none uppercase tracking-widest"
            maxLength={7}
          />
          <ContrastBadge color={value} />
        </div>
      </div>

      {/* Recent swatches */}
      {recentColors.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50">Recientes</span>
          {recentColors.map((color, i) => (
            <button
              key={`${color}-${i}`}
              onClick={() => handleColorChange(color)}
              className="w-6 h-6 rounded-lg border border-[var(--border-color)] shadow-sm hover:scale-110 active:scale-95 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  );
}