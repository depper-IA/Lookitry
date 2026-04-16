import LoginForm from '@/components/auth/LoginForm';
import AuthGuard from '@/components/auth/AuthGuard';
import Image from 'next/image';
import Link from 'next/link';

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
      {/* Split screen layout - desktop only, hidden on mobile */}
      <div className="hidden lg:flex min-h-screen">
        {/* LEFT SIDE - Promotional Panel (70%) */}
        <div className="w-[70%] relative overflow-hidden">
          {/* Background gradient with accent glow */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a05 50%, #0a0a0a 100%)',
            }}
          />

          {/* Decorative accent circles */}
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: '#FF5C3A' }}
          />
          <div
            className="absolute -bottom-48 -right-24 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
            style={{ backgroundColor: '#FF5C3A' }}
          />
          <div
            className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-10 blur-2xl"
            style={{ backgroundColor: '#FF5C3A' }}
          />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-16 py-12">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-16 group">
              <div className="relative h-14 w-14 shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Lookitry"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-jakarta font-extrabold text-3xl text-white tracking-tight">
                Look<span style={{ color: '#FF5C3A' }}>itry</span>
              </span>
            </Link>

            {/* Main content */}
            <div className="max-w-xl text-center">
              {/* Headline */}
              <h1
                className="font-jakarta font-bold text-5xl leading-tight mb-6"
                style={{ color: '#ffffff' }}
              >
                Transforma tu manera de{' '}
                <span style={{ color: '#FF5C3A' }}>comprar moda</span>
              </h1>

              {/* Subtext */}
              <p
                className="text-lg leading-relaxed mb-10"
                style={{ color: '#999999' }}
              >
                Prueba virtualmente cualquier prenda antes de comprarla.
                Aumenta tus ventas, reduce devoluciones y ofrece una
                experiencia única a tus clientes.
              </p>

              {/* Features */}
              <div className="grid grid-cols-3 gap-6 mb-12">
                <div className="text-center">
                  <div
                    className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,92,58,0.1)' }}
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
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: '#ffffff' }}
                  >
                    Prueba Virtual
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#666666' }}>
                    Visualiza antes de comprar
                  </p>
                </div>

                <div className="text-center">
                  <div
                    className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,92,58,0.1)' }}
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
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: '#ffffff' }}
                  >
                    Más Ventas
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#666666' }}>
                    Convierte más clientes
                  </p>
                </div>

                <div className="text-center">
                  <div
                    className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,92,58,0.1)' }}
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
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: '#ffffff' }}
                  >
                    Sin Devoluciones
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#666666' }}>
                    Menos errores en tallas
                  </p>
                </div>
              </div>

              {/* CTA */}
              <p
                className="text-sm font-medium tracking-wide uppercase"
                style={{ color: '#FF5C3A' }}
              >
                Transforma tu experiencia de moda
              </p>
            </div>

            {/* Bottom tagline */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-xs" style={{ color: '#444444' }}>
                Tecnologia de inteligencia artificial para la industria de la moda
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form (30%) */}
        <div
          className="w-[30%] flex items-center justify-center p-8"
          style={{ backgroundColor: '#0a0a0a' }}
        >
          <div className="w-full max-w-sm">
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>

      {/* Mobile fallback - original centered layout */}
      <div className="lg:hidden min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="w-full max-w-md">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </AuthGuard>
  );
}
