import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
  return (
    <footer className="bg-[#050505] border-t border-[#1a1a1a]">
      {/* Cuerpo principal */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-12 md:py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Columna 1 — Marca */}
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Image
              src="/logo.svg"
              alt="Lookitry"
              width={24}
              height={24}
              className="object-contain h-6 w-auto"
            />
            <span className="font-syne font-extrabold text-sm text-white tracking-tight">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
          <p className="text-[12px] text-[#888] leading-relaxed mb-5">
            Probador virtual con IA para tiendas de ropa, accesorios y calzado en Latinoamérica.
          </p>
          {/* Contacto */}
          <div className="flex flex-col gap-2">
            <a
              href="mailto:info@pruebalo.wilkiedevs.com"
              className="flex items-center gap-2 text-[12px] text-[#888] hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              info@pruebalo.wilkiedevs.com
            </a>
            <a
              href="https://wa.me/573105436281"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] text-[#888] hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              +57 310 543 6281
            </a>
          </div>
        </div>

        {/* Columna 2 — Producto */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#666] mb-4">Producto</p>
          <ul className="flex flex-col gap-2.5">
            {[
              { label: 'Inicio', href: '/' },
              { label: 'Planes y precios', href: '/planes' },
              { label: 'Iniciar sesión', href: '/login' },
              { label: 'Crear cuenta gratis', href: '/register' },
            ].map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-[12px] text-[#888] hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3 — Empresa */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#666] mb-4">Empresa</p>
          <ul className="flex flex-col gap-2.5">
            {[
              { label: 'Sobre nosotros', href: '/sobre-nosotros' },
              { label: 'Términos y Condiciones', href: '/terminos' },
              { label: 'Política de Privacidad', href: '/politicas-privacidad' },
            ].map(l => (
              <li key={l.href}>
                <Link href={l.href} className="text-[12px] text-[#888] hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 4 — CTA */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#666] mb-4">Empieza hoy</p>
          <p className="text-[12px] text-[#888] leading-relaxed mb-4">
            7 días gratis. Requiere verificación de tarjeta. Cancela cuando quieras.
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#FF5C3A] hover:bg-[#e84d2c] text-white text-[12px] font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-[#111] px-6 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-[#666]">
            © {new Date().getFullYear()} Lookitry · Wilkie Devs SAS · Colombia
          </p>
          <Link
            href="/admin/login"
            className="text-[11px] text-[#444] hover:text-[#777] transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
