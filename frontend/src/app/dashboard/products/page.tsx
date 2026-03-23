'use client';

import { useState, useEffect } from 'react';
import { ProductList, type ViewMode } from '@/components/dashboard/ProductList';
import { ProductForm } from '@/components/dashboard/ProductForm';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { productsService } from '@/services/products.service';
import type { Product, CreateProductDto } from '@/types';

// ── Iconos de vista ──────────────────────────────────────────────────────────
function IconGrid() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconThumbnails() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconList() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'grid',       label: 'Cuadrícula',  icon: <IconGrid /> },
  { id: 'thumbnails', label: 'Miniaturas',  icon: <IconThumbnails /> },
  { id: 'list',       label: 'Lista',       icon: <IconList /> },
];

// ── Página ───────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLimit, setProductsLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Persistir preferencia de vista
  useEffect(() => {
    const saved = localStorage.getItem('products-view-mode') as ViewMode | null;
    if (saved && ['grid', 'thumbnails', 'list'].includes(saved)) setViewMode(saved);
  }, []);

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('products-view-mode', mode);
  };

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productsService.getProducts();
      setProducts(data.products);
      setProductsLimit(data.limit);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (data: CreateProductDto) => {
    try {
      await productsService.createProduct(data);
      await loadProducts();
      setShowForm(false);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Has alcanzado el límite de productos para tu plan');
      } else {
        setError(err.response?.data?.message || 'Error al crear producto');
      }
      throw err;
    }
  };

  const handleUpdateProduct = async (data: CreateProductDto) => {
    if (!editingProduct) return;
    try {
      await productsService.updateProduct(editingProduct.id, data);
      await loadProducts();
      setShowForm(false);
      setEditingProduct(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar producto');
      throw err;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    try {
      await productsService.deleteProduct(productId);
      await loadProducts();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar producto');
    }
  };

  const handleNewProduct = () => {
    if (products.length >= productsLimit) {
      setError(`Has alcanzado el límite de ${productsLimit} productos para tu plan`);
      return;
    }
    setEditingProduct(null);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            Productos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {products.length} de {productsLimit} productos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de vista — solo visible cuando no hay formulario abierto */}
          {!showForm && (
            <div
              className="flex items-center rounded-lg p-0.5 gap-0.5"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            >
              {VIEW_MODES.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => handleViewMode(id)}
                  title={label}
                  className="p-1.5 rounded-md transition-colors"
                  style={{
                    backgroundColor: viewMode === id ? '#FF5C3A' : 'transparent',
                    color: viewMode === id ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}

          {!showForm && (
            <Button onClick={handleNewProduct} size="md">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Producto
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {showForm ? (
        <ProductForm
          product={editingProduct}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
        />
      ) : (
        <ProductList
          products={products}
          viewMode={viewMode}
          onEdit={(p) => { setEditingProduct(p); setShowForm(true); }}
          onDelete={handleDeleteProduct}
        />
      )}
    </div>
  );
}
