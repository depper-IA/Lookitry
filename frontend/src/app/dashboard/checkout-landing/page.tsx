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
  const { brand, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState({ 
    landingPrice: 650000, 
    landingOriginalPrice: 900000, 
    trm: 3900,
    basicPrice: 150000,
    proPrice: 250000,
    discounts: { meses_1: 0, meses_3: 5, meses_6: 10, meses_12: 15 } as Record<string, number>
  });
  const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'paypal'>('wompi');
  
  // Normalizar el plan para comparación insensible a mayúsculas
  const brandPlan = brand?.plan?.toUpperCase() || '';
  const isTrial = !brandPlan || brandPlan === 'TRIAL';
  const hasActivePlan = brandPlan === 'BASIC' || brandPlan === 'PRO';
  
  // Derivamos si se incluye plan: obligatorio para Trial, prohibido para Activos
  // Si auth está cargando, asumimos false para no mostrar nada prematuramente
  const includePlan = !authLoading && isTrial;

  const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'PRO'>('BASIC');
  const [months, setMonths] = useState<number>(1);

  // Sincronizar selección inicial cuando carga la marca
  useEffect(() => {
    if (brandPlan === 'PRO') setSelectedPlan('PRO');
    else if (brandPlan === 'BASIC') setSelectedPlan('BASIC');
  }, [brandPlan]);

  // Cargar precios reales de Supabase
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?select=id,data`, {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        });
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const basic = rows.find(r => r.id === 'basic')?.data;
          const pro = rows.find(r => r.id === 'pro')?.data;
          const landing = rows.find(r => r.id === 'landing')?.data;
          const discounts = rows.find(r => r.id === 'descuentos_duracion')?.data;
          
          setPricing(prev => ({
            ...prev,
            basicPrice: basic?.precio_mensual_cop || prev.basicPrice,
            proPrice: pro?.precio_mensual_cop || prev.proPrice,
            landingPrice: landing?.precio || prev.landingPrice,
            landingOriginalPrice: landing?.precio_original || prev.landingOriginalPrice,
            discounts: discounts || prev.discounts
          }));
        }
      } catch (err) {
        console.error('Error fetching pricing:', err);
      }
    };
    fetchPricing();
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Cálculos dinámicos
  const basePlanPrice = selectedPlan === 'PRO' ? pricing.proPrice : pricing.basicPrice;
  const discountPct = pricing.discounts[`meses_${months}`] || 0;
  const planSubtotal = (basePlanPrice * months);
  const planDiscount = Math.round(planSubtotal * (discountPct / 100));
  const planTotal = planSubtotal - planDiscount;
  
  const totalPrice = pricing.landingPrice + (includePlan ? planTotal : 0);

  const handlePagar = async () => {
    setLoading(true);
    setError('');
    try {
      const planToSend = includePlan ? selectedPlan : 'NONE';
      const monthsToSend = includePlan ? months : 0;
      
      // CASO ESPECIAL: TOTAL 0 (Cupón 100% o Crédito total)
      if (totalPrice === 0) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/wompi/free-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            plan: planToSend,
            months: monthsToSend,
            includes_landing: true,
            reference: `FREE-${brand?.id}-${Date.now()}`
          })
        });
        
        const data = await res.json();
        if (data.success) {
          router.push(`/pago-exitoso?plan=${planToSend}&months=${monthsToSend}`);
          return;
        } else {
          throw new Error(data.error || 'Error en la activación gratuita');
        }
      }

      if (paymentMethod === 'wompi') {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/wompi/checkout-url?plan=${planToSend}&months=${monthsToSend}&includes_landing=true&amount=${totalPrice}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (data.checkoutUrl) window.location.href = data.checkoutUrl;
        else if (data.url) window.location.href = data.url;
        else throw new Error(data.error || 'Error al generar link de pago');
      } else {
        // PayPal real: backend convierte COP -> USD con TRM y devuelve checkout URL
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments/paypal/checkout-url?plan=${planToSend}&months=${monthsToSend}&includes_landing=true&amount=${totalPrice}&trm=${pricing.trm}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        const data = await res.json();
        if (data.checkoutUrl) window.location.href = data.checkoutUrl;
        else throw new Error(data.error || 'Error al generar link de PayPal');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          Activar Mini-landing
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {isTrial ? 'Selecciona tu suscripción y activa tu página profesional' : 'Añade tu propia mini-landing a tu plan activo'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECCIÓN 1: Selección de Plan (SOLO PARA TRIAL) */}
          {isTrial && (
            <div className="p-6 rounded-3xl border space-y-6" style={{ backgroundColor: 'rgba(255,92,58,0.03)', borderColor: 'rgba(255,92,58,0.2)' }}>
              <div className="flex items-center gap-2">
                <IconAlert />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Paso 1: Elige tu Plan</h3>
              </div>
              
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

              {/* Selector de Meses */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Duración de la suscripción</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map(m => {
                    const discount = pricing.discounts[`meses_${m}`] || 0;
                    return (
                      <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`py-3 px-2 rounded-xl border-2 text-center transition-all ${months === m ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 text-white' : 'border-gray-800 bg-black/20 text-gray-500'}`}
                      >
                        <p className="text-sm font-bold">{m} {m === 1 ? 'Mes' : 'Meses'}</p>
                        {discount > 0 && <p className="text-[9px] font-black text-emerald-500">-{discount}% OFF</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 2: Detalles Landing */}
          <div className="p-6 rounded-3xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{isTrial ? 'Paso 2: Beneficios de tu Mini-landing' : 'Beneficios de tu Mini-landing'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'URL propia personalizada',
                'Branding con tu logo y colores',
                'Compatible con Ads e Instagram',
                'Catálogo IA ilimitado',
                'Sin publicidad externa',
                'Optimización móvil premium'
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <IconCheck />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 3: Pago */}
          <div className="p-6 rounded-3xl border space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Paso {isTrial ? '3' : '2'}: Método de pago</h3>
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

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-2xl">{error}</div>}

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

        {/* RESUMEN */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-sm border-b pb-3" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>Resumen</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Mini-landing (Pago único)</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(pricing.landingPrice)}</span>
              </div>
              
              {includePlan && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedPlan === 'PRO' ? 'Plan Pro' : 'Plan Básico'} ({months} {months === 1 ? 'Mes' : 'Meses'})</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(planSubtotal)}</span>
                  </div>
                  {planDiscount > 0 && (
                    <div className="flex justify-between text-[10px] text-emerald-500 font-bold">
                      <span>Descuento {discountPct}%</span>
                      <span>-{formatCurrency(planDiscount)}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between pt-3 border-t text-base font-black" style={{ borderColor: 'var(--border-color)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total</span>
                <span style={{ color: '#FF5C3A' }}>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border flex items-start gap-3" style={{ borderColor: 'var(--border-color)' }}>
            <svg className="w-5 h-5 text-[#FF5C3A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              Acceso inmediato tras confirmar el pago. Los precios incluyen impuestos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
