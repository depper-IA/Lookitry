import { useCallback, useState } from 'react';
import type { Product, CreateProductDto } from '@/types';
import { productsService } from '@/services/products.service';

export interface UseProductMutationsOptions {
  onProductCreated?: () => void;
  onProductUpdated?: () => void;
  onProductDeleted?: () => void;
  onError?: (message: string) => void;
}

interface DeleteConfirmState {
  isOpen: boolean;
  productId?: string;
}

/**
 * Manages CRUD and widget operations for products.
 * Returns mutation handlers and delete confirmation state.
 */
export function useProductMutations(options: UseProductMutationsOptions = {}) {
  const { onProductCreated, onProductUpdated, onProductDeleted, onError } = options;

  // Delete confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState<DeleteConfirmState>({ isOpen: false });

  // CRUD operations
  const createProduct = useCallback(async (data: CreateProductDto) => {
    try {
      await productsService.createProduct(data);
      onProductCreated?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al crear producto';
      onError?.(message);
      throw err;
    }
  }, [onProductCreated, onError]);

  const updateProduct = useCallback(async (productId: string, data: CreateProductDto) => {
    try {
      await productsService.updateProduct(productId, data);
      onProductUpdated?.();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al actualizar producto';
      onError?.(message);
      throw err;
    }
  }, [onProductUpdated, onError]);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      await productsService.deleteProduct(productId);
      onProductDeleted?.();
      setConfirmDelete({ isOpen: false });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al eliminar producto';
      onError?.(message);
      throw err;
    }
  }, [onProductDeleted, onError]);

  // Delete confirmation handlers
  const openDeleteConfirm = useCallback((productId: string) => {
    setConfirmDelete({ isOpen: true, productId });
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setConfirmDelete({ isOpen: false });
  }, []);

  const confirmDeleteProduct = useCallback(async () => {
    if (confirmDelete.productId) {
      await deleteProduct(confirmDelete.productId);
    }
  }, [confirmDelete.productId, deleteProduct]);

  // Widget operations
  const addToWidget = useCallback(async (productId: string, widgetProductIds: string[], maxProducts: number) => {
    if (widgetProductIds.length >= maxProducts) {
      onError?.(`Máximo ${maxProducts} productos en widget`);
      return false;
    }
    if (widgetProductIds.includes(productId)) {
      return false;
    }
    return true; // Let caller handle state update
  }, [onError]);

  const removeFromWidget = useCallback(async (productId: string, widgetProductIds: string[]) => {
    return widgetProductIds.filter((id) => id !== productId);
  }, []);

  return {
    // CRUD
    createProduct,
    updateProduct,
    deleteProduct,
    // Delete confirmation
    confirmDelete,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteProduct,
    // Widget helpers
    addToWidget,
    removeFromWidget,
  };
}