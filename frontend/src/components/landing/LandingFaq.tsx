'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shirt, Store, CreditCard, Zap, LayoutGrid, ChevronDown, Sparkles, ArrowRight } from 'lucide-react';

const FAQ_TABS = [
  {
    id: 'probador',
    label: 'Probador IA',
    icon: <Shirt size={16} aria-hidden="true" />,
    items: [
      { q: '¿Cómo funciona el probador virtual?', a: 'El cliente sube una foto suya (selfie o foto de cuerpo completo), selecciona el producto que quiere probar y la IA genera en segundos una imagen realista mostrando cómo le quedaría la prenda o accesorio.' },
      { q: '¿Qué tipos de productos soporta el probador?', a: 'Ropa (camisas, vestidos, pantalones, chaquetas), accesorios (bolsos, cinturones, sombreros) y calzado. La calidad del resultado depende de la claridad de la foto del producto.' },
      { q: '¿Cómo integro el probador en mi tienda o web?', a: 'Tienes dos opciones: usar tu propia Tienda Virtual de Lookitry (sin código) o conectar el probador directamente en tu sitio web. Funciona en Shopify, WordPress, Wix, etc.' },
      { q: '¿Mis clientes necesitan crear una cuenta?', a: 'No. El probador es completamente público. Tus clientes solo necesitan subir una foto y elegir el producto. Sin registro, sin apps, sin fricción.' },
      { q: '¿Las fotos de mis clientes se almacenan?', a: 'Las selfies se procesan de forma temporal y se eliminan automáticamente después de generar el resultado. No almacenamos imágenes de los clientes permanentemente.' },
      { q: '¿Cuántos productos puedo tener?', a: 'El Plan Básico permite hasta 5 productos activos. El Plan Pro permite hasta 15 productos. Puedes editarlos desde tu dashboard en cualquier momento.' },
    ]
  },
  {
    id: 'mini-landing',
    label: 'Tienda Virtual',
    icon: <Store size={16} aria-hidden="true" />,
    items: [
      { q: '¿Qué es la Tienda Virtual y para qué sirve?', a: 'Es una página profesional en lookitry.com/tu-marca. Incluye tu catálogo con probador virtual integrado, botón de WhatsApp directo y diseños elegantes. Ideal para compartir en tu bio de Instagram.' },
      { q: '¿Cuánto cuesta y cuánto tarda en activarse?', a: 'Es un pago único y no tiene mensualidad adicional. La activación es inmediata: en minutos después de confirmar el pago, tu tienda ya está disponible.' },
      { q: '¿Puedo cambiar el diseño de mi tienda?', a: 'Sí. Desde tu dashboard puedes elegir entre varios estilos. También puedes actualizar tu logo, colores, slogan y horarios.' },
      { q: '¿Incluye el probador virtual?', a: 'Sí, el probador de IA está integrado directamente. Tus clientes pueden probarse productos sin salir de tu página.' },
      { q: '¿Necesito saber programar?', a: 'No. Todo se configura con formularios simples. No necesitas tocar código ni contratar desarrolladores.' },
      { q: '¿Se paga mensualidad?', a: 'No. El precio de la Tienda Virtual es un pago único. Solo requiere que mantengas tu suscripción de Lookitry activa para que el probador siga funcionando.' },
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
      { q: '¿Funciona en Shopify o Wix?', a: 'Sí. Aunque no sea vía plugin directo, puedes conectar el probador que se copia y pega en la sección de descripción o liquid de cualquier plataforma.' },
      { q: '¿El plugin tiene costo adicional?', a: 'No. El uso del plugin o la conexión directa está incluido en cualquiera de nuestros planes de suscripción (Básico o Pro).' },
      { q: '¿Es compatible con mi plantilla actual?', a: 'Nuestra tecnología se adapta al diseño de tu tienda, manteniendo siempre un aspecto limpio y profesional.' }
    ]
  }
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8 font-medium text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] border shadow-sm transition-all ${light
      ? 'bg-black/5 border-black/10 text-black/40 dark:bg-white/5 dark:border-white/10 dark:text-white/60'
      : 'bg-accent/5 border-accent/20 text-accent'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-black/20 dark:bg-white/40' : 'bg-accent'}`} aria-hidden="true" />
    {text}
  </div>
);

