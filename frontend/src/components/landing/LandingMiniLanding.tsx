'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Globe, Box, Sparkles, MessageCircle } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

const imageVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], delay: 0.4 },
  },
};

const ctaVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], delay: 0.6 },
  },
};

export default function LandingMiniLanding() {
  const features = [
    { title: "Página pública propia", desc: "URL en lookitry.com/tu-marca. Compártela en redes o tu bio.", icon: <Globe size={20} aria-hidden="true" /> },
    { title: "Catálogo visual", desc: "Tus productos con foto, precio y badge. Listos en segundos.", icon: <Box size={20} aria-hidden="true" /> },
    { title: "Probador IA integrado", desc: "El widget de prueba virtual está embebido directamente.", icon: <Sparkles size={20} aria-hidden="true" /> },
    { title: "WhatsApp flotante", desc: "Botón de contacto siempre visible para cerrar ventas con un clic.", icon: <MessageCircle size={20} aria-hidden="true" /> }
  ];

  return (
    <section id="mini-landing" className="bg-white dark:bg-black py-16 sm:py-20 px-4 sm:px-6 overflow-hidden" aria-label="Mini Landing Pro">
      <div className="max-w-7xl mx-auto px-0 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 font-medium text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] bg-accent/5 border border-accent/20 text-accent"
            >
              Tu propia página
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white mb-4 sm:mb-6 leading-tight"
            >
              Tu tienda online, <br />
              <span className="text-accent">sin pagar un diseñador.</span>
            </motion.h2>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10"
            >
              {features.map((feat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="dark:bg-dark-input bg-warm border border-white/5 dark:border-border-active p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl hover:bg-dark-surface dark:hover:bg-dark-surface hover:shadow-xl transition-all group"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h4 className="font-jakarta font-bold text-sm sm:text-base text-black dark:text-white mb-1.5 sm:mb-2">{feat.title}</h4>
                  <p className="text-text-muted dark:text-white/60 text-xs leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={ctaVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="flex flex-wrap gap-3 sm:gap-4"
            >
              <Link href="/checkout?plan=LANDING" className="bg-accent text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm transition-all hover:scale-105 shadow-xl shadow-accent/20">
                Crear mi página ahora
              </Link>
              <Link href="/planes" className="bg-white dark:bg-dark text-dark dark:text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm transition-all hover:bg-accent dark:hover:bg-accent dark:hover:text-white">
                Ver planes y precios
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={imageVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            whileHover={{ scale: 1.02 }}
            className="hidden lg:block relative"
          >
            <div className="relative z-10 rounded-2xl sm:rounded-[2rem] overflow-hidden border border-black/10 dark:border-gray-200 shadow-2xl group-hover:shadow-3xl transition-shadow">
              <Image src="/hero/promo_landing.png" alt="Vista previa de Lookitry Landing" width={600} height={400} className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            <div className="absolute -top-6 sm:-top-10 -right-6 sm:-right-10 w-32 h-32 sm:w-40 sm:h-40 bg-accent/10 blur-3xl rounded-full" aria-hidden="true" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
