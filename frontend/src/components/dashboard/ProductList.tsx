'use client';

import React from 'react';
import type { Product } from '@/types';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';

export type ViewMode = 'grid' | 'thumbnails' | 'list';

interface ProductListProps {
  products: Product[];
  viewMode?: ViewMode;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

// ── Imagen con fallback ──────────────────────────────────────────────────────
function ProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [errored, setErrored] = React.useState(false);
  if (errored) {
    return (
      <div className={`flex items-center justify-center ${className ?? ''}`} style={{ backgroundColor: 'var(--border-color)' }}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#555' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5A.75.75 0 0121 3.75v16.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 20.25V3.75A.75.75 0 013.75 3z" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover object-center ${className ?? ''}`}
      onError={() => setErrored(true)}
    />
  );
}

// ── Badges de categoría y badge ──────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}>
      {category}
    </span>
  );
}

function ProductBadge({ badge }: { badge: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    nuevo:  { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a' },
    top:    { bg: 'rgba(234,179,8,0.12)',  color: '#ca8a04' },
    oferta: { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626' },
  };
  const s = styles[badge] ?? { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {badge}
    </span>
  );
}

// ── Estado vacío ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <Card>
      <CardBody>
        <div className="text-center py-12">
          <svg className="mx-auto h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No hay productos</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Comienza creando tu primer producto.</p>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Vista GRID (tarjetas grandes — vista actual) ─────────────────────────────
function GridView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id}>
          <div className="aspect-square w-full overflow-hidden rounded-t-xl" style={{ backgroundColor: 'var(--border-color)' }}>
            <ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full" />
          </div>
          <CardBody>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
            {product.description && (
              <p className="mt-1 text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {product.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={product.category} />
              {product.badge && <ProductBadge badge={product.badge} />}
              {product.price != null && (
                <span className="text-xs font-semibold ml-auto" style={{ color: 'var(--text-primary)' }}>
                  ${product.price.toLocaleString('es-CO')}
                </span>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onEdit(product)} className="flex-1">Editar</Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(product.id)} className="flex-1">Eliminar</Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

// ── Vista THUMBNAILS (miniaturas pequeñas) ───────────────────────────────────
function ThumbnailsView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="group relative rounded-xl overflow-hidden border transition-all"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          {/* Imagen cuadrada */}
          <div className="aspect-square w-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
            <ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full transition-transform duration-200 group-hover:scale-105" />
          </div>

          {/* Overlay con acciones al hover */}
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <button
              onClick={() => onEdit(product)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              title="Editar"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: 'rgba(239,68,68,0.25)' }}
              title="Eliminar"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>

          {/* Nombre debajo */}
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
            {product.price != null && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>${product.price.toLocaleString('es-CO')}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Vista LIST (tabla compacta) ──────────────────────────────────────────────
function ListView({ products, onEdit, onDelete }: Omit<ProductListProps, 'viewMode'>) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
            <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Producto</th>
            <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>Categoría</th>
            <th className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Precio</th>
            <th className="text-right px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <tr
              key={product.id}
              className="transition-colors"
              style={{
                backgroundColor: i % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-card)',
                borderBottom: i < products.length - 1 ? '1px solid var(--border-color)' : undefined,
              }}
            >
              {/* Producto: miniatura + nombre + descripción */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--border-color)' }}>
                    <ProductImage src={product.imageUrl} alt={product.name} className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                    {product.description && (
                      <p className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>{product.description}</p>
                    )}
                  </div>
                </div>
              </td>

              {/* Categoría */}
              <td className="px-4 py-3 hidden sm:table-cell">
                <div className="flex items-center gap-1.5">
                  <CategoryBadge category={product.category} />
                  {product.badge && <ProductBadge badge={product.badge} />}
                </div>
              </td>

              {/* Precio */}
              <td className="px-4 py-3 hidden md:table-cell">
                {product.price != null ? (
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    ${product.price.toLocaleString('es-CO')}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                )}
              </td>

              {/* Acciones */}
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: '#ef4444' }}
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export function ProductList({ products, viewMode = 'grid', onEdit, onDelete }: ProductListProps) {
  if (products.length === 0) return <EmptyState />;

  if (viewMode === 'list') return <ListView products={products} onEdit={onEdit} onDelete={onDelete} />;
  if (viewMode === 'thumbnails') return <ThumbnailsView products={products} onEdit={onEdit} onDelete={onDelete} />;
  return <GridView products={products} onEdit={onEdit} onDelete={onDelete} />;
}
