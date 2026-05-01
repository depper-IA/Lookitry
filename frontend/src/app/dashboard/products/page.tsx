'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductList, type ViewMode } from '@/components/dashboard/ProductList';
import { ProductForm } from '@/components/dashboard/ProductForm';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { productsService } from '@/services/products.service';
import { brandsService } from '@/services/brands.service';
import { api } from '@/services/api';
import type { Product, CreateProductDto, BrandPlan } from '@/types';
import { getPricingConfig } from '@/lib/pricing';
import { WidgetPlaylist } from '@/components/dashboard/WidgetPlaylist';
import { WidgetPreview } from '@/components/dashboard/WidgetPreview';
import { CategoryFilter } from '@/components/dashboard/CategoryFilter';
import { useViewMode } from '@/hooks/useViewMode';
import { useProductSearch } from '@/hooks/useProductSearch';
import { useProductMutations } from '@/hooks/useProductMutations';
import {
  Package,
  Plus,
  LayoutGrid,
  Grid3X3,
  LayoutList,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Tag,
  ArrowRight,
  Trash2,
  Star,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

// Plan limits for widget products
const PLAN_WIDGET_LIMITS: Record<BrandPlan, number> = {
  TRIAL: 1,
  BASIC: 5,
  PRO: 15,
  ENTERPRISE: Infinity,
};

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ProductsPage() {
  // View mode from hook
  const [viewMode, handleViewMode] = useViewMode();

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLimit, setProductsLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | undefined>();
  const [brandPlan, setBrandPlan] = useState<BrandPlan>('BASIC');

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showExternalIdField, setShowExternalIdField] = useState(false);

  // Widget state
  const [widgetProductIds, setWidgetProductIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');

  // Mobile tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'widget'>('catalog');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 6;

  // Use product search hook
  const {
    filteredProducts,
    paginatedProducts,
    totalPages,
    goToPage,
  } = useProductSearch({
    products,
    categoryFilter,
  });

  // Use product mutations hook
  const {
    confirmDelete,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteProduct,
  } = useProductMutations({
    onProductCreated: () => {
      loadProducts();
      window.dispatchEvent(new CustomEvent('onboarding:step-complete', { detail: { step: 3 } }));
    },
    onProductDeleted: () => {
      loadProducts();
    },
    onError: (message) => setError(message),
  });

  // Widget state (kept locally for complex logic)
  const [widgetProducts, setWidgetProducts] = useState<Product[]>([]);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSavingWidget, setIsSavingWidget] = useState(false);

  // Computed
  const widgetMaxProducts = PLAN_WIDGET_LIMITS[brandPlan] ?? 5;
  const canAddToWidget = widgetProducts.length < widgetMaxProducts;
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter]);

  // Load brand info
  useEffect(() => {
    brandsService.getCurrentBrand().then((brand) => {
      setBrandId(brand.id);
      setBrandPlan(brand.plan as BrandPlan);
      setWidgetProductIds(brand.widgetProductIds || []);
    }).catch(console.error);
  }, []);

  // Load products on mount
  useEffect(() => {
    loadProducts();
    loadBrandIntegrationState();
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

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productsService.getProducts();
      setProducts(data.products);
      setProductsLimit(data.limit);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al sincronizar catálogo');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBrandIntegrationState = async () => {
    try {
      const res = await api.get<{
        products: { totalMappedProducts: number; activeMappedProducts: number };
        telemetry: { totalRequests: number; failedRequests: number; avgLatencyMs: number; lastSyncAt: string | null };
        integration: { pluginValidated: boolean; pluginValidatedAt: string | null; pluginStoreDomain: string | null };
      }>('/brands/me/woocommerce-metrics');

      const pluginValidated = Boolean(res.data?.integration?.pluginValidated);
      const lastSyncAt = res.data?.telemetry?.lastSyncAt ?? null;
      const totalRequests = Number(res.data?.telemetry?.totalRequests ?? 0);
      const mapped = Number(res.data?.products?.totalMappedProducts ?? 0);

      setShowExternalIdField(pluginValidated || Boolean(lastSyncAt) || totalRequests > 0 || mapped > 0);
    } catch {
      setShowExternalIdField(false);
    }
  };

  // Form handlers
  const handleCreateProduct = async (data: CreateProductDto) => {
    try {
      await productsService.createProduct(data);
      await loadProducts();
      setShowForm(false);
      setError(null);
      window.dispatchEvent(new CustomEvent('onboarding:step-complete', { detail: { step: 3 } }));
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Límite Alcanzado: Evoluciona tu plan para añadir más productos.');
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

  // Delete handlers
  const handleDeleteProduct = async (productId: string) => {
    if (widgetProductIds.includes(productId)) {
      const newWidgetIds = widgetProductIds.filter((id) => id !== productId);
      setWidgetProductIds(newWidgetIds);
      await debouncedSaveWidget(newWidgetIds);
    }
    openDeleteConfirm(productId);
  };

  // Widget handlers
  const handleAddToWidget = (productId: string) => {
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
  };

  const handleRemoveFromWidget = (productId: string) => {
    const newWidgetIds = widgetProductIds.filter((id) => id !== productId);
    setWidgetProductIds(newWidgetIds);
    setWidgetProducts(prev => prev.filter(p => p.id !== productId));
    debouncedSaveWidget(newWidgetIds);
  };

  const handleReorderWidget = (newOrder: string[]) => {
    setWidgetProductIds(newOrder);
    setWidgetProducts(prev => {
      const reordered = newOrder
        .map(id => prev.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined);
      return reordered;
    });
    debouncedSaveWidget(newOrder);
  };

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

  const handleClearWidget = async () => {
    setWidgetProductIds([]);
    await debouncedSaveWidget([]);
  };

  const handleNewProduct = () => {
    if (products.length >= productsLimit) {
      setError(`Límite de Productos: ${productsLimit} alcanzado. Amplía tu plan para añadir más.`);
      return;
    }
    setEditingProduct(null);
    setShowForm(true);
  };

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('products-view-mode', viewMode);
  }, [viewMode]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Spinner size="lg" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] animate-pulse">Cargando Catálogo...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-[1600px] mx-auto space-y-10 md:space-y-16 pb-32 px-4 xl:px-0 relative"
    >
      {/* Background orbs */}
      <div className="absolute top-0 -left-20 w-[400px] h-[400px] bg-[#FF5C3A]/5 blur-[150px] rounded-full -z-10" />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-indigo-500/5 blur-[180px] rounded-full -z-10" />

      {/* Header */}
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-10 border-b border-[var(--border-color)] pb-10 md:pb-12 mt-4 md:mt-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[2rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10 shadow-inner group transition-all">
              <Package className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" />
            </div>
            <h1 className="text-3xl md:text-5xl font-[950] tracking-tighter text-[var(--text-primary)] uppercase leading-none font-jakarta">Catálogo</h1>
          </div>
          <p className="text-[10px] md:text-[11px] font-black tracking-[0.3em] text-[var(--text-muted)] uppercase opacity-60">
            Productos Activos: <span className="text-[#FF5C3A] font-[950]">{products.length}</span> / <span className="text-indigo-400 font-[950] font-mono">{productsLimit}</span>
          </p>
        </div>

        <div className="flex flex-col-reverse md:flex-row items-stretch md:items-center justify-center md:justify-end gap-4 md:gap-6">
          {!showForm && (
            <div className="flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] md:rounded-[2.5rem] p-1 shadow-xl md:shadow-2xl">
              {([
                { id: 'grid', icon: <LayoutGrid size={16} /> },
                { id: 'thumbnails', icon: <Grid3X3 size={16} /> },
                { id: 'list', icon: <LayoutList size={16} /> },
              ] as const).map(({ id, icon }) => (
                <button
                  key={id} onClick={() => handleViewMode(id)}
                  className={`p-2.5 md:p-3 rounded-full transition-all duration-500 ${viewMode === id ? 'bg-[#FF5C3A] text-white shadow-2xl shadow-[#FF5C3A]/30 scale-[1.1]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}

          {!showForm ? (
            <button
              onClick={handleNewProduct}
              className="flex items-center justify-center gap-3 px-6 md:px-10 py-4 md:py-5 bg-[#FF5C3A] text-white rounded-2xl md:rounded-[2rem] font-[950] uppercase tracking-widest text-[10px] md:text-[11px] shadow-[0_20px_40px_rgba(255,92,58,0.3)] hover:scale-[1.02] active:scale-95 transition-all group"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Añadir Producto
            </button>
          ) : (
            <button
              onClick={() => { setShowForm(false); setEditingProduct(null); }}
              className="flex items-center justify-center gap-3 px-6 md:px-10 py-4 md:py-5 bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-2xl md:rounded-[2rem] font-[950] uppercase tracking-widest text-[10px] md:text-[11px] hover:bg-white/5 active:scale-95 transition-all shadow-xl"
            >
              <ChevronLeft size={18} /> Volver
            </button>
          )}
        </div>
      </motion.header>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="p-5 md:p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl md:rounded-[3rem] text-rose-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest flex items-center justify-between shadow-4xl shadow-rose-500/5"
          >
            <div className="flex items-center gap-4">
              <AlertCircle size={20} />
              <span className="line-clamp-2 md:line-clamp-none">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-rose-500/10 rounded-full transition-all shrink-0">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div variants={itemVariants} className="relative z-0">
        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="bg-[var(--bg-card)] rounded-[2.5rem] md:rounded-[4rem] border border-[var(--border-color)] p-6 md:p-12 shadow-4xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-10 translate-y-[-10px] group-hover:scale-105 transition-transform duration-1000">
                <Sparkles size={200} strokeWidth={1} />
              </div>
              <div className="relative z-10 space-y-10">
                <header className="flex items-center gap-6 border-b border-[var(--border-color)] pb-10">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center border border-[#FF5C3A]/10">
                    <Tag className="w-6 h-6 text-[#FF5C3A]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-[950] text-[var(--text-primary)] uppercase tracking-tighter">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-2">{editingProduct ? `ID: ${editingProduct.id}` : 'Módulo de Creación'}</p>
                  </div>
                </header>
                <ProductForm
                  product={editingProduct}
                  showExternalId={showExternalIdField}
                  brandId={brandId}
                  onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
                  onCancel={() => { setShowForm(false); setEditingProduct(null); }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Mobile Tab Switcher */}
              <div className="lg:hidden mb-6">
                <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-1">
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'catalog' ? 'bg-[#FF5C3A] text-white' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Catálogo
                  </button>
                  <button
                    onClick={() => setActiveTab('widget')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'widget' ? 'bg-[#FF5C3A] text-white' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Star size={14} />
                    Mi Widget
                    {widgetProducts.length > 0 && (
                      <span className="ml-1 w-5 h-5 rounded-full bg-white/20 text-[10px] font-black flex items-center justify-center">
                        {widgetProducts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-10 xl:gap-12">

                {/* Left: Catalog Panel */}
                <div className={activeTab === 'widget' ? 'hidden lg:block' : ''}>
                  {/* Category Filter */}
                  <div className="flex items-center justify-between mb-6">
                    <CategoryFilter
                      categories={categories}
                      selectedCategory={categoryFilter}
                      onSelectCategory={setCategoryFilter}
                    />
                    {categoryFilter !== 'Todas' && (
                      <button
                        onClick={() => setCategoryFilter('Toutes')}
                        className="text-[10px] font-semibold text-[#FF5C3A] hover:underline"
                      >
                        Limpiar filtro
                      </button>
                    )}
                  </div>

                  <ProductList
                    products={paginatedProducts}
                    viewMode={viewMode}
                    onEdit={(p) => { setEditingProduct(p); setShowForm(true); }}
                    onDelete={handleDeleteProduct}
                    widgetProductIds={widgetProductIds}
                    onAddToWidget={handleAddToWidget}
                    canAddToWidget={canAddToWidget}
                  />

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 py-4">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#FF5C3A]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                              currentPage === page
                                ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20'
                                : 'bg-[var(--bg-card)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#FF5C3A]/30'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#FF5C3A]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        aria-label="Página siguiente"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}

                  {products.length === 0 && (
                    <div className="py-40 text-center space-y-10 border-2 border-dashed border-[var(--border-color)] rounded-[5rem] bg-[var(--bg-card)]/30">
                      <div className="relative inline-block">
                        <Package size={120} strokeWidth={0.5} className="text-[var(--text-muted)] opacity-20" />
                        <Zap size={40} className="absolute -top-4 -right-4 text-[#FF5C3A] animate-pulse" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-3xl font-[950] text-[var(--text-muted)] uppercase tracking-tighter opacity-30">Tu catálogo está vacío</h3>
                        <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-20">Empieza subiendo tu primera prenda para activar el probador</p>
                      </div>
                      <button
                        onClick={handleNewProduct}
                        className="px-12 py-6 bg-white text-black border border-white/10 rounded-[2.5rem] font-[950] uppercase tracking-widest text-[11px] hover:scale-[1.05] transition-all"
                      >
                        Añadir Mi Primer Producto <ArrowRight size={14} className="inline ml-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Widget Panel */}
                <div className={`space-y-8 ${activeTab === 'catalog' ? 'hidden lg:block' : ''}`}>
                  {/* Widget Playlist */}
                  <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 shadow-xl">
                    <WidgetPlaylist
                      products={widgetProducts}
                      onRemove={handleRemoveFromWidget}
                      onReorder={handleReorderWidget}
                      maxProducts={widgetMaxProducts}
                      isLoading={isSavingWidget}
                    />

                    {widgetProducts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--card-border)] flex justify-between items-center">
                        <button
                          onClick={handleClearWidget}
                          className="text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-400 flex items-center gap-2 transition-colors"
                        >
                          <Trash2 size={12} />
                          Borrar Todo
                        </button>
                        {isSavingWidget && (
                          <span className="text-[9px] text-[var(--text-muted)]">Guardando...</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Widget Preview */}
                  <WidgetPreview
                    products={widgetProducts}
                    maxProducts={widgetMaxProducts}
                  />
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteProduct}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto de tu catálogo? Esta acción retirará el producto del probador virtual permanentemente."
      />
    </motion.div>
  );
}