'use client';

import React from 'react';

export type SkeletonVariant = 'grid' | 'list' | 'thumbnail';

interface ProductSkeletonProps {
  variant?: SkeletonVariant;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — Premium dark skeleton matching the brand aesthetic
// ═══════════════════════════════════════════════════════════════════════════════
const DESIGN = {
  accent: '#FF5C3A',
  surface: 'rgba(255, 255, 255, 0.04)',
  surfaceElevated: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.06)',
  shimmer: 'rgba(255, 255, 255, 0.08)',
  shimmerHighlight: 'rgba(255, 255, 255, 0.15)',
  textMuted: 'rgba(255, 255, 255, 0.3)',
};

// Shared shimmer animation (reuse across variants)
const shimmerClass =
  'animate-pulse rounded-xl';

function ShimmerBlock({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`${shimmerClass} relative overflow-hidden`}
      style={{
        background: DESIGN.surface,
        border: `1px solid ${DESIGN.border}`,
        ...style,
      }}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${DESIGN.shimmerHighlight} 50%, transparent 100%)`,
          animation: 'shimmer 1.5s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRID VARIANT — Full product card skeleton (520px min height)
// ═══════════════════════════════════════════════════════════════════════════════

function GridSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        minHeight: '520px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image area */}
      <div className="aspect-square relative overflow-hidden">
        <ShimmerBlock
          className="absolute inset-0 rounded-none"
          style={{ borderRadius: 0 }}
        />
        {/* Top badges row */}
        <div className="absolute top-3 left-3 flex gap-2">
          <ShimmerBlock className="w-16 h-5 rounded-full" />
          <ShimmerBlock className="w-14 h-5 rounded-full" />
        </div>
        {/* Active indicator */}
        <div className="absolute top-3 right-3">
          <ShimmerBlock className="w-7 h-7 rounded-full" />
        </div>
      </div>

      {/* Content area */}
      <div className="p-5 flex flex-col flex-1 justify-end gap-3">
        {/* Product name */}
        <ShimmerBlock className="h-4 w-3/4" />
        <ShimmerBlock className="h-4 w-1/2" />

        {/* Description lines */}
        <div className="space-y-2 mt-1">
          <ShimmerBlock className="h-3 w-full" style={{ borderRadius: '4px' }} />
          <ShimmerBlock className="h-3 w-4/5" style={{ borderRadius: '4px' }} />
        </div>

        {/* Attribute pills */}
        <div className="flex gap-2 mt-2">
          <ShimmerBlock className="w-16 h-5 rounded-full" />
          <ShimmerBlock className="w-12 h-5 rounded-full" />
        </div>

        {/* Price + status row */}
        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className="space-y-1">
            <ShimmerBlock className="h-3 w-12" style={{ borderRadius: '4px' }} />
            <ShimmerBlock className="h-6 w-20" />
          </div>
          <ShimmerBlock className="w-20 h-4 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// THUMBNAIL VARIANT — Compact product card skeleton (440px min height)
// ═══════════════════════════════════════════════════════════════════════════════

function ThumbnailSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        minHeight: '440px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image area */}
      <div className="aspect-[4/5] relative overflow-hidden">
        <ShimmerBlock
          className="absolute inset-0 rounded-none"
          style={{ borderRadius: 0 }}
        />
        {/* Top badges */}
        <div className="absolute top-3 left-3">
          <ShimmerBlock className="w-14 h-5 rounded-full" />
        </div>
        {/* Active indicator */}
        <div className="absolute top-3 right-3">
          <ShimmerBlock className="w-7 h-7 rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <ShimmerBlock className="h-3 w-3/4" />
        <ShimmerBlock className="h-3 w-1/2" />

        {/* Price */}
        <div className="mt-auto pt-2 flex justify-between items-end">
          <ShimmerBlock className="h-5 w-16" />
          <ShimmerBlock className="w-16 h-3 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIST VARIANT — Table row style skeleton
// ═══════════════════════════════════════════════════════════════════════════════

function ListSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Accent line */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(to right, ${DESIGN.accent}, transparent)`,
        }}
      />

      {/* Desktop table row */}
      <div className="hidden lg:flex items-center px-6 py-5 gap-4 border-b border-[var(--card-border)]">
        {/* Product image + name */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <ShimmerBlock className="w-14 h-14 rounded-xl shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <ShimmerBlock className="h-4 w-40" />
            <ShimmerBlock className="h-3 w-24" style={{ borderRadius: '4px' }} />
          </div>
        </div>

        {/* Category */}
        <div className="flex gap-2">
          <ShimmerBlock className="w-16 h-5 rounded-full" />
        </div>

        {/* Specs */}
        <div className="flex-1 space-y-2 px-4">
          <ShimmerBlock className="h-3 w-full" style={{ borderRadius: '4px' }} />
          <ShimmerBlock className="h-3 w-2/3" style={{ borderRadius: '4px' }} />
        </div>

        {/* Price */}
        <div className="w-28 shrink-0">
          <ShimmerBlock className="h-4 w-16 ml-auto" style={{ borderRadius: '4px' }} />
          <ShimmerBlock className="h-6 w-20 ml-auto mt-1" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <ShimmerBlock className="w-10 h-10 rounded-lg" />
          <ShimmerBlock className="w-10 h-10 rounded-lg" />
        </div>
      </div>

      {/* Mobile card skeleton */}
      <div className="lg:hidden p-4 flex gap-4">
        <ShimmerBlock className="w-20 h-20 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-4 w-3/4" />
          <ShimmerBlock className="h-3 w-1/2" />
          <ShimmerBlock className="h-3 w-2/3" style={{ borderRadius: '4px' }} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export function ProductSkeleton({ variant = 'grid' }: ProductSkeletonProps) {
  if (variant === 'list') return <ListSkeleton />;
  if (variant === 'thumbnail') return <ThumbnailSkeleton />;
  return <GridSkeleton />;
}

// Grid of skeletons for loading state
interface ProductSkeletonGridProps {
  count?: number;
  variant?: SkeletonVariant;
}

export function ProductSkeletonGrid({ count = 8, variant = 'grid' }: ProductSkeletonGridProps) {
  return (
    <div
      className={
        variant === 'list'
          ? 'space-y-4'
          : variant === 'thumbnail'
          ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}