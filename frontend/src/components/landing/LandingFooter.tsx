import Link from 'next/link';
import Image from 'next/image';

const NAV_PRODUCTO = [
  { label: 'Inicio', href: '/' },
  { label: 'Planes y precios', href: '/planes' },
  { label: 'Iniciar sesión', href: '/login' },
  { label: 'Crear cuenta gratis', href: '/register' },
];

const NAV_EMPRESA = [
  { label: 'Sobre nosotros', href: '/sobre-nosotros' },
  { label: 'Términos y Condiciones', href: '/terminos' },
  { label: 'Política de Privacidad', href: '/politicas-privacidad' },
];

function IconMail() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-[#080808] border-t border-[#161616]">

      {/* Franja superior — CTA */}
      <div className="border-b border-[#161616]">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-white mb-0.5">¿Listo para empezar?</p>
            <p className="text-[12px] text-[#666]">7 días gratis · Requiere verificación de tarjeta · Cancela cuando quieras</p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            Crear cuenta gratis
            <IconArrow />
          </Link>
        </div>
      </div>

      {/* Cuerpo principal */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-10 lg:gap-16">

        {/* Columna 1 — Marca + contacto */}
        <div>
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
            <Image
              src="/logo.svg"
              alt="Lookitry"
              width={22}
              height={22}
              className="object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <span className="font-syne font-extrabold text-[15px] text-white tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>

          <p className="text-[13px] text-[#777] leading-relaxed mb-6 max-w-[280px]">
            Probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica.
          </p>

          {/* Contacto */}
          <div className="flex flex-col gap-3">
            <a
              href="mailto:info@pruebalo.wilkiedevs.com"
              className="inline-flex items-center gap-2.5 text-[12px] text-[#666] hover:text-[#FF5C3A] transition-colors group"
            >
              <span className="w-7 h-7 rounded-lg bg-[#111] border border-[#1e1e1e] flex items-center justify-center flex-shrink-0 group-hover:border-[#FF5C3A]/30 transition-colors">
                <IconMail />
              </span>
              info@pruebalo.wilkiedevs.com
            </a>
            <a
              href="https://wa.me/573105436281"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 text-[12px] text-[#666] hover:text-[#FF5C3A] transition-colors group"
            >
              <span className="w-7 h-7 rounded-lg bg-[#111] border border-[#1e1e1e] flex items-center justify-center flex-shrink-0 group-hover:border-[#FF5C3A]/30 transition-colors">
                <IconPhone />
              </span>
              +57 310 543 6281
            </a>
          </div>
        </div>

        {/* Columna 2 — Producto */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#444] mb-5">Producto</p>
          <ul className="flex flex-col gap-3">
            {NAV_PRODUCTO.map(l => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[13px] text-[#777] hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3 — Empresa */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#444] mb-5">Empresa</p>
          <ul className="flex flex-col gap-3">
            {NAV_EMPRESA.map(l => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[13px] text-[#777] hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-[#111]">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-[#3a3a3a]">
            © {new Date().getFullYear()} Lookitry · Wilkie Devs SAS · Colombia
          </p>
          <Link
            href="/admin/login"
            className="text-[11px] text-[#2a2a2a] hover:text-[#555] transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>

    </footer>
  );
}
