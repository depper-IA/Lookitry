'use client';

import { useState, useEffect } from 'react';
import { brandsService } from '@/services/brands.service';
import { Spinner } from '@/components/ui/Spinner';
import type { Brand } from '@/types';

export default function ProfilePage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para cambio de contraseña
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  // Estado para verificación de email
  const [verifySending, setVerifySending] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    if (!brand?.email) return;
    setVerifyError(null);
    setVerifySending(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/auth/resend-verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: brand.email }),
        }
      );
      if (!res.ok) throw new Error('Error al reenviar');
      setVerifySent(true);
    } catch {
      setVerifyError('No se pudo enviar el correo. Intenta de nuevo.');
    } finally {
      setVerifySending(false);
    }
  };

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (pwForm.newPassword.length < 6) {
      setPwError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Las contraseñas no coinciden');
      return;
    }

    setPwSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com'}/api/auth/change-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cambiar la contraseña');
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
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
              <div className="relative">
                <input
                  type="email"
                  value={brand?.email ?? ''}
                  disabled
                  style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                  className="w-full px-3 py-2 pr-28 min-h-[44px] border rounded-xl text-sm cursor-not-allowed"
                />
                {/* Badge de estado de verificación */}
                {brand?.emailVerified ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verificado
                  </span>
                ) : (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    Sin verificar
                  </span>
                )}
              </div>
              {/* Acción de reenvío si no está verificado */}
              {!brand?.emailVerified && (
                <div className="mt-2">
                  {verifySent ? (
                    <p className="flex items-center gap-1.5 text-[12px] text-emerald-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Correo enviado. Revisa tu bandeja de entrada.
                    </p>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        Verifica tu correo para usar las generaciones.
                      </p>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={verifySending}
                        className="text-[12px] text-[#FF5C3A] hover:text-[#e04e30] underline disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {verifySending ? 'Enviando...' : 'Reenviar correo'}
                      </button>
                    </div>
                  )}
                  {verifyError && (
                    <p className="text-[12px] text-[#ef4444] mt-1">{verifyError}</p>
                  )}
                </div>
              )}
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
              <span className="flex items-center gap-2 text-sm text-[#10b981]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cambios guardados
              </span>
            )}
            {error && (
              <span className="text-sm text-[#ef4444]">{error}</span>
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

      {/* Sección: Cambiar contraseña */}
      <form onSubmit={handlePasswordChange} style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border mt-6 divide-y">
        <div className="p-6 space-y-4">
          <h2 style={{ color: 'var(--text-muted)' }} className="text-xs font-semibold uppercase tracking-wide">
            Cambiar contraseña
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Contraseña actual */}
            <div className="sm:col-span-2">
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showPw.current ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Tu contraseña actual"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 pr-10 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none transition-colors" style={{ color: 'var(--text-muted)' }} tabIndex={-1}>
                  {showPw.current
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPw.new ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 pr-10 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none transition-colors" style={{ color: 'var(--text-muted)' }} tabIndex={-1}>
                  {showPw.new
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showPw.confirm ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repite la nueva contraseña"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  className="w-full px-3 py-2 pr-10 min-h-[44px] border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]"
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none transition-colors" style={{ color: 'var(--text-muted)' }} tabIndex={-1}>
                  {showPw.confirm
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <div>
            {pwSuccess && (
              <span className="flex items-center gap-2 text-sm text-[#10b981]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Contraseña actualizada
              </span>
            )}
            {pwError && <span className="text-sm text-[#ef4444]">{pwError}</span>}
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 px-5 py-2 min-h-[44px] bg-[#FF5C3A] text-white text-sm font-medium rounded-xl hover:bg-[#e04e30] disabled:opacity-50 transition-colors"
          >
            {pwSaving
              ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            }
            {pwSaving ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
