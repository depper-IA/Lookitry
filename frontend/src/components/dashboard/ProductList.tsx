'use client';

import React from 'react';
import type { Product } from '@/types';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  if (products.length === 0) {
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id}>
          <div className="aspect-square w-full overflow-hidden rounded-t-xl" style={{ backgroundColor: 'var(--border-color)' }}>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          </div>
          <CardBody>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
            {product.description && (
              <p className="mt-1 text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {product.description}
              </p>
            )}
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}>
                {product.category}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onEdit(product)} className="flex-1">
                Editar
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(product.id)} className="flex-1">
                Eliminar
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
