'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shirt, Store, CreditCard, Zap, LayoutGrid, ChevronDown, Sparkles, ArrowRight } from 'lucide-react';

const FAQ_TABS = [
  {
    id: 'probador',
    label: 'Probador IA',
    icon: <Shirt size={16} aria-hidden="true" />,
    items: [
      { q: '¿Cómo funciona el probador virtual?', a: 'El cliente sube una foto suya (selfie o foto de cuerpo completo), selecciona el producto que quiere probar y la IA genera en segundos una imagen realista mostrando cómo le quedaría la prenda o accesorio.' },
      { q: '¿Qué tipos de productos soporta el probador?', a: 'Ropa (camisas, vestidos, pantalones, chaquetas), accesorios (bolsos, cinturones, sombreros) y calzado. La calidad del resultado depende de la claridad de la foto del producto.' },
      { q: '¿Cómo integro el probador en mi tienda o web?', a: 'Tienes dos opciones: usar tu mini-landing (sin código) o copiar el widget embebible desde tu dashboard y pegarlo en tu sitio web. Funciona en Shopify, WordPress, Wix, etc.' },
      { q: '¿Mis clientes necesitan crear una cuenta?', a: 'No. El probador es completamente público. Tus clientes solo necesitan subir una foto y elegir el producto. Sin registro, sin apps, sin fricción.' },
      { q: '¿Las fotos de mis clientes se almacenan?', a: 'Las selfies se procesan de forma temporal y se eliminan automáticamente después de generar el resultado. No almacenamos imágenes de los clientes permanentemente.' },
      { q: '¿Cuántos productos puedo tener?', a: 'El Plan Básico permite hasta 5 productos activos. El Plan Pro permite hasta 15 productos. Puedes editarlos desde tu dashboard en cualquier momento.' },
    ]
  },
  {
    id: 'mini-landing',
    label: 'Mini-Landing',
    icon: <Store size={16} aria-hidden="true" />,
    items: [
      { q: '¿Qué es la mini-landing y para qué sirve?', a: 'Es una página pública profesional en lookitry.com/tu-marca. Incluye tu catálogo con probador virtual integrado, botón de WhatsApp flotante y hasta 3 templates de diseño. Ideal para compartir en redes o bio de Instagram.' },
      { q: '¿Cuánto cuesta y cuánto tarda en activarse?', a: 'Es un pago único y no tiene mensualidad adicional. La activación es inmediata: en minutos después de confirmar el pago, tu página ya está disponible.' },
      { q: '¿Puedo cambiar el diseño de mi mini-landing?', a: 'Sí. Desde tu dashboard puedes elegir entre 3 templates: Clásico, Editorial y Probador. También puedes actualizar tu logo, colores, slogan y horarios.' },
      { q: '¿Incluye el probador virtual?', a: 'Sí, el probador de IA está integrado directamente en tu página. Tus clientes pueden probarse productos sin salir de tu mini-landing.' },
      { q: '¿Necesito saber programar?', a: 'No. Todo se configura desde tu dashboard con formularios simples. No necesitas tocar código ni contratar desarrolladores.' },
      { q: '¿Se paga mensualidad?', a: 'No. El precio de la mini-landing es un pago único de por vida. Solo requiere que mantengas tu suscripción de Lookitry activa para que el probador siga funcionando.' },
    ]
  },
  {
    id: 'pagos',
    label: 'Pagos',
    icon: <CreditCard size={16} aria-hidden="true" />,
    items: [
      { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos pagos a través de Wompi (Visa, Mastercard, PSE y Nequi) y PayPal para pagos en USD. También coordinamos pagos manuales por WhatsApp.' },
      { q: '¿Hay descuentos por pagar varios meses?', a: 'Pagar 3 meses te da 5% de descuento, 6 meses 10% y 12 meses 15%. Se aplican automáticamente al finalizar la compra.' },
      { q: '¿El pago es seguro?', a: 'Sí. Todos los pagos se procesan a través de Wompi, una pasarela certificada. Nosotros nunca almacenamos los datos de tu tarjeta.' },
      { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí. No hay contratos de permanencia. Puedes cancelar tu suscripción cuando quieras desde tu dashboard.' },
      { q: '¿Qué pasa si no renuevo mi plan?', a: 'Tu cuenta queda suspendida al vencer el período pagado. Tus datos se conservan por 30 días para que puedas reactivar sin perder nada.' }
    ]
  },
  {
    id: 'generaciones',
    label: 'Generaciones',
    icon: <Zap size={16} aria-hidden="true" />,
    items: [
      { q: '¿Qué es una "generación"?', a: 'Cada vez que un cliente usa el probador virtual para ver cómo le queda un producto, se consume una generación. Es el proceso de IA que crea la imagen personalizada.' },
      { q: '¿Qué pasa si agoto mis generaciones?', a: 'El probador deja de estar disponible hasta que se reinicie el contador el siguiente mes o hasta que hagas un upgrade de plan.' },
      { q: '¿Cuántas generaciones incluye cada plan?', a: 'El Plan Básico incluye 400 generaciones por mes. El Plan Pro incluye 1.200 generaciones por mes. El contador se reinicia el primer día de cada mes.' },
      { q: '¿Puedo ver cuántas he usado?', a: 'Sí. En tu dashboard tienes analíticas en tiempo real del consumo de generaciones y visitas a tu catálogo.' },
      { q: '¿Las generaciones no usadas se acumulan?', a: 'No. Las generaciones no utilizadas en el periodo actual no se transfieren al siguiente mes.' },
      { q: '¿Cuánto tarda en generar una imagen?', a: 'Normalmente entre 10 y 25 segundos, dependiendo de la complejidad de la prenda y la pose del cliente.' }
    ]
  },
  {
    id: 'plugin',
    label: 'Plugin/Integración',
    icon: <LayoutGrid size={16} aria-hidden="true" />,
    items: [
      { q: '¿Tienen plugin para WooCommerce?', a: 'Sí, contamos con un plugin oficial para WordPress/WooCommerce que permite integrar el probador en minutos sin tocar código.' },
      { q: '¿Funciona en Shopify o Wix?', a: 'Sí. Aunque no sea vía plugin directo, puedes usar nuestro widget embebible (Iframe) que se copia y pega en la sección de descripción o liquid de cualquier plataforma.' },
      { q: '¿El plugin tiene costo adicional?', a: 'No. El uso del plugin o el widget está incluido en cualquiera de nuestros planes de suscripción (Básico o Pro).' },
      { q: '¿Es compatible con mi plantilla actual?', a: 'Nuestra tecnología es agnóstica al diseño. Se adapta al contenedor donde lo coloque, manteniendo siempre un aspecto limpio y profesional.' }
    ]
  }
];

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8 font-medium text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] border shadow-sm transition-all ${light
      ? 'bg-black/5 border-black/10 text-black/40 dark:bg-white/5 dark:border-white/10 dark:text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-black/20 dark:bg-white/40' : 'bg-[#FF5C3A]'}`} aria-hidden="true" />
    {text}
  </div>
);

export default function LandingFaq() {
  const [activeTab, setActiveTab] = useState<string>('probador');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section className="bg-white dark:bg-black py-20 sm:py-24 md:py-28 lg:py-40 px-4 sm:px-6 md:px-12 border-t border-[#eeebe7] dark:border-white/5" aria-label="Preguntas frecuentes">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <SectionTag text="Resolviendo dudas" light />
          <h2 className="font-jakarta text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white tracking-tight mb-6 sm:mb-8">Preguntas <span className="text-[#FF5C3A]">frecuentes.</span></h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-center flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-10 md:mb-12" role="tablist" aria-label="Categorías de preguntas frecuentes">
          {FAQ_TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setOpenFaqIndex(0); }}
                role="tab"
                aria-selected={active}
                aria-controls={`faq-panel-${tab.id}`}
                className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 md:px-7 py-2.5 sm:py-3 md:py-3.5 rounded-xl sm:rounded-[1.2rem] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border whitespace-nowrap ${active
                    ? 'bg-[#FF5C3A] border-[#FF5C3A] text-white shadow-2xl shadow-[#FF5C3A]/30'
                    : 'bg-[#f8f6f4] dark:bg-white/5 border-[#e8e4df] dark:border-white/5 text-[#666] dark:text-white/40 hover:bg-[#eeebe7] dark:hover:bg-white/10 hover:text-[#0a0a0a] dark:hover:text-white/60'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>

        {/* Accordion */}
        <div id={`faq-panel-${activeTab}`} className="bg-[#f8f6f4] dark:bg-[#111] border border-[#e8e4df] dark:border-white/5 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 lg:p-10 shadow-sm dark:shadow-2xl overflow-hidden" role="tabpanel">
          {FAQ_TABS.find(t => t.id === activeTab)?.items.map((item, idx) => {
            const open = openFaqIndex === idx;
            return (
              <div key={idx} className="border-b border-[#e8e4df] dark:border-white/5 last:border-0 font-dm-sans">
                <button
                  onClick={() => setOpenFaqIndex(open ? null : idx)}
                  aria-expanded={open}
                  className="w-full py-5 sm:py-6 md:py-7 flex items-center justify-between text-left group transition-all"
                >
                  <span className={`font-jakarta text-base sm:text-lg font-bold pr-4 transition-all duration-300 ${open ? 'text-[#FF5C3A]' : 'text-[#0a0a0a] dark:text-white/70 group-hover:text-[#0a0a0a] dark:group-hover:text-white'}`}>
                    {item.q}
                  </span>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500 ${open ? 'bg-[#FF5C3A] border-[#FF5C3A] rotate-180' : 'border-[#e8e4df] dark:border-white/10 text-[#666] dark:text-white/20'
                    }`} aria-hidden="true">
                    <ChevronDown size={18} />
                  </div>
                </button>
                {open && (
                  <div className="pb-6 sm:pb-8 text-[#666] dark:text-white/50 text-sm leading-relaxed max-w-3xl animate-in fade-in slide-in-from-top-2 duration-300">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Marketing */}
        <div className="mt-12 sm:mt-16 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#0a0a0a] dark:from-black dark:via-[#111] dark:to-black p-8 sm:p-10 md:p-12 text-center border border-white/5">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-[#FF5C3A]/50 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150px] h-[1px] bg-gradient-to-r from-transparent via-[#FF5C3A]/30 to-transparent" />
          
          {/* Glow effect */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#FF5C3A]/10 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 mb-6">
              <Sparkles size={28} className="text-[#FF5C3A]" />
            </div>
            
            <h3 className="font-jakarta text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              ¿Listo para <span className="text-[#FF5C3A]">transformar</span> tu tienda?
            </h3>
            
            <p className="font-dm-sans text-white/50 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Prueba el probador virtual de IA en tu marca y vê los resultados en pocos minutos.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/trial-checkout"
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#FF5C3A] text-white font-bold text-sm uppercase tracking-wider overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5C3A]/30"
              >
                <span className="relative z-10">Comenzar trial</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              
              <Link
                href="/planes"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-white/20 text-white/70 font-medium text-sm hover:bg-white/5 hover:text-white hover:border-white/30 transition-all duration-300"
              >
                Ver planes
              </Link>
            </div>
          </div>
        </div>

        
      </div>
    </section>
  );
}
