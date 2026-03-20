'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/currency';
import { Spinner } from '@/components/ui/Spinner';

function IconCheck() {
  return (
    <svg className="w-4 h-4 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg className="w-6 h-6 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export default function CheckoutLandingPage() {
  const router = useRouter();
  const { brand } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState({ landingPrice: 650000, landingOriginalPrice: 900000, trm: 3900 });
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'paypal'>('wompi');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment-settings/public`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPricing({ landingPrice: data.landingPrice, landingOriginalPrice: data.landingOriginalPrice, trm: data.trm || 3900 }); })
      .catch(() => {});
  }, []);

  const handlePagar = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
      
      if (paymentMethod === 'paypal') {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments/paypal/checkout-url?amount=${pricing.landingPrice}&plan=LANDING&includes_landing=true&trm=${pricing.trm}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al generar link de PayPal');
        window.location.href = data.checkoutUrl;
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/wompi/checkout-url?amount=${pricing.landingPrice}&plan=LANDING&includes_landing=true`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al conectar con Wompi');
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  // 1. Verificación de seguridad: No se puede tener landing sin un plan activo.
  const hasActivePlan = brand?.plan === 'BASIC' || brand?.plan === 'PRO';
  const isTrial = brand?.plan === 'TRIAL' || !brand?.plan;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          Activar Mini-landing
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Probador virtual público con tu propio link y branding profesional
        </p>
      </div>

      {!hasActivePlan ? (
        /* Caso: No tiene plan activo (Está en Trial o Expirado) */
        <div className="bg-[#ef4444]05 border border-[#ef4444]20 rounded-3xl p-8 text-center space-y-4" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="w-12 h-12 bg-[#ef4444]10 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconAlert />
          </div>
          <h2 className="font-syne font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            Requiere un Plan Activo
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Para tener una mini-landing pública, tu marca debe estar suscrita a un plan **Básico** o **Pro**. Actualmente tu cuenta se encuentra en modo **{isTrial ? 'Trial' : 'Inactivo'}**.
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard/checkout"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#FF5C3A] text-white font-bold rounded-2xl transition-all hover:scale-[1.02]"
            >
              Ver planes de suscripción
            </Link>
          </div>
          <button onClick={() => router.back()} className="block mx-auto text-xs" style={{ color: 'var(--text-muted)' }}>
            Volver atrás
          </button>
        </div>
      ) : (
        /* Caso: Tiene plan activo, puede comprar la landing */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>¿Qué incluye?</h3>
              <div className="space-y-4">
                {[
                  'URL propia (pruebalo.wilkiedevs.com/tumarca)',
                  'Branding con tu logo y colores',
                  'Compatible con Instagram y Facebook Ads',
                  'Optimizado para dispositivos móviles',
                  'Sin anuncios de terceros'
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <IconCheck />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selector de método de pago */}
            <div className="p-6 rounded-3xl border space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Elige tu método de pago</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMethod('wompi')}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${paymentMethod === 'wompi' ? 'border-[#FF5C3A] bg-[#FF5C3A]/5' : 'border-[#2a2a2a] bg-[#1a1a1a] opacity-60'}`}
                >
                  <img src="/wompi-logo.svg" alt="Wompi" className="h-6 w-auto invert brightness-200" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">Tarjetas / PSE</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${paymentMethod === 'paypal' ? 'border-[#0070ba] bg-[#0070ba]/5' : 'border-[#2a2a2a] bg-[#1a1a1a] opacity-60'}`}
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 w-auto" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">PayPal / USD</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-[#ef4444]10 border border-[#ef4444]20 text-[#ef4444] text-xs rounded-2xl">
                {error}
              </div>
            )}

            <button
              onClick={handlePagar}
              disabled={loading}
              className="w-full py-4 bg-[#FF5C3A] hover:opacity-90 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#FF5C3A]/20 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: paymentMethod === 'wompi' ? '#FF5C3A' : '#0070ba' }}
            >
              {loading ? <Spinner size="sm" /> : (
                paymentMethod === 'wompi' 
                  ? `Pagar ${formatCurrency(pricing.landingPrice)} COP con Wompi`
                  : `Pagar USD $${Math.ceil(pricing.landingPrice / pricing.trm)} con PayPal`
              )}
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-3xl border text-center space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>Pago Único</p>
              <div className="flex flex-col">
                <span className="text-sm line-through opacity-50" style={{ color: 'var(--text-muted)' }}>{formatCurrency(pricing.landingOriginalPrice)}</span>
                <span className="text-3xl font-syne font-extrabold text-[#FF5C3A]">{formatCurrency(pricing.landingPrice)}</span>
              </div>
              <p className="text-[10px] italic pt-2" style={{ color: 'var(--text-muted)' }}>Válido mientras tu suscripción esté activa</p>
            </div>

            <div className="p-4 rounded-2xl border flex items-start gap-3" style={{ borderColor: 'var(--border-color)' }}>
              <svg className="w-5 h-5 text-[#FF5C3A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Este es un pago único por el servicio de alojamiento y personalización de tu página.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
