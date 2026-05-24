'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Rocket, ShoppingBag, Megaphone } from 'lucide-react';

const stats = [
  { value: '-40%', label: 'Menos devoluciones', Icon: ShoppingBag },
  { value: '94%', label: 'Mas conversion', Icon: Rocket },
  { value: '+30%', label: 'Mas tiempo en tienda', Icon: Camera },
  { value: '3 de 4', label: 'No compra sin probarse', Icon: Megaphone },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function LandingStats() {
  return (
    <section
      className="relative py-12 sm:py-16 lg:py-20 -mx-4 sm:-mx-8 md:-mx-16 px-4 sm:px-8 md:px-16"
      aria-label="Estadisticas"
    >
      {/* Container principal */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-br from-white to-[#fff9f5] dark:from-[#141414] dark:to-[#0f0f0f] border border-[#FF5C3A]/15 dark:border-white/5 shadow-2xl shadow-[#FF5C3A]/5 dark:shadow-none rounded-3xl py-10 sm:py-12 lg:py-16 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto relative overflow-hidden"
      >
        {/* Grid pattern sutil */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)',
          }}
        />

        {/* Orbe de blur */}
        <div className="absolute -top-20 -right-20 w-72 h-72 sm:w-96 sm:h-96 bg-[#FF5C3A]/10 rounded-full blur-3xl" />

        {/* Contenido */}
        <div className="relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-8 sm:mb-12"
          >
            <p className="text-[var(--text-secondary)] text-sm sm:text-base lg:text-lg font-medium max-w-3xl mx-auto leading-relaxed px-2">
              Tiendas con probador virtual reducen devoluciones, generan confianza y convierten mas visitas en ventas
            </p>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4 lg:gap-6 justify-center items-start w-full"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="text-center flex flex-col items-center w-full group cursor-default px-2"
              >
                {/* Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }}
                  className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FF5C3A]/10 mb-3 sm:mb-4 group-hover:bg-[#FF5C3A]/20 transition-colors duration-300"
                >
                  <stat.Icon size={18} className="sm:size-5 text-[#FF5C3A]" aria-hidden="true" />
                </motion.div>

                {/* Valor */}
                <motion.div
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-1 sm:mb-2 tabular-nums"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12 + 0.2 }}
                >
                  {stat.value}
                </motion.div>

                {/* Label */}
                <div className="text-[var(--text-muted)] text-xs sm:text-sm lg:text-base font-medium leading-tight">
                  {stat.label}
                </div>

                {/* Accent line on hover */}
                <motion.div
                  className="h-0.5 bg-[#FF5C3A] mt-2 sm:mt-3 mx-auto origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                  style={{ maxWidth: '2rem' }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}