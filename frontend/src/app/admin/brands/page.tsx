'use client';

import { useEffect, useState } from 'react';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { CheckCircle, XCircle, Search, Plus, Users, Package, Image as ImageIcon, TrendingUp, Globe, PauseCircle, ChevronRight, ExternalLink, Eye, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/services/adminApi';
import { BrandFilters } from '@/components/admin/brands/BrandFilters';
import { BrandTable } from '@/components/admin/brands/BrandTable';

export interface Brand {
  id: string;
  email: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  subscription_status?: string;
  trial_end_date?: string | null;
  is_in_trial?: boolean;
  trial_days_remaining?: number | null;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  contact_name?: string;
  stats: {
    productsCount: number;
    generationsCount: number;
    generationsThisMonth: number;
  };
  has_landing_page?: boolean;
  internal_notes?: string;
  modal_title?: string;
  modal_description?: string;
  modal_features?: string[];
}

interface Product {
  id: string;
  name: string;
  category: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

type FilterPlan = 'all' | 'TRIAL' | 'BASIC' | 'PRO' | 'LANDING';
type FilterStatus = 'all' | 'active' | 'suspended';

// ── Toast helper ──────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.6rem] border border-[var(--border-color)] bg-[var(--bg-input)] p-5"
    >
      <div className="flex items-center justify-between">
        <div style={{ color: accent }}>{icon}</div>
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </motion.div>
  );
}

// ── Brand Card (para vista grid) ───────────────────────────────────────────────

function BrandCard({ brand, onClick }: { brand: Brand; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className="group rounded-[1.8rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition-all hover:border-[var(--accent)]/30 cursor-pointer"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black"
            style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
          >
            {(brand.name || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{brand.name}</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{brand.email}</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
          backgroundColor: brand.plan === 'PRO' ? 'rgba(168,85,247,0.12)' : brand.plan === 'TRIAL' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
          color: brand.plan === 'PRO' ? '#a855f7' : brand.plan === 'TRIAL' ? '#6366f1' : '#10b981'
        }}>
          {brand.plan}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">
          <Package className="h-3.5 w-3.5" />
          {brand.stats.productsCount || 0} productos
        </span>
        <span className="flex items-center gap-1">
          <ImageIcon className="h-3.5 w-3.5" />
          {brand.stats.generationsCount || 0} gen.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] py-2.5 text-xs font-bold transition-all hover:border-[var(--accent)]/30 hover:text-[var(--accent)]"
          style={{ color: 'var(--text-primary)' }}
        >
          <Eye className="h-3.5 w-3.5" />
          Ver detalles
        </button>
      </div>
    </motion.div>
  );
}

// ── Side Panel (reemplaza modal) ───────────────────────────────────────────────

