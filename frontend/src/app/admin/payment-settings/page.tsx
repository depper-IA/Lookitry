'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

interface PaymentSettings {
  wompi_enabled: boolean;
  wompi_public_key: string;
  wompi_private_key: string;
  wompi_events_secret: string;
  wompi_integrity_secret: string;
  wompi_test_mode: boolean;
  // Wompi producción
  wompi_prod_public_key: string;
  wompi_prod_private_key: string;
  wompi_prod_events_secret: string;
  wompi_prod_integrity_secret: string;
  paypal_enabled: boolean;
  paypal_email: string;
  paypal_client_id: string;
  paypal_client_secret: string;
  paypal_prod_client_id: string;
  paypal_prod_client_secret: string;
  paypal_sandbox: boolean;
  manual_enabled: boolean;
  manual_instructions: string;
  manual_bank_name: string;
  manual_account_number: string;
  manual_account_holder: string;
  manual_whatsapp: string;
  manual_email: string;
  transfer_enabled: boolean;
  transfer_bank_name: string;
  transfer_account_number: string;
  transfer_account_type: string;
  transfer_account_holder: string;
  transfer_nit: string;
  currency: string;
  // Analytics
  ga_measurement_id: string;
}

type Tab = 'wompi' | 'paypal' | 'manual' | 'transfer' | 'analytics';

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('wompi');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsRes = await fetch(`${API_URL}/api/admin/payment-settings`, { credentials: 'include' });

      const data = await settingsRes.json();
      if (!settingsRes.ok) throw new Error(data.message || 'Error al cargar configuración');
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    try {
      const settingsRes = await fetch(`${API_URL}/api/admin/payment-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await settingsRes.json();
      if (!settingsRes.ok) throw new Error(data.message || 'Error al guardar');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof PaymentSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin" />
    </div>
  );

  if (!settings) return (
    <div style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: 'rgb(239,68,68)' }} className="border px-4 py-3 rounded-xl text-sm">
      {error || 'No se pudo cargar la configuración'}
    </div>
  );

  const tabs: { id: Tab; label: string; enabled: boolean; icon: React.ReactNode }[] = [
    {
      id: 'wompi', label: 'Wompi', enabled: settings.wompi_enabled,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    },
    {
      id: 'paypal', label: 'PayPal', enabled: settings.paypal_enabled,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
    },
    {
      id: 'manual', label: 'Pago Manual', enabled: settings.manual_enabled,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
    {
      id: 'transfer', label: 'Transferencia', enabled: settings.transfer_enabled,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    },
    {
      id: 'analytics', label: 'Analytics', enabled: true,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="space-y-6 max-w-4xl w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-jakarta font-bold tracking-tight">Medios de pago</h1>
          <p style={{ color: 'var(--text-muted)' }} className="mt-1 text-sm">Configura los métodos de pago disponibles para tus clientes</p>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Guardado
            </span>
          )}
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ scale: saving ? 1 : 1.02 }}
            whileTap={{ scale: saving ? 1 : 0.98 }}
            className="relative overflow-hidden flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 text-white rounded-2xl disabled:opacity-50 font-black uppercase tracking-widest shadow-lg shadow-[var(--accent)]/20"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Guardando...
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  Guardar cambios
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: 'rgb(239,68,68)' }} className="border px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Tabs de métodos de pago */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] shadow-sm border overflow-hidden">
        <div style={{ borderColor: 'var(--border-color)' }} className="flex overflow-x-auto border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={activeTab === tab.id ? { color: 'var(--accent)' } : { color: 'var(--text-muted)' }}
              className={`flex shrink-0 items-center gap-2 px-4 py-4 sm:px-6 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id ? 'border-[var(--accent)]' : 'border-transparent hover:opacity-80'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`ml-1 w-2 h-2 rounded-full ${tab.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* WOMPI */}
          {activeTab === 'wompi' && (
            <div className="space-y-6">
              {/* Header con toggle habilitado */}
              <div style={{ borderColor: 'var(--border-color)' }} className="flex flex-col gap-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold">Wompi (Colombia)</h3>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-0.5">Pasarela de pagos para Colombia. Acepta tarjetas, PSE, Nequi y más.</p>
                </div>
                <Toggle enabled={settings.wompi_enabled} onChange={v => set('wompi_enabled', v)} />
              </div>

              {settings.wompi_enabled && (
                <>
                  {/* Selector de modo activo */}
                  <div className="flex flex-col gap-3 p-4 rounded-xl border sm:flex-row sm:items-center" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-input)' }}>
                    <div className="flex-1">
                      <p style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">Modo activo</p>
                      <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
                        {settings.wompi_test_mode
                          ? 'Sandbox — los pagos no son reales. Usa para pruebas.'
                          : 'Producción — los pagos son reales y se cobran.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
                      <button
                        onClick={() => set('wompi_test_mode', true)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                        style={settings.wompi_test_mode
                          ? { background: 'var(--accent)', color: '#fff' }
                          : { color: 'var(--text-muted)' }}
                      >
                        Sandbox
                      </button>
                      <button
                        onClick={() => set('wompi_test_mode', false)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                        style={!settings.wompi_test_mode
                          ? { background: '#22c55e', color: '#fff' }
                          : { color: 'var(--text-muted)' }}
                      >
                        Producción
                      </button>
                    </div>
                  </div>

                  {/* Bloque Sandbox */}
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)', background: settings.wompi_test_mode ? 'rgba(255,92,58,0.08)' : 'var(--bg-input)' }}>
                      <span className={`w-2 h-2 rounded-full ${settings.wompi_test_mode ? 'bg-[var(--accent)]' : 'bg-gray-400'}`} />
                      <span className="text-sm font-medium" style={{ color: settings.wompi_test_mode ? 'var(--accent)' : 'var(--text-muted)' }}>
                        Llaves Sandbox (pruebas)
                      </span>
                      {settings.wompi_test_mode && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                          Activo
                        </span>
                      )}
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-4">
                      <Field label="Llave pública sandbox" value={settings.wompi_public_key} onChange={v => set('wompi_public_key', v)} placeholder="pub_test_..." />
                      <SecretField label="Llave privada sandbox" fieldKey="wompi_private" value={settings.wompi_private_key} onChange={v => set('wompi_private_key', v)} show={showSecrets['wompi_private']} onToggle={() => toggleSecret('wompi_private')} placeholder="prv_test_..." />
                      <SecretField label="Events secret sandbox" fieldKey="wompi_events" value={settings.wompi_events_secret} onChange={v => set('wompi_events_secret', v)} show={showSecrets['wompi_events']} onToggle={() => toggleSecret('wompi_events')} placeholder="test_events_..." />
                      <SecretField label="Integrity secret sandbox" fieldKey="wompi_integrity" value={settings.wompi_integrity_secret} onChange={v => set('wompi_integrity_secret', v)} show={showSecrets['wompi_integrity']} onToggle={() => toggleSecret('wompi_integrity')} placeholder="test_integrity_..." />
                    </div>
                  </div>

                  {/* Bloque Producción */}
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)', background: !settings.wompi_test_mode ? 'rgba(34,197,94,0.08)' : 'var(--bg-input)' }}>
                      <span className={`w-2 h-2 rounded-full ${!settings.wompi_test_mode ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm font-medium" style={{ color: !settings.wompi_test_mode ? '#22c55e' : 'var(--text-muted)' }}>
                        Llaves Producción (pagos reales)
                      </span>
                      {!settings.wompi_test_mode && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                          Activo
                        </span>
                      )}
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-4">
                      <Field label="Llave pública producción" value={settings.wompi_prod_public_key} onChange={v => set('wompi_prod_public_key', v)} placeholder="pub_prod_..." />
                      <SecretField label="Llave privada producción" fieldKey="wompi_prod_private" value={settings.wompi_prod_private_key} onChange={v => set('wompi_prod_private_key', v)} show={showSecrets['wompi_prod_private']} onToggle={() => toggleSecret('wompi_prod_private')} placeholder="prv_prod_..." />
                      <SecretField label="Events secret producción" fieldKey="wompi_prod_events" value={settings.wompi_prod_events_secret} onChange={v => set('wompi_prod_events_secret', v)} show={showSecrets['wompi_prod_events']} onToggle={() => toggleSecret('wompi_prod_events')} placeholder="prod_events_..." />
                      <SecretField label="Integrity secret producción" fieldKey="wompi_prod_integrity" value={settings.wompi_prod_integrity_secret} onChange={v => set('wompi_prod_integrity_secret', v)} show={showSecrets['wompi_prod_integrity']} onToggle={() => toggleSecret('wompi_prod_integrity')} placeholder="prod_integrity_..." />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400">
                    Obtén tus llaves en{' '}
                    <a href="https://comercios.wompi.co" target="_blank" rel="noopener noreferrer" className="underline font-medium">comercios.wompi.co</a>
                  </div>
                </>
              )}
            </div>
          )}

          {/* PAYPAL */}
          {activeTab === 'paypal' && (
            <div className="space-y-6">
              <div style={{ borderColor: 'var(--border-color)' }} className="flex flex-col gap-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold">PayPal</h3>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-0.5">Acepta pagos internacionales vía PayPal.</p>
                </div>
                <Toggle enabled={settings.paypal_enabled} onChange={v => set('paypal_enabled', v)} />
              </div>

              {settings.paypal_enabled && (
                <>
                  {/* Selector de modo activo */}
                  <div className="flex flex-col gap-3 p-4 rounded-xl border sm:flex-row sm:items-center" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-input)' }}>
                    <div className="flex-1">
                      <p style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">Modo activo</p>
                      <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">
                        {settings.paypal_sandbox
                          ? 'Sandbox — los pagos son simulados para pruebas.'
                          : 'Producción — los pagos son reales a través de PayPal.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
                      <button
                        onClick={() => set('paypal_sandbox', true)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                        style={settings.paypal_sandbox
                          ? { background: '#f59e0b', color: '#fff' }
                          : { color: 'var(--text-muted)' }}
                      >
                        Sandbox
                      </button>
                      <button
                        onClick={() => set('paypal_sandbox', false)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                        style={!settings.paypal_sandbox
                          ? { background: '#22c55e', color: '#fff' }
                          : { color: 'var(--text-muted)' }}
                      >
                        Producción
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Email de cuenta PayPal" value={settings.paypal_email} onChange={v => set('paypal_email', v)} placeholder="tu@email.com" hint="Email donde recibirás las notificaciones de pago." type="email" />
                  </div>

                  {/* Bloque Sandbox */}
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)', background: settings.paypal_sandbox ? 'rgba(245,158,11,0.08)' : 'var(--bg-input)' }}>
                      <span className={`w-2 h-2 rounded-full ${settings.paypal_sandbox ? 'bg-amber-500' : 'bg-gray-400'}`} />
                      <span className="text-sm font-medium" style={{ color: settings.paypal_sandbox ? '#f59e0b' : 'var(--text-muted)' }}>
                        Credenciales Sandbox (pruebas)
                      </span>
                      {settings.paypal_sandbox && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Activo
                        </span>
                      )}
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-4">
                      <Field label="Client ID Sandbox" value={settings.paypal_client_id} onChange={v => set('paypal_client_id', v)} placeholder="AXxx..." />
                      <SecretField label="Client Secret Sandbox" fieldKey="paypal_secret" value={settings.paypal_client_secret} onChange={v => set('paypal_client_secret', v)} show={showSecrets['paypal_secret']} onToggle={() => toggleSecret('paypal_secret')} placeholder="EXxx..." />
                    </div>
                  </div>

                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)', background: !settings.paypal_sandbox ? 'rgba(34,197,94,0.08)' : 'var(--bg-input)' }}>
                      <span className={`w-2 h-2 rounded-full ${!settings.paypal_sandbox ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm font-medium" style={{ color: !settings.paypal_sandbox ? '#22c55e' : 'var(--text-muted)' }}>
                        Credenciales Producción (pagos reales)
                      </span>
                      {!settings.paypal_sandbox && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                          Activo
                        </span>
                      )}
                    </div>
                    <div className="p-4 grid grid-cols-1 gap-4">
                      <Field label="Client ID Producción" value={settings.paypal_prod_client_id} onChange={v => set('paypal_prod_client_id', v)} placeholder="AXxx..." />
                      <SecretField label="Client Secret Producción" fieldKey="paypal_prod_secret" value={settings.paypal_prod_client_secret} onChange={v => set('paypal_prod_client_secret', v)} show={showSecrets['paypal_prod_secret']} onToggle={() => toggleSecret('paypal_prod_secret')} placeholder="EXxx..." />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400">
                    Obtén tus credenciales en{' '}
                    <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">developer.paypal.com</a>
                  </div>
                </>
              )}
            </div>
          )}

          {/* PAGO MANUAL */}
          {activeTab === 'manual' && (
            <div className="space-y-5">
              <div style={{ borderColor: 'var(--border-color)' }} className="flex flex-col gap-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold">Pago Manual</h3>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-0.5">El cliente paga por fuera y envía el comprobante. Tú confirmas manualmente.</p>
                </div>
                <Toggle enabled={settings.manual_enabled} onChange={v => set('manual_enabled', v)} />
              </div>
              {settings.manual_enabled && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Instrucciones para el cliente</label>
                    <textarea
                      value={settings.manual_instructions}
                      onChange={e => set('manual_instructions', e.target.value)}
                      rows={3}
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Realiza el pago y envía el comprobante..."
                    />
                  </div>
                  <Field label="Banco (opcional)" value={settings.manual_bank_name} onChange={v => set('manual_bank_name', v)} placeholder="Bancolombia" />
                  <Field label="Número de cuenta (opcional)" value={settings.manual_account_number} onChange={v => set('manual_account_number', v)} placeholder="123-456789-00" />
                  <Field label="Titular de la cuenta (opcional)" value={settings.manual_account_holder} onChange={v => set('manual_account_holder', v)} placeholder="Nombre del titular" />
                </div>
              )}
            </div>
          )}

{/* TRANSFERENCIA */}
          {activeTab === 'transfer' && (
            <div className="space-y-6">
              <div style={{ borderColor: 'var(--border-color)' }} className="flex flex-col gap-4 pb-4 border-b sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold">Transferencia bancaria</h3>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-0.5">Recepcón de pagos por transferencia directa.</p>
                </div>
                <Toggle enabled={settings.transfer_enabled} onChange={v => set('transfer_enabled', v)} />
              </div>

              {settings.transfer_enabled && (
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Banco" value={settings.transfer_bank_name} onChange={v => set('transfer_bank_name', v)} placeholder="Bancolombia" />
                  <div>
                    <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">Tipo de cuenta</label>
                    <select
                      value={settings.transfer_account_type}
                      onChange={e => set('transfer_account_type', e.target.value)}
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  </div>
                  <Field label="Número de cuenta" value={settings.transfer_account_number} onChange={v => set('transfer_account_number', v)} placeholder="123-456789-00" />
                  <Field label="Titular" value={settings.transfer_account_holder} onChange={v => set('transfer_account_holder', v)} placeholder="Nombre o razón social" />
                  <Field label="NIT / Cédula" value={settings.transfer_nit} onChange={v => set('transfer_nit', v)} placeholder="900.123.456-7" />
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <div className="min-w-0">
                  <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold">Google Analytics 4</h3>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-0.5">Configura el tracking de Google Analytics para medir el tráfico y conversiones.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Field 
                  label="GA4 Measurement ID" 
                  value={settings.ga_measurement_id || ''} 
                  onChange={v => set('ga_measurement_id', v)} 
                  placeholder="G-XXXXXXXXXX"
                  hint="El ID de medición se encuentra en Google Analytics > Admin > Data Streams"
                  type="text"
                />
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-input)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">¿Cómo obtener tu Measurement ID?</p>
                    <ol style={{ color: 'var(--text-muted)' }} className="text-xs mt-2 list-decimal list-inside space-y-1">
                      <li>Ve a <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Analytics</a></li>
                      <li>Dirígete a <strong>Admin {'>'} Data Streams</strong></li>
                      <li>Selecciona tu property o crea una nueva</li>
                      <li>Copia el <strong>Measurement ID</strong> (formato G-XXXXXXX)</li>
                    </ol>
                  </div>
                </div>
              </div>

              {settings.ga_measurement_id ? (
                <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-emerald-500 font-medium">Analytics configurado correctamente</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm text-amber-500 font-medium">Analytics no está configurado</span>
                  </div>
                </div>
              )}
</div>
          )}
        </div>
      </div>

      {/* Resumen de métodos activos */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-[2rem] shadow-sm border p-5">
        <h3 style={{ color: 'var(--text-primary)' }} className="font-semibold mb-3">Métodos activos</h3>
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <span
              key={tab.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={tab.enabled
                ? { backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
                : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tab.enabled ? '#10b981' : 'var(--text-muted)' }} />
              {tab.label}
            </span>
          ))}
        </div>
        {!tabs.some(t => t.enabled) && (
          <p className="text-sm text-red-500 mt-2">Ningún método de pago está activo. Los clientes no podrán pagar.</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      onClick={() => onChange(!enabled)}
      whileTap={{ scale: 0.95 }}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
      style={{ backgroundColor: enabled ? 'var(--accent)' : 'var(--border-color)' }}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="h-4 w-4 rounded-full bg-white shadow"
      />
    </motion.button>
  );
}

function Field({
  label, value, onChange, placeholder, hint, type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <motion.label
        style={{ color: 'var(--text-secondary)' }}
        className="block text-sm font-medium mb-1"
        whileHover={{ color: '#FF5C3A' }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.label>
      <motion.input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        whileFocus={{ scale: 1.01, borderColor: "#FF5C3A" }}
        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm transition-all"
      />
      {hint && <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1">{hint}</p>}
    </div>
  );
}

function SecretField({
  label, fieldKey, value, onChange, show, onToggle, placeholder,
}: {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-medium mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ color: 'var(--text-muted)' }}
          className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-80"
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
