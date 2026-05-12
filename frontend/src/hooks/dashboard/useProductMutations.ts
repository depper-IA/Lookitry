'use client';

import { useCallback, useRef } from 'react';
import { productsService } from '@/services/products.service';
import type { Product, CreateProductDto } from '@/types';

interface UseProductMutationsOptions {
  onProductCreated?: (product: Product) => void;
  onProductUpdated?: (product: Product) => void;
  onProductDeleted?: (productId: string) => void;
  onError?: (message: string, error?: unknown) => void;
}

/**
 * Provides CRUD mutation handlers for products.
 * @param options - Callback options for mutation outcomes
 */
export function useProductMutations(options: UseProductMutationsOptions = {}) {
  const { onProductCreated, onProductUpdated, onProductDeleted, onError } = options;

  const handleError = useCallback(
    (err: unknown, fallback: string) => {
      const message =
        err instanceof Error
          ? err.message
          : (err as any)?.response?.data?.message || fallback;
      onError?.(message, err);
    },
    [onError]
  );

  const createProduct = useCallback(
    async (data: CreateProductDto): Promise<Product | null> => {
      try {
        const product = await productsService.createProduct(data);
        onProductCreated?.(product);
        return product;
      } catch (err: unknown) {
        handleError(err, 'Error al crear producto');
        return null;
      }
    },
    [handleError, onProductCreated]
  );

  const updateProduct = useCallback(
    async (productId: string, data: Partial<CreateProductDto>): Promise<Product | null> => {
      try {
        const product = await productsService.updateProduct(productId, data);
        onProductUpdated?.(product);
        return product;
      } catch (err: unknown) {
        handleError(err, 'Error al actualizar producto');
        return null;
      }
    },
    [handleError, onProductUpdated]
  );

  const deleteProduct = useCallback(
    async (productId: string): Promise<boolean> => {
      try {
        await productsService.deleteProduct(productId);
        onProductDeleted?.(productId);
        return true;
      } catch (err: unknown) {
        handleError(err, 'Error al eliminar producto');
        return false;
      }
    },
    [handleError, onProductDeleted]
  );

  // Widget mutations
  const addToWidget = useCallback(
    async (productId: string, currentIds: string[]): Promise<string[] | null> => {
      try {
        const newIds = [...currentIds, productId];
        const result = await productsService.updateWidgetProducts(newIds);
        return result.productIds;
      } catch (err: unknown) {
        handleError(err, 'Error al agregar al widget');
        return null;
      }
    },
    [handleError]
  );

  const removeFromWidget = useCallback(
    async (productId: string, currentIds: string[]): Promise<string[] | null> => {
      try {
        const newIds = currentIds.filter((id) => id !== productId);
        const result = await productsService.updateWidgetProducts(newIds);
        return result.productIds;
      } catch (err: unknown) {
        handleError(err, 'Error al remover del widget');
        return null;
      }
    },
    [handleError]
  );

  const reorderWidget = useCallback(
    async (newOrder: string[]): Promise<string[] | null> => {
      try {
        const result = await productsService.updateWidgetProducts(newOrder);
        return result.productIds;
      } catch (err: unknown) {
        handleError(err, 'Error al reordenar widget');
        return null;
      }
    },
    [handleError]
  );

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    addToWidget,
    removeFromWidget,
    reorderWidget,
  };
}