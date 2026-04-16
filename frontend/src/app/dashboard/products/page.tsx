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
import {
  Package,
  Plus,
  LayoutGrid,
  Grid3X3,
  LayoutList,
  AlertCircle,
  X,
  ChevronLeft,
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
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLimit, setProductsLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id?: string }>({ isOpen: false });
  const [showExternalIdField, setShowExternalIdField] = useState(false);
  const [brandId, setBrandId] = useState<string | undefined>();
  const [brandPlan, setBrandPlan] = useState<BrandPlan>('BASIC');

  // Widget state
  const [widgetProducts, setWidgetProducts] = useState<Product[]>([]);
  const [widgetProductIds, setWidgetProductIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSavingWidget, setIsSavingWidget] = useState(false);

  // Mobile tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'widget'>('catalog');

  // Get widget limit from plan
  const widgetMaxProducts = PLAN_WIDGET_LIMITS[brandPlan] ?? 5;
  const canAddToWidget = widgetProducts.length < widgetMaxProducts;

  // Categories from products
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Filtered products for catalog
  const filteredProducts = categoryFilter === 'Todas'
    ? products
    : products.filter((p) => p.category === categoryFilter);

  useEffect(() => {
    brandsService.getCurrentBrand().then((brand) => {
      setBrandId(brand.id);
      setBrandPlan(brand.plan as BrandPlan);
      setWidgetProductIds(brand.widgetProductIds || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('products-view-mode') as ViewMode | null;
    if (saved && ['grid', 'thumbnails', 'list'].includes(saved)) setViewMode(saved);
    loadProducts();
    loadBrandIntegrationState();
  }, []);

  const loadWidgetProducts = useCallback(async () => {
    if (widgetProductIds.length === 0) {
      setWidgetProducts([]);
      return;
    }
    try {
      const allProducts = await productsService.getWidgetProducts();
      // Filter to only widget products and maintain order
      const ordered = widgetProductIds
        .map((id) => allProducts.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined);
      setWidgetProducts(ordered);
    } catch (err) {
      console.error('Error loading widget products:', err);
    }
  }, [widgetProductIds]);

  useEffect(() => {
    loadWidgetProducts();
  }, [loadWidgetProducts]);

  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('products-view-mode', mode);
  };

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

  const handleDeleteProduct = async (productId: string) => {
    // Remove from widget if present
    if (widgetProductIds.includes(productId)) {
      const newWidgetIds = widgetProductIds.filter((id) => id !== productId);
      setWidgetProductIds(newWidgetIds);
      await debouncedSaveWidget(newWidgetIds);
    }
    setConfirmDelete({ isOpen: true, id: productId });
  };

  const handleConfirmDelete = async () => {
    const productId = confirmDelete.id;
    if (!productId) return;
    try {
      await productsService.deleteProduct(productId);
      await loadProducts();
      setError(null);
      setConfirmDelete({ isOpen: false });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar producto');
    }
  };

  const handleNewProduct = () => {
    if (products.length >= productsLimit) {
      setError(`Límite de Productos: ${productsLimit} alcanzado. Amplía tu plan para añadir más.`);
      return;
    }
    setEditingProduct(null);
    setShowForm(true);
  };

  // Widget handlers
  const handleAddToWidget = async (productId: string) => {
    if (widgetProducts.length >= widgetMaxProducts) {
      setError(`Máximo ${widgetMaxProducts} productos en widget (plan ${brandPlan})`);
      return;
    }
    if (widgetProductIds.includes(productId)) return;

    const newWidgetIds = [...widgetProductIds, productId];
    setWidgetProductIds(newWidgetIds);
    await debouncedSaveWidget(newWidgetIds);
  };

  const handleRemoveFromWidget = async (productId: string) => {
    const newWidgetIds = widgetProductIds.filter((id) => id !== productId);
    setWidgetProductIds(newWidgetIds);
    await debouncedSaveWidget(newWidgetIds);
  };

  const handleReorderWidget = async (newOrder: string[]) => {
    setWidgetProductIds(newOrder);
    await debouncedSaveWidget(newOrder);
  };

  const debouncedSaveWidget = useCallback((productIds: string[]) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    setIsSavingWidget(true);
    const timeout = setTimeout(async () => {
      try {
        await productsService.updateWidgetProducts(productIds);
      } catch (err) {
        console.error('Error saving widget:', err);
        setError('Error al guardar widget');
      } finally {
        setIsSavingWidget(false);
      }
    }, 500);
    setSaveTimeout(timeout);
  }, [saveTimeout]);

  const handleClearWidget = async () => {
    setWidgetProductIds([]);
    await debouncedSaveWidget([]);
  };

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
                      activeTab === 'catalog'
                        ? 'bg-[#FF5C3A] text-white'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Catálogo
                  </button>
                  <button
                    onClick={() => setActiveTab('widget')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'widget'
                        ? 'bg-[#FF5C3A] text-white'
                        : 'text-[var(--text-muted)]'
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
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">

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
                        onClick={() => setCategoryFilter('Todas')}
                        className="text-[10px] font-semibold text-[#FF5C3A] hover:underline"
                      >
                        Limpiar filtro
                      </button>
                    )}
                  </div>

                  <ProductList
                    products={filteredProducts}
                    viewMode={viewMode}
                    onEdit={(p) => { setEditingProduct(p); setShowForm(true); }}
                    onDelete={handleDeleteProduct}
                    widgetProductIds={widgetProductIds}
                    onAddToWidget={handleAddToWidget}
                    canAddToWidget={canAddToWidget}
                  />

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
        onClose={() => setConfirmDelete({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Producto"
        message="¿Estás seguro de que deseas eliminar este producto de tu catálogo? Esta acción retirará el producto del probador virtual permanentemente."
      />
    </motion.div>
  );
}