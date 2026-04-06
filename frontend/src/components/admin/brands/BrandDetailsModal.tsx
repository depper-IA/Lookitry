'use client';

import { Brand } from '@/app/admin/brands/page';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface BrandDetailsModalProps {
  brand: Brand;
  onClose: () => void;
  onToggleLanding: (brand: Brand) => void;
  onSaveNotes: (brand: Brand) => void;
  onOpenModalConfig: (brand: Brand) => void;
  togglingLanding: boolean;
  savingNotes: boolean;
}

export function BrandDetailsModal({
  brand,
  onClose,
  onToggleLanding,
  onSaveNotes,
  onOpenModalConfig,
  togglingLanding,
  savingNotes,
}: BrandDetailsModalProps) {
  const [notes, setNotes] = useState(brand.internal_notes || '');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-150 animate-in fade-in">
      <div
        className="rounded-[2rem] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-transform duration-200 animate-in zoom-in-95"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <h2 className="font-jakarta font-bold tracking-tight text-xl" style={{ color: 'var(--text-primary)' }}>
            Detalles de {brand.name}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {([
              ['Email', brand.email],
              ['Slug', brand.slug],
              ['Plan', brand.plan],
              ['Fecha de registro', new Date(brand.created_at).toLocaleDateString('es-ES')],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
            {brand.plan === 'TRIAL' && (
              <div className="col-span-2">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Estado de prueba</p>
                <p className="text-sm font-medium" style={{ color: '#6366f1' }}>
                  En período de prueba — {brand.trial_days_remaining ?? 0} días restantes
                  {brand.trial_end_date && ` (vence ${new Date(brand.trial_end_date).toLocaleDateString('es-ES')})`}
                </p>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          <div className="border-t pt-4">
            <h3 className="font-jakarta font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Estadísticas</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Productos', value: brand.stats.productsCount, color: '#3b82f6' },
                { label: 'Generaciones', value: brand.stats.generationsCount, color: '#10b981' },
                { label: 'Este mes', value: brand.stats.generationsThisMonth, color: '#FF5C3A' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-base)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                  <p className="text-xl font-bold font-jakarta" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mini-landing toggle */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Mini-landing activa</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {brand.has_landing_page
                    ? 'La página pública está activa y visible sin banners.'
                    : 'La página muestra un banner de activación ($500.000 COP).'}
                </p>
              </div>
              <button
                onClick={() => onToggleLanding(brand)}
                disabled={togglingLanding}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
                style={{ backgroundColor: brand.has_landing_page ? '#FF5C3A' : 'var(--border-color)' }}
                aria-label="Activar mini-landing"
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                  style={{ transform: brand.has_landing_page ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
                />
              </button>
            </div>
          </div>

          {/* Notas internas */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notas internas</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Solo visibles para el equipo</p>
              </div>
              <button
                onClick={() => onSaveNotes({ ...brand, internal_notes: notes })}
                disabled={savingNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#FF5C3A', color: 'white' }}
              >
                {savingNotes && <RefreshCw className="w-3 h-3 animate-spin" />}
                {savingNotes ? 'Guardando...' : 'Guardar notas'}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Añadir notas sobre esta marca..."
              className="w-full px-3 py-2 rounded-xl text-sm resize-none"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              rows={3}
            />
          </div>

          {/* Botón Configurar Modal */}
          <div className="border-t pt-4">
            <button
              onClick={() => { onClose(); onOpenModalConfig(brand); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Configurar Modal de Activación
            </button>
          </div>

          {/* Widget preview */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Vista previa del widget</p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
              <iframe
                src={`https://lookitry.com/embed/${brand.slug}`}
                className="w-full h-80"
                title={`Preview widget de ${brand.name}`}
              />
            </div>
            <a
              href={`https://lookitry.com/embed/${brand.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs mt-2 inline-flex items-center gap-1 hover:underline"
              style={{ color: '#FF5C3A' }}
            >
              Abrir en nueva pestaña
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
