'use client';

import { useState, useEffect } from 'react';
import { ProductList } from '@/components/dashboard/ProductList';
import { ProductForm } from '@/components/dashboard/ProductForm';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { productsService } from '@/services/products.service';
import type { Product, CreateProductDto } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLimit, setProductsLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        {!showForm && (
          <Button onClick={handleNewProduct} size="md">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
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
          onEdit={(p) => { setEditingProduct(p); setShowForm(true); }}
          onDelete={handleDeleteProduct}
        />
      )}
    </div>
  );
}
