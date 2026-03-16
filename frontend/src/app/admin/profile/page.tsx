'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

function getToken() {
  return localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
}

export default function AdminProfilePage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/admins/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cambiar contraseña');
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-input, var(--bg-hover))',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,92,58,0.1)' }}
            >
              <KeyRound className="w-5 h-5" style={{ color: '#FF5C3A' }} />
            </div>
            <div>
              <h1 className="font-syne font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Cambiar contraseña
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Actualiza la contraseña de tu cuenta de administrador
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Contraseña actual */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={show.current ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                required
                placeholder="Tu contraseña actual"
                className="w-full px-3 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A] transition-colors"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShow(s => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={show.next ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                required
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A] transition-colors"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShow(s => ({ ...s, next: !s.next }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {show.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Indicador de fortaleza */}
            {form.newPassword.length > 0 && (
              <div className="mt-1.5 flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-colors"
                    style={{
                      background: form.newPassword.length >= i * 3
                        ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#10b981'
                        : 'var(--border-color)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <input
                type={show.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
                placeholder="Repite la nueva contraseña"
                className="w-full px-3 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40 focus:border-[#FF5C3A] transition-colors"
                style={{
                  ...inputStyle,
                  borderColor: form.confirmPassword && form.confirmPassword !== form.newPassword
                    ? '#ef4444'
                    : 'var(--border-color)',
                }}
              />
              <button
                type="button"
                onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword && form.confirmPassword !== form.newPassword && (
              <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 rounded-xl text-sm text-red-600 bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          {/* Éxito */}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Contraseña actualizada exitosamente
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 min-h-[44px] rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ background: '#FF5C3A' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