export default function LandingFaq() {
  const [activeTab, setActiveTab] = useState<string>('probador');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section className="bg-white dark:bg-black py-20 sm:py-24 md:py-28 lg:py-40 px-4 sm:px-6 md:px-12 relative overflow-hidden" aria-label="Preguntas frecuentes">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/3 via-transparent to-transparent" />

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <motion.div custom={0} variants={fadeInUp}>
            <SectionTag text="Resolviendo dudas" light />
          </motion.div>
          <motion.h2
            custom={1}
            variants={fadeInUp}
            className="font-jakarta text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white tracking-tight mb-6 sm:mb-8"
          >
            Preguntas <span className="text-accent">frecuentes.</span>
          </motion.h2>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="flex justify-center flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-10 md:mb-12"
          role="tablist"
          aria-label="Categorías de preguntas frecuentes"
        >
          {FAQ_TABS.map((tab, i) => {
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                custom={i}
                variants={fadeInUp}
                onClick={() => { setActiveTab(tab.id); setOpenFaqIndex(0); }}
                role="tab"
                aria-selected={active}
                aria-controls={`faq-panel-${tab.id}`}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl sm:rounded-[1.2rem] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border whitespace-nowrap ${active
                    ? 'bg-accent border-accent text-white shadow-2xl shadow-accent/30 scale-105'
                    : 'bg-warm dark:bg-white/5 border-gray-200 dark:border-white/5 text-text-muted dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-dark dark:hover:text-white/60 hover:scale-105'
                  }`}
              >
                <span className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Accordion */}
        <motion.div
          id={`faq-panel-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-warm dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 lg:p-10 shadow-sm dark:shadow-2xl overflow-hidden"
          role="tabpanel"
        >
          {FAQ_TABS.find(t => t.id === activeTab)?.items.map((item, idx) => {
            const open = openFaqIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className="border-b border-gray-200 dark:border-white/5 last:border-0 font-dm-sans"
              >
                <button
                  onClick={() => setOpenFaqIndex(open ? null : idx)}
                  aria-expanded={open}
                  className="w-full py-5 sm:py-6 md:py-7 flex items-center justify-between text-left group"
                >
                  <span className={`font-jakarta text-base sm:text-lg font-bold pr-4 transition-all duration-300 ${open ? 'text-accent' : 'text-dark dark:text-white/70 group-hover:text-dark dark:group-hover:text-white'
                    }`}>
                    {item.q}
                  </span>
                  <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500 ${open ? 'bg-accent border-accent text-white' : 'border-gray-200 dark:border-white/10 text-text-muted dark:text-white/20 group-hover:border-accent/50 group-hover:text-accent'
                      }`}
                    aria-hidden="true"
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="pb-6 sm:pb-8 text-text-muted dark:text-white/50 text-sm leading-relaxed max-w-3xl overflow-hidden"
                  >
                    {item.a}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Marketing */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 sm:mt-16 relative overflow-hidden rounded-3xl bg-dark border border-border-active dark:border-white/10 p-8 sm:p-10 md:p-12 text-center"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150px] h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

          {/* Glow effect */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 mb-6 transition-transform duration-300 hover:scale-110 hover:rotate-6"
            >
              <Sparkles size={28} className="text-accent" />
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="font-jakarta text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight"
            >
              ¿Listo para <span className="text-accent">transformar</span> tu tienda?
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="font-dm-sans text-white/50 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed"
            >
              Prueba el probador virtual de IA en tu marca y vê los resultados en pocos minutos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/trial-checkout"
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-accent text-white font-bold text-sm uppercase tracking-wider overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-accent/30"
              >
                <span className="relative z-10">Comenzar trial</span>
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <ArrowRight size={18} />
                </motion.span>
              </Link>

              <Link
                href="/planes"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-white/20 text-white/70 font-medium text-sm hover:bg-white/5 hover:text-white hover:border-white/30 hover:scale-105 transition-all duration-300"
              >
                Ver planes
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
