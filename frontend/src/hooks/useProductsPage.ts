import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/services/products.service';
import { brandsService } from '@/services/brands.service';
import type { Product, CreateProductDto, BrandPlan } from '@/types';

const PLAN_WIDGET_LIMITS: Record<BrandPlan, number> = {
  TRIAL: 1,
  BASIC: 5,
  PRO: 15,
  ENTERPRISE: Infinity,
};

export interface UseProductsPageOptions {
  onError?: (message: string) => void;
}

export interface UseProductsPageResult {
  // State
  products: Product[];
  productsLimit: number;
  isLoading: boolean;
  error: string | null;
  brandPlan: BrandPlan;
  brandId: string | undefined;
  widgetProductIds: string[];
  widgetProducts: Product[];
  isSavingWidget: boolean;
  
  // Computed
  widgetMaxProducts: number;
  canAddToWidget: boolean;
  categories: string[];
  
  // Actions
  loadProducts: () => Promise<void>;
  addToWidget: (productId: string) => void;
  removeFromWidget: (productId: string) => void;
  reorderWidget: (newOrder: string[]) => void;
  clearWidget: () => Promise<void>;
}

export function useProductsPage(options: UseProductsPageOptions = {}): UseProductsPageResult {
  const { onError } = options;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLimit, setProductsLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | undefined>();
  const [brandPlan, setBrandPlan] = useState<BrandPlan>('BASIC');
  const [widgetProductIds, setWidgetProductIds] = useState<string[]>([]);
  const [widgetProducts, setWidgetProducts] = useState<Product[]>([]);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSavingWidget, setIsSavingWidget] = useState(false);

  // Computed values
  const widgetMaxProducts = PLAN_WIDGET_LIMITS[brandPlan] ?? 5;
  const canAddToWidget = widgetProducts.length < widgetMaxProducts;
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await productsService.getProducts();
      setProducts(data.products);
      setProductsLimit(data.limit);
      setError(null);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al sincronizar catálogo';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Load brand info on mount
  useEffect(() => {
    brandsService.getCurrentBrand().then((brand) => {
      setBrandId(brand.id);
      setBrandPlan(brand.plan as BrandPlan);
      setWidgetProductIds(brand.widgetProductIds || []);
    }).catch(console.error);
  }, []);

  // Load widget products
  const loadWidgetProducts = useCallback(async () => {
    try {
      const products = await productsService.getWidgetProducts();
      setWidgetProducts(products);
    } catch (err) {
      console.error('Error loading widget products:', err);
      setWidgetProducts([]);
    }
  }, []);

  useEffect(() => {
    if (brandId) {
      loadWidgetProducts();
    }
  }, [brandId, loadWidgetProducts]);

  // Widget operations
  const addToWidget = useCallback((productId: string) => {
    if (widgetProductIds.length >= widgetMaxProducts) {
      setError(`Máximo ${widgetMaxProducts} productos en widget (plan ${brandPlan})`);
      return;
    }
    if (widgetProductIds.includes(productId)) return;

    const productToAdd = products.find(p => p.id === productId);
    const newWidgetIds = [...widgetProductIds, productId];
    setWidgetProductIds(newWidgetIds);

    if (productToAdd) {
      setWidgetProducts(prev => [...prev, productToAdd]);
    }

    debouncedSaveWidget(newWidgetIds);
  }, [widgetProductIds, widgetMaxProducts, brandPlan, products, widgetProducts]);

  const removeFromWidget = useCallback((productId: string) => {
    const newWidgetIds = widgetProductIds.filter((id) => id !== productId);
    setWidgetProductIds(newWidgetIds);
    setWidgetProducts(prev => prev.filter(p => p.id !== productId));
    debouncedSaveWidget(newWidgetIds);
  }, [widgetProductIds]);

  const reorderWidget = useCallback((newOrder: string[]) => {
    setWidgetProductIds(newOrder);
    setWidgetProducts(prev => {
      const reordered = newOrder
        .map(id => prev.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined);
      return reordered;
    });
    debouncedSaveWidget(newOrder);
  }, []);

  const debouncedSaveWidget = useCallback((productIds: string[]) => {
    setSaveTimeout(prev => {
      if (prev) clearTimeout(prev);
      return null;
    });

    const timeout = setTimeout(async () => {
      setIsSavingWidget(true);
      try {
        const response = await productsService.updateWidgetProducts(productIds);
        if (response.removedIds && response.removedIds.length > 0) {
          setError(`${response.removedIds.length} producto(s) fueron removido(s) del widget (no pertenecían a tu marca)`);
        }
      } catch (err) {
        console.error('Error saving widget:', err);
        setError('Error al guardar widget');
      } finally {
        setIsSavingWidget(false);
        setSaveTimeout(null);
      }
    }, 500);
  }, []);

  const clearWidget = useCallback(async () => {
    setWidgetProductIds([]);
    await debouncedSaveWidget([]);
  }, [debouncedSaveWidget]);

  return {
    products,
    productsLimit,
    isLoading,
    error,
    brandPlan,
    brandId,
    widgetProductIds,
    widgetProducts,
    isSavingWidget,
    widgetMaxProducts,
    canAddToWidget,
    categories,
    loadProducts,
    addToWidget,
    removeFromWidget,
    reorderWidget,
    clearWidget,
  };
}