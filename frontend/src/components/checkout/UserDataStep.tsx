'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, AlertCircle, ChevronLeft, ChevronRight, Lock, CheckCircle } from 'lucide-react';
import { Step } from '@/components/payments/StepProgress';
import { authService } from '@/services/auth.service';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import Link from 'next/link';

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
  handleGoogleCheckoutSuccess?: (data: any) => void;
  loginHint?: string;
  existingAccountRedirectUrl?: string;
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
  handleGoogleCheckoutSuccess,
  existingAccountRedirectUrl,
  stepNumber = 2,
  OA
}: UserDataStepProps) {
  const existingAccountDetected = !hasSession && emailExists?.exists;

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
        {!hasSession && (
        <div className="mb-6">
            <GoogleSignInButton 
              mode={existingAccountDetected ? 'login' : 'register'}
              onSuccess={handleGoogleCheckoutSuccess}
              onError={(err) => setEmailError(err)}
              redirectTo={existingAccountRedirectUrl}
              loginHint={email || ''}
            />
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#222]"></div>
              <span className="text-[11px] text-[#666] uppercase tracking-wider">o continúa con correo</span>
              <div className="flex-1 h-px bg-[#222]"></div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-[#999] uppercase tracking-widest flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" style={{ color: OA }} />
            Correo Electrónico
            {hasSession && <Lock className="w-3 h-3 text-[#999]" />}
          </label>
          <div className="relative">
            <motion.div
              animate={emailError ? {
                x: [0, -10, 10, -10, 10, 0],
                borderColor: ["rgba(239,68,68,0.5)", "rgba(239,68,68,0.8)", "rgba(239,68,68,0.5)", "rgba(239,68,68,0.8)", "rgba(239,68,68,0.5)", "#222"]
              } : {}}
              transition={{ duration: 0.4 }}
            >
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                type="email"
                value={email}
                onChange={e => {
                  if (hasSession) return; // SECURITY: Prevent email changes when authenticated
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                readOnly={hasSession}
                placeholder=" "
                className={`peer w-full bg-[#050505] border rounded-xl px-4 pt-6 pb-2 text-white outline-none transition-all ${hasSession ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{ borderColor: emailError ? 'rgba(239,68,68,0.5)' : '#222' }}
                onFocus={e => { e.currentTarget.style.borderColor = OA; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(255,92,58,0.1)`; }}
                onBlur={async e => { 
                  e.currentTarget.style.borderColor = emailError ? 'rgba(239,68,68,0.5)' : '#222';
                  e.currentTarget.style.boxShadow = 'none';
                  if (!hasSession && email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    await validateStep2();
                  }
                }}
              />
              <motion.label
                className="absolute left-4 top-4 text-gray-500 pointer-events-none
                         peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#FF5C3A]
                         peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs
                         transition-all duration-200"
                style={{ color: emailError ? '#ef4444' : undefined }}
              >
                {hasSession ? email : 'ejemplo@mimarca.com'}
              </motion.label>
            </motion.div>
            {emailChecking && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <div className="w-4 h-4 border-2 border-t-[#FF5C3A] border-white/20 rounded-full animate-spin" />
              </motion.div>
            )}
            {!emailError && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
              >
                <CheckCircle className="w-5 h-5" />
              </motion.span>
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

        {existingAccountDetected && existingAccountRedirectUrl && (
          <div className="rounded-2xl border border-[#FF5C3A]/30 bg-[#FF5C3A]/5 p-4 space-y-3">
            <p className="text-sm font-bold text-white">Esta cuenta ya existe.</p>
            <p className="text-[12px] text-[#bdbdbd]">
              Continúa desde tu checkout interno para que el proceso se trate como upgrade y no como un registro nuevo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={existingAccountRedirectUrl}
                className="flex-1 text-center rounded-xl px-4 py-3 text-sm font-bold text-white transition-all"
                style={{ backgroundColor: OA }}
              >
                Iniciar sesión y continuar
              </Link>
              <button
                type="button"
                onClick={() => { window.location.href = existingAccountRedirectUrl; }}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/5 transition-all"
              >
                Ir al checkout interno
              </button>
            </div>
          </div>
        )}

        {!hasSession && !existingAccountDetected && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#999] uppercase tracking-widest flex items-center gap-2">
              <User className="w-3.5 h-3.5" style={{ color: OA }} />
              Nombre de tu Marca
            </label>
            <div className="relative">
              <motion.div
                animate={brandNameError ? {
                  x: [0, -10, 10, -10, 10, 0],
                } : {}}
                transition={{ duration: 0.4 }}
              >
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  type="text"
                  value={brandName}
                  onChange={e => { setBrandName(e.target.value); setBrandNameError(''); }}
                  placeholder=" "
                  className="peer w-full bg-[#050505] border rounded-xl px-4 pt-6 pb-2 text-white outline-none transition-all"
                  style={{ borderColor: brandNameError ? 'rgba(239,68,68,0.5)' : '#222' }}
                  onFocus={e => { e.currentTarget.style.borderColor = OA; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(255,92,58,0.1)`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = brandNameError ? 'rgba(239,68,68,0.5)' : '#222'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <motion.label
                  className="absolute left-4 top-4 text-gray-500 pointer-events-none
                           peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#FF5C3A]
                           peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs
                           transition-all duration-200"
                  style={{ color: brandNameError ? '#ef4444' : undefined }}
                >
                  Mi Tienda de Moda
                </motion.label>
              </motion.div>
              {!brandNameError && brandName && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.span>
              )}
            </div>
            {brandNameError && <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-red-400 font-medium flex items-center gap-1.5"
            >
              <AlertCircle className="w-3 h-3" /> {brandNameError}
            </motion.p>}
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
            if (existingAccountDetected && existingAccountRedirectUrl) {
              window.location.href = existingAccountRedirectUrl;
              return;
            }

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
              {existingAccountDetected ? 'IR AL CHECKOUT INTERNO' : 'CONTINUAR AL PAGO'}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
