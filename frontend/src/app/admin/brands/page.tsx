'use client';

import { useEffect, useState, useCallback } from 'react';

interface Brand {
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

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
    if (filterPlan === 'TRIAL') filtered = filtered.filter(b => b.is_in_trial);
    else if (filterPlan !== 'all') filtered = filtered.filter(b => b.plan === filterPlan && !b.is_in_trial);
    if (filterTrial === 'trial') filtered = filtered.filter(b => b.is_in_trial);
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
      const res = await fetch(`${API_URL}/api/admin/brands`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cargar marcas');
      setBrands(data.brands);
    } catch (err: any) {
      setError(err.message || 'Error al cargar marcas');
    } finally {
      setLoading(false);
    }
  };

  const fetchLandingPrice = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.landing_price) setLandingPrice(data.landing_price);
    } catch { /* silencioso */ }
  };

  const handleViewDetails = (brand: Brand) => { setSelectedBrand(brand); setShowDetailsModal(true); };

  const handleViewProducts = async (brand: Brand) => {
    setSelectedBrand(brand); setShowProductsModal(true); setLoadingProducts(true); setProducts([]);
    try {
      const res = await fetch(`${API_URL}/api/admin/brands/${brand.id}/products`, {
        credentials: 'include',
      });
      const data = await res.json();
      setProducts(data.products);
    } catch { /* silent */ } finally { setLoadingProducts(false); }
  };

  const handleChangePlan = async (brandId: string, newPlan: string) => {
    if (!confirm(`¿Cambiar plan a ${newPlan}?`)) return;
    setChangingPlan(brandId);
    try {
      const res = await fetch(`${API_URL}/api/admin/brands/${brandId}/plan`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      await fetchBrands();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar plan');
    } finally { setChangingPlan(null); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!selectedBrand) return;
    if (!confirm('¿Eliminar este producto permanentemente? Esta acción no se puede deshacer.')) return;
    setDeletingProduct(productId);
    try {
      const res = await fetch(`${API_URL}/api/admin/brands/${selectedBrand.id}/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar producto');
    } finally {
      setDeletingProduct(null);
    }
  };

  const handleCreateBrand = async () => {
    if (!createForm.name || !createForm.email || !createForm.slug || !createForm.password) {
      alert('Nombre, email, slug y contraseña son requeridos');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/brands`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          slug: createForm.slug,
          password: createForm.password,
          plan: createForm.plan,
          trial_days: Number(createForm.trial_days) || 7,
          phone: createForm.phone || undefined,
          contact_name: createForm.contact_name || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', slug: '', password: '', plan: 'TRIAL', trial_days: '7', phone: '', contact_name: '' });
      await fetchBrands();
    } catch (err: any) {
      alert(err.message || 'Error al crear marca');
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
    const newValue = !(brand as any).has_landing_page;
    setTogglingLanding(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/brands/${brand.id}/landing-page`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ has_landing_page: newValue }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      // Actualizar localmente sin refetch completo
      setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, has_landing_page: newValue } as any : b));
      if (selectedBrand?.id === brand.id) {
        setSelectedBrand(prev => prev ? { ...prev, has_landing_page: newValue } as any : prev);
      }
    } catch (err: any) {
      alert(err.message || 'Error al actualizar mini-landing');
    } finally {
      setTogglingLanding(false);
    }
  };

  const handleOpenModalConfig = (brand: Brand) => {
    setModalConfigBrand(brand);
    const b = brand as any;
    const feats = Array.isArray(b.modal_features) ? [...b.modal_features] : [];
    while (feats.length < 3) feats.push('');
    setModalConfigForm({
      modal_title: b.modal_title || '',
      modal_description: b.modal_description || '',
      modal_features: feats,
    });
    setShowModalConfigModal(true);
  };

  const handleSaveModalConfig = async () => {
    if (!modalConfigBrand) return;
    setSavingModalConfig(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/brands/${modalConfigBrand.id}/modal-config`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modal_title: modalConfigForm.modal_title || null,
          modal_description: modalConfigForm.modal_description || null,
          modal_features: modalConfigForm.modal_features.filter(f => f.trim()).length > 0
            ? modalConfigForm.modal_features.filter(f => f.trim())
            : null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setShowModalConfigModal(false);
    } catch (err: any) {
      alert(err.message || 'Error al guardar configuración del modal');
    } finally { setSavingModalConfig(false); }
  };

  const handleActivatePlan = async () => {
    if (!selectedBrand) return;
    setActivating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/brands/${selectedBrand.id}/activate-plan`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: activateForm.plan,
          amount: Number(activateForm.amount),
          payment_method: activateForm.payment_method,
          notes: activateForm.notes || 'Activación manual por administrador',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setShowActivateModal(false);
      await fetchBrands();
    } catch (err: any) {
      alert(err.message || 'Error al activar plan');
    } finally { setActivating(false); }
  };

  const handleSendResetEmail = async (brand: Brand) => {
    setSendingReset(brand.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/brands/${brand.id}/send-reset-email`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al enviar email');
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
    setBulkLoading(true);
    const ids = Array.from(selected);
    let ok = 0; let fail = 0;

    await Promise.all(ids.map(async id => {
      try {
        if (action === 'delete') {
          const res = await fetch(`${API_URL}/api/admin/brands/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) throw new Error();
        } else {
          const res = await fetch(`${API_URL}/api/admin/subscriptions/${id}/${action}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          if (!res.ok) throw new Error();
        }
        ok++;
      } catch { fail++; }
    }));

    setBulkLoading(false);
    setConfirmBulk(null);
    setSelected(new Set());
    await fetchBrands();
    if (fail > 0) alert(`${ok} exitosa${ok !== 1 ? 's' : ''}, ${fail} con error`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando marcas...</div>
    </div>
  );

  if (error) return <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>{error}</div>;

  const trialCount = brands.filter(b => b.is_in_trial).length;
  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBrands = filteredBrands.slice(startIndex, startIndex + itemsPerPage);

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
      <div className="rounded-[2rem] border p-4 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Buscar por nombre, email o slug
            </label>
            <input id="search" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A]"
              style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Filtrar por plan</label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'all',     label: `Todos (${brands.length})` },
                { value: 'TRIAL',   label: `TRIAL (${brands.filter(b => b.is_in_trial).length})` },
                { value: 'BASIC',   label: `BASIC (${brands.filter(b => b.plan === 'BASIC' && !b.is_in_trial).length})` },
                { value: 'PRO',     label: `PRO (${brands.filter(b => b.plan === 'PRO').length})` },
                { value: 'LANDING', label: `LANDING (${brands.filter(b => b.plan === 'LANDING').length})` },
              ] as { value: FilterPlan; label: string }[]).map(({ value, label }) => (
                <button key={value} onClick={() => setFilterPlan(value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: filterPlan === value ? '#FF5C3A' : 'var(--bg-base)',
                    color: filterPlan === value ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${filterPlan === value ? '#FF5C3A' : 'var(--border-color)'}`,
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Filtrar por estado</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'trial', label: `En prueba (${trialCount})` },
              { value: 'active', label: `Activos (${brands.filter(b => b.subscription_status === 'active' || b.subscription_status === 'expiring_soon').length})` },
              { value: 'suspended', label: `Suspendidos (${brands.filter(b => b.subscription_status === 'suspended' || b.subscription_status === 'expired').length})` },
            ].map(opt => (
              <button key={opt.value} onClick={() => setFilterTrial(opt.value as FilterTrial)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: filterTrial === opt.value ? '#FF5C3A' : 'var(--bg-base)',
                  color: filterTrial === opt.value ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${filterTrial === opt.value ? '#FF5C3A' : 'var(--border-color)'}`,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-[2rem] border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

        {/* Barra de acciones masivas */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ backgroundColor: 'rgba(255,92,58,0.06)', borderColor: 'var(--border-color)' }}>
            <span className="text-sm font-medium" style={{ color: '#FF5C3A' }}>
              {selected.size} seleccionada{selected.size > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setConfirmBulk('reactivate')} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Reactivar
              </button>
              <button onClick={() => setConfirmBulk('suspend')} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                Suspender
              </button>
              <button onClick={() => setConfirmBulk('delete')} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Eliminar
              </button>
              <button onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 rounded-lg border text-xs transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-base)' }}>
              <th className="px-4 py-3 w-10">
                <input type="checkbox"
                  checked={paginatedBrands.length > 0 && paginatedBrands.every(b => selected.has(b.id))}
                  ref={el => { if (el) el.indeterminate = selected.size > 0 && !paginatedBrands.every(b => selected.has(b.id)); }}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: '#FF5C3A' }} />
              </th>
              {[
                { label: 'Marca', field: 'name' as const },
                { label: 'Email', field: 'email' as const },
                { label: 'Plan', field: 'plan' as const },
                { label: 'Estado', field: 'status' as const },
                { label: 'Productos', field: 'products' as const },
                { label: 'Generaciones', field: 'generations' as const },
                { label: 'Acciones', field: null },
              ].map(h => (
                <th key={h.label} 
                  onClick={() => h.field && toggleSort(h.field)}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${h.field ? 'cursor-pointer hover:bg-black/5' : ''}`} 
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <div className="flex items-center gap-1">
                    {h.label}
                    {h.field && (
                      <svg className="w-3 h-3" style={{ color: sortField === h.field ? '#FF5C3A' : 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedBrands.map(brand => (
              <tr key={brand.id} className="border-t transition-colors"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: selected.has(brand.id) ? 'rgba(255,92,58,0.05)' : 'transparent',
                }}>
                <td className="px-4 py-3.5">
                  <input type="checkbox" checked={selected.has(brand.id)} onChange={() => toggleSelect(brand.id)}
                    className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: '#FF5C3A' }} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{brand.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{brand.slug}</div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>{brand.email}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={
                      brand.is_in_trial
                        ? { backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }
                        : brand.plan === 'PRO'
                        ? { backgroundColor: 'rgba(168,85,247,0.12)', color: '#a855f7' }
                        : brand.plan === 'LANDING'
                        ? { backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }
                        : { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }
                    }>
                    {brand.is_in_trial ? 'TRIAL' : brand.plan}
                  </span>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {brand.is_in_trial
                      ? 'Gratuito'
                      : brand.plan === 'PRO'
                      ? '$250.000/mes'
                      : brand.plan === 'BASIC'
                      ? '$150.000/mes'
                      : brand.plan === 'LANDING'
                      ? (landingPrice ? `$${landingPrice.toLocaleString('es-CO')}` : '—')
                      : '—'}
                  </div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  {brand.is_in_trial ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v10.5a3 3 0 006 0V3M6 3h12" /></svg>
                      Prueba — {brand.trial_days_remaining ?? 0}d
                    </span>
                  ) : brand.subscription_status === 'active' ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Activo</span>
                  ) : brand.subscription_status === 'expiring_soon' ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>Por vencer</span>
                  ) : brand.subscription_status === 'suspended' ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Suspendido</span>
                  ) : brand.subscription_status === 'expired' ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Vencido</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-muted)' }}>Sin suscripción</span>
                  )}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{brand.stats.productsCount}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{brand.stats.generationsCount}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{brand.stats.generationsThisMonth} este mes</div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleViewDetails(brand)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all duration-150" title="Ver detalles">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button onClick={() => handleViewProducts(brand)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all duration-150" title="Ver productos">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </button>
                    {brand.is_in_trial ? (
                      <button onClick={() => handleOpenActivate(brand)} className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-all duration-150" title="Activar plan">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    ) : (
                      <button onClick={() => handleChangePlan(brand.id, brand.plan === 'BASIC' ? 'PRO' : 'BASIC')} disabled={changingPlan === brand.id}
                        className="p-1.5 rounded-lg bg-[#FF5C3A]/10 text-[#FF5C3A] hover:bg-[#FF5C3A]/20 transition-all duration-150 disabled:opacity-50" title={`Cambiar a ${brand.plan === 'BASIC' ? 'PRO' : 'BASIC'}`}>
                        {changingPlan === brand.id
                          ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF5C3A', borderTopColor: 'transparent' }} />
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                      </button>
                    )}
                    <button onClick={() => handleOpenModalConfig(brand)} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all duration-150" title="Configurar Modal">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                      onClick={() => handleSendResetEmail(brand)}
                      disabled={sendingReset === brand.id}
                      className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-all duration-150 disabled:opacity-50"
                      title="Enviar email de recuperación"
                    >
                      {sendingReset === brand.id
                        ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#f59e0b', borderTopColor: 'transparent' }} />
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filteredBrands.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-10 w-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No se encontraron marcas</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Intenta ajustar los filtros de búsqueda.</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border px-4 py-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredBrands.length)} de {filteredBrands.length}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)' }}>Anterior</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className="px-3 py-1.5 rounded-lg border text-xs transition-colors"
                  style={{
                    backgroundColor: currentPage === p ? '#FF5C3A' : 'var(--bg-base)',
                    color: currentPage === p ? '#fff' : 'var(--text-secondary)',
                    borderColor: currentPage === p ? '#FF5C3A' : 'var(--border-color)',
                  }}>{p}</button>
              );
            })}
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)' }}>Siguiente</button>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {showDetailsModal && selectedBrand && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity duration-150 animate-in fade-in">
          <div className="rounded-[2rem] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-transform duration-200 animate-in zoom-in-95" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-5">
              <h2 className="font-jakarta font-bold tracking-tight text-xl" style={{ color: 'var(--text-primary)' }}>Detalles de {selectedBrand.name}</h2>
              <button onClick={() => setShowDetailsModal(false)} style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[['Email', selectedBrand.email], ['Slug', selectedBrand.slug], ['Plan', selectedBrand.is_in_trial ? 'TRIAL' : selectedBrand.plan],
                  ['Fecha de registro', new Date(selectedBrand.created_at).toLocaleDateString('es-ES')]].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
                {selectedBrand.is_in_trial && (
                  <div className="col-span-2">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Estado de prueba</p>
                    <p className="text-sm font-medium" style={{ color: '#3b82f6' }}>
                      En período de prueba — {selectedBrand.trial_days_remaining} días restantes
                      {selectedBrand.trial_end_date && ` (vence ${new Date(selectedBrand.trial_end_date).toLocaleDateString('es-ES')})`}
                    </p>
                  </div>
                )}
              </div>
              <div className="border-t pt-4">
                <h3 className="font-jakarta font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Estadísticas</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Productos', value: selectedBrand.stats.productsCount, color: '#3b82f6' },
                    { label: 'Generaciones', value: selectedBrand.stats.generationsCount, color: '#10b981' },
                    { label: 'Este mes', value: selectedBrand.stats.generationsThisMonth, color: '#FF5C3A' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-base)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                      <p className="text-xl font-bold font-jakarta" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggle mini-landing */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Mini-landing activa</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {(selectedBrand as any).has_landing_page
                        ? 'La página pública está activa y visible sin banners.'
                        : 'La página muestra un banner de activación ($500.000 COP).'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleLandingPage(selectedBrand)}
                    disabled={togglingLanding}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
                    style={{ backgroundColor: (selectedBrand as any).has_landing_page ? '#FF5C3A' : 'var(--border-color)' }}
                    aria-label="Activar mini-landing"
                  >
                    <span
                      className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                      style={{ transform: (selectedBrand as any).has_landing_page ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
                    />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
}