function BrandSidePanel({ brand, onClose, onToggleLanding, onSaveNotes, onOpenModalConfig, togglingLanding, savingNotes }: {
  brand: Brand;
  onClose: () => void;
  onToggleLanding: (b: Brand) => void;
  onSaveNotes: (b: Brand) => void;
  onOpenModalConfig: (b: Brand) => void;
  togglingLanding: boolean;
  savingNotes: boolean;
}) {
  const [notes, setNotes] = useState(brand.internal_notes || '');

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)', borderLeft: '1px solid var(--border-color)' }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}
              >
                {(brand.name || 'M').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold tracking-tight text-lg" style={{ color: 'var(--text-primary)' }}>{brand.name}</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/{brand.slug}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-secondary)' }} className="p-2 hover:bg-[var(--bg-hover)] rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Plan Badge */}
          <div className="mb-6">
            <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{
              backgroundColor: brand.plan === 'PRO' ? 'rgba(168,85,247,0.12)' : brand.plan === 'TRIAL' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
              color: brand.plan === 'PRO' ? '#a855f7' : brand.plan === 'TRIAL' ? '#6366f1' : '#10b981'
            }}>
              {brand.plan}
              {brand.plan === 'PRO' ? ' — $250.000/mes' : brand.plan === 'BASIC' ? ' — $150.000/mes' : ''}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <a href={`/admin/brands/${brand.id}`} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] py-3 text-sm font-semibold transition-all hover:border-[var(--accent)]/30" style={{ color: 'var(--text-primary)' }}>
              <Pencil className="h-4 w-4" />
              Editar
            </a>
            <a href={`https://lookitry.com/embed/${brand.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] py-3 text-sm font-semibold transition-all hover:border-[var(--accent)]/30" style={{ color: 'var(--text-primary)' }}>
              <ExternalLink className="h-4 w-4" />
              Ver widget
            </a>
          </div>

          {/* Info Grid */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-4 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</span>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{brand.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Registro</span>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{new Date(brand.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Estado</span>
              <span className="text-sm font-medium" style={{ 
                color: brand.subscription_status === 'active' ? '#10b981' : 
                       brand.subscription_status === 'expiring_soon' ? '#f59e0b' :
                       brand.subscription_status === 'suspended' ? '#ef4444' : 'var(--text-muted)'
              }}>
                {brand.subscription_status === 'active' ? 'Activa' :
                 brand.subscription_status === 'expiring_soon' ? 'Por vencer' :
                 brand.subscription_status === 'suspended' ? 'Suspendida' : 'Sin suscripción'}
              </span>
            </div>
            {brand.plan === 'TRIAL' && (
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Trial restante</span>
                <span className="text-sm font-medium" style={{ color: '#6366f1' }}>{brand.trial_days_remaining ?? 0} días</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-3 text-center">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Productos</p>
              <p className="text-xl font-bold" style={{ color: '#3b82f6' }}>{brand.stats.productsCount}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-3 text-center">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Generaciones</p>
              <p className="text-xl font-bold" style={{ color: '#10b981' }}>{brand.stats.generationsCount}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] p-3 text-center">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Este mes</p>
              <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{brand.stats.generationsThisMonth}</p>
            </div>
          </div>

          {/* Mini-landing Toggle */}
          <div className="rounded-xl border border-[var(--border-color)] p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" style={{ color: brand.has_landing_page ? '#10b981' : 'var(--text-muted)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Mini-landing</span>
              </div>
              <button
                onClick={() => onToggleLanding(brand)}
                disabled={togglingLanding}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
                style={{ backgroundColor: brand.has_landing_page ? '#10b981' : 'var(--border-color)' }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                  style={{ transform: brand.has_landing_page ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
                />
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {brand.has_landing_page ? 'Página activa sin banners' : 'Muestra banner de activación'}
            </p>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-[var(--border-color)] p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notas internas</span>
              <button
                onClick={() => onSaveNotes({ ...brand, internal_notes: notes })}
                disabled={savingNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {savingNotes ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Añadir notas sobre esta marca..."
              className="w-full px-3 py-2 rounded-xl text-sm resize-none"
              style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              rows={3}
            />
          </div>

          {/* Config Modal */}
          <button
            onClick={() => { onClose(); onOpenModalConfig(brand); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Configurar modal de activación
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', slug: '', password: '', plan: 'TRIAL', trial_days: '7', phone: '', contact_name: '' });
  const [creating, setCreating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [togglingLanding, setTogglingLanding] = useState(false);
  const [showModalConfigModal, setShowModalConfigModal] = useState(false);
  const [modalConfigBrand, setModalConfigBrand] = useState<Brand | null>(null);
  const [modalConfigForm, setModalConfigForm] = useState({ modal_title: '', modal_description: '', modal_features: ['', '', ''] });
  const [savingModalConfig, setSavingModalConfig] = useState(false);
  const [sendingReset, setSendingReset] = useState<string | null>(null);
  const [resetToast, setResetToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const confirm = useConfirm();

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<FilterPlan>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Stats
  const [landingPrice, setLandingPrice] = useState<number | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredBrands.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBrands.map(b => b.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ok = await confirm({
      title: 'Eliminar marcas',
      message: `¿Eliminar ${selectedIds.size} marca(s) seleccionada(s)? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
      reason: 'Las marcas eliminadas no pueden recuperarse.',
    });
    if (!ok) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => adminApi.delete(`/admin/brands/${id}`)));
      showToast(`${selectedIds.size} marca(s) eliminada(s)`, 'success');
      setSelectedIds(new Set());
      await fetchBrands();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar marcas', 'error');
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchLandingPrice();
  }, []);

  useEffect(() => { applyFilters(); }, [brands, searchTerm, filterPlan, filterStatus]);

  const applyFilters = () => {
    let filtered = [...brands];
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterPlan !== 'all') filtered = filtered.filter(b => b.plan === filterPlan);
    if (filterStatus === 'active') filtered = filtered.filter(b => b.subscription_status === 'active' || b.subscription_status === 'expiring_soon');
    if (filterStatus === 'suspended') filtered = filtered.filter(b => b.subscription_status === 'suspended' || b.subscription_status === 'expired');

    setFilteredBrands(filtered);
  };

  const fetchBrands = async () => {
    try {
      const data = await adminApi.get<{ brands: Brand[] }>('/admin/brands');
      setBrands(data.brands);
    } catch (err: any) {
      setError(err.message || 'Error al cargar marcas');
    } finally {
      setLoading(false);
    }
  };

  const fetchLandingPrice = async () => {
    try {
      const data = await adminApi.get<{ landing_price?: number }>('/admin/payment-settings');
      if (data.landing_price) setLandingPrice(data.landing_price);
    } catch { /* silencioso */ }
  };

  const handleViewDetails = (brand: Brand) => setSelectedBrand(brand);

  const handleViewProducts = async (brand: Brand) => {
    setSelectedBrand(brand); setShowProductsModal(true); setLoadingProducts(true); setProducts([]);
    try {
      const data = await adminApi.get<{ products: Product[] }>(`/admin/brands/${brand.id}/products`);
      setProducts(data.products ?? []);
    } catch { /* silent */ } finally { setLoadingProducts(false); }
  };

  const handleChangePlan = async (brandId: string, newPlan: string) => {
    const ok = await confirm({
      title: 'Cambiar plan',
      message: `¿Cambiar el plan de esta marca a ${newPlan}?`,
      confirmLabel: 'Cambiar plan',
      danger: false,
      reason: 'Esta acción modifica el contrato de la marca y puede afectar su facturación.',
    });
    if (!ok) return;
    setChangingPlan(brandId);
    try {
      await adminApi.patch(`/admin/brands/${brandId}/plan`, { plan: newPlan });
      await fetchBrands();
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar plan', 'error');
    } finally { setChangingPlan(null); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!selectedBrand) return;
    const ok = await confirm({
      title: 'Eliminar producto',
      message: '¿Eliminar este producto permanentemente?',
      confirmLabel: 'Eliminar',
      danger: true,
      reason: 'Los productos eliminados no pueden recuperarse.',
    });
    if (!ok) return;
    setDeletingProduct(productId);
    try {
      await adminApi.delete(`/admin/brands/${selectedBrand.id}/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar producto', 'error');
    } finally { setDeletingProduct(null); }
  };

  const handleCreateBrand = async () => {
    if (!createForm.name || !createForm.email || !createForm.slug || !createForm.password) {
      showToast('Nombre, email, slug y contraseña son requeridos', 'error');
      return;
    }
    setCreating(true);
    try {
      await adminApi.post('/admin/brands', {
        name: createForm.name,
        email: createForm.email,
        slug: createForm.slug,
        password: createForm.password,
        plan: createForm.plan,
        trial_days: Number(createForm.trial_days) || 7,
        phone: createForm.phone || undefined,
        contact_name: createForm.contact_name || undefined,
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', slug: '', password: '', plan: 'TRIAL', trial_days: '7', phone: '', contact_name: '' });
      await fetchBrands();
    } catch (err: any) {
      showToast(err.message || 'Error al crear marca', 'error');
    } finally { setCreating(false); }
  };

  const handleToggleLandingPage = async (brand: Brand) => {
    const newValue = !brand.has_landing_page;
    setTogglingLanding(true);
    try {
      await adminApi.patch(`/admin/brands/${brand.id}/landing-page`, { has_landing_page: newValue });
      setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, has_landing_page: newValue } : b));
      if (selectedBrand?.id === brand.id) {
        setSelectedBrand(prev => prev ? { ...prev, has_landing_page: newValue } : prev);
      }
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar mini-landing', 'error');
    } finally { setTogglingLanding(false); }
  };

  const handleSaveNotes = async (brand: Brand) => {
    setSavingNotes(true);
    try {
      await adminApi.patch(`/admin/brands/${brand.id}/notes`, { internal_notes: brand.internal_notes || '' });
      setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, internal_notes: brand.internal_notes } : b));
      showToast('Notas guardadas', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al guardar notas', 'error');
    } finally { setSavingNotes(false); }
  };

  const handleOpenModalConfig = (brand: Brand) => {
    setModalConfigBrand(brand);
    const feats = Array.isArray(brand.modal_features) ? [...brand.modal_features] : [];
    while (feats.length < 3) feats.push('');
    setModalConfigForm({ modal_title: brand.modal_title || '', modal_description: brand.modal_description || '', modal_features: feats });
    setShowModalConfigModal(true);
  };

  const handleSaveModalConfig = async () => {
    if (!modalConfigBrand) return;
    setSavingModalConfig(true);
    try {
      await adminApi.patch(`/admin/brands/${modalConfigBrand.id}/modal-config`, {
        modal_title: modalConfigForm.modal_title || null,
        modal_description: modalConfigForm.modal_description || null,
        modal_features: modalConfigForm.modal_features.filter(f => f.trim()).length > 0 ? modalConfigForm.modal_features.filter(f => f.trim()) : null,
      });
      setShowModalConfigModal(false);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar', 'error');
    } finally { setSavingModalConfig(false); }
  };

  const handleSendResetEmail = async (brand: Brand) => {
    setSendingReset(brand.id);
    try {
      await adminApi.post(`/admin/brands/${brand.id}/send-reset-email`);
      setResetToast({ message: `Email enviado a ${brand.email}`, type: 'success' });
      setTimeout(() => setResetToast(null), 4000);
    } catch (err: any) {
      setResetToast({ message: err.message || 'Error', type: 'error' });
      setTimeout(() => setResetToast(null), 4000);
    } finally { setSendingReset(null); }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      <p className="animate-pulse text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Cargando marcas</p>
    </div>
  );

  if (error) return <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>{error}</div>;

  // Stats
  const stats = {
    total: brands.length,
    trial: brands.filter(b => b.plan === 'TRIAL').length,
    active: brands.filter(b => b.subscription_status === 'active' || b.subscription_status === 'expiring_soon').length,
    suspended: brands.filter(b => b.subscription_status === 'suspended' || b.subscription_status === 'expired').length,
  };

  const filterChips: { value: FilterPlan; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: brands.length },
    { value: 'TRIAL', label: 'Trial', count: brands.filter(b => b.plan === 'TRIAL').length },
    { value: 'BASIC', label: 'Basic', count: brands.filter(b => b.plan === 'BASIC').length },
    { value: 'PRO', label: 'Pro', count: brands.filter(b => b.plan === 'PRO').length },
    { value: 'LANDING', label: 'Landing', count: brands.filter(b => b.plan === 'LANDING').length },
  ];

  const statusChips: { value: FilterStatus; label: string; count: number }[] = [
    { value: 'all', label: 'Todos', count: brands.length },
    { value: 'active', label: 'Activas', count: brands.filter(b => b.subscription_status === 'active' || b.subscription_status === 'expiring_soon').length },
    { value: 'suspended', label: 'Suspendidas', count: brands.filter(b => b.subscription_status === 'suspended' || b.subscription_status === 'expired').length },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 pb-20">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_25px_60px_rgba(0,0,0,0.1)] md:p-8"
        style={{ borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', background: 'linear-gradient(135deg,color-mix(in_srgb,var(--accent)_8%,transparent),var(--bg-card)_28%,var(--bg-card)_100%)' }}
      >
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', filter: 'blur(60px)' }} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)' }}>
              Gestión
            </span>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--text-primary)' }}>
              {brands.length} marcas
            </span>
          </div>
          <h1 className="font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Marcas</h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">{stats.active} activas · {stats.trial} en trial</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total" value={stats.total} accent="#3b82f6" />
          <StatCard icon={<Package className="h-5 w-5" />} label="Trial" value={stats.trial} accent="#6366f1" />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Activas" value={stats.active} accent="#10b981" />
          <StatCard icon={<PauseCircle className="h-5 w-5" />} label="Suspendidas" value={stats.suspended} accent="#ef4444" />
        </div>
      </motion.section>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-[2rem] border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, email o slug..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border text-sm outline-none transition-colors focus:border-[var(--accent)]/50"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Filter Chips - Plan */}
        <div className="flex flex-wrap gap-2">
          {filterChips.map(chip => (
            <button
              key={chip.value}
              onClick={() => setFilterPlan(chip.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border"
              style={filterPlan === chip.value
                ? { backgroundColor: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                : { backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }
              }
            >
              {chip.label} ({chip.count})
            </button>
          ))}
        </div>

        {/* Filter Chips - Status */}
        <div className="flex flex-wrap gap-2">
          {statusChips.map(chip => (
            <button
              key={chip.value}
              onClick={() => setFilterStatus(chip.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border"
              style={filterStatus === chip.value
                ? { backgroundColor: '#10b981', color: '#fff', borderColor: '#10b981' }
                : { backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }
              }
            >
              {chip.label} ({chip.count})
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="h-4 w-4" />
            Nueva marca
          </button>
        </div>
      </motion.div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p style={{ color: 'var(--text-muted)' }} className="text-sm">
          Mostrando {filteredBrands.length} de {brands.length} marcas
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={viewMode === 'grid' ? { backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={viewMode === 'table' ? { backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}
          >
            Tabla
          </button>
        </div>
      </div>

      {/* Brands Grid/Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        {viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredBrands.slice(0, 24).map(brand => (
                <BrandCard key={brand.id} brand={brand} onClick={() => handleViewDetails(brand)} />
              ))}
            </AnimatePresence>
            {filteredBrands.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="mx-auto h-10 w-10 mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No se encontraron marcas</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Intenta ajustar los filtros</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-5 py-3"
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                  {selectedIds.size} seleccionada(s)
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="ml-auto text-sm text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </motion.div>
            )}
            <BrandTable
              brands={filteredBrands}
              selected={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onSelectDetails={handleViewDetails}
              onSelectProducts={handleViewProducts}
              onSelectActivate={brand => handleChangePlan(brand.id, brand.plan === 'BASIC' ? 'PRO' : 'BASIC')}
              onSelectModalConfig={handleOpenModalConfig}
              onSendReset={handleSendResetEmail}
              sortField="name"
              sortOrder="asc"
              onSortChange={() => {}}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              landingPrice={landingPrice}
            />
          </>
        )}
      </motion.div>

      {/* Side Panel */}
      <AnimatePresence>
        {selectedBrand && (
          <BrandSidePanel
            brand={selectedBrand}
            onClose={() => setSelectedBrand(null)}
            onToggleLanding={handleToggleLandingPage}
            onSaveNotes={handleSaveNotes}
            onOpenModalConfig={handleOpenModalConfig}
            togglingLanding={togglingLanding}
            savingNotes={savingNotes}
          />
        )}
      </AnimatePresence>

      {/* Modal Ver Productos */}
      {showProductsModal && selectedBrand && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-[2rem] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="font-bold tracking-tight text-xl" style={{ color: 'var(--text-primary)' }}>Productos de {selectedBrand.name}</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Total: {products.length}</p>
              </div>
              <button onClick={() => setShowProductsModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {loadingProducts ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando productos...</div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-sm" style={{ color: 'var(--text-secondary)' }}>Esta marca aún no tiene productos.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-base)' }}>
                    {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-3" />}
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{product.category}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium"
                        style={product.is_active ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' } : { backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      {!product.is_active && (
                        <button onClick={() => handleDeleteProduct(product.id)} disabled={deletingProduct === product.id}
                          className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowProductsModal(false)} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Marca */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-[2rem] p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-bold tracking-tight text-xl" style={{ color: 'var(--text-primary)' }}>Nueva marca</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre <span className="text-red-500">*</span></label>
                  <input type="text" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre de la marca"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Slug <span className="text-red-500">*</span></label>
                  <input type="text" value={createForm.slug} onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="mi-marca"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email <span className="text-red-500">*</span></label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="contacto@marca.com"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contraseña <span className="text-red-500">*</span></label>
                <input type="text" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Contraseña inicial"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Plan</label>
                  <select value={createForm.plan} onChange={e => setCreateForm(f => ({ ...f, plan: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    <option value="TRIAL">TRIAL — 7 días</option>
                    <option value="BASIC">BASIC — $150.000/mes</option>
                    <option value="PRO">PRO — $250.000/mes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Días trial</label>
                  <input type="number" min="1" max="90" value={createForm.trial_days} onChange={e => setCreateForm(f => ({ ...f, trial_days: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Teléfono</label>
                  <input type="text" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="Opcional"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contacto</label>
                  <input type="text" value={createForm.contact_name} onChange={e => setCreateForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Opcional"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                Cancelar
              </button>
              <button onClick={handleCreateBrand} disabled={creating}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)' }}>
                {creating && <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />}
                Crear Marca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurar Modal de Activacion */}
      {showModalConfigModal && modalConfigBrand && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="rounded-[2rem] p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold tracking-tight text-lg" style={{ color: 'var(--text-primary)' }}>Modal de activación</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{modalConfigBrand.name}</p>
              </div>
              <button onClick={() => setShowModalConfigModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Título del modal</label>
                <input type="text" value={modalConfigForm.modal_title} onChange={e => setModalConfigForm(f => ({ ...f, modal_title: e.target.value }))}
                  maxLength={80} placeholder="Ej: Activa tu probador virtual"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
                <textarea value={modalConfigForm.modal_description} onChange={e => setModalConfigForm(f => ({ ...f, modal_description: e.target.value }))}
                  rows={3} maxLength={300} placeholder="Descripción..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Beneficios</label>
                <div className="space-y-2">
                  {modalConfigForm.modal_features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-4 text-center flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                      <input type="text" value={feat} onChange={e => {
                        const next = [...modalConfigForm.modal_features]; next[i] = e.target.value;
                        setModalConfigForm(f => ({ ...f, modal_features: next }));
                      }} maxLength={80} placeholder={`Beneficio ${i + 1}`}
                        className="flex-1 px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowModalConfigModal(false)} className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                Cancelar
              </button>
              <button onClick={handleSaveModalConfig} disabled={savingModalConfig}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: 'var(--accent)' }}>
                {savingModalConfig && <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de reset email */}
      {resetToast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${resetToast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {resetToast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {resetToast.message}
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
