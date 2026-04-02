'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Crown, ShieldCheck } from 'lucide-react';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';
import { useEffect, useState } from 'react';

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,100..1000;1,100..1000&display=swap');
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
`;

export default function PluginActivationPage() {
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');

  useEffect(() => {
    const saved = localStorage.getItem('currency') as 'COP' | 'USD' | null;
    if (saved) setCurrency(saved);
  }, []);

  const handleCurrencyChange = (nextCurrency: 'COP' | 'USD') => {
    setCurrency(nextCurrency);
    localStorage.setItem('currency', nextCurrency);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-dm-sans">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />
      <LandingNav currency={currency} onCurrencyChange={handleCurrencyChange} />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 text-[#FF5C3A] text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              Activacion del plugin
            </div>
            <h1 className="font-jakarta text-4xl md:text-6xl font-black leading-[1.05] tracking-tight mb-6">
              Elige el plan correcto para activar <span className="text-[#FF5C3A]">Lookitry en WooCommerce</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              El plugin no funciona con BASIC ni Trial. Si quieres usar el probador dentro de tu tienda, necesitas activar PRO o hablar con nosotros para ENTERPRISE.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-10 flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 text-[#FF5C3A] flex items-center justify-center mb-8">
                <Crown size={24} />
              </div>
              <h2 className="font-jakarta text-3xl font-black mb-4">Plan PRO</h2>
              <p className="text-white/60 leading-relaxed mb-8">
                La opcion directa para instalar el plugin, validar tu API Key y empezar a sincronizar productos desde WooCommerce.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  'Plugin oficial para WooCommerce',
                  'Sincronizacion de catalogo',
                  'Try-on embebido en ficha de producto',
                  'Activacion operativa inmediata',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-white/85">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/checkout?plan=PRO"
                className="mt-auto inline-flex items-center justify-center gap-3 rounded-[1.5rem] bg-[#FF5C3A] px-8 py-5 font-black uppercase tracking-[0.15em] text-[11px] text-white shadow-2xl shadow-[#FF5C3A]/20 hover:scale-[1.02] transition-all"
              >
                Comprar PRO <ArrowRight size={18} />
              </Link>
            </section>

            <section className="rounded-[2rem] border border-[#FF5C3A]/20 bg-gradient-to-br from-[#FF5C3A]/10 to-white/5 p-10 flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-8">
                <ShieldCheck size={24} />
              </div>
              <h2 className="font-jakarta text-3xl font-black mb-4">Plan ENTERPRISE</h2>
              <p className="text-white/70 leading-relaxed mb-8">
                Para marcas con operacion mas compleja, catalogos grandes, necesidades a medida o acompanamiento comercial y tecnico dedicado.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  'Onboarding guiado',
                  'Configuracion para operaciones complejas',
                  'Acompanamiento tecnico prioritario',
                  'Ruta comercial personalizada',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-white/90">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/contacto?source=plugin-woocommerce&plan=ENTERPRISE"
                className="mt-auto inline-flex items-center justify-center gap-3 rounded-[1.5rem] border border-white/15 bg-white/10 px-8 py-5 font-black uppercase tracking-[0.15em] text-[11px] text-white hover:border-[#FF5C3A] hover:text-[#FF5C3A] transition-all"
              >
                Hablar con ventas <ArrowRight size={18} />
              </Link>
            </section>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
