'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Globe, CheckCircle, XCircle, CreditCard, ShieldCheck } from 'lucide-react';
import { subscriptionService } from '@/services/subscription.service';
import { formatCurrency } from '@/utils/currency';
import WompiButton from '@/components/payments/WompiButton';
import type { WompiWidgetResult } from '@/types/wompi';

const LANDING_PRICE_FALLBACK = 650000;
const LANDING_ORIGINAL_PRICE_FALLBACK = 900000;

const LANDING_FEATURES = [
  'Página pública en pruebalo.wilkiedevs.com/tu-marca',
  'Hero con imagen de portada personalizada',
  'Galería de productos con probador virtual integrado',
  'Sección de contacto y redes sociales',
  'Horarios de atención',
  'Pago único — sin cargos mensuales adicionales',
];

type PageState = 'loading' | 'ready' | 'success' | 'error' | 'no-plan';

export default function CheckoutLandingPage() {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [landingPrice, setLandingPrice] = useState(LANDING_PRICE_FALLBACK);
  const [landingOriginalPrice, setLandingOriginalPrice] = useState(LANDING_ORIGINAL_PRICE_FALLBACK);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [wompiEnabled, setWompiEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

    Promise.all([
      subscriptionService.getSubscriptionInfo(),
      fetch(`${apiUrl}/api/payment-settings/public`).then(r => r.ok ? r.json() : null),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?select=id,config&id=eq.landing`, {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }).then(r => r.ok ? r.json() : null),
    ])
      .then(([subInfo, paySettings, pricingRows]) => {
        const status = subInfo.brand.subscriptionStatus ?? (subInfo.brand as any).subscription_status;
        const inTrial = subInfo.isInTrial;
        const hasActivePlan = !inTrial && (status === 'active' || status === 'expiring_soon');
        const hasLanding = (subInfo.brand as any).has_landing_page;

        // Solo puede comprar landing si tiene plan activo (BASIC o PRO) y no tiene landing ya
        if (!hasActivePlan) {
          setPageState('no-plan');
          return;
        }
        if (hasLanding) {
          // Ya tiene landing — redirigir al editor
          router.replace('/dashboard/mi-pagina');
          return;
        }

        setCurrentPlan((subInfo.brand as any).plan ?? null);

        // Precios desde payment_settings o pricing_config
        if (paySettings?.landingPrice) setLandingPrice(paySettings.landingPrice);
        if (paySettings?.landingOriginalPrice) setLandingOriginalPrice(paySettings.landingOriginalPrice);
        if (Array.isArray(pricingRows) && pricingRows.length > 0) {
          const cfg = pricingRows[0]?.config;
          if (cfg?.precio) setLandingPrice(cfg.precio);
          if (cfg?.precio_original) setLandingOriginalPrice(cfg.precio_original);
        }

        // Verificar Wompi
        fetch(`${apiUrl}/api/payments/wompi/config?plan=BASIC&months=1`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
          .then(r => setWompiEnabled(r.ok))
          .catch(() => setWompiEnabled(false));

        setPageState('ready');
      })
      .catch(() => {
        setErrorMsg('No se pudo cargar la información. Intenta de nuevo.');
        setPageState('error');
      });
  }, [router]);

  const handleSuccess = (result: WompiWidgetResult) => {
    console.log('[Landing Checkout] Pago aprobado:', result.transaction.id);
    setPageState('success');
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
    setPageState('error');
  };

  // ── Estados ───────────────────────────────────────────────────────────────

  if (pageState === 'loading') {
    return (
      <div className="max-w-lg mx-auto py-16 flex items-center justify-center gap-3">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando...</span>
      </div>
    );
  }

  if (pageState === 'no-plan') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="flex justify-center">
          <XCircle className="w-14 h-14" style={{ color: '#ef4444' }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Plan requerido</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Necesitas tener un plan Básico o Pro activo para agregar la mini-landing.
        </p>
        <button
          onClick={() => router.push('/dashboard/checkout')}
          className="mt-2 px-6 py-2.5 min-h-[44px] rounded-xl text-white text-sm font-medium"
          style={{ background: '#FF5C3A' }}
        >
          Ver planes
        </button>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Pago recibido</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Tu mini-landing se activará en los próximos minutos. Puedes empezar a personalizarla desde el editor.
        </p>
        <button
          onClick={() => router.push('/dashboard/mi-pagina')}
          className="mt-4 px-6 py-2.5 min-h-[44px] rounded-xl text-white text-sm font-medium"
          style={{ background: '#FF5C3A' }}
        >
          Ir al editor de mi página
        </button>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="flex justify-center">
          <XCircle className="w-14 h-14" style={{ color: '#ef4444' }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Algo salió mal</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={() => { setPageState('loading'); setErrorMsg(''); window.location.reload(); }}
            className="px-5 py-2.5 min-h-[44px] rounded-xl border text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => router.push('/dashboard/subscription')}
            className="px-5 py-2.5 min-h-[44px] rounded-xl text-white text-sm font-medium"
            style={{ background: '#FF5C3A' }}
          >
            Volver a suscripción
          </button>
        </div>
      </div>
    );
  }

  // ── Vista principal ───────────────────────────────────────────────────────

  const discount = Math.round((1 - landingPrice / landingOriginalPrice) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Agregar mini-landing
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Pago único — disponible para tu plan {currentPlan === 'PRO' ? 'Pro' : 'Básico'} activo
          </p>
        </div>
      </div>

      {/* Card del producto */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div
          className="px-6 py-5 flex items-center gap-4 border-b"
          style={{ background: 'rgba(255,92,58,0.04)', borderColor: 'var(--border-color)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,92,58,0.1)' }}
          >
            <Globe className="w-6 h-6" style={{ color: '#FF5C3A' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Mini-landing personalizada
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(255,92,58,0.12)', color: '#FF5C3A' }}
              >
                Pago único
              </span>
              {discount > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                >
                  -{discount}%
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Página pública de tu marca con probador virtual integrado
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          <ul className="space-y-2">
            {LANDING_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Resumen del pedido */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="px-6 py-4 border-b" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Resumen del pedido</h2>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Mini-landing personalizada</span>
            {discount > 0 ? (
              <div className="text-right">
                <span className="text-sm line-through mr-2" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(landingOriginalPrice)}
                </span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(landingPrice)}
                </span>
              </div>
            ) : (
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(landingPrice)}
              </span>
            )}
          </div>
          <div
            className="flex items-center justify-between pt-3 border-t"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total a pagar</p>
            <p className="text-xl font-bold" style={{ color: '#FF5C3A' }}>{formatCurrency(landingPrice)}</p>
          </div>
        </div>
      </div>

      {/* Sección de pago */}
      <div className="rounded-2xl border px-6 py-5 space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <CreditCard className="w-5 h-5" style={{ color: '#FF5C3A' }} />
          <h2 className="font-semibold">Método de pago</h2>
        </div>

        {wompiEnabled === null && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Verificando disponibilidad...
          </div>
        )}

        {wompiEnabled === true && (
          <>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Paga de forma segura con tarjeta de crédito, débito, PSE o Nequi a través de Wompi.
            </p>
            <WompiButton
              plan="BASIC"
              months={1}
              amount={landingPrice}
              onSuccess={handleSuccess}
              onError={handleError}
              className="w-full py-3 min-h-[44px] rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
              style={{ background: '#FF5C3A' }}
            >
              <CreditCard className="w-4 h-4" />
              Pagar {formatCurrency(landingPrice)} con Wompi
            </WompiButton>
          </>
        )}

        {wompiEnabled === false && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              El pago en línea no está disponible en este momento. Contáctanos para completar tu compra.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:info@pruebalo.wilkiedevs.com"
                className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border text-sm transition-colors hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                info@pruebalo.wilkiedevs.com
              </a>
              <a
                href="https://wa.me/573105436281"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border text-sm transition-colors hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.858L.057 23.428a.5.5 0 0 0 .609.61l5.699-1.48A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs justify-center" style={{ color: 'var(--text-muted)' }}>
        <ShieldCheck className="w-4 h-4" />
        <span>Pagos procesados de forma segura por Wompi. No almacenamos datos de tu tarjeta.</span>
      </div>
    </div>
  );
}
