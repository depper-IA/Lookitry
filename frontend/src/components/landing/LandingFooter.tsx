import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
  return (
    <footer className="bg-[#050505] border-t border-[#1a1a1a] px-6 md:px-8 py-7">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Lookitry"
            width={22}
            height={22}
            className="object-contain h-[22px] w-auto"
          />
          <span
            className="font-syne font-extrabold text-sm text-white tracking-tight"
          >
            Look<span className="text-[#FF5C3A]">itry</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 md:gap-5 flex-wrap justify-center">
          <Link href="/" className="text-[12px] text-[#555] hover:text-[#aaa] transition-colors">
            Inicio
          </Link>
          <Link href="/planes" className="text-[12px] text-[#555] hover:text-[#aaa] transition-colors">
            Planes
          </Link>
          <Link href="/login" className="text-[12px] text-[#555] hover:text-[#aaa] transition-colors">
            Iniciar sesión
          </Link>
          <a
            href="mailto:info@pruebalo.wilkiedevs.com"
            className="text-[12px] text-[#555] hover:text-[#aaa] transition-colors"
          >
            info@pruebalo.wilkiedevs.com
          </a>
          <a
            href="https://wa.me/573105436281"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[#555] hover:text-[#aaa] transition-colors"
          >
            +57 310 543 6281
          </a>
          <Link href="/terminos" className="text-[12px] text-[#555] hover:text-[#aaa] transition-colors">
            Términos y Condiciones
          </Link>
          <Link href="/admin/login" className="text-[12px] text-[#333] hover:text-[#555] transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
