'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/services/api';
import { authService } from '@/services/auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

// --- Icons ---
const IconCheck = () => (
  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const IconLock = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const IconArrowLeft = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const IconInfo = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconUser = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function TrialCheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'paypal'>('wompi');
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const [trm, setTrm] = useState(3900);

  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');

  useEffect(() => {

    // Cargar info de campaña y TRM
    Promise.all([
      api.get<any>('/trial/status'),
      fetch(`${API_URL}/api/payment-settings/public`).then(r => r.ok ? r.json() : null)
    ]).then(([trialRes, paySettings]) => {
      setCampaign(trialRes.data);
      if (paySettings?.trm) setTrm(paySettings.trm);
    }).catch(err => console.error('Error loading checkout data:', err));

    // Cargar moneda desde localStorage
    const savedCurrency = localStorage.getItem('currency') as 'COP' | 'USD';
    if (savedCurrency) {
      setCurrency(savedCurrency);
      if (savedCurrency === 'USD') setPaymentMethod('paypal');
    }

    const handleCurrencyChange = () => {
      const current = localStorage.getItem('currency') as 'COP' | 'USD';
      if (current) {
        setCurrency(current);
        if (current === 'USD') setPaymentMethod('paypal');
      }
    };
    window.addEventListener('currencyChange', handleCurrencyChange);
    return () => window.removeEventListener('currencyChange', handleCurrencyChange);
  }, []); // Sin router dependency para evitar redirecciones

  const priceCOP = campaign?.priceCOP ?? 20000;
  const trialDays = campaign?.trialDays ?? 7;
  const priceUSD = Math.ceil(priceCOP / trm);

  const formatPrice = (val: number) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(val);
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handlePagar = async () => {
    setLoading(true);
    setError('');

    try {
      if (!guestEmail || !guestEmail.includes('@')) {
        throw new Error('Por favor ingresa un correo electrónico válido');
      }
      if (!guestName || guestName.trim().length === 0) {
        throw new Error('Por favor ingresa el nombre de tu marca');
      }

      const body: any = { 
        method: paymentMethod,
        email: guestEmail,
        brandName: guestName
      };
      if (paymentMethod === 'paypal') body.trm = trm;

      // MARKETING: Siempre usamos el endpoint de invitado para este trial
      const res = await api.post<any>('/trial/initiate-guest', body);
      
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        throw new Error('No se pudo generar el enlace de pago');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar el pago');
      setLoading(false);
    }
  };

  const toggleCurrency = () => {
    const newCurrency = currency === 'COP' ? 'USD' : 'COP';
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
    window.dispatchEvent(new Event('currencyChange'));
    if (newCurrency === 'USD') setPaymentMethod('paypal');
    else setPaymentMethod('wompi');
  };


  return (
    <main className="min-h-screen bg-[#030303] text-white selection:bg-[#FF5C3A]/30">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl px-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
          <span className="font-syne font-extrabold text-base tracking-tight">
            Look<span className="text-[#FF5C3A]">itry</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {/* Currency Switcher */}
          <button
            onClick={toggleCurrency}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 transition-all text-[11px] font-bold"
          >
            <span className={currency === 'COP' ? 'text-[#FF5C3A]' : 'text-white/40'}>COP</span>
            <div className="w-px h-3 bg-white/10" />
            <span className={currency === 'USD' ? 'text-[#FF5C3A]' : 'text-white/40'}>USD</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/50">
            <IconLock />
            Pago 100% seguro
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 md:py-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white transition-colors mb-8 group"
        >
          <IconArrowLeft />
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          
          {/* Columna Info Plan */}
          <div className="space-y-6">
            <div>
              <h1 className="font-syne font-bold text-3xl md:text-4xl leading-tight mb-4">
                Activa tu <span className="text-[#FF5C3A]">Prueba Profesional</span>
              </h1>
              <p className="text-white/60 text-[15px] leading-relaxed max-w-md">
                Estás a un paso de revolucionar la experiencia de compra de tus clientes con Probador Virtual.
              </p>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#FF5C3A]/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-center justify-between mb-8">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF5C3A]">Acceso Ilimitado</span>
                <span className="bg-white/5 border border-white/10 text-[11px] px-3 py-1 rounded-full text-white/80 font-medium">
                  {trialDays} días
                </span>
              </div>

              <div className="space-y-4 mb-10">
                {[
                  '1 Producto activo en el catálogo',
                  '15 Generaciones con IA',
                  'Widget personalizable para tu sitio',
                  'Acceso a todas las funciones PRO'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <IconCheck />
                    <span className="text-[14px] text-white/80">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] text-white/40 uppercase font-bold tracking-tight">Total a pagar</span>
                  <span className="text-3xl font-syne font-extrabold text-white">
                    {formatPrice(currency === 'USD' ? priceUSD : priceCOP)}
                  </span>
                </div>
                {currency === 'USD' && (
                  <div className="text-right">
                    <span className="block text-[10px] text-white/30 leading-tight italic">TRM: {trm.toLocaleString('es-CO')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#FF5C3A]/5 border border-[#FF5C3A]/20 rounded-2xl p-4 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#FF5C3A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconInfo />
              </div>
              <p className="text-[12px] text-white/60 leading-relaxed">
                <strong className="text-white">Dato:</strong> Puedes cancelar en cualquier momento. Si decides seguir, tu inversión en la prueba se descontará de tu primer mes de suscripción.
              </p>
            </div>
          </div>

          {/* Columna Pago */}
          <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 md:p-10 sticky top-28">
            <h2 className="font-syne font-bold text-xl mb-6 flex items-center gap-2 text-white">
              <span className="w-1.5 h-6 bg-[#FF5C3A] rounded-full inline-block" />
              Tus Datos de Contacto
            </h2>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[12px] font-bold text-white/50 uppercase tracking-tight mb-2">Tu Email (donde recibirás el acceso)</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-[14px] text-white focus:outline-none focus:border-[#FF5C3A] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-white/50 uppercase tracking-tight mb-2">Nombre de tu Marca</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Mi Marca Increíble"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-[14px] text-white focus:outline-none focus:border-[#FF5C3A] transition-colors"
                  required
                />
              </div>
            </div>

            <h2 className="font-syne font-bold text-xl mb-6 flex items-center gap-2 text-white">
              <span className="w-1.5 h-6 bg-[#FF5C3A] rounded-full inline-block" />
              Método de Pago
            </h2>

            <div className="space-y-4 mb-8">
              <button
                onClick={() => { setPaymentMethod('wompi'); if (currency === 'USD') setCurrency('COP'); }}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                  paymentMethod === 'wompi' 
                    ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-[0_0_20px_rgba(255,92,58,0.1)]' 
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wompi' ? 'border-[#FF5C3A]' : 'border-white/20'}`}>
                    {paymentMethod === 'wompi' && <div className="w-2.5 h-2.5 rounded-full bg-[#FF5C3A]" />}
                  </div>
                  <div>
                    <span className="block font-bold text-[15px] text-white">Wompi</span>
                    <span className="text-[11px] text-white/40">Tarjetas, PSE, Nequi (Solo COP)</span>
                  </div>
                </div>
                <Image src="/wompi-logo.svg" alt="Wompi" width={60} height={20} className="object-contain opacity-70" />
              </button>

              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                  paymentMethod === 'paypal' 
                    ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-[0_0_20px_rgba(255,92,58,0.1)]' 
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'paypal' ? 'border-[#FF5C3A]' : 'border-white/20'}`}>
                    {paymentMethod === 'paypal' && <div className="w-2.5 h-2.5 rounded-full bg-[#FF5C3A]" />}
                  </div>
                  <div>
                    <span className="block font-bold text-[15px] text-white">PayPal</span>
                    <span className="text-[11px] text-white/40">Tarjetas globales o Saldo PHP</span>
                  </div>
                </div>
                <Image src="/payment-paypal.svg" alt="PayPal" width={60} height={20} className="object-contain opacity-70" />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-[13px] mb-6 flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={handlePagar}
              disabled={loading}
              className="w-full bg-[#FF5C3A] hover:bg-[#ff6c4d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-syne font-extrabold text-base py-5 rounded-2xl transition-all shadow-[0_4px_24px_rgba(255,92,58,0.3)] hover:shadow-[0_8px_32px_rgba(255,92,58,0.4)] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </div>
              ) : (
                `Pagar ${formatPrice(currency === 'USD' ? priceUSD : priceCOP)}`
              )}
            </button>

            <p className="text-center text-[11px] text-white/30 mt-6 leading-relaxed">
              Al activar la prueba profesional, aceptas nuestros{' '}
              <Link href="/terminos" className="underline hover:text-white transition-colors">Términos y Condiciones</Link>.
            </p>
          </div>

        </div>
      </div>
      
      {/* Footer minimal */}
      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-white/20 text-[11px] font-syne uppercase tracking-widest">
          Lookitry &copy; 2024 &bull; AI Try-On solutions
        </p>
      </footer>
    </main>
  );
}

