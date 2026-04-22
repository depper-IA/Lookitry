'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/services/adminApi';

type WooBrandStatus = 'active' | 'pending' | 'inactive';

type WooBrand = {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  has_api_key: boolean;
  status: WooBrandStatus;
  plugin_validated_at?: string | null;
  plugin_store_domain?: string | null;
  subscription_status?: string | null;
  product_counts: { total: number; active: number; mapped: number };
  telemetry: {
    totalRequests: number;
    failedRequests: number;
    avgLatencyMs: number;
    lastSyncAt: string | null;
    lastErrorMessage?: string | null;
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

const STATUS_META: Record<WooBrandStatus, { label: string; bg: string; text: string }> = {
  active: { label: 'Activa', bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  pending: { label: 'Pendiente', bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  inactive: { label: 'Inactiva', bg: 'rgba(148,163,184,0.12)', text: '#cbd5e1' },
};

export default function AdminWooCommercePage() {
  // adminApi ya maneja la base y el prefijo /api correctamente
  const [brands, setBrands] = useState<WooBrand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [summary, setSummary] = useState<WooSummary | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === selectedBrandId) || null,
    [brands, selectedBrandId]
  );

  const filteredBrands = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Mostramos activas y pendientes para que el admin vea quién está intentando conectar
    const visibleBrands = brands.filter((brand) => brand.status === 'active' || brand.status === 'pending');

    if (!q) return visibleBrands;

    return visibleBrands.filter((brand) =>
      [brand.name, brand.slug, brand.email, brand.plugin_store_domain || '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [brands, query]);

  const fetchBrands = async () => {
    setLoadingBrands(true);
    setError('');
    try {
      const data = await adminApi.get('/admin/woocommerce/brands-summary');
      const list: WooBrand[] = Array.isArray(data.brands) ? data.brands : [];
      setBrands(list);

      const firstVisible = list.find((brand) => brand.status === 'active' || brand.status === 'pending');
      setSelectedBrandId((current) => {
        if (current && list.some((brand) => brand.id === current && (brand.status === 'active' || brand.status === 'pending'))) {
          return current;
        }
        return firstVisible?.id || '';
      });
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar la integración WooCommerce.');
      setBrands([]);
      setSelectedBrandId('');
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchProducts = async (brandId: string) => {
    if (!brandId) return;
    setLoadingProducts(true);
    try {
      const data = await adminApi.get(`/admin/woocommerce/brands/${brandId}/products`);
      setProducts((data.products || []).filter((product: WooProduct) => !!product.external_id));
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar el detalle de WooCommerce.');
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
      await adminApi.patch(
        `/admin/woocommerce/brands/${selectedBrandId}/products/${productId}/active`,
        { is_active: nextState }
      );

      setProducts((prev) => prev.map((product) => (
        product.id === productId ? { ...product, is_active: nextState } : product
      )));

      await Promise.all([fetchBrands(), fetchProducts(selectedBrandId)]);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el producto.');
    } finally {
      setSavingMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrandId) {
      fetchProducts(selectedBrandId);
    } else {
      setProducts([]);
      setSummary(null);
    }
  }, [selectedBrandId]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-jakarta font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          WooCommerce activo
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Vista de marcas con plugin validado o pendiente de validación.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <section
        className="rounded-[2rem] border p-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar marca, slug, email o dominio"
            className="w-full max-w-md rounded-xl border px-3 py-2"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={fetchBrands}
            className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            Refrescar
          </button>
        </div>

        {loadingBrands ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando marcas activas...</p>
        ) : filteredBrands.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed p-8 text-center" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              No hay marcas WooCommerce activas o pendientes
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Las marcas deben tener al menos una API Key generada para aparecer aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Marca</th>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Estado</th>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Plan</th>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Tienda</th>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Mapeados</th>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Activos</th>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Errores 30d</th>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Último sync</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((brand) => {
                  const meta = STATUS_META[brand.status];
                  return (
                    <tr
                      key={brand.id}
                      onClick={() => setSelectedBrandId(brand.id)}
                      className="cursor-pointer border-b"
                      style={{
                        borderColor: 'var(--border-color)',
                        backgroundColor: selectedBrandId === brand.id ? 'var(--bg-hover)' : 'transparent',
                      }}
                    >
                      <td className="py-4">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{brand.name}</div>
                        <div style={{ color: 'var(--text-muted)' }}>/{brand.slug}</div>
                      </td>
                      <td className="py-4">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]"
                          style={{ background: meta.bg, color: meta.text }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-4" style={{ color: 'var(--text-secondary)' }}>{brand.plan}</td>
                      <td className="py-4" style={{ color: 'var(--text-secondary)' }}>
                        {brand.plugin_store_domain || 'Sin dominio reportado'}
                      </td>
                      <td className="py-4">{brand.product_counts.mapped}</td>
                      <td className="py-4">{brand.product_counts.active}</td>
                      <td className="py-4">{brand.telemetry?.failedRequests || 0}</td>
                      <td className="py-4" style={{ color: 'var(--text-secondary)' }}>
                        {brand.telemetry?.lastSyncAt ? new Date(brand.telemetry.lastSyncAt).toLocaleString('es-CO') : 'Sin sync'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        className="rounded-[2rem] border p-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="mb-4">
          <h2 className="font-jakarta text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {selectedBrand ? `Productos sincronizados · ${selectedBrand.name}` : 'Productos sincronizados'}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Solo se habilita detalle sobre marcas activas validadas por el plugin.
          </p>
        </div>

        {summary && (
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: 'Mapeados', value: summary.products.totalMappedProducts },
              { label: 'Activos', value: summary.products.activeMappedProducts },
              { label: 'Requests 30d', value: summary.telemetry.totalRequests },
              { label: 'Errores 30d', value: summary.telemetry.failedRequests },
              { label: 'Latencia media', value: `${summary.telemetry.avgLatencyMs}ms` },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
                <div className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  {card.label}
                </div>
                <div className="mt-2 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {summary?.telemetry.lastErrorMessage && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Último error: {summary.telemetry.lastErrorMessage}
          </div>
        )}

        {!selectedBrandId ? (
          <p style={{ color: 'var(--text-muted)' }}>Selecciona una marca activa para revisar sus productos mapeados.</p>
        ) : loadingProducts ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando productos...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Producto</th>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">External ID</th>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Categoría</th>
                  <th className="py-3 text-[11px] font-black uppercase tracking-[0.18em]">Activo</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-4" style={{ color: 'var(--text-primary)' }}>{product.name}</td>
                    <td className="py-4" style={{ color: 'var(--text-secondary)' }}>{product.external_id}</td>
                    <td className="py-4" style={{ color: 'var(--text-secondary)' }}>{product.category || 'General'}</td>
                    <td className="py-4">
                      <button
                        disabled={!!savingMap[product.id]}
                        onClick={() => toggleProduct(product.id, !product.is_active)}
                        className="rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white"
                        style={{
                          backgroundColor: product.is_active ? '#10b981' : '#475569',
                          opacity: savingMap[product.id] ? 0.6 : 1,
                        }}
                      >
                        {savingMap[product.id] ? 'Guardando' : product.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
}
