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
  const [pricing, setPricing] = useState({ 
    landingPrice: 650000, 
    landingOriginalPrice: 900000, 
    trm: 3900,
    basicPrice: 150000,
    proPrice: 250000
  });
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'paypal'>('wompi');
  
  // Estado para usuarios que necesitan comprar un plan junto con la landing
  const hasActivePlan = brand?.plan === 'BASIC' || brand?.plan === 'PRO';
  const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'PRO'>(brand?.plan === 'PRO' ? 'PRO' : 'BASIC');
  const [includePlan, setIncludePlan] = useState(!hasActivePlan);

  useEffect(() => {
    // Cargar precios dinámicos
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment-settings/public`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?select=id,data`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }).then(r => r.json())
    ]).then(([paySettings, pricingRows]) => {
      const basic = pricingRows.find((r: any) => r.id === 'basic')?.data?.precio_mensual_cop;
      const pro = pricingRows.find((r: any) => r.id === 'pro')?.data?.precio_mensual_cop;
      
      setPricing(prev => ({
        ...prev,
        landingPrice: paySettings.landingPrice || prev.landingPrice,
        landingOriginalPrice: paySettings.landingOriginalPrice || prev.landingOriginalPrice,
        trm: paySettings.trm || prev.trm,
        basicPrice: basic || prev.basicPrice,
        proPrice: pro || prev.proPrice
      }));
    }).catch(() => {});
  }, []);

  const planPrice = selectedPlan === 'PRO' ? pricing.proPrice : pricing.basicPrice;
  const totalPrice = pricing.landingPrice + (includePlan ? planPrice : 0);

  const handlePagar = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('brandToken');
      const planToActivate = includePlan ? selectedPlan : 'LANDING_ONLY';
      
      // La referencia ahora incluirá si es un combo
      const endpoint = paymentMethod === 'paypal' ? 'paypal' : 'wompi';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/${endpoint}/checkout-url?amount=${totalPrice}&plan=${planToActivate}&months=1&includes_landing=true&trm=${pricing.trm}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error al conectar con ${endpoint}`);
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Encabezado */}
      <div>
        <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          Activar Mini-landing
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {includePlan ? 'Selecciona tu plan y activa tu página profesional' : 'Personaliza tu probador virtual con branding propio'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECCIÓN OBLIGATORIA: Selección de Plan (Solo para Trial/Inactivos) */}
          {!hasActivePlan && (
            <div className="p-6 rounded-3xl border space-y-4" style={{ backgroundColor: 'rgba(255,92,58,0.03)', borderColor: 'rgba(255,92,58,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <IconAlert />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Paso 1: Elige un Plan de Suscripción</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">La mini-landing requiere un plan activo para funcionar.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'BASIC', name: 'Plan Básico', price: pricing.basicPrice, desc: 'Hasta 5 productos' },
                  { id: 'PRO', name: 'Plan Pro', price: pricing.proPrice, desc: 'Hasta 15 productos' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id as any)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${selectedPlan === p.id ? 'border-[#FF5C3A] bg-[#FF5C3A]/5' : 'border-gray-800 bg-black/20'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPlan === p.id ? 'border-[#FF5C3A]' : 'border-gray-600'}`}>
                        {selectedPlan === p.id && <div className="w-2 h-2 rounded-full bg-[#FF5C3A]" />}
                      </div>
                    </div>
                    <p className="text-lg font-black" style={{ color: '#FF5C3A' }}>{formatCurrency(p.price)}<span className="text-[10px] font-normal text-gray-500">/mes</span></p>
                    <p className="text-[10px] text-gray-500 mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN: Detalles de la Landing */}
          <div className="p-6 rounded-3xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{hasActivePlan ? '¿Qué incluye la Mini-landing?' : 'Paso 2: Beneficios de tu nueva página'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'URL propia personalizada',
                'Branding con tu logo y colores',
                'Compatible con Ads e Instagram',
                'Catálogo IA ilimitado (según plan)',
                'Sin publicidad de Lookitry',
                'Optimización móvil premium'
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <IconCheck />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN: Método de Pago */}
          <div className="p-6 rounded-3xl border space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Paso {hasActivePlan ? '2' : '3'}: Método de pago</h3>
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
            className="w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: paymentMethod === 'wompi' ? '#FF5C3A' : '#0070ba' }}
          >
            {loading ? <Spinner size="sm" /> : (
              paymentMethod === 'wompi' 
                ? `Pagar ${formatCurrency(totalPrice)} COP con Wompi`
                : `Pagar USD $${Math.ceil(totalPrice / pricing.trm)} con PayPal`
            )}
          </button>
        </div>

        {/* COLUMNA DERECHA: Resumen de Compra */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-sm border-b pb-3" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>Resumen</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Mini-landing (Pago único)</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(pricing.landingPrice)}</span>
              </div>
              
              {includePlan && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedPlan === 'PRO' ? 'Plan Pro' : 'Plan Básico'} (1 mes)</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(planPrice)}</span>
                </div>
              )}
              
              <div className="flex justify-between pt-3 border-t text-base font-black" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total</span>
                <span style={{ color: '#FF5C3A' }}>{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <div className="pt-4">
              <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 flex items-start gap-2">
                <IconCheck />
                <p className="text-[10px] text-gray-400">Activación inmediata tras confirmar el pago.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border flex items-start gap-3" style={{ borderColor: 'var(--border-color)' }}>
            <svg className="w-5 h-5 text-[#FF5C3A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              Al adquirir la mini-landing, aceptas que su funcionamiento depende de mantener una suscripción activa a Lookitry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
