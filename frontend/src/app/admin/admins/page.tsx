'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus, Shield, ShieldOff, Mail, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '@/services/adminApi';

type Permission =
  | 'brands' | 'subscriptions' | 'revenue'
  | 'conversion' | 'health' | 'notifications'
  | 'settings' | 'admins';

const ALL_PERMISSIONS: { key: Permission; label: string; description: string }[] = [
  { key: 'brands',        label: 'Marcas',          description: 'Ver y gestionar marcas' },
  { key: 'subscriptions', label: 'Suscripciones',   description: 'Ver y gestionar suscripciones' },
  { key: 'revenue',       label: 'Ingresos',        description: 'Ver ingresos y pagos' },
  { key: 'conversion',    label: 'Conversiones',    description: 'Ver métricas de conversión y dashboard' },
  { key: 'health',        label: 'Sistema',         description: 'Ver estado del sistema' },
  { key: 'notifications', label: 'Notificaciones',  description: 'Ver notificaciones del panel' },
  { key: 'settings',      label: 'Configuración',   description: 'Configurar medios de pago' },
  { key: 'admins',        label: 'Admins',          description: 'Gestionar otros administradores' },
];

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Permission[];
  created_at: string;
}

function PermissionBadge({ perm }: { perm: Permission }) {
  const info = ALL_PERMISSIONS.find(p => p.key === perm);
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: 500,
      background: 'rgba(255,92,58,0.1)',
      color: '#FF5C3A',
    }}>
      {info?.label || perm}
    </span>
  );
}

