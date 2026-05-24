'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Rocket, TrendingUp, ShoppingBag, Megaphone } from 'lucide-react';

const stats = [
  { value: '-40%', label: 'Reduccion en devoluciones con prueba virtual activa', Icon: ShoppingBag },
  { value: '+64%', label: 'De compradores prefieren tiendas con probador virtual', Icon: TrendingUp },
  { value: '94%', label: 'Mayor tasa de conversion con experiencia de prueba', Icon: Rocket },
  { value: '+30%', label: 'Mas tiempo navegando en tiendas con probador virtual', Icon: Camera },
  { value: '3 de 4', label: 'Clientes no compran por no poder probarse la prenda', Icon: Megaphone },
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
      {/* Container principal con fondo oscuro */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#0a0a0a] rounded-3xl py-12 lg:py-16 px-8 lg:px-12 max-w-6xl mx-auto relative overflow-hidden"
      >
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #ffffff 1px, transparent 1px),
              linear-gradient(to bottom, #ffffff 1px, transparent 1px)
            `,
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)',
          }}
        />

        {/* Orbes de blur */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FF5C3A]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF5C3A]/10 rounded-full blur-3xl" />

        {/* Contenido */}
        <div className="relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-12"
          >
            <p className="text-white/70 text-base lg:text-lg font-medium max-w-3xl mx-auto leading-relaxed">
              Las tiendas que ofrecen probador virtual reducen devoluciones, aumentan la confianza del comprador y convierten más visitas en ventas
            </p>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-5 md:gap-x-2 lg:gap-x-6 justify-center items-start w-full"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="text-center flex flex-col items-center w-full group cursor-default"
              >
                {/* Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FF5C3A]/10 mb-4 group-hover:bg-[#FF5C3A]/20 transition-colors duration-300"
                >
                  <stat.Icon size={20} className="text-[#FF5C3A]" aria-hidden="true" />
                </motion.div>

                {/* Valor */}
                <motion.div
                  className="text-2xl lg:text-3xl font-bold text-white mb-2 tabular-nums"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12 + 0.2 }}
                >
                  {stat.value}
                </motion.div>

                {/* Label */}
                <div className="text-white/40 text-sm lg:text-base font-medium">
                  {stat.label}
                </div>

                {/* Accent line on hover */}
                <motion.div
                  className="h-0.5 bg-[#FF5C3A] mt-3 mx-auto origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
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