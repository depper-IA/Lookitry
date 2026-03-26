import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'Política de Cookies — Lookitry',
  description: 'Uso de cookies y tecnologías similares en Lookitry.',
};

export default function CookiesPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#030303]">
        <section className="px-6 md:px-8 py-16 md:py-24 border-b border-[#1a1a1a]">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#FF5C3A] mb-3">Legal</p>
            <h1 className="font-jakarta font-bold text-3xl md:text-5xl text-white tracking-tight">
              Política de cookies
            </h1>
            <p className="text-[#999] text-sm md:text-base mt-3 max-w-3xl">
              Te explicamos qué cookies usamos, por qué las usamos y cómo puedes gestionarlas.
            </p>
          </div>
        </section>

        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6">
              <p className="text-[#FF5C3A] text-[11px] uppercase tracking-wider font-semibold">Cookies necesarias</p>
              <p className="text-[#bbb] text-sm mt-2">Autenticación, seguridad de sesión y funcionamiento base del sitio.</p>
            </div>
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6">
              <p className="text-[#FF5C3A] text-[11px] uppercase tracking-wider font-semibold">Privacidad</p>
              <p className="text-[#bbb] text-sm mt-2">No vendemos datos personales ni usamos tracking publicitario invasivo.</p>
            </div>
            <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6">
              <p className="text-[#FF5C3A] text-[11px] uppercase tracking-wider font-semibold">Control del usuario</p>
              <p className="text-[#bbb] text-sm mt-2">Puedes bloquear o eliminar cookies desde la configuración de tu navegador.</p>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
