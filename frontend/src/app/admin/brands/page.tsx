'use client';

import { useEffect, useState } from 'react';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { CheckCircle, XCircle } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { BrandDetailsModal } from '@/components/admin/brands/BrandDetailsModal';
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
  // Additional properties previously accessed via `as any`
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
type FilterTrial = 'all' | 'trial' | 'active' | 'suspended';

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


export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', slug: '', password: '', plan: 'TRIAL', trial_days: '7', phone: '', contact_name: '' });
  const [creating, setCreating] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activateForm, setActivateForm] = useState({ plan: 'BASIC', amount: '', payment_method: 'transferencia', notes: '' });
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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<FilterPlan>('all');
  const [filterTrial, setFilterTrial] = useState<FilterTrial>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Ordenamiento
  const [sortField, setSortField] = useState<'name' | 'email' | 'plan' | 'status' | 'products' | 'generations'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selección masiva
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState<'suspend' | 'reactivate' | 'delete' | null>(null);

  // Precio dinámico del plan LANDING
  const [landingPrice, setLandingPrice] = useState<number | null>(null);

  useEffect(() => {
    fetchBrands();
    fetchLandingPrice();
  }, []);
  useEffect(() => { applyFilters(); }, [brands, searchTerm, filterPlan, filterTrial, sortField, sortOrder]);
  useEffect(() => { setCurrentPage(1); setSelected(new Set()); }, [searchTerm, filterPlan, filterTrial]);

  const applyFilters = () => {
    let filtered = [...brands];
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterPlan === 'TRIAL') filtered = filtered.filter(b => b.plan === 'TRIAL');
    else if (filterPlan !== 'all') filtered = filtered.filter(b => b.plan === filterPlan);
    if (filterTrial === 'trial') filtered = filtered.filter(b => b.plan === 'TRIAL');
    else if (filterTrial === 'active') filtered = filtered.filter(b => b.subscription_status === 'active' || b.subscription_status === 'expiring_soon');
    else if (filterTrial === 'suspended') filtered = filtered.filter(b => b.subscription_status === 'suspended' || b.subscription_status === 'expired');
    
    // Ordenamiento
    filtered.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === 'email') {
        valA = a.email.toLowerCase();
        valB = b.email.toLowerCase();
      } else if (sortField === 'plan') {
        valA = a.plan;
        valB = b.plan;
      } else if (sortField === 'status') {
        valA = a.subscription_status || '';
        valB = b.subscription_status || '';
      } else if (sortField === 'products') {
        valA = a.stats.productsCount;
        valB = b.stats.productsCount;
      } else if (sortField === 'generations') {
        valA = a.stats.generationsCount;
        valB = b.stats.generationsCount;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredBrands(filtered);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
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

  const handleViewDetails = (brand: Brand) => { setSelectedBrand(brand); setShowDetailsModal(true); };

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
      message: '¿Eliminar este producto permanentemente? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      danger: true,
      reason: 'Los productos eliminados no pueden recuperarse. Asegúrate de que el producto esté inactivo.',
    });
    if (!ok) return;
    setDeletingProduct(productId);
    try {
      await adminApi.delete(`/admin/brands/${selectedBrand.id}/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar producto', 'error');
    } finally {
      setDeletingProduct(null);
    }
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
    } finally {
      setCreating(false);
    }
  };

  const handleOpenActivate = (brand: Brand) => {
    setSelectedBrand(brand);
    setActivateForm({ plan: brand.plan || 'BASIC', amount: brand.plan === 'PRO' ? '250000' : '150000', payment_method: 'transferencia', notes: '' });
    setShowActivateModal(true);
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
    } finally {
      setTogglingLanding(false);
    }
  };

  const handleSaveNotes = async (brand: Brand) => {
    setSavingNotes(true);
    try {
      await adminApi.patch(`/admin/brands/${brand.id}/notes`, { internal_notes: brand.internal_notes || '' });
      setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, internal_notes: brand.internal_notes } : b));
      showToast('Notas guardadas correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al guardar notas', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleOpenModalConfig = (brand: Brand) => {
    setModalConfigBrand(brand);
    const feats = Array.isArray(brand.modal_features) ? [...brand.modal_features] : [];
    while (feats.length < 3) feats.push('');
    setModalConfigForm({
      modal_title: brand.modal_title || '',
      modal_description: brand.modal_description || '',
      modal_features: feats,
    });
    setShowModalConfigModal(true);
  };

  const handleSaveModalConfig = async () => {
    if (!modalConfigBrand) return;
    setSavingModalConfig(true);
    try {
      await adminApi.patch(`/admin/brands/${modalConfigBrand.id}/modal-config`, {
        modal_title: modalConfigForm.modal_title || null,
        modal_description: modalConfigForm.modal_description || null,
        modal_features: modalConfigForm.modal_features.filter(f => f.trim()).length > 0
          ? modalConfigForm.modal_features.filter(f => f.trim())
          : null,
      });
      setShowModalConfigModal(false);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar configuración del modal', 'error');
    } finally { setSavingModalConfig(false); }
  };

  const handleActivatePlan = async () => {
    if (!selectedBrand) return;
    setActivating(true);
    try {
      await adminApi.patch(`/admin/brands/${selectedBrand.id}/activate-plan`, {
        plan: activateForm.plan,
        amount: Number(activateForm.amount),
        payment_method: activateForm.payment_method,
        notes: activateForm.notes || 'Activación manual por administrador',
      });
      setShowActivateModal(false);
      await fetchBrands();
    } catch (err: any) {
      showToast(err.message || 'Error al activar plan', 'error');
    } finally { setActivating(false); }
  };

  const handleSendResetEmail = async (brand: Brand) => {
    setSendingReset(brand.id);
    try {
      await adminApi.post(`/admin/brands/${brand.id}/send-reset-email`);
      setResetToast({ message: `Email de recuperación enviado a ${brand.email}`, type: 'success' });
      setTimeout(() => setResetToast(null), 4000);
    } catch (err: any) {
      setResetToast({ message: err.message || 'Error al enviar email', type: 'error' });
      setTimeout(() => setResetToast(null), 4000);
    } finally {
      setSendingReset(null);
    }
  };

  // ── Selección masiva ──────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const pageIds = filteredBrands.slice(startIdx, startIdx + itemsPerPage).map(b => b.id);
    if (selected.size === pageIds.length && pageIds.every(id => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageIds));
    }
  };

  const handleBulkAction = async (action: 'suspend' | 'reactivate' | 'delete') => {
    const actionLabels: Record<string, { title: string; message: string; danger: boolean }> = {
      suspend: { title: 'Suspender marcas', message: `¿Suspender ${selected.size} marca(s)? Sus suscripciones quedarán inactivas.`, danger: false },
      reactivate: { title: 'Reactivar marcas', message: `¿Reactivar ${selected.size} marca(s)? Sus suscripciones se restaurarán.`, danger: false },
      delete: { title: 'Eliminar marcas', message: `¿Eliminar permanentemente ${selected.size} marca(s) y todos sus datos?`, danger: true },
    };
    const cfg = actionLabels[action];
    const ok = await confirm({
      title: cfg.title,
      message: cfg.message,
      confirmLabel: action === 'delete' ? 'Eliminar permanentemente' : action === 'suspend' ? 'Suspender' : 'Reactivar',
      danger: cfg.danger,
      reason: action === 'delete'
        ? 'Esta acción elimina la marca, productos, generaciones y pagos. No se puede deshacer.'
        : action === 'suspend'
        ? 'Las marcas suspendidas perderán acceso hasta que se reactiven manualmente.'
        : 'Las marcas reactivadas recuperarán su suscripción anterior.',
    });
    if (!ok) return;

    setBulkLoading(true);
    const ids = Array.from(selected);
    let okCount = 0; let failCount = 0;

    await Promise.all(ids.map(async id => {
      try {
        if (action === 'delete') {
          await adminApi.delete(`/admin/brands/${id}`);
        } else {
          await adminApi.patch(`/admin/subscriptions/${id}/${action}`, {});
        }
        okCount++;
      } catch { failCount++; }
    }));

    setBulkLoading(false);
    setConfirmBulk(null);
    setSelected(new Set());
    await fetchBrands();
    showToast(
      failCount === 0
        ? `${okCount} marca${okCount !== 1 ? 's' : ''} ${action === 'suspend' ? 'suspendida' : action === 'reactivate' ? 'reactivada' : 'eliminada'}${okCount !== 1 ? 's' : ''}`
        : `${okCount} exitosa${okCount !== 1 ? 's' : ''}, ${failCount} con error`,
      failCount === 0 ? 'success' : 'error'
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando marcas...</div>
    </div>
  );

  if (error) return <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>{error}</div>;

  const trialCount = brands.filter(b => b.plan === 'TRIAL').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Gestión de marcas</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Total: {brands.length} | Mostrando: {filteredBrands.length}
            {trialCount > 0 && (
              <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}>
                {trialCount} en período de prueba
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-[#FF5C3A]/20 hover:scale-[1.01] active:scale-95 min-h-[40px]"
          style={{ backgroundColor: '#FF5C3A' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e04e2f')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FF5C3A')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Marca
        </button>
      </div>

      {/* Filtros */}
      <BrandFilters
        brands={brands}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterPlan={filterPlan}
        onFilterPlanChange={setFilterPlan}
        filterTrial={filterTrial}
        onFilterTrialChange={setFilterTrial}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortOrder={sortOrder}
        onSortOrderChange={() => toggleSort(sortField)}
        onShowCreate={() => setShowCreateModal(true)}
      />

      {/* Tabla */}
      <BrandTable
        brands={filteredBrands}
        selected={selected}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onSelectDetails={handleViewDetails}
        onSelectProducts={handleViewProducts}
        onSelectActivate={brand => brand.plan === 'TRIAL' ? handleOpenActivate(brand) : handleChangePlan(brand.id, brand.plan === 'BASIC' ? 'PRO' : 'BASIC')}
        onSelectModalConfig={handleOpenModalConfig}
        onSendReset={handleSendResetEmail}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={setSortField}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        landingPrice={landingPrice}
      />

      {/* Modal Ver Detalles */}
      {showDetailsModal && selectedBrand && (
        <BrandDetailsModal
          brand={selectedBrand}
          onClose={() => setShowDetailsModal(false)}
          onToggleLanding={handleToggleLandingPage}
          onSaveNotes={handleSaveNotes}
          onOpenModalConfig={handleOpenModalConfig}
          togglingLanding={togglingLanding}
          savingNotes={savingNotes}
        />
      )}

      {/* Modal Ver Productos */}
      {showProductsModal && selectedBrand && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-150 animate-in fade-in">
          <div className="rounded-[2rem] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-transform duration-200 animate-in zoom-in-95" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="font-jakarta font-bold tracking-tight text-xl" style={{ color: 'var(--text-primary)' }}>Productos de {selectedBrand.name}</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Total: {products.length}</p>
              </div>
              <button onClick={() => setShowProductsModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {loadingProducts ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando productos...</div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-sm" style={{ color: 'var(--text-secondary)' }}>Esta marca aún no tiene productos.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className="rounded-xl border p-4 transition-colors" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-base)' }}>
                    {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-3" />}
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{product.category}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium`}
                        style={product.is_active
                          ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }
                          : { backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }
                        }>
                        {product.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(product.created_at).toLocaleDateString('es-ES')}</span>
                        {!product.is_active && (
                          <button onClick={() => handleDeleteProduct(product.id)} disabled={deletingProduct === product.id}
                            title="Eliminar producto inactivo" className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50">
                            {deletingProduct === product.id ? (
                              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-red-500" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowProductsModal(false)} className="px-4 py-2 rounded-lg text-sm transition-colors" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Marca */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity duration-150 animate-in fade-in">
          <div className="rounded-[2rem] p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto transition-transform duration-200 animate-in zoom-in-95" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-jakarta font-bold tracking-tight text-xl" style={{ color: 'var(--text-primary)' }}>Nueva marca</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Crea una marca manualmente. Se iniciará con un período de prueba activo.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre <span className="text-red-500">*</span></label>
                  <input type="text" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre de la marca"
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A]"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Slug <span className="text-red-500">*</span></label>
                  <input type="text" value={createForm.slug} onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="mi-marca"
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A]"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email <span className="text-red-500">*</span></label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="contacto@marca.com"
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A]"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contraseña inicial <span className="text-red-500">*</span></label>
                <input type="text" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Contraseña que se le entregará al cliente"
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A]"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Plan</label>
                  <select value={createForm.plan} onChange={e => setCreateForm(f => ({ ...f, plan: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    <option value="TRIAL">TRIAL — 7 días</option>
                    <option value="BASIC">BASIC — $150.000/mes</option>
                    <option value="PRO">PRO — $250.000/mes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Días de prueba</label>
                  <input type="number" min="1" max="90" value={createForm.trial_days} onChange={e => setCreateForm(f => ({ ...f, trial_days: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Teléfono</label>
                  <input type="text" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="Opcional"
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre de contacto</label>
                  <input type="text" value={createForm.contact_name} onChange={e => setCreateForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Opcional"
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                Cancelar
              </button>
              <button onClick={handleCreateBrand} disabled={creating}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#FF5C3A' }}>
                {creating && <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />}
                Crear Marca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Activar Plan */}
      {showActivateModal && selectedBrand && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-150 animate-in fade-in">
          <div className="rounded-[2rem] p-6 max-w-md w-full transition-transform duration-200 animate-in zoom-in-95" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-jakarta font-bold tracking-tight text-lg" style={{ color: 'var(--text-primary)' }}>Activar plan - {selectedBrand.name}</h2>
              <button onClick={() => setShowActivateModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              Esta marca está en período de prueba. Al activar el plan, se iniciará una suscripción activa de 30 días.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Plan</label>
                <select value={activateForm.plan} onChange={e => setActivateForm(f => ({ ...f, plan: e.target.value, amount: e.target.value === 'PRO' ? '250000' : '150000' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="BASIC">BASIC — $150.000 COP/mes</option>
                  <option value="PRO">PRO — $250.000 COP/mes</option>
                </select>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Monto recibido (COP)</label>
                <input type="number" value={activateForm.amount} onChange={e => setActivateForm(f => ({ ...f, amount: e.target.value }))}
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Método de pago</label>
                <select value={activateForm.payment_method} onChange={e => setActivateForm(f => ({ ...f, payment_method: e.target.value }))}
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]">
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Notas (opcional)</label>
                <input type="text" value={activateForm.notes} onChange={e => setActivateForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Referencia de pago, observaciones..."
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowActivateModal(false)}
                style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                className="px-4 py-2 min-h-[44px] border rounded-xl text-sm hover:opacity-80 transition-opacity">
                Cancelar
              </button>
              <button onClick={handleActivatePlan} disabled={activating}
                className="px-4 py-2 min-h-[44px] bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 text-sm font-semibold transition-colors">
                {activating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                Activar Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación acción masiva */}
      {confirmBulk && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-150 animate-in fade-in">
          <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] shadow-xl w-full max-w-sm p-6 space-y-4 border transition-transform duration-200 animate-in zoom-in-95">
            <h3 style={{ color: 'var(--text-primary)' }} className="font-jakarta font-bold tracking-tight text-lg">
              {confirmBulk === 'delete' && `Eliminar ${selected.size} marca${selected.size > 1 ? 's' : ''}`}
              {confirmBulk === 'suspend' && `Suspender ${selected.size} marca${selected.size > 1 ? 's' : ''}`}
              {confirmBulk === 'reactivate' && `Reactivar ${selected.size} marca${selected.size > 1 ? 's' : ''}`}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
              {confirmBulk === 'delete' && 'Esta acción es irreversible. Se eliminarán las marcas y todos sus datos.'}
              {confirmBulk === 'suspend' && 'Las marcas seleccionadas perderán acceso al dashboard y al probador público.'}
              {confirmBulk === 'reactivate' && 'Las marcas seleccionadas recuperarán acceso completo al sistema.'}
            </p>
            {bulkLoading && (
              <div style={{ color: 'var(--text-muted)' }} className="flex items-center gap-2 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FF5C3A]" />
                Procesando...
              </div>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setConfirmBulk(null)}
                disabled={bulkLoading}
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                className="px-4 py-2 min-h-[44px] rounded-xl border text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleBulkAction(confirmBulk)}
                disabled={bulkLoading}
                className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                  confirmBulk === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  confirmBulk === 'suspend' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-[#FF5C3A] hover:bg-[#e04e30]'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Configurar Modal de Activación */}
      {showModalConfigModal && modalConfigBrand && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="rounded-[2rem] p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-jakarta font-bold tracking-tight text-lg" style={{ color: 'var(--text-primary)' }}>Modal de activación</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{modalConfigBrand.name}</p>
              </div>
              <button onClick={() => setShowModalConfigModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              Este texto aparece en el modal que ven los visitantes cuando la mini-landing aún no está activa.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Título del modal</label>
                <input
                  type="text"
                  value={modalConfigForm.modal_title}
                  onChange={e => setModalConfigForm(f => ({ ...f, modal_title: e.target.value }))}
                  maxLength={80}
                  placeholder="Ej: Activa tu probador virtual"
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
                <textarea
                  value={modalConfigForm.modal_description}
                  onChange={e => setModalConfigForm(f => ({ ...f, modal_description: e.target.value }))}
                  rows={3}
                  maxLength={300}
                  placeholder="Ej: Permite que tus clientes se prueben la ropa virtualmente..."
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40"
                  style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Beneficios (hasta 5)</label>
                <div className="space-y-2">
                  {modalConfigForm.modal_features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-4 text-center flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                      <input
                        type="text"
                        value={feat}
                        onChange={e => {
                          const next = [...modalConfigForm.modal_features];
                          next[i] = e.target.value;
                          setModalConfigForm(f => ({ ...f, modal_features: next }));
                        }}
                        maxLength={80}
                        placeholder={`Beneficio ${i + 1}`}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40"
                        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  ))}
                  {modalConfigForm.modal_features.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setModalConfigForm(f => ({ ...f, modal_features: [...f.modal_features, ''] }))}
                      className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                      style={{ color: '#FF5C3A' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar beneficio
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowModalConfigModal(false)}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                Cancelar
              </button>
              <button onClick={handleSaveModalConfig} disabled={savingModalConfig}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#FF5C3A' }}>
                {savingModalConfig && <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de reset email */}
      {resetToast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${resetToast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {resetToast.type === 'success'
            ? <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          }
          {resetToast.message}
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
