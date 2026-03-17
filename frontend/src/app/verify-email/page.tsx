'use client';

import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a0a0a' }}
    >
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" style={{ fontFamily: 'Syne, sans-serif' }} className="font-extrabold text-xl text-white tracking-tight">
            Look<span className="text-[#FF5C3A]">itry</span>
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-8 text-center">

          {/* Icono sobre */}
          <div className="w-16 h-16 rounded-full bg-[#1f1f1f] flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <h1 style={{ fontFamily: 'Syne, sans-serif' }} className="font-bold text-[22px] text-white mb-2">
            Revisa tu correo
          </h1>
          <p className="text-[13px] text-[#555] leading-relaxed mb-6">
            Te enviamos un enlace de confirmación. Haz clic en él para activar tu cuenta y acceder al dashboard.
          </p>

          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 mb-6">
            <p className="text-[12px] text-[#444] leading-relaxed">
              Si no ves el correo, revisa tu carpeta de spam o correo no deseado. El enlace expira en 24 horas.
            </p>
          </div>

          <p className="text-center text-[13px] text-[#444]">
            ¿Ya verificaste?{' '}
            <Link href="/login" className="text-[#FF5C3A] hover:text-[#e84d2c] transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
