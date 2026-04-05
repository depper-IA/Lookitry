'use client';

import { Check, ChevronRight, Building2 } from 'lucide-react';
import { formatCop } from '@/lib/paymentDisplay';
import { PlanKey, SubPlan } from '@/app/checkout/page';

interface PlanSelectionStepProps {
  selectedPlan: PlanKey;
  setSelectedPlan: (plan: PlanKey) => void;
  selectedMonths: number;
  setSelectedMonths: (months: number) => void;
  subPlan: SubPlan;
  setSubPlan: (plan: SubPlan) => void;
  planBase: Record<'BASIC' | 'PRO' | 'TRIAL', number>;
  discounts: any[];
  isLanding: boolean;
  isTrial: boolean;
  trialBlockedBySession: boolean;
  handleLogoutAndGoToTrial: () => void;
  handleNextStep: () => void;
  planNames: Record<PlanKey, string>;
  landingPrice: number;
  landingOriginal: number;
  stepNumber?: number;
  OA: string;
  hasSession: boolean;
  clearCheckoutDraft: (key: string) => void;
  CHECKOUT_DRAFT_KEY: string;
}

export default function PlanSelectionStep({
  selectedPlan,
  setSelectedPlan,
  selectedMonths,
  setSelectedMonths,
  subPlan,
  setSubPlan,
  planBase,
  discounts,
  isLanding,
  isTrial,
  trialBlockedBySession,
  handleLogoutAndGoToTrial,
  handleNextStep,
  planNames,
  landingPrice,
  landingOriginal,
  stepNumber = 1,
  OA,
  hasSession,
  clearCheckoutDraft,
  CHECKOUT_DRAFT_KEY
}: PlanSelectionStepProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-jakarta font-bold text-white tracking-tight">Elige tu plan</h2>
          <p className="mt-1 text-sm text-[#999]">
            Selecciona el plan que mejor se adapte a tu negocio.
          </p>
        </div>
        <div className="text-[10px] font-bold px-2 py-1 rounded border uppercase" style={{ color: OA, backgroundColor: 'rgba(255,92,58,0.07)', borderColor: 'rgba(255,92,58,0.2)' }}>Paso {stepNumber} de 3</div>
      </div>

      {/* Alerta de Trial - solo mostrar si el usuario ya tuvo trial */}
      {trialBlockedBySession && (
        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm font-bold text-amber-300">Ya usaste tu prueba gratuita.</p>
          <p className="mt-2 text-sm text-[#d6d6d6]">
            ¡Tu cuenta ya tuvo un trial! Te invitamos a hacer upgrade a Basic o Pro para continuar.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setSelectedPlan('BASIC')}
              className="rounded-xl bg-[#FF5C3A] px-5 py-3 text-sm font-bold text-white transition-all flex-1"
            >
              Ver planes pagos
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="rounded-xl border border-[#2a2a2a] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-white/5 flex-1"
            >
              Ir al dashboard
            </button>
          </div>
        </div>
      )}

      {/* Grid de Planes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {(['TRIAL', 'BASIC', 'PRO', 'LANDING'] as PlanKey[]).map(p => {
          const isSelected = selectedPlan === p;
          return (
            <button
              key={p}
              onClick={() => {
                if (p === 'TRIAL' && !hasSession) {
                  clearCheckoutDraft(CHECKOUT_DRAFT_KEY);
                  window.location.href = '/trial-checkout';
                  return;
                }
                setSelectedPlan(p);
              }}
              className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-300`}
              style={{
                borderColor: isSelected ? OA : '#1f1f1f',
                backgroundColor: isSelected ? 'rgba(255,92,58,0.04)' : '#0d0d0d',
                boxShadow: isSelected ? `0 0 20px rgba(255,92,58,0.08)` : 'none',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isSelected ? OA : '#999' }}>
                  {planNames[p]}
                </span>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                  style={{ borderColor: isSelected ? OA : '#333', backgroundColor: isSelected ? OA : 'transparent' }}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>

              <div className="space-y-1">
                {p === 'LANDING' ? (
                  <>
                    <div className="text-sm text-[#999] line-through font-medium">{formatCop(landingOriginal)}</div>
                    <div className="text-2xl font-jakarta font-extrabold text-white">{formatCop(landingPrice)}</div>
                    <div className="text-[10px] font-bold uppercase" style={{ color: OA }}>Pago único</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-jakarta font-extrabold text-white">
                      {p === 'TRIAL' 
                        ? (planBase.TRIAL > 0 ? formatCop(planBase.TRIAL) : 'GRATIS')
                        : formatCop(planBase[p as keyof typeof planBase])
                      }
                    </div>
                    <div className="text-[10px] text-[#999] font-bold uppercase mt-0.5">
                      {p === 'TRIAL' ? (planBase.TRIAL > 0 ? 'Pago único' : '7 Días') : 'Mensual'}
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Enlace a Enterprise */}
      <div className="bg-gradient-to-r from-[#0d0d0d] to-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#FF5C3A]/10 to-[#FF5C3A]/5 border border-[#FF5C3A]/20">
              <Building2 className="w-5 h-5" style={{ color: OA }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">¿Necesitas un plan personalizado?</p>
              <p className="text-[11px] text-[#999]">Para empresas con necesidades especiales, contáctanos.</p>
            </div>
          </div>
          <a
            href="/contacto?source=checkout&plan=ENTERPRISE"
            className="px-5 py-2.5 rounded-xl border border-[#FF5C3A]/30 text-[11px] font-bold text-[#FF5C3A] hover:bg-[#FF5C3A]/10 transition-all whitespace-nowrap"
          >
            Plan Enterprise
          </a>
        </div>
      </div>

      {/* Sub-plan para LANDING */}
      {isLanding && (
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 mb-8 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,92,58,0.08)' }}>
              <Building2 className="w-5 h-5" style={{ color: OA }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Suscripción vinculada</h3>
              <p className="text-[11px] text-[#999]">La mini-landing requiere un plan activo</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(['BASIC', 'PRO'] as SubPlan[]).map(p => {
              const isSSelected = subPlan === p;
              return (
                <button
                  key={p}
                  onClick={() => setSubPlan(p)}
                  className="text-left p-4 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: isSSelected ? OA : '#1f1f1f',
                    backgroundColor: isSSelected ? 'rgba(255,92,58,0.05)' : '#0a0a0a',
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-white">{planNames[p]}</span>
                    {isSSelected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: OA }} />}
                  </div>
                  <div className="text-sm font-bold text-white">{formatCop(planBase[p])}/mes</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selector de meses */}
      {!isTrial && (
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">¿Por cuánto tiempo?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {discounts.map(d => (
              <button
                key={d.months}
                onClick={() => setSelectedMonths(d.months)}
                className="relative py-4 rounded-xl border-2 transition-all"
                style={{
                  borderColor: selectedMonths === d.months ? OA : '#1f1f1f',
                  backgroundColor: selectedMonths === d.months ? 'rgba(255,92,58,0.05)' : '#0a0a0a',
                }}
              >
                <div className="text-lg font-bold text-white">{d.months}</div>
                <div className="text-[10px] text-[#999] font-bold uppercase tracking-tighter">
                  Mes{d.months > 1 ? 'es' : ''}
                </div>
                {d.pct > 0 && (
                  <div className="absolute -top-2.5 right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    -{d.pct}%
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <button
          onClick={handleNextStep}
          className="w-full text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
          style={{ backgroundColor: OA, boxShadow: `0 10px 30px -10px rgba(255,92,58,0.4)` }}
        >
          CONTINUAR
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
