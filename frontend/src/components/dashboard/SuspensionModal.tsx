'use client';

import React from 'react';

interface SuspensionModalProps {
  brandName: string;
  brandEmail: string;
  plan: string;
  isTrialExpired?: boolean;
  isTrialPending?: boolean;
}

export function SuspensionModal({
  brandName,
  brandEmail,
  plan,
  isTrialExpired = false,
  isTrialPending = false,
}: SuspensionModalProps) {
  const planPrice = plan === 'PRO' ? '250.000' : '150.000';
  const accentColor = isTrialPending ? 'text-blue-500' : isTrialExpired ? 'text-amber-500' : 'text-[#FF5C3A]';
  const bgColor = isTrialPending ? 'bg-blue-500/10 border-blue-500/20' : isTrialExpired ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#FF5C3A]/10 border-[#FF5C3A]/20';
  const glowColor = isTrialPending ? 'bg-blue-500' : isTrialExpired ? 'bg-amber-500' : 'bg-[#FF5C3A]';

  return (
    <div className="dark">
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[32px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] max-w-lg w-full overflow-hidden relative">
          
          {/* Glow decoration */}
          <div className={`absolute top-0 left-0 w-full h-1 ${glowColor} opacity-50`}></div>
          <div className={`absolute -top-24 -right-24 w-48 h-48 ${glowColor} opacity-5/20 blur-[80px] rounded-full`}></div>

          <div className="p-8 md:p-10 text-center">
            {/* Icon */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border ${bgColor}`}>
              <svg className={`w-10 h-10 ${accentColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isTrialPending ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                )}
              </svg>
            </div>

            <h2 className="font-syne font-bold text-2xl text-white mb-3 tracking-tight leading-tight">
              {isTrialPending ? 'Verificando tu Pago' : isTrialExpired ? 'Período de Prueba Vencido' : 'Suscripción Suspendida'}
            </h2>
            
            <p className="text-[15px] text-[#888] mb-8 leading-relaxed max-w-[320px] mx-auto">
              {isTrialPending 
                ? 'Hemos recibido tu notificación de pago. Estamos esperando la confirmación de la pasarela para activar tu plan.'
                : isTrialExpired
                  ? `Tu cuenta de trial para ${brandName} ha expirado. Activa tu plan para seguir usando el probador.`
                  : 'Tu suscripción ha sido suspendida por falta de pago. Renueva ahora para recuperar el acceso.'}
            </p>

            <div className="space-y-4 mb-8">
              {!isTrialPending ? (
                <a
                  href="/dashboard/subscription"
                  className="group block w-full py-4 bg-[#FF5C3A] hover:bg-[#ff785c] active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-[0_10px_20px_rgba(255,92,58,0.2)] text-[15px]"
                >
                  Continuar al Pago
                  <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
                </a>
              ) : (
                <div className="py-4 px-6 bg-white/5 border border-white/10 text-white rounded-2xl text-[14px] flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Esperando confirmación...
                </div>
              )}
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 bg-transparent hover:bg-white/5 text-white/70 hover:text-white font-semibold rounded-2xl transition-all border border-white/10 text-[14px]"
              >
                Contactar Soporte (WhatsApp)
              </a>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left">
              <p className="text-[11px] text-[#555] uppercase tracking-wider font-bold mb-1.5">Información del Plan</p>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#888]">Plan Actual</span>
                <span className="text-[13px] text-white font-medium px-2 py-1 bg-white/10 rounded-lg">{plan}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-white/[0.02] text-center">
            <p className="text-[11px] text-[#444]">
              Tus productos y configuraciones están seguros.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