// Toast simple
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      padding: '12px 20px', borderRadius: 12,
      background: type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      color: type === 'success' ? '#16a34a' : '#dc2626',
      fontSize: 14, fontWeight: 500,
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    }}>
      {message}
    </div>
  );
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sendCredentialsConfirm, setSendCredentialsConfirm] = useState<Admin | null>(null);
  const [passwordAdmin, setPasswordAdmin] = useState<Admin | null>(null);
  const [sendingCredentials, setSendingCredentials] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get('/admin/admins');
      if (data.error) throw new Error(data.message);
      setAdmins(data.admins);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    try {
      const d = await adminApi.delete(`/admin/admins/${id}`);
      if (d.error) throw new Error(d.message);
      setDeleteConfirm(null);
      load();
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const handleUpdatePermissions = async (id: string, permissions: Permission[]) => {
    try {
      const d = await adminApi.patch(`/admin/admins/${id}/permissions`, { permissions });
      if (d.error) throw new Error(d.message);
      setEditingAdmin(null);
      load();
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const handleSendCredentials = async (admin: Admin) => {
    setSendingCredentials(true);
    try {
      const data = await adminApi.post(`/admin/admins/${admin.id}/send-credentials`);
      if (data.error) throw new Error(data.message);
      setSendCredentialsConfirm(null);
      setToast({ message: `Credenciales enviadas a ${admin.email}`, type: 'success' });
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    } finally {
      setSendingCredentials(false);
    }
  };

  const handleChangePassword = async (adminId: string, newPassword: string) => {
    try {
      const data = await adminApi.put(`/admin/admins/${adminId}/password`, { newPassword });
      if (data.error) throw new Error(data.message);
      setPasswordAdmin(null);
      setToast({ message: 'Contraseña actualizada correctamente', type: 'success' });
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
      throw e;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', height: 256, justifyContent: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '4px solid rgba(255,92,58,0.2)',
          borderTopColor: '#FF5C3A',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="font-jakarta" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Administradores
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
            Gestiona los accesos al panel de administración
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', minHeight: 44,
            background: '#FF5C3A', color: '#fff',
            fontSize: 14, fontWeight: 600,
            border: 'none', borderRadius: 12, cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Nuevo admin
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          color: '#ef4444', padding: '12px 16px', borderRadius: 12, fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Tabla */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16,
        border: '1px solid var(--border-color)', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Permisos</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Creado</th>
              <th style={{ padding: '12px 24px' }} />
            </tr>
          </thead>
          <tbody>
            {admins.map((a, i) => (
              <tr
                key={a.id}
                style={{
                  borderTop: i > 0 ? '1px solid var(--border-color)' : undefined,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '16px 24px' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{a.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{a.email}</p>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {a.permissions && a.permissions.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {a.permissions.map(p => <PermissionBadge key={p} perm={p} />)}
                    </div>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 600,
                      color: '#FF5C3A', background: 'rgba(255,92,58,0.1)',
                      padding: '2px 10px', borderRadius: 9999,
                    }}>
                      <Shield style={{ width: 12, height: 12 }} /> Superadmin
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px 24px', fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(a.created_at).toLocaleDateString('es-CO')}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <ActionBtn title="Enviar credenciales" onClick={() => setSendCredentialsConfirm(a)} color="#FF5C3A">
                      <Mail style={{ width: 15, height: 15 }} />
                    </ActionBtn>
                    <ActionBtn title="Editar permisos" onClick={() => setEditingAdmin(a)} color="#FF5C3A">
                      <Shield style={{ width: 15, height: 15 }} />
                    </ActionBtn>
                    <ActionBtn title="Cambiar contraseña" onClick={() => setPasswordAdmin(a)} color="#FF5C3A">
                      <KeyRound style={{ width: 15, height: 15 }} />
                    </ActionBtn>
                    <ActionBtn title="Eliminar" onClick={() => setDeleteConfirm(a.id)} color="#ef4444">
                      <Trash2 style={{ width: 15, height: 15 }} />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  No hay administradores registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear admin */}
      {showCreate && <CreateAdminModal onClose={() => setShowCreate(false)} onCreated={load} />}

      {/* Modal editar permisos */}
      {editingAdmin && (
        <EditPermissionsModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSave={(perms) => handleUpdatePermissions(editingAdmin.id, perms)}
        />
      )}

      {passwordAdmin && (
        <ChangePasswordModal
          admin={passwordAdmin}
          onClose={() => setPasswordAdmin(null)}
          onSave={(newPassword) => handleChangePassword(passwordAdmin.id, newPassword)}
        />
      )}

      {/* Confirm delete */}
      {deleteConfirm && (
        <ConfirmModal
          title="Eliminar administrador"
          description="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          confirmDanger
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)}
        />
      )}

      {/* Confirm send credentials */}
      {sendCredentialsConfirm && (
        <ConfirmModal
          title="Enviar credenciales"
          description={`Esto solo debería usarse si ${sendCredentialsConfirm.email} perdió acceso al panel. Para cambios normales de contraseña usa la opción directa desde esta tabla.`}
          confirmLabel={sendingCredentials ? 'Enviando...' : 'Enviar credenciales'}
          confirmDanger={false}
          loading={sendingCredentials}
          onCancel={() => setSendCredentialsConfirm(null)}
          onConfirm={() => handleSendCredentials(sendCredentialsConfirm)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Botón de acción en tabla ──────────────────────────────────────────────────

function ActionBtn({ children, title, onClick, color }: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
        background: 'transparent', color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = color;
        e.currentTarget.style.background = `${color}18`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-muted)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

// ── Modal genérico de confirmación ───────────────────────────────────────────

function ConfirmModal({ title, description, confirmLabel, confirmDanger, loading, onCancel, onConfirm }: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmDanger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: 400, padding: 24 }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0', fontSize: 16 }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>{description}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 0', minHeight: 44, borderRadius: 12,
              border: '1px solid var(--border-color)', background: 'transparent',
              fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '10px 0', minHeight: 44, borderRadius: 12,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600, color: '#fff',
              background: confirmDanger ? '#ef4444' : '#FF5C3A',
              opacity: loading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading && <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ admin, onClose, onSave }: {
  admin: Admin;
  onClose: () => void;
  onSave: (newPassword: string) => Promise<void>;
}) {
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (form.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await onSave(form.newPassword);
    } catch {
      // el error visible ya se maneja en el padre/toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20, width: '100%', maxWidth: 520, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,92,58,0.1)', color: '#FF5C3A' }}>
            <KeyRound style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>Cambiar contraseña</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              {admin.name} · {admin.email}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Nueva contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={show.next ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl border px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40"
                style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={() => setShow((s) => ({ ...s, next: !s.next }))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                {show.next ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>Confirmar contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={show.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repite la nueva contraseña"
                className="w-full rounded-xl border px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5C3A]/40"
                style={{ background: 'var(--bg-hover)', borderColor: form.confirmPassword && form.confirmPassword !== form.newPassword ? '#ef4444' : 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                {show.confirm ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          <div style={{ background: 'rgba(255,92,58,0.08)', border: '1px solid rgba(255,92,58,0.18)', color: 'var(--text-secondary)', borderRadius: 12, padding: '10px 12px', fontSize: 12 }}>
            Este cambio actualiza la contraseña directamente desde el panel. El envío por correo queda solo para recuperación de acceso.
          </div>

          {error && (
            <div style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: 12, padding: '10px 12px', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, minHeight: 44, borderRadius: 12, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, minHeight: 44, borderRadius: 12, border: 'none', background: '#FF5C3A', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.65 : 1 }}>
            {loading ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal crear admin ─────────────────────────────────────────────────────────

function CreateAdminModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const togglePerm = (p: Permission) => {
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.name) { setError('Todos los campos son requeridos'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.post('/admin/admins', { ...form, permissions: isSuperadmin ? [] : permissions });
      if (data.error) throw new Error(data.message);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', boxSizing: 'border-box',
    border: '1px solid var(--border-color)', borderRadius: 10,
    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
    fontSize: 14, outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: 4,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: 520, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #FF5C3A, #e04e30)', padding: '20px 24px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>Nuevo administrador</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0 0' }}>Define sus datos y nivel de acceso</p>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <p style={{ fontSize: 13, color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 10, margin: 0 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                style={inputStyle} placeholder="Juan Pérez" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={inputStyle} placeholder="admin@ejemplo.com" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              style={inputStyle} placeholder="Mínimo 8 caracteres" />
          </div>

          {/* Nivel de acceso */}
          <div>
            <label style={labelStyle}>Nivel de acceso</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              {[
                { value: true, icon: <Shield style={{ width: 15, height: 15 }} />, label: 'Superadmin (acceso total)' },
                { value: false, icon: <ShieldOff style={{ width: 15, height: 15 }} />, label: 'Permisos personalizados' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setIsSuperadmin(opt.value)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 12px', minHeight: 44, borderRadius: 12, cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                    border: isSuperadmin === opt.value ? '2px solid #FF5C3A' : '2px solid var(--border-color)',
                    background: isSuperadmin === opt.value ? 'rgba(255,92,58,0.08)' : 'transparent',
                    color: isSuperadmin === opt.value ? '#FF5C3A' : 'var(--text-muted)',
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            {!isSuperadmin && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ALL_PERMISSIONS.map(p => (
                  <label
                    key={p.key}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: 10, borderRadius: 12, cursor: 'pointer',
                      border: permissions.includes(p.key) ? '1px solid rgba(255,92,58,0.4)' : '1px solid var(--border-color)',
                      background: permissions.includes(p.key) ? 'rgba(255,92,58,0.06)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(p.key)}
                      onChange={() => togglePerm(p.key)}
                      style={{ marginTop: 2, accentColor: '#FF5C3A' }}
                    />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{p.label}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{p.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '10px 0', minHeight: 44, borderRadius: 12,
                border: '1px solid var(--border-color)', background: 'transparent',
                fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 1, padding: '10px 0', minHeight: 44, borderRadius: 12,
                border: 'none', background: '#FF5C3A', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading && <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />}
              {loading ? 'Creando...' : 'Crear admin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal editar permisos ─────────────────────────────────────────────────────

function EditPermissionsModal({ admin, onClose, onSave }: {
  admin: Admin;
  onClose: () => void;
  onSave: (perms: Permission[]) => void;
}) {
  const [permissions, setPermissions] = useState<Permission[]>(admin.permissions || []);
  const [isSuperadmin, setIsSuperadmin] = useState(!admin.permissions || admin.permissions.length === 0);

  const togglePerm = (p: Permission) => {
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: 520, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Editar permisos — {admin.name}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{admin.email}</p>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { value: true, icon: <Shield style={{ width: 15, height: 15 }} />, label: 'Superadmin' },
              { value: false, icon: <ShieldOff style={{ width: 15, height: 15 }} />, label: 'Personalizado' },
            ].map(opt => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setIsSuperadmin(opt.value)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 12px', minHeight: 44, borderRadius: 12, cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                  border: isSuperadmin === opt.value ? '2px solid #FF5C3A' : '2px solid var(--border-color)',
                  background: isSuperadmin === opt.value ? 'rgba(255,92,58,0.08)' : 'transparent',
                  color: isSuperadmin === opt.value ? '#FF5C3A' : 'var(--text-muted)',
                }}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {!isSuperadmin && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ALL_PERMISSIONS.map(p => (
                <label
                  key={p.key}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: 10, borderRadius: 12, cursor: 'pointer',
                    border: permissions.includes(p.key) ? '1px solid rgba(255,92,58,0.4)' : '1px solid var(--border-color)',
                    background: permissions.includes(p.key) ? 'rgba(255,92,58,0.06)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(p.key)}
                    onChange={() => togglePerm(p.key)}
                    style={{ marginTop: 2, accentColor: '#FF5C3A' }}
                  />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{p.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{p.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '10px 0', minHeight: 44, borderRadius: 12,
                border: '1px solid var(--border-color)', background: 'transparent',
                fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(isSuperadmin ? [] : permissions)}
              style={{
                flex: 1, padding: '10px 0', minHeight: 44, borderRadius: 12,
                border: 'none', background: '#FF5C3A', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Guardar permisos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
