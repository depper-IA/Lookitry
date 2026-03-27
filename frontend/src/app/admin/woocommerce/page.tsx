'use client';

import { useEffect, useMemo, useState } from 'react';

type WooBrand = {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  has_api_key: boolean;
  subscription_status?: string | null;
  product_counts: { total: number; active: number; mapped: number };
  telemetry: {
    totalRequests: number;
    failedRequests: number;
    avgLatencyMs: number;
    lastSyncAt: string | null;
  };
};

type WooProduct = {
  id: string;
  name: string;
  category: string | null;
  external_id: string | null;
  is_active: boolean;
  updated_at: string;
};

type WooSummary = {
  products: {
    totalMappedProducts: number;
    activeMappedProducts: number;
  };
  telemetry: {
    totalRequests: number;
    failedRequests: number;
    avgLatencyMs: number;
    totalRetries: number;
    lastSyncAt: string | null;
    lastErrorAt: string | null;
    lastErrorMessage: string | null;
  };
};

export default function AdminWooCommercePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  const [brands, setBrands] = useState<WooBrand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [summary, setSummary] = useState<WooSummary | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const brandsPerPage = 6;

  const selectedBrand = useMemo(
    () => brands.find((b) => b.id === selectedBrandId) || null,
    [brands, selectedBrandId]
  );

  const filteredBrands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q)
    );
  }, [brands, query]);

  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / brandsPerPage));
  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * brandsPerPage;
    return filteredBrands.slice(start, start + brandsPerPage);
  }, [filteredBrands, currentPage]);

  const fetchBrands = async () => {
    setLoadingBrands(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/woocommerce/brands-summary`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('No se pudo cargar marcas WooCommerce');
      const data = await res.json();
      const list: WooBrand[] = data.brands || [];
      setBrands(list);
      if (!selectedBrandId && list.length) setSelectedBrandId(list[0].id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchProducts = async (brandId: string) => {
    if (!brandId) return;
    setLoadingProducts(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/woocommerce/brands/${brandId}/products`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('No se pudo cargar productos de la marca');
      const data = await res.json();
      setProducts((data.products || []).filter((p: WooProduct) => !!p.external_id));
      setSummary(data.summary || null);
    } catch (error) {
      console.error(error);
      setProducts([]);
      setSummary(null);
    } finally {
      setLoadingProducts(false);
    }
  };

  const toggleProduct = async (productId: string, nextState: boolean) => {
    if (!selectedBrandId) return;
    setSavingMap((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(
        `${apiBase}/api/admin/woocommerce/brands/${selectedBrandId}/products/${productId}/active`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: nextState }),
        }
      );

      if (!res.ok) throw new Error('No se pudo actualizar el estado del producto');

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_active: nextState } : p))
      );
      fetchBrands();
      fetchProducts(selectedBrandId);
    } catch (error) {
      console.error(error);
      alert('No se pudo actualizar el producto. Intenta de nuevo.');
    } finally {
      setSavingMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (selectedBrandId) fetchProducts(selectedBrandId);
  }, [selectedBrandId]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-jakarta font-black tracking-tight text-2xl text-[var(--text-primary)]">WooCommerce Control</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Control centralizado desde Admin: marcas integradas, productos mapeados y metricas reales del plugin.
        </p>
      </header>

      <section
        className="rounded-[2rem] border p-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar marca por nombre, slug o email"
            className="w-full max-w-md rounded-xl px-3 py-2 border"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={fetchBrands}
            className="rounded-xl px-4 py-2 text-white font-bold uppercase text-xs tracking-wider"
            style={{ backgroundColor: '#FF5C3A' }}
          >
            Refrescar
          </button>
        </div>

        {loadingBrands ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando marcas...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2">Marca</th>
                  <th className="py-2">Plan</th>
                  <th className="py-2">API Key</th>
                  <th className="py-2">Mapeados</th>
                  <th className="py-2">Activos</th>
                  <th className="py-2">Errores 30d</th>
                  <th className="py-2">Latencia</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBrands.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBrandId(b.id)}
                    className="cursor-pointer border-t"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: selectedBrandId === b.id ? 'var(--bg-hover)' : 'transparent',
                    }}
                  >
                    <td className="py-3">
                      <div className="font-semibold">{b.name}</div>
                      <div style={{ color: 'var(--text-muted)' }}>/{b.slug}</div>
                    </td>
                    <td className="py-3">{b.plan}</td>
                    <td className="py-3">{b.has_api_key ? 'OK' : 'NO'}</td>
                    <td className="py-3">{b.product_counts.mapped}</td>
                    <td className="py-3">{b.product_counts.active}</td>
                    <td className="py-3">{b.telemetry?.failedRequests || 0}</td>
                    <td className="py-3">{b.telemetry?.avgLatencyMs || 0}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loadingBrands && filteredBrands.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>
              {(currentPage - 1) * brandsPerPage + 1}–
              {Math.min(currentPage * brandsPerPage, filteredBrands.length)} de {filteredBrands.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Anterior
              </button>
              <span className="font-semibold">{currentPage}/{totalPages}</span>
              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </section>

      <section
        className="rounded-[2rem] border p-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="mb-4">
          <h2 className="font-jakarta font-bold tracking-tight">
            {selectedBrand ? `Productos sincronizados - ${selectedBrand.name}` : 'Productos sincronizados'}
          </h2>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
              <div style={{ color: 'var(--text-muted)' }} className="text-xs uppercase">Mapeados</div>
              <div className="text-xl font-bold">{summary.products.totalMappedProducts}</div>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
              <div style={{ color: 'var(--text-muted)' }} className="text-xs uppercase">Activos</div>
              <div className="text-xl font-bold">{summary.products.activeMappedProducts}</div>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
              <div style={{ color: 'var(--text-muted)' }} className="text-xs uppercase">Requests 30d</div>
              <div className="text-xl font-bold">{summary.telemetry.totalRequests}</div>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
              <div style={{ color: 'var(--text-muted)' }} className="text-xs uppercase">Errores 30d</div>
              <div className="text-xl font-bold">{summary.telemetry.failedRequests}</div>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
              <div style={{ color: 'var(--text-muted)' }} className="text-xs uppercase">Latencia media</div>
              <div className="text-xl font-bold">{summary.telemetry.avgLatencyMs}ms</div>
            </div>
          </div>
        )}

        {summary?.telemetry.lastSyncAt && (
          <div className="mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>
            Ultima sincronizacion exitosa: {new Date(summary.telemetry.lastSyncAt).toLocaleString('es-CO')}
          </div>
        )}

        {summary?.telemetry.lastErrorMessage && (
          <div className="mb-5 text-sm text-red-400">
            Ultimo error reportado: {summary.telemetry.lastErrorMessage}
          </div>
        )}

        {!selectedBrandId ? (
          <p style={{ color: 'var(--text-muted)' }}>Selecciona una marca para ver sus productos mapeados.</p>
        ) : loadingProducts ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando productos...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2">Producto</th>
                  {selectedBrand?.has_api_key && <th className="py-2">External ID</th>}
                  <th className="py-2">Categoria</th>
                  <th className="py-2">Activo</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-3">{p.name}</td>
                    {selectedBrand?.has_api_key && <td className="py-3">{p.external_id}</td>}
                    <td className="py-3">{p.category || 'General'}</td>
                    <td className="py-3">
                      <button
                        disabled={!!savingMap[p.id]}
                        onClick={() => toggleProduct(p.id, !p.is_active)}
                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: p.is_active ? '#10b981' : '#374151',
                          color: '#fff',
                          opacity: savingMap[p.id] ? 0.6 : 1,
                        }}
                      >
                        {savingMap[p.id] ? 'Guardando...' : p.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
