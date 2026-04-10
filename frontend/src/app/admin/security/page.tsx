'use client';

import { useEffect, useState, useCallback } from 'react';
import { Shield, Check, AlertTriangle, Lock, Key, Users } from 'lucide-react';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { adminApi } from '@/services/adminApi';
import { motion } from 'framer-motion';

interface PaymentSettings {
  bypass_ip_protection: boolean;
  ip_whitelist: string;
  maintenance_mode: boolean;
  maintenance_message: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  created_at: string;
}

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onChange} disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 flex-shrink-0 ${value ? 'bg-[var(--accent)]' : 'bg-gray-500'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function Section({ title, icon, children, danger }: { title: string; icon: React.ReactNode; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: danger ? 'rgba(239,68,68,0.3)' : 'var(--border-color)' }}>
      <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,92,58,0.1)', color: danger ? '#ef4444' : 'var(--accent)' }}>
          {icon}
        </div>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function AdminSecurityPage() {
  const [bypassIp, setBypassIp] = useState(false);
  const [savingBypass, setSavingBypass] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [savingWhitelist, setSavingWhitelist] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const confirm = useConfirm();

  const loadSettings = useCallback(async () => {
    try {
      const data = await adminApi.get('/admin/payment-settings');
      if (!data.error) {
        setBypassIp(data.bypass_ip_protection ?? false);
        setIpWhitelist(data.ip_whitelist ?? '');
        setMaintenanceMode(data.maintenance_mode ?? false);
        setMaintenanceMessage(data.maintenance_message ?? '');
      }
    } catch { /* silencioso */ }
  }, []);

  const loadAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const data = await adminApi.get('/admin/admins');
      setAdmins(data.admins || []);
    } catch { setError('Error al cargar administradores'); }
    finally { setLoadingAdmins(false); }
  }, []);

  useEffect(() => {
    loadSettings();
    loadAdmins();
  }, []);

  function flash(msg: string, type: 'ok' | 'err') {
    if (type === 'ok') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  }

  async function handleToggleBypass() {
    const newVal = !bypassIp;
    const ok = await confirm({
      title: newVal ? 'Activar bypass IP' : 'Desactivar bypass IP',
      message: newVal
        ? 'Se omitirá la verificación de IP para TODOS los registros de prueba.'
        : 'Se restaurará la verificación de IP en producción.',
      confirmLabel: newVal ? 'Activar bypass' : 'Desactivar bypass',
      danger: newVal,
      reason: newVal
        ? 'Cualquier IP podrá registrar cuentas de prueba sin verificación.'
        : 'Se restaura la protección de IP.',
    });
    if (!ok) return;
    setSavingBypass(true);
    try {
      const data = await adminApi.put('/admin/payment-settings', { bypass_ip_protection: newVal });
      if (data.error) throw new Error(data.message || 'Error');
      setBypassIp(newVal);
      flash(newVal ? 'Bypass IP activado — modo test' : 'Bypass IP desactivado', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingBypass(false); }
  }

  async function handleSaveWhitelist() {
    setSavingWhitelist(true);
    try {
      const data = await adminApi.put('/admin/payment-settings', { ip_whitelist: ipWhitelist });
      if (data.error) throw new Error(data.message || 'Error');
      flash('Whitelist de IPs guardada', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingWhitelist(false); }
  }

  async function handleToggleMaintenance() {
    const newVal = !maintenanceMode;
    const ok = await confirm({
      title: newVal ? 'Activar modo mantenimiento' : 'Desactivar modo mantenimiento',
      message: newVal
        ? 'TODOS los usuarios verán la página de mantenimiento. Solo los administradores podrán acceder.'
        : 'El sitio volverá a funcionar con normalidad para todos los usuarios.',
      confirmLabel: newVal ? 'Activar mantenimiento' : 'Desactivar',
      danger: newVal,
      reason: newVal
        ? 'Esto afecta la disponibilidad del servicio para todos los usuarios activos.'
        : 'El sitio se restaurará inmediatamente.',
    });
    if (!ok) return;
    setSavingMaintenance(true);
    try {
      const data = await adminApi.put('/admin/payment-settings', { 
        maintenance_mode: newVal, 
        maintenance_message: maintenanceMessage 
      });
      if (data.error) throw new Error(data.message || 'Error');
      setMaintenanceMode(newVal);
      flash(newVal ? 'Modo mantenimiento ACTIVADO' : 'Modo mantenimiento desactivado', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingMaintenance(false); }
  }

  async function handleSaveMaintenanceMessage() {
    setSavingMaintenance(true);
    try {
      const data = await adminApi.put('/admin/payment-settings', { 
        maintenance_mode: maintenanceMode, 
        maintenance_message: maintenanceMessage 
      });
      if (data.error) throw new Error(data.message || 'Error');
      flash('Mensaje de mantenimiento guardado', 'ok');
    } catch (err: any) { flash(err.message, 'err'); }
    finally { setSavingMaintenance(false); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-6">
      <div>
        <h1 className="font-jakarta font-bold tracking-tight text-2xl" style={{ color: 'var(--text-primary)' }}>Seguridad</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Protección IP, whitelist, mantenimiento y administradores</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>{error}</div>}
      {success && <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>{success}</div>}

      {bypassIp && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-400 font-medium">Bypass IP activado — la verificación de IP está deshabilitada para todos los registros de prueba</span>
        </div>
      )}

      {maintenanceMode && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <Lock className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-400 font-medium">MODO MANTENIMIENTO ACTIVO — Los usuarios ven la página de mantenimiento</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Protección de IP" icon={<Shield className="w-4 h-4" />}>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Bypass verificación de IP</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {bypassIp ? 'Activo — se omite la verificación de IP para todos los registros de prueba' : 'Inactivo — verificación de IP habilitada en producción'}
                </p>
              </div>
              <Toggle value={bypassIp} onChange={handleToggleBypass} disabled={savingBypass} />
            </div>

            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Whitelist de IPs</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                IPs que siempre pueden registrar cuentas de prueba. Separa con comas. Ej: <span className="font-mono">190.24.1.1, 181.55.2.3</span>
              </p>
              <div className="flex gap-2">
                <input type="text" value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)}
                  placeholder="190.24.1.1, 181.55.2.3"
                  className="flex-1 border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <button onClick={handleSaveWhitelist} disabled={savingWhitelist}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60 transition-colors">
                  {savingWhitelist ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-white" /> : <Check className="w-4 h-4" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Modo Mantenimiento" icon={<Lock className="w-4 h-4" />} danger={maintenanceMode}>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Activar mantenimiento</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {maintenanceMode ? 'ACTIVO — Los usuarios verán la página de mantenimiento' : 'Inactivo — El sitio funciona con normalidad'}
                </p>
              </div>
              <Toggle value={maintenanceMode} onChange={handleToggleMaintenance} disabled={savingMaintenance} />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Mensaje de mantenimiento</label>
              <textarea value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)} rows={3}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Explica qué está sucediendo a los usuarios..." />
              <div className="flex justify-end mt-2">
                <button onClick={handleSaveMaintenanceMessage} disabled={savingMaintenance}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[#e04e30] disabled:opacity-60 transition-colors">
                  {savingMaintenance ? 'Guardando...' : 'Guardar mensaje'}
                </button>
              </div>
            </div>
          </div>
        </Section>
      </div>

      <Section title="Administradores y permisos" icon={<Users className="w-4 h-4" />}>
        {loadingAdmins ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)' }} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Nombre', 'Email', 'Rol', 'Permisos', 'Creado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{admin.name}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{admin.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: admin.role === 'superadmin' ? 'rgba(255,92,58,0.15)' : 'rgba(107,114,128,0.15)', color: admin.role === 'superadmin' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {admin.permissions && admin.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions.map(p => (
                            <span key={p} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>{p}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--accent)' }}>Acceso total</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {new Date(admin.created_at).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Para crear, editar permisos o eliminar administradores, ve a <a href="/admin/admins" className="underline" style={{ color: 'var(--accent)' }}>Administradores</a>.
        </p>
      </Section>
    </motion.div>
  );
}
