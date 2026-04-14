// Lookitry Mission Control - Atoms Components
// v1.0 | Abril 2026

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// StatusDot - Indicador de estado con pulse animation
// ============================================================================

interface StatusDotProps {
  status: 'online' | 'busy' | 'offline' | 'up' | 'down' | 'degraded' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

const STATUS_COLORS = {
  online: 'bg-[#00E5A0]',
  up: 'bg-[#00E5A0]',
  busy: 'bg-[#FFB547]',
  degraded: 'bg-[#FFB547]',
  offline: 'bg-[#444444]',
  down: 'bg-[#FF3A5C]',
  critical: 'bg-[#FF3A5C]',
};

const STATUS_GLOW = {
  online: 'shadow-[0_0_12px_rgba(0,229,160,0.6)]',
  up: 'shadow-[0_0_12px_rgba(0,229,160,0.6)]',
  busy: 'shadow-[0_0_12px_rgba(255,181,71,0.6)]',
  degraded: 'shadow-[0_0_12px_rgba(255,181,71,0.6)]',
  offline: '',
  down: 'shadow-[0_0_12px_rgba(255,58,92,0.6)]',
  critical: 'shadow-[0_0_12px_rgba(255,58,92,0.6)]',
};

const SIZES = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function StatusDot({ status, size = 'md', showPulse = true }: StatusDotProps) {
  const shouldPulse = showPulse && (status === 'online' || status === 'busy' || status === 'up');

  return (
    <span className="relative inline-flex">
      <motion.span
        className={cn(
          'rounded-full',
          STATUS_COLORS[status],
          SIZES[size],
          STATUS_GLOW[status]
        )}
        animate={shouldPulse ? {
          scale: [1, 1.15, 1],
          opacity: [1, 0.7, 1],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {shouldPulse && (
        <motion.span
          className={cn(
            'absolute rounded-full',
            STATUS_COLORS[status],
            SIZES[size]
          )}
          style={{ transform: 'scale(1)' }}
          animate={{
            scale: [1, 2],
            opacity: [0.6, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </span>
  );
}

// ============================================================================
// Badge - Pill de status
// ============================================================================

interface BadgeProps {
  variant: 'online' | 'busy' | 'offline' | 'beta' | 'ok' | 'error' | 'warning' | 'info' | 'critical';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

const BADGE_STYLES = {
  online: 'bg-[#00E5A0]/10 text-[#00E5A0] border-[#00E5A0]/20',
  ok: 'bg-[#00E5A0]/10 text-[#00E5A0] border-[#00E5A0]/20',
  busy: 'bg-[#FFB547]/10 text-[#FFB547] border-[#FFB547]/20',
  warning: 'bg-[#FFB547]/10 text-[#FFB547] border-[#FFB547]/20',
  offline: 'bg-[#444444]/10 text-[#888888] border-[#444444]/20',
  error: 'bg-[#FF3A5C]/10 text-[#FF3A5C] border-[#FF3A5C]/20',
  critical: 'bg-[#FF3A5C]/10 text-[#FF3A5C] border-[#FF3A5C]/20',
  beta: 'bg-[#FF5C3A]/10 text-[#FF5C3A] border-[#FF5C3A]/20',
  info: 'bg-[#5C8AFF]/10 text-[#5C8AFF] border-[#5C8AFF]/20',
};

export function Badge({ variant, children, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        BADGE_STYLES[variant],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {children}
    </span>
  );
}

// ============================================================================
// StatCard - Métrica individual con label, valor, trend
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  accent?: boolean;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  trend,
  trendDirection = 'neutral',
  icon,
  accent = false,
  onClick,
}: StatCardProps) {
  const trendColors = {
    up: 'text-[#00E5A0]',
    down: 'text-[#FF3A5C]',
    neutral: 'text-[#888888]',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-lg border bg-[#111111] p-4 transition-all duration-200',
        'hover:border-[#FF5C3A]/30 hover:shadow-[0_0_30px_rgba(255,92,58,0.1)]',
        accent && 'border-[#FF5C3A]/30 shadow-[0_0_20px_rgba(255,92,58,0.1)]',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Scanline effect overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)'
      }} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-[#888888]">
            {label}
          </span>
          {icon && <span className="text-[#888888]">{icon}</span>}
        </div>
        
        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-semibold text-[#F0F0F0]">
            {value}
          </span>
          {trend && (
            <span className={cn('text-sm font-medium', trendColors[trendDirection])}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MonoNumber - Número en JetBrains Mono con animación
// ============================================================================

interface MonoNumberProps {
  value: number;
  format?: 'number' | 'currency' | 'percent' | 'decimal';
  duration?: number;
  className?: string;
}

export function MonoNumber({ value, format = 'number', duration = 800, className }: MonoNumberProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('font-mono font-medium text-[#F0F0F0]', className)}
    >
      {format === 'number' && new Intl.NumberFormat('es-CO').format(value)}
      {format === 'currency' && new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)}
      {format === 'percent' && `${(value * 100).toFixed(1)}%`}
      {format === 'decimal' && value.toFixed(2)}
    </motion.span>
  );
}

// ============================================================================
// LiveClock - Reloj HH:MM:SS en tiempo real
// ============================================================================

import { useState, useEffect } from 'react';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <span className="font-mono text-sm font-medium tabular-nums text-[#888888]">
      {formatTime(time)} <span className="text-[#555555]">COT</span>
    </span>
  );
}

// ============================================================================
// ProgressBar - Barra animada con % label
// ============================================================================

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showLabel?: boolean;
  color?: 'accent' | 'success' | 'warning' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PROGRESS_COLORS = {
  accent: 'bg-[#FF5C3A]',
  success: 'bg-[#00E5A0]',
  warning: 'bg-[#FFB547]',
  critical: 'bg-[#FF3A5C]',
};

export function ProgressBar({ value, label, showLabel = true, color = 'accent', size = 'md', className }: ProgressBarProps) {
  const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-[#888888]">{label}</span>
          {showLabel && (
            <span className="text-xs font-mono text-[#F0F0F0]">{Math.round(value)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-[#1e1e1e]', heights[size])}>
        <motion.div
          className={cn('h-full rounded-full', PROGRESS_COLORS[color])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// TrendArrow - Flecha ▲/▼ con color dinámico
// ============================================================================

interface TrendArrowProps {
  value: string;
  direction?: 'up' | 'down' | 'neutral';
}

export function TrendArrow({ value, direction = 'neutral' }: TrendArrowProps) {
  const colors = {
    up: 'text-[#00E5A0]',
    down: 'text-[#FF3A5C]',
    neutral: 'text-[#888888]',
  };

  const arrows = {
    up: '▲',
    down: '▼',
    neutral: '◆',
  };

  return (
    <span className={cn('font-mono text-sm font-medium', colors[direction])}>
      {arrows[direction]} {value}
    </span>
  );
}

// ============================================================================
// MetricDelta - "+12%" con color y flecha
// ============================================================================

interface MetricDeltaProps {
  value: number;
  label?: string;
}

export function MetricDelta({ value, label }: MetricDeltaProps) {
  const isPositive = value >= 0;
  const color = isPositive ? 'text-[#00E5A0]' : 'text-[#FF3A5C]';

  return (
    <span className={cn('flex items-center gap-1 text-sm font-medium', color)}>
      <span>{isPositive ? '▲' : '▼'}</span>
      <span className="font-mono">{Math.abs(value)}%</span>
      {label && <span className="text-[#555555]">{label}</span>}
    </span>
  );
}

// ============================================================================
// GlowButton - CTA con hover glow naranja
// ============================================================================

interface GlowButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function GlowButton({
  variant = 'primary',
  size = 'md',
  children,
  className,
  onClick,
  disabled,
}: GlowButtonProps) {
  const variants = {
    primary: 'bg-[#FF5C3A] text-white hover:bg-[#FF7A5C] shadow-[0_0_20px_rgba(255,92,58,0.4)]',
    secondary: 'bg-[#1a1a1a] text-[#F0F0F0] border border-[#2a2a2a] hover:border-[#FF5C3A]/50',
    ghost: 'bg-transparent text-[#888888] hover:text-[#F0F0F0]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg font-medium transition-all duration-200',
        variants[variant],
        sizes[size],
        variant === 'primary' && 'hover:shadow-[0_0_30px_rgba(255,92,58,0.5)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </motion.button>
  );
}

// ============================================================================
// IconButton - Botón cuadrado con icono
// ============================================================================

interface IconButtonProps {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

export function IconButton({
  icon,
  size = 'md',
  variant = 'default',
  className,
  onClick,
  disabled,
  title,
}: IconButtonProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const variants = {
    default: 'bg-[#1a1a1a] text-[#888888] hover:bg-[#222222] hover:text-[#F0F0F0] border border-[#2a2a2a]',
    accent: 'bg-[#FF5C3A]/10 text-[#FF5C3A] hover:bg-[#FF5C3A]/20 border border-[#FF5C3A]/30',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center justify-center rounded-lg transition-all duration-200',
        sizes[size],
        variants[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon}
    </motion.button>
  );
}

// ============================================================================
// Separator - Divisor horizontal con glow sutil
// ============================================================================

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  glow?: boolean;
}

export function Separator({ orientation = 'horizontal', glow = false }: SeparatorProps) {
  return (
    <div
      className={cn(
        'bg-[#1e1e1e]',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        glow && orientation === 'horizontal' && 'bg-gradient-to-r from-transparent via-[#FF5C3A]/20 to-transparent'
      )}
    />
  );
}