'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

interface PaymentSettings {
  wompi_enabled: boolean;
  wompi_public_key: string;
  wompi_private_key: string;
  wompi_events_secret: string;
  wompi_integrity_secret: string;
  wompi_test_mode: boolean;
  paypal_enabled: boolean;
  paypal_email: string;
  paypal_client_id: string;
  paypal_client_secret: string;
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
}

type Tab = 'wompi' | 'paypal' | 'manual' | 'transfer';

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
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cargar configuración');
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
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/payment-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar');
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
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (!settings) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error || 'No se pudo cargar la configuración'}</div>
  );

  const tabs: { id: Tab; label: string; enabled: boolean; icon: React.ReactNode }[] = [
    {
      id: 'wompi',
      label: 'Wompi',
      enabled: settings.wompi_enabled,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: 'paypal',
      label: 'PayPal',
      enabled: settings.paypal_enabled,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'manual',
      label: 'Pago Manual',
      enabled: settings.manual_enabled,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'transfer',
      label: 'Transferencia',
      enabled: settings.transfer_enabled,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medios de Pago</h1>
          <p className="text-gray-500 mt-1 text-sm">Configura los métodos de pago disponibles para tus clientes</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardado
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
            Guardar cambios
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Moneda global */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Moneda del sistema</label>
        <select
          value={settings.currency}
          onChange={e => set('currency', e.target.value)}
          className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="COP">COP — Peso colombiano</option>
          <option value="USD">USD — Dólar estadounidense</option>
          <option value="EUR">EUR — Euro</option>
          <option value="MXN">MXN — Peso mexicano</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`ml-1 w-2 h-2 rounded-full ${tab.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* WOMPI */}
          {activeTab === 'wompi' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">Wompi (Colombia)</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Pasarela de pagos para Colombia. Acepta tarjetas, PSE, Nequi y más.</p>
                </div>
                <Toggle enabled={settings.wompi_enabled} onChange={v => set('wompi_enabled', v)} />
              </div>

              {settings.wompi_enabled && (
                <>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-amber-800">
                      Modo {settings.wompi_test_mode ? 'prueba (sandbox)' : 'producción'} activo.
                      {settings.wompi_test_mode ? ' Los pagos no son reales.' : ' Los pagos son reales.'}
                    </p>
                    <label className="ml-auto flex items-center gap-2 text-sm text-amber-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!settings.wompi_test_mode}
                        onChange={e => set('wompi_test_mode', !e.target.checked)}
                        className="rounded"
                      />
                      Producción
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Llave pública" value={settings.wompi_public_key} onChange={v => set('wompi_public_key', v)} placeholder="pub_test_..." />
                    <SecretField label="Llave privada" fieldKey="wompi_private" value={settings.wompi_private_key} onChange={v => set('wompi_private_key', v)} show={showSecrets['wompi_private']} onToggle={() => toggleSecret('wompi_private')} placeholder="prv_test_..." />
                    <SecretField label="Events secret" fieldKey="wompi_events" value={settings.wompi_events_secret} onChange={v => set('wompi_events_secret', v)} show={showSecrets['wompi_events']} onToggle={() => toggleSecret('wompi_events')} placeholder="test_events_..." />
                    <SecretField label="Integrity secret" fieldKey="wompi_integrity" value={settings.wompi_integrity_secret} onChange={v => set('wompi_integrity_secret', v)} show={showSecrets['wompi_integrity']} onToggle={() => toggleSecret('wompi_integrity')} placeholder="test_integrity_..." />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    Obtén tus llaves en{' '}
                    <a href="https://comercios.wompi.co" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                      comercios.wompi.co
                    </a>
                  </div>
                </>
              )}
            </div>
          )}

          {/* PAYPAL */}
          {activeTab === 'paypal' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">PayPal</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Acepta pagos internacionales vía PayPal. Puedes usar solo el email o integración completa.</p>
                </div>
                <Toggle enabled={settings.paypal_enabled} onChange={v => set('paypal_enabled', v)} />
              </div>

              {settings.paypal_enabled && (
                <>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-amber-800">
                      Modo {settings.paypal_sandbox ? 'sandbox (prueba)' : 'producción'} activo.
                    </p>
                    <label className="ml-auto flex items-center gap-2 text-sm text-amber-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!settings.paypal_sandbox}
                        onChange={e => set('paypal_sandbox', !e.target.checked)}
                        className="rounded"
                      />
                      Producción
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Field
                      label="Email de PayPal"
                      value={settings.paypal_email}
                      onChange={v => set('paypal_email', v)}
                      placeholder="tu@email.com"
                      hint="Los clientes pueden enviarte pagos directamente a este email."
                      type="email"
                    />
                    <Field label="Client ID (opcional)" value={settings.paypal_client_id} onChange={v => set('paypal_client_id', v)} placeholder="AXxx..." hint="Solo necesario para integración avanzada con botón de PayPal." />
                    <SecretField label="Client Secret (opcional)" fieldKey="paypal_secret" value={settings.paypal_client_secret} onChange={v => set('paypal_client_secret', v)} show={showSecrets['paypal_secret']} onToggle={() => toggleSecret('paypal_secret')} placeholder="EXxx..." />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    Obtén tus credenciales en{' '}
                    <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                      developer.paypal.com
                    </a>
                  </div>
                </>
              )}
            </div>
          )}

          {/* PAGO MANUAL */}
          {activeTab === 'manual' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">Pago Manual</h3>
                  <p className="text-sm text-gray-500 mt-0.5">El cliente paga por fuera y envía el comprobante. Tú confirmas manualmente.</p>
                </div>
                <Toggle enabled={settings.manual_enabled} onChange={v => set('manual_enabled', v)} />
              </div>

              {settings.manual_enabled && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones para el cliente</label>
                    <textarea
                      value={settings.manual_instructions}
                      onChange={e => set('manual_instructions', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Realiza el pago y envía el comprobante..."
                    />
                  </div>
                  <Field label="WhatsApp de contacto" value={settings.manual_whatsapp} onChange={v => set('manual_whatsapp', v)} placeholder="+57 300 123 4567" hint="Número con código de país para enlace directo." />
                  <Field label="Email de contacto" value={settings.manual_email} onChange={v => set('manual_email', v)} placeholder="pagos@tuempresa.com" type="email" />
                  <Field label="Banco (opcional)" value={settings.manual_bank_name} onChange={v => set('manual_bank_name', v)} placeholder="Bancolombia" />
                  <Field label="Número de cuenta (opcional)" value={settings.manual_account_number} onChange={v => set('manual_account_number', v)} placeholder="123-456789-00" />
                  <Field label="Titular de la cuenta (opcional)" value={settings.manual_account_holder} onChange={v => set('manual_account_holder', v)} placeholder="Nombre del titular" />
                </div>
              )}
            </div>
          )}

          {/* TRANSFERENCIA */}
          {activeTab === 'transfer' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">Transferencia Bancaria</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Muestra los datos bancarios al cliente para que realice la transferencia.</p>
                </div>
                <Toggle enabled={settings.transfer_enabled} onChange={v => set('transfer_enabled', v)} />
              </div>

              {settings.transfer_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Banco" value={settings.transfer_bank_name} onChange={v => set('transfer_bank_name', v)} placeholder="Bancolombia" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cuenta</label>
                    <select
                      value={settings.transfer_account_type}
                      onChange={e => set('transfer_account_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
        </div>
      </div>

      {/* Resumen de métodos activos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Métodos activos</h3>
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <span
              key={tab.id}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                tab.enabled
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              {tab.label}
            </span>
          ))}
        </div>
        {!tabs.some(t => t.enabled) && (
          <p className="text-sm text-red-600 mt-2">
            Ningún método de pago está activo. Los clientes no podrán pagar.
          </p>
        )}
      </div>
    </div>
  );
}

// Componentes auxiliares

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
