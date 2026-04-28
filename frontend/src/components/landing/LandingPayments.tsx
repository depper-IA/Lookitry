'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Check, Zap } from 'lucide-react';

const PAYMENT_LOGOS = [
  { name: 'Visa', url: '/payment-visa.svg' },
  { name: 'Mastercard', url: '/payment-mastercard.svg' },
  { name: 'PSE', url: '/payment-pse.svg' },
  { name: 'Nequi', url: '/payment-nequi.svg' },
  { name: 'Bancolombia', url: '/payment-bancolombia.svg' },
  { name: 'PayPal', url: '/payment-paypal.svg' },
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
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

const logoVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: 0.3 + i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const badgeVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.6 + i * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const SECURITY_BADGES = [
  { icon: <ShieldCheck size={16} aria-hidden="true" />, text: 'SSL Encrypted 256-bit' },
  { icon: <Check size={16} aria-hidden="true" />, text: 'PCI DSS Verified' },
  { icon: <Zap size={16} aria-hidden="true" />, text: 'Activación Inmediata' },
];

export default function LandingPayments() {
  return (
    <section className="bg-white dark:bg-black py-20 sm:py-24 md:py-28 lg:py-32 px-4 sm:px-6 relative overflow-hidden" aria-label="Medios de pago">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF5C3A]/3 via-transparent to-transparent" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="text-center mb-12 sm:mb-14 md:mb-16"
        >
          <motion.div
            custom={0}
            variants={fadeInUp}
            className="flex items-center justify-center gap-2 mb-3 sm:mb-4 text-[#10b981]"
          >
            <ShieldCheck size={18} aria-hidden="true" />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[.2em] sm:tracking-[.25em]">Transacciones Protegidas</span>
          </motion.div>
          <motion.h2
            custom={1}
            variants={fadeInUp}
            className="font-jakarta font-bold text-2xl sm:text-3xl md:text-4xl text-black dark:text-white mb-3 sm:mb-4"
          >
            Medios de pago disponibles
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeInUp}
            className="text-sm text-[#666] dark:text-white/70 max-w-md mx-auto font-dm-sans font-light"
          >
            Utilizamos pasarelas certificadas Wompi y PayPal para garantizar que tus datos estén siempre seguros.
          </motion.p>
        </motion.div>

        {/* Payment logos */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-10 md:gap-12 lg:gap-16"
        >
          {PAYMENT_LOGOS.map((logo, i) => (
            <motion.div
              key={logo.name}
              custom={i}
              variants={logoVariants}
              className="relative h-8 sm:h-10 w-20 sm:w-28 group cursor-pointer"
            >
              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 rounded-lg bg-[#FF5C3A]/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ scale: 1.5 }}
              />
              <Image
                src={logo.url}
                alt={logo.name}
                title={logo.name}
                fill
                className="object-contain transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg dark:brightness-0 dark:invert"
                sizes="112px"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Security badges */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="mt-10 sm:mt-12 md:mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10"
        >
          {SECURITY_BADGES.map((badge, i) => (
            <motion.div
              key={badge.text}
              custom={i}
              variants={badgeVariants}
              className="group flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-[#f8f6f4] dark:bg-white/5 border border-[#e8e4df] dark:border-white/10 hover:border-[#FF5C3A]/40 hover:bg-[#FF5C3A]/5 transition-all duration-300 cursor-default"
            >
              <span className="text-[#FF5C3A] shrink-0 group-hover:scale-110 transition-transform duration-300">
                {badge.icon}
              </span>
              <span className="text-[9px] sm:text-[10px] text-black dark:text-white font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] group-hover:text-[#FF5C3A] transition-colors duration-300">
                {badge.text}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
