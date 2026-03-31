'use client';

import { useState, useEffect, useCallback } from 'react';
import { wompiService } from '@/services/wompi.service';
import type { WompiWidgetResult } from '@/types/wompi';
import type { PlanType } from '@/types';

type WompiPlan = Exclude<PlanType, 'ENTERPRISE'>;

interface WompiButtonProps {
  plan: WompiPlan;
  months?: number;
  amount?: number;
  includesLanding?: boolean;
  onSuccess: (result: WompiWidgetResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const WOMPI_SCRIPT_URL = 'https://checkout.wompi.co/widget.js';

function loadWompiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${WOMPI_SCRIPT_URL}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = WOMPI_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el widget de Wompi'));
    document.head.appendChild(script);
  });
}

export default function WompiButton({
  plan,
  months = 1,
  amount,
  includesLanding = false,
  onSuccess,
  onError,
  disabled = false,
  className = '',
  style,
  children,
}: WompiButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    loadWompiScript()
      .then(() => {
        setScriptReady(true);
        setScriptFailed(false);
      })
      .catch(() => {
        setScriptReady(false);
        setScriptFailed(true);
      });
  }, []);

  const redirectToHostedCheckout = useCallback(async () => {
    const checkout = await wompiService.getCheckoutUrl(plan, months, amount, includesLanding);
    window.open(checkout.checkoutUrl, '_self');
  }, [plan, months, amount, includesLanding]);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (!scriptReady || scriptFailed || !window.WidgetCheckout) {
        await redirectToHostedCheckout();
        return;
      }

      const config = await wompiService.getWidgetConfig(plan, months, amount, includesLanding);

      const widget = new window.WidgetCheckout({
        currency: config.currency,
        amountInCents: config.amountInCents,
        reference: config.reference,
        publicKey: config.publicKey,
        signature: { integrity: config.signature },
      });

      widget.open((result: WompiWidgetResult) => {
        setLoading(false);
        const status = result.transaction?.status;

        if (status === 'APPROVED') {
          onSuccess(result);
        } else if (status === 'PENDING') {
          onError?.('Estamos verificando tu pago con Wompi.');
        } else {
          onError?.(`Pago ${status === 'DECLINED' ? 'rechazado' : 'fallido'}. Intenta de nuevo.`);
        }
      });
    } catch (err: any) {
      setLoading(false);
      onError?.(err.message ?? 'Error al iniciar el pago');
    }
  }, [scriptReady, scriptFailed, loading, plan, months, amount, includesLanding, onSuccess, onError, redirectToHostedCheckout]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      style={style}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Cargando...
        </span>
      ) : (
        children ?? 'Pagar con Wompi'
      )}
    </button>
  );
}
