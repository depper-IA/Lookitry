'use client';

import { Mail, User, AlertCircle, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Step } from '@/components/payments/StepProgress';
import { authService } from '@/services/auth.service';

interface UserDataStepProps {
  email: string;
  setEmail: (val: string) => void;
  brandName: string;
  setBrandName: (val: string) => void;
  emailError: string;
  setEmailError: (val: string) => void;
  brandNameError: string;
  setBrandNameError: (val: string) => void;
  emailChecking: boolean;
  emailExists: { exists: boolean; name?: string } | null;
  hasSession: boolean;
  sessionInfo: { name: string; email: string } | null;
  validateStep2: () => Promise<boolean>;
  handlePrevStep: () => void;
  setCurrentStep: (step: Step) => void;
  stepNumber?: number;
  OA: string;
}

export default function UserDataStep({
  email,
  setEmail,
  brandName,
  setBrandName,
  emailError,
  setEmailError,
  brandNameError,
  setBrandNameError,
  emailChecking,
  emailExists,
  hasSession,
  sessionInfo,
  validateStep2,
  handlePrevStep,
  setCurrentStep,
  stepNumber = 2,
  OA
}: UserDataStepProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-jakarta font-bold text-white tracking-tight">Tus datos</h2>
          <p className="text-sm text-[#999] mt-1">Vinculamos tu compra al correo con el que entrarás y administrarás la cuenta</p>
        </div>
        <div className="text-[10px] font-bold px-2 py-1 rounded border uppercase" style={{ color: OA, backgroundColor: 'rgba(255,92,58,0.07)', borderColor: 'rgba(255,92,58,0.2)' }}>Paso {stepNumber} de 3</div>
      </div>

      <div className="space-y-6 bg-[#0d0d0d] border border-[#1f1f1f] p-8 rounded-3xl">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#999] uppercase tracking-widest flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" style={{ color: OA }} />
            Correo Electrónico
            {hasSession && <Lock className="w-3 h-3 text-[#999]" />}
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={e => {
                if (hasSession) return; // SECURITY: Prevent email changes when authenticated
                setEmail(e.target.value);
                setEmailError('');
              }}
              readOnly={hasSession}
              placeholder="ejemplo@mimarca.com"
              className={`w-full bg-[#050505] border rounded-xl px-4 py-4 text-white outline-none transition-all ${hasSession ? 'opacity-70 cursor-not-allowed' : ''}`}
              style={{ borderColor: emailError ? 'rgba(239,68,68,0.5)' : '#222' }}
              onFocus={e => { e.currentTarget.style.borderColor = OA; }}
              onBlur={async e => { 
                e.currentTarget.style.borderColor = emailError ? 'rgba(239,68,68,0.5)' : '#222';
                if (!hasSession && email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  await validateStep2();
                }
              }}
            />
            {emailChecking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-t-[#FF5C3A] border-white/20 rounded-full animate-spin" />
              </div>
            )}
          </div>
          {emailError && (
            <p className="text-[11px] text-red-400 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> 
              {emailError}
              {emailExists?.exists && emailExists.name && (
                <span className="text-[#999]"> — Sesión: {emailExists.name}</span>
              )}
            </p>
          )}
          {hasSession && (
            <p className="text-[11px] text-[#999]">
              Correo vinculado a tu cuenta activa. Para usar otro correo,{' '}
              <button
                onClick={() => { authService.logout().then(() => window.location.reload()); }}
                className="underline hover:text-white transition-colors"
                style={{ color: OA }}
              >
                cierra sesión
              </button>.
            </p>
          )}
        </div>

        {!hasSession && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#999] uppercase tracking-widest flex items-center gap-2">
              <User className="w-3.5 h-3.5" style={{ color: OA }} />
              Nombre de tu Marca
            </label>
            <input
              type="text"
              value={brandName}
              onChange={e => { setBrandName(e.target.value); setBrandNameError(''); }}
              placeholder="Mi Tienda de Moda"
              className="w-full bg-[#050505] border rounded-xl px-4 py-4 text-white outline-none transition-all"
              style={{ borderColor: brandNameError ? 'rgba(239,68,68,0.5)' : '#222' }}
              onFocus={e => { e.currentTarget.style.borderColor = OA; }}
              onBlur={e => { e.currentTarget.style.borderColor = brandNameError ? 'rgba(239,68,68,0.5)' : '#222'; }}
            />
            {brandNameError && <p className="text-[11px] text-red-400 font-medium flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> {brandNameError}</p>}
          </div>
        )}

        {hasSession && sessionInfo && (
          <div className="rounded-2xl p-4 flex items-center gap-4 border" style={{ backgroundColor: 'rgba(255,92,58,0.04)', borderColor: 'rgba(255,92,58,0.2)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: OA }}>
              {sessionInfo.name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{sessionInfo.name}</p>
              <p className="text-xs text-[#999]">{sessionInfo.email}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-10">
        <button
          onClick={handlePrevStep}
          className="flex-1 bg-[#0d0d0d] hover:bg-[#141414] text-white font-bold py-4 rounded-2xl border border-[#1f1f1f] transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          ATRÁS
        </button>
        <button
          onClick={async () => {
            const isValid = await validateStep2();
            if (isValid) {
              setCurrentStep((stepNumber + 1) as Step);
              window.scrollTo(0, 0);
            }
          }}
          disabled={emailChecking}
          className="flex-[2] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          style={{ backgroundColor: OA, boxShadow: `0 10px 30px -10px rgba(255,92,58,0.4)` }}
        >
          {emailChecking ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              CONTINUAR AL PAGO
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
