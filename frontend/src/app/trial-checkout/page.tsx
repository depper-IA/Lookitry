'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/services/api';
import { authService } from '@/services/auth.service';

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

export default function TrialCheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'paypal'>('wompi');
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Verificar sesión
    const token = authService.getToken();
    if (!token) {
      router.push('/login?redirect=/trial-checkout');
      return;
    }
    setHasSession(true);

    // Cargar info de campaña
    api.get<any>('/trial/status')
      .then(res => setCampaign(res.data))
      .catch(err => console.error('Error loading campaign:', err));
  }, [router]);

  const price = campaign?.priceCOP ?? 20000;
  const trialDays = campaign?.trialDays ?? 7;

  const formatCOP = (val: number) => {
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
      const res = await api.post<any>('/trial/initiate', { method: paymentMethod });
      
      if (res.data.skipPayment) {
        router.push('/dashboard');
        return;
      }

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

  if (!hasSession) return null;

  return (
    <main className="min-h-screen bg-[#030303] text-white selection:bg-[#FF5C3A]/30">
      {/* Nav */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Lookitry" width={28} height={28} className="object-contain h-7 w-auto" priority />
          <span className="font-syne font-extrabold text-base tracking-tight">
            Look<span className="text-[#FF5C3A]">itry</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 text-[12px] text-white/50">
          <IconLock />
          Pago 100% seguro
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white transition-colors mb-10 group"
        >
          <IconArrowLeft />
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Columna Info Plan */}
          <div className="space-y-8">
            <div>
              <h1 className="font-syne font-bold text-3xl md:text-4xl leading-tight mb-4">
                Activa tu <span className="text-[#FF5C3A]">Prueba Profesional</span>
              </h1>
              <p className="text-white/60 text-base leading-relaxed max-w-md">
                Estás a un paso de revolucionar la experiencia de compra de tus clientes con Probador Virtual.
              </p>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
              {/* Glow effect */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#FF5C3A]/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-center justify-between mb-8">
                <span className="text-[12px] font-bold uppercase tracking-widest text-[#FF5C3A]">Plan de Prueba</span>
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
                  <span className="text-[12px] text-white/40 uppercase font-bold tracking-tight">Total a pagar</span>
                  <span className="text-3xl font-syne font-extrabold text-[#FF5C3A]">
                    {formatCOP(price)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-white/30 leading-tight">Incluye todos<br/>los beneficios</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Pago */}
          <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 md:p-10 sticky top-28">
            <h2 className="font-syne font-bold text-xl mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#FF5C3A] rounded-full inline-block" />
              Método de Pago
            </h2>

            <div className="space-y-4 mb-8">
              <button
                onClick={() => setPaymentMethod('wompi')}
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
                    <span className="block font-bold text-[15px] text-white">Wompi (Colombia)</span>
                    <span className="text-[11px] text-white/40">Tarjetas, PSE, Nequi, Bancolombia</span>
                  </div>
                </div>
                <Image src="/img/wompi-logo.png" alt="Wompi" width={60} height={20} className="opacity-70 grayscale brightness-200" />
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
                    <span className="text-[11px] text-white/40">Tarjeta de crédito o saldo PayPal</span>
                  </div>
                </div>
                <Image src="/img/paypal-logo.png" alt="PayPal" width={60} height={20} className="opacity-70 grayscale brightness-200" />
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
                `Pagar ${formatCOP(price)}`
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
