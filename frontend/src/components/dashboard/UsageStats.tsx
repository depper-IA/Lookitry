'use client';

import React from 'react';
import type { UsageStats as UsageStatsType } from '@/types';
import { Card, CardHeader, CardBody } from '../ui/Card';

interface UsageStatsProps {
  stats: UsageStatsType;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#FF5C3A';
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function UsageStats({ stats }: UsageStatsProps) {
  const { generationsUsed, generationsLimit, productsCount, productsLimit } = stats.currentMonth;
  const genPct = (generationsUsed / generationsLimit) * 100;
  const prodPct = (productsCount / productsLimit) * 100;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-5">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: 'Generaciones este mes',
            used: generationsUsed,
            limit: generationsLimit,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            label: 'Productos activos',
            used: productsCount,
            limit: productsLimit,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            ),
          },
        ].map(({ label, used, limit, icon }) => (
          <Card key={label}>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: '#FF5C3A' }}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                  <p className="text-2xl font-bold font-syne" style={{ color: 'var(--text-primary)' }}>
                    {used} <span className="text-base font-normal" style={{ color: 'var(--text-muted)' }}>/ {limit}</span>
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Detalle */}
      <Card>
        <CardHeader>
          <h3 className="font-syne font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Uso detallado</h3>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Generaciones */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Generaciones de imágenes</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{genPct.toFixed(1)}%</span>
            </div>
            <ProgressBar value={generationsUsed} max={generationsLimit} />
            <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {generationsUsed} de {generationsLimit} generaciones usadas este mes.
            </p>
            {genPct >= 90 && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Estás cerca de alcanzar tu límite mensual de generaciones.
              </div>
            )}
          </div>

          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Productos</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{prodPct.toFixed(1)}%</span>
            </div>
            <ProgressBar value={productsCount} max={productsLimit} />
            <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {productsCount} de {productsLimit} productos activos.
            </p>
            {prodPct >= 100 && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                Has alcanzado el límite de productos. Elimina algunos para agregar nuevos.
              </div>
            )}
          </div>

          {/* Fecha reset */}
          <div className="pt-4 border-t flex items-center gap-2 text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            El contador se reiniciará el <strong className="ml-1" style={{ color: 'var(--text-primary)' }}>{formatDate(stats.resetDate)}</strong>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
