'use client';

import React from 'react';
import type { Product } from '@/types';
import { getProxiedUrl } from '@/utils/imageProxy';

interface WidgetPreviewProps {
  products: Product[];
  maxProducts: number;
}

export function WidgetPreview({ products, maxProducts }: WidgetPreviewProps) {
  const percentage = maxProducts > 0 ? (products.length / maxProducts) * 100 : 0;
  const isWarning = percentage >= 80 && percentage < 100;
  const isFull = products.length >= maxProducts;
  const overflow = products.length - 4;

  const borderColor = isFull
    ? '#EF4444'
    : isWarning
    ? '#FF5C3A'
    : 'var(--card-border)';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Vista Previa
        </span>
        {isFull && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 uppercase">
            Completo
          </span>
        )}
      </div>

      {/* Preview Grid */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden p-3 transition-all duration-300"
        style={{
          background: 'var(--bg-card)',
          border: `2px solid ${borderColor}`,
          boxShadow: isWarning ? '0 0 20px rgba(255,92,58,0.2)' : isFull ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
        }}
      >
        {products.length === 0 ? (
          /* Empty State */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-[var(--card-border)] flex items-center justify-center">
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>?</span>
            </div>
          </div>
        ) : (
          <>
            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 h-full">
              {products.slice(0, 4).map((product, index) => (
                <div
                  key={product.id}
                  className="relative rounded-lg overflow-hidden border border-[var(--card-border)]"
                >
                  <img
                    src={getProxiedUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ))}
              {/* Fill empty slots */}
              {products.length < 4 &&
                Array.from({ length: 4 - products.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--bg-card-elevated)]"
                  />
                ))}
            </div>

            {/* Overflow Badge */}
            {overflow > 0 && (
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm">
                <span className="text-[9px] font-bold text-white">+{overflow} más</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-card)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              background: isFull
                ? '#EF4444'
                : isWarning
                ? '#FF5C3A'
                : '#10B981',
            }}
          />
        </div>
        <p className="text-[9px] font-semibold text-center" style={{ color: 'var(--text-muted)' }}>
          {products.length} producto{products.length !== 1 ? 's' : ''} en widget
        </p>
      </div>
    </div>
  );
}