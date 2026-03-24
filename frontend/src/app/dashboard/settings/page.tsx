'use client';

import { useState, useEffect } from 'react';
import { SettingsForm } from '@/components/dashboard/SettingsForm';
import { Spinner } from '@/components/ui/Spinner';
import { brandsService } from '@/services/brands.service';
import type { Brand, UpdateBrandConfigDto } from '@/types';

export default function SettingsPage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { loadBrand(); }, []);

  const loadBrand = async () => {
    try {
      setIsLoading(true);
      const data = await brandsService.getCurrentBrand();
      setBrand(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateBrandConfigDto) => {
    try {
      const updatedBrand = await brandsService.updateBrand(data);
      setBrand(updatedBrand);
      setSuccess('Configuración actualizada exitosamente');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
      window.dispatchEvent(new CustomEvent('onboarding:step-complete', { detail: { step: 2 } }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar configuración');
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!brand) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-jakarta font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          Configuración
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Personaliza la apariencia de tu probador virtual
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981] text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      <SettingsForm brand={brand} onSubmit={handleSubmit} />
    </div>
  );
}
