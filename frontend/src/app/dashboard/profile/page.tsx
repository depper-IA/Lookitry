'use client';

import { useState, useEffect } from 'react';
import { brandsService } from '@/services/brands.service';
import type { Brand } from '@/types';

export default function ProfilePage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    contact_name: '',
    address: '',
    city: '',
    country: '',
    nit: '',
    website: '',
  });

  useEffect(() => {
    brandsService.getCurrentBrand().then((b) => {
      setBrand(b);
      setForm({
        name: b.name ?? '',
        phone: (b as any).phone ?? '',
        contact_name: (b as any).contact_name ?? '',
        address: (b as any).address ?? '',
        city: (b as any).city ?? '',
        country: (b as any).country ?? '',
        nit: (b as any).nit ?? '',
        website: (b as any).website ?? '',
      });
      setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // Normalizar website: si tiene valor pero no tiene protocolo, agregar https://
      const website = form.website.trim();
      const normalizedWebsite = website && !website.match(/^https?:\/\//)
        ? `https://${website}`
        : website;

      await brandsService.updateMe({ ...form, website: normalizedWebsite });
      setForm(prev => ({ ...prev, website: normalizedWebsite }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5C3A]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-syne font-bold">Perfil de la marca</h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
          Información de contacto y datos de facturación
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border divide-y">
        {/* Sección: Datos básicos */}
        <div className="p-6 space-y-4">
          <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold uppercase tracking-wide">
            Datos básicos
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Nombre de la marca
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-3 py-2 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                value={brand?.email ?? ''}
                disabled
                style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                className="w-full px-3 py-2 min-h-[44px] border rounded-xl text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Nombre de contacto
              </label>
              <input
                type="text"
                name="contact_name"
                value={form.contact_name}
                onChange={handleChange}
                placeholder="Persona de contacto"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-3 py-2 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
              />
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+57 300 000 0000"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                className="w-full px-3 py-2 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
              />
            </div>
          </div>
        </div>

        {/* Sección: Facturación */}
        <div className="p-6 space-y-4" style={{ borderColor: 'var(--border-color)' }}>
          <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold uppercase tracking-wide">
            Facturación
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { name: 'nit', label: 'NIT / RUT', placeholder: '900.000.000-0' },
              { name: 'website', label: 'Sitio web', placeholder: 'wilkiedevs.com' },
              { name: 'address', label: 'Dirección', placeholder: 'Calle 123 # 45-67' },
              { name: 'city', label: 'Ciudad', placeholder: 'Bogotá' },
              { name: 'country', label: 'País', placeholder: 'Colombia' },
            ].map(field => (
              <div key={field.name}>
                <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  name={field.name}
                  value={(form as any)[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer del formulario */}
        <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <div>
            {success && (
              <span className="flex items-center gap-2 text-sm text-emerald-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cambios guardados
              </span>
            )}
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 min-h-[44px] bg-[#FF5C3A] text-white text-sm font-medium rounded-xl hover:bg-[#e04e30] disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
