import LoginForm from '@/components/auth/LoginForm';
import AuthGuard from '@/components/auth/AuthGuard';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { redirect?: string };
}) {
  const redirectTo =
    searchParams?.redirect && searchParams.redirect.startsWith('/')
      ? searchParams.redirect
      : '/dashboard';

  return (
    <AuthGuard redirectTo="/dashboard">
      {/* Google Identity Services — solo en páginas de auth */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      {/* Split screen layout - 60/40 premium split */}
      <div className="hidden lg:flex h-dvh overflow-hidden">
        {/* LEFT SIDE - Promotional Panel (60%) */}
        <div className="w-[60%] relative overflow-hidden flex flex-col theme-bg-base">
          {/* Rich gradient background - adapts to theme */}
          <div
            className="absolute inset-0 opacity-0 dark:opacity-100"
            style={{
              background: 'linear-gradient(145deg, #050505 0%, #0f0a08 25%, #0a0a0a 50%, #080510 75%, #050505 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-100 dark:opacity-0"
            style={{
              background: 'linear-gradient(145deg, #f5f2ee 0%, #ede9e4 25%, #fafafa 50%, #f0ede8 75%, #f5f2ee 100%)',
            }}
          />

          {/* Ambient accent glows - dark mode only */}
          <div
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-15 blur-[100px] dark:opacity-15 opacity-0"
            style={{ background: 'radial-gradient(circle, #FF5C3A 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-32 -right-16 w-[500px] h-[500px] rounded-full opacity-10 blur-[120px] dark:opacity-10 opacity-0"
            style={{ background: 'radial-gradient(circle, #FF5C3A 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[80px] dark:opacity-[0.03] opacity-0"
            style={{ background: 'radial-gradient(circle, #FF5C3A 0%, transparent 70%)' }}
          />

          {/* Subtle grid pattern - dark mode only */}
          <div
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.025] opacity-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-12 py-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-8 group">
              <div className="relative h-14 w-14 shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Lookitry"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-jakarta font-extrabold text-2xl tracking-tight theme-text">
                Look<span style={{ color: '#FF5C3A' }}>itry</span>
              </span>
            </Link>

            {/* Main content */}
            <div className="max-w-lg text-center">
              {/* Headline */}
              <h1
                className="font-jakarta font-bold text-4xl leading-[1.15] mb-4 tracking-tight theme-text"
              >
                Transforma tu manera de{' '}
                <span style={{ color: '#FF5C3A' }}>comprar moda</span>
              </h1>

              {/* Subtext */}
              <p
                className="text-[15px] leading-relaxed mb-8 font-light theme-text-muted"
              >
                Prueba virtualmente cualquier prenda antes de comprarla.
                Aumenta tus ventas y ofrece una experiencia única.
              </p>

              {/* Features - refined cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="relative group">
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(135deg, rgba(255,92,58,0.1) 0%, transparent 100%)' }}
                  />
                  <div className="relative p-4 rounded-xl border transition-all duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,92,58,0.12)' }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="#FF5C3A"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold mb-0.5 theme-text">
                      Prueba Virtual
                    </p>
                    <p className="text-[12px] theme-text-muted">
                      Visualiza
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(135deg, rgba(255,92,58,0.1) 0%, transparent 100%)' }}
                  />
                  <div className="relative p-4 rounded-xl border transition-all duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,92,58,0.12)' }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="#FF5C3A"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold mb-0.5 theme-text">
                      Más Ventas
                    </p>
                    <p className="text-[12px] theme-text-muted">
                      Convierte
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(135deg, rgba(255,92,58,0.1) 0%, transparent 100%)' }}
                  />
                  <div className="relative p-4 rounded-xl border transition-all duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,92,58,0.12)' }}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="#FF5C3A"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold mb-0.5 theme-text">
                      Sin Devoluciones
                    </p>
                    <p className="text-[12px] theme-text-muted">
                      Menos errores
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA tagline */}
              <p
                className="text-[11px] font-medium tracking-[0.2em] uppercase"
                style={{ color: '#FF5C3A' }}
              >
                Transforma tu experiencia
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form (40%) */}
        <div
          className="w-[40%] flex flex-col justify-center overflow-hidden px-8 dark"
          style={{ backgroundColor: '#080808' }}
        >
          <div className="w-full max-w-[420px] mx-auto px-4">
            <LoginForm redirectTo={redirectTo} compact hideLogo />
          </div>
        </div>
      </div>

      {/* Mobile fallback - original centered layout */}
      <div className="lg:hidden min-h-screen flex items-center justify-center px-4 py-12 dark" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="w-full max-w-md">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </AuthGuard>
  );
}
