import { useState, useCallback } from 'react';
import { productsService } from '@/services/products.service';
import type { Product, CreateProductDto } from '@/types';

interface UseProductFormModalOptions {
  onProductCreated?: () => void;
  onProductUpdated?: () => void;
}

export interface UseProductFormModalResult {
  // State
  isOpen: boolean;
  editingProduct: Product | null;
  
  // Actions
  openCreate: () => void;
  openEdit: (product: Product) => void;
  close: () => void;
  
  // Form handlers (to be passed to ProductForm)
  handleCreate: (data: CreateProductDto) => Promise<void>;
  handleUpdate: (data: CreateProductDto) => Promise<void>;
}

export function useProductFormModal(options: UseProductFormModalOptions = {}): UseProductFormModalResult {
  const { onProductCreated, onProductUpdated } = options;
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const openCreate = useCallback(() => {
    setEditingProduct(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingProduct(null);
  }, []);

  const handleCreate = useCallback(async (data: CreateProductDto) => {
    await productsService.createProduct(data);
    onProductCreated?.();
    close();
  }, [onProductCreated, close]);

  const handleUpdate = useCallback(async (data: CreateProductDto) => {
    if (!editingProduct) return;
    await productsService.updateProduct(editingProduct.id, data);
    onProductUpdated?.();
    close();
  }, [editingProduct, onProductUpdated, close]);

  return {
    isOpen,
    editingProduct,
    openCreate,
    openEdit,
    close,
    handleCreate,
    handleUpdate,
  };
}