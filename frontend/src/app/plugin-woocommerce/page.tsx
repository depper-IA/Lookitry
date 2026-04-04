'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Monitor,
  Palette,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import LandingNav from '@/components/landing/new-landing/LandingNav';
import LandingFooter from '@/components/landing/new-landing/LandingFooter';

const PREMIUM_FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,100..1000;1,100..1000&display=swap');
  .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-dm-sans { font-family: 'DM Sans', sans-serif; }
`;

const SectionLabel = ({ text, dark = false }: { text: string; dark?: boolean }) => (
  <div
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
      dark ? 'bg-black/10 border-black/10 text-black/60' : 'bg-[#FF5C3A]/10 border-[#FF5C3A]/20 text-[#FF5C3A]'
    } text-[10px] font-bold uppercase tracking-widest mb-8 border transition-all`}
  >
    <div className={`w-1 h-1 rounded-full ${dark ? 'bg-black/40' : 'bg-[#FF5C3A]'} animate-pulse`} />
    {text}
  </div>
);

export default function PluginWooCommercePage() {
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');

  useEffect(() => {
    const saved = localStorage.getItem('currency') as 'COP' | 'USD' | null;
    if (saved) setCurrency(saved);
  }, []);

  const handleCurrencyChange = (nextCurrency: 'COP' | 'USD') => {
    setCurrency(nextCurrency);
    localStorage.setItem('currency', nextCurrency);
  };

  const proPrice = currency === 'COP' ? '350.000' : '89';
  const proGens = '1.200';
  const proProducts = '15';

  const problemPoints = [
    'El cliente no sabe como se vera la prenda en su cuerpo y pospone la compra.',
    'Mandarlo a una herramienta externa rompe el flujo y baja la intencion de compra.',
    'Las devoluciones por expectativa visual incorrecta erosionan margen y confianza.',
  ];

  const solutionPoints = [
    {
      title: 'Boton directo en la ficha',
      desc: 'El CTA del probador aparece dentro de la pagina de producto, junto al flujo natural de compra.',
    },
    {
      title: 'Modal embebido sin salir de la tienda',
      desc: 'La experiencia se abre en overlay y mantiene al usuario en tu dominio, sin apps ni pasos innecesarios.',
    },
    {
      title: 'Sincronizacion y validacion operativa',
      desc: 'El plugin conecta catalogo, valida la tienda con tu cuenta de Lookitry y reporta telemetria para operacion real.',
    },
  ];

  const featureCards = [
    {
      title: 'One-Click en Producto',
      desc: 'El probador se activa desde la ficha de producto y respeta el flujo nativo de WooCommerce.',
      icon: <Zap size={24} />,
    },
    {
      title: 'Sin Apps ni Cuentas',
      desc: 'El comprador solo sube su foto y obtiene el resultado. No tiene que descargar nada ni crear usuario adicional.',
      icon: <Cpu size={24} />,
    },
    {
      title: 'Integracion Visual',
      desc: 'Puedes ajustar texto y colores del boton para que la activacion del probador encaje con tu tienda.',
      icon: <Palette size={24} />,
    },
    {
      title: 'Operacion Controlada',
      desc: 'La conexion con Lookitry valida plan, sincroniza productos y registra eventos clave del plugin para soporte y monitoreo.',
      icon: <ShieldCheck size={24} />,
    },
  ];

  const faqs = [
    {
      q: '¿El cliente tiene que salir de mi tienda o crear una cuenta aparte?',
      a: 'No. La experiencia se abre en un modal dentro de la misma pagina de producto para que el recorrido siga ocurriendo en tu storefront.',
    },
    {
      q: '¿Tengo que mantener un catalogo separado para usar el plugin?',
      a: 'No deberias operar dos catalogos. El plugin toma tus productos de WooCommerce y te permite sincronizarlos con Lookitry desde la configuracion del conector.',
    },
    {
      q: '¿Esta incluido en el Plan Basico o Trial?',
      a: 'No. El plugin requiere un plan PRO o ENTERPRISE porque depende de activacion operativa, sincronizacion y uso productivo del motor de try-on.',
    },
    {
      q: '¿Ralentizara la velocidad de mi producto?',
      a: 'No deberia impactar el performance principal de la ficha. La generacion corre en la infraestructura de Lookitry y la tienda solo inicializa el modal y la sesion segura.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-dm-sans selection:bg-[#FF5C3A]/30 selection:text-[#FF5C3A] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: PREMIUM_FONTS }} />

      <LandingNav currency={currency} onCurrencyChange={handleCurrencyChange} />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40 mt-12">
            <div className="relative z-10">
              <SectionLabel text="Plugin Oficial WooCommerce" />
              <h1 className="font-jakarta text-[48px] md:text-[64px] font-black leading-[1.1] tracking-tight mb-8">
                Activa el probador virtual en tu ficha de producto y deja que tu cliente{' '}
                <span className="text-[#FF5C3A]">pruebe antes de comprar.</span>
              </h1>
              <p className="text-lg text-white/60 mb-12 leading-relaxed max-w-xl font-dm-sans">
                Lookitry se integra directamente con WooCommerce para mostrar un boton de prueba virtual dentro de cada
                producto. El cliente sube su foto, abre un modal sin salir de tu tienda y ve el resultado en una
                experiencia pensada para reducir friccion, dudas y devoluciones.
              </p>

              <div className="flex flex-wrap gap-5">
                <Link
                  href="/checkout?plan=PRO"
                  className="bg-[#FF5C3A] text-white px-10 py-5 rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl shadow-[#FF5C3A]/20 flex items-center gap-3 active:scale-95"
                >
                  Contratar Plan Pro y Descargar <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-[#FF5C3A]/10 blur-[120px] rounded-full animate-pulse" />
              <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0a] aspect-[4/3] flex items-center justify-center p-8 group transition-all duration-700 hover:border-[#FF5C3A]/30">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF5C3A]/5 to-transparent pointer-events-none" />
                <div className="w-full h-full relative flex flex-col">
                  <div className="flex items-center gap-2 p-4 bg-white/5 border-b border-white/5 rounded-t-2xl">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                  </div>
                  <div className="flex-1 flex items-center justify-center relative bg-white/[0.02]">
                    <Monitor size={120} className="text-white/5" />
                    <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 space-y-4">
                      <div className="p-6 rounded-3xl bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-xl translate-x-[-8%] group-hover:translate-x-0 transition-transform duration-700">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#7f54b3]/20 flex items-center justify-center">
                            <Image
                              src="https://woocommerce.com/wp-content/themes/woo/images/logo-woocommerce.svg"
                              alt="Woo"
                              width={24}
                              height={24}
                            />
                          </div>
                          <div>
                            <div className="text-[10px] font-extrabold text-[#c4b5fd] uppercase tracking-widest">
                              Sincronizacion activa
                            </div>
                            <div className="text-sm font-bold text-white/90">Lookitry Plugin Oficial</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 rounded-3xl bg-[#0a0a0a]/80 border border-white/10 backdrop-blur-xl translate-x-[8%] group-hover:translate-x-0 transition-transform duration-700 delay-150">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#FF5C3A]/20 flex items-center justify-center text-[#FF5C3A]">
                            <TrendingUp size={20} />
                          </div>
                          <div>
                            <div className="text-[10px] font-extrabold text-[#FF5C3A] uppercase tracking-widest">
                              Experiencia embebida
                            </div>
                            <div className="text-sm font-bold text-white/90">Modal nativo en producto</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-40" id="problem-solution">
            <div className="text-center mb-20 flex flex-col items-center">
              <SectionLabel text="Productividad E-commerce" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6 max-w-3xl leading-tight">
                Escalar tu tienda es dificil cuando el cliente todavia no puede <span className="text-white/40 italic">verse comprando.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="p-10 md:p-14 rounded-[3.5rem] bg-white/5 border border-white/10 flex flex-col hover:bg-white/[0.08] transition-all">
                <h3 className="font-jakarta text-2xl font-bold mb-8 text-white/80">Lo que hoy frena la compra online:</h3>
                <div className="space-y-8 flex-1">
                  {problemPoints.map((text, i) => (
                    <div key={i} className="flex gap-4 group">
                      <XCircle className="text-red-500/40 shrink-0 mt-1 group-hover:scale-110 transition-transform" size={24} />
                      <p className="text-white/40 text-lg leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 md:p-14 rounded-[3.5rem] bg-[#FF5C3A] border border-[#FF5C3A]/20 flex flex-col relative overflow-hidden group shadow-2xl shadow-[#FF5C3A]/20">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="font-jakarta text-2xl font-bold mb-8 text-white">Lo que resuelve Lookitry en WooCommerce:</h3>
                  <div className="space-y-8 flex-1">
                    {solutionPoints.map((item, i) => (
                      <div key={i} className="flex gap-4 items-start group">
                        <CheckCircle2 className="text-white shrink-0 mt-1 group-hover:scale-110 transition-transform" size={24} />
                        <div>
                          <span className="block font-bold text-white text-xl mb-1">{item.title}</span>
                          <p className="text-white/80 text-base leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-40">
            <div className="text-center mb-20 flex flex-col items-center">
              <SectionLabel text="Lo que incluye" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-black mb-6">
                Propuesta comparable, <span className="text-[#FF5C3A]">sin vender humo.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureCards.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex flex-col items-start h-full group hover:-translate-y-2 duration-500"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center text-[#FF5C3A] mb-8 group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h4 className="font-jakarta font-bold text-xl mb-4 text-white/90">{feat.title}</h4>
                  <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[4rem] p-12 md:p-24 text-center mb-40 relative overflow-hidden group shadow-[0_50px_100px_rgba(255,255,255,0.05)] border border-white/10">
            <div className="absolute inset-0 bg-[#FF5C3A]/5 opacity-50 pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
              <SectionLabel text="Potencia Premium" />
              <h2 className="font-jakarta text-4xl md:text-7xl font-black text-[#0a0a0a] mb-8 tracking-tighter">
                Convierte mejor sin agregar <br /> friccion al checkout.
              </h2>
              <p className="text-[#0a0a0a]/60 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-dm-sans leading-relaxed">
                El plugin de WooCommerce esta disenado para tiendas que necesitan una experiencia de try-on integrada,
                rapida y operable. Se incluye de forma exclusiva en nuestro <span className="font-bold text-[#FF5C3A]">Plan Pro</span>.
              </p>

              <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-16">
                <div className="text-center">
                  <div className="text-[#FF5C3A] text-6xl md:text-8xl font-black tracking-tighter mb-2 flex items-start gap-1 justify-center">
                    <span className="text-2xl mt-4 md:mt-6">{currency === 'COP' ? '$' : 'USD'}</span>
                    {proPrice}
                  </div>
                  <div className="text-[#0a0a0a]/40 text-xs md:text-sm uppercase font-bold tracking-[0.2em]">Suscripcion mensual</div>
                </div>
                <div className="flex flex-col gap-5 text-left p-10 bg-[#0a0a0a]/5 rounded-[2.5rem] border border-black/5 shadow-inner">
                  <div className="flex items-center gap-3 text-[#0a0a0a]/80 font-bold text-lg">
                    <CheckCircle2 size={22} className="text-green-600" />
                    Hasta {proProducts} productos activos
                  </div>
                  <div className="flex items-center gap-3 text-[#0a0a0a]/80 font-bold text-lg">
                    <CheckCircle2 size={22} className="text-green-600" />
                    {proGens} generaciones mensuales
                  </div>
                  <div className="flex items-center gap-3 text-[#0a0a0a]/80 font-bold text-lg">
                    <CheckCircle2 size={22} className="text-green-600" />
                    Plugin, sync y activacion oficial
                  </div>
                </div>
              </div>

              <Link
                href="/checkout?plan=PRO"
                id="cta-pro-plugin"
                className="bg-[#FF5C3A] text-white px-16 py-8 rounded-[2.5rem] font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#FF5C3A]/30 inline-flex items-center gap-4 group/cta"
              >
                Contratar Plan Pro y Descargar Plugin <ArrowRight size={24} className="group-hover/cta:translate-x-2 transition-transform" />
              </Link>

              <p className="mt-10 text-[#0a0a0a]/40 text-sm font-medium">
                Mas claridad para comprar. Menos friccion para instalar. Mejor base para escalar.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-40">
            <div className="text-center mb-16 flex flex-col items-center">
              <SectionLabel text="Preguntas del Plugin" />
              <h2 className="font-jakarta text-3xl md:text-5xl font-bold">
                Dudas <span className="text-[#FF5C3A]">Resueltas.</span>
              </h2>
            </div>

            <div className="grid gap-6">
              {faqs.map((faq, i) => (
                <div key={i} className="p-10 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group cursor-pointer">
                  <h3 className="font-jakarta font-bold text-xl mb-6 flex items-center justify-between text-white/90">
                    {faq.q}
                    <ArrowRight size={20} className="text-[#FF5C3A] rotate-90 group-hover:rotate-0 transition-transform duration-500" />
                  </h3>
                  <p className="text-white/40 leading-relaxed text-base group-hover:text-white/60 transition-colors">{faq.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-20 text-center">
              <div className="inline-flex flex-col items-center p-12 rounded-[3.5rem] bg-gradient-to-b from-[#FF5C3A]/10 to-transparent border border-[#FF5C3A]/20">
                <h3 className="text-2xl font-bold font-jakarta mb-6">¿Listo para activar el try-on en tu tienda?</h3>
                <Link href="/checkout?plan=PRO" className="flex items-center gap-3 text-white font-black text-xl hover:text-[#FF5C3A] transition-colors border-b-2 border-[#FF5C3A] pb-2">
                  Empieza tu Plan Pro hoy mismo <ArrowRight size={24} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
