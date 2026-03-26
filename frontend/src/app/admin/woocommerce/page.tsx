'use client';

import { useEffect, useMemo, useState } from 'react';

type WooBrand = {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  has_api_key: boolean;
  product_counts: { total: number; active: number; mapped: number };
};

type WooProduct = {
  id: string;
  name: string;
  category: string | null;
  external_id: string | null;
  is_active: boolean;
  updated_at: string;
};

export default function AdminWooCommercePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';
  const [brands, setBrands] = useState<WooBrand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

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
    } catch (error) {
      console.error(error);
      setProducts([]);
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
    if (selectedBrandId) fetchProducts(selectedBrandId);
  }, [selectedBrandId]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-jakarta font-black uppercase italic tracking-tight text-2xl">WooCommerce Control</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Control centralizado desde Admin: marcas integradas, productos mapeados y activación/desactivación por producto.
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
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((b) => (
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
                  </tr>
                ))}
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
          <h2 className="font-jakarta font-bold uppercase italic">
            {selectedBrand ? `Productos sincronizados - ${selectedBrand.name}` : 'Productos sincronizados'}
          </h2>
        </div>

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
                  <th className="py-2">External ID</th>
                  <th className="py-2">Categoria</th>
                  <th className="py-2">Activo</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-3">{p.name}</td>
                    <td className="py-3">{p.external_id}</td>
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
