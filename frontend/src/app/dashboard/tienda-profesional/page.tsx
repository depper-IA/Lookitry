'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Rocket,
  ArrowRight,
  Globe,
  ShoppingBag,
  Zap,
  Star,
  Layout,
  ChevronLeft,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function TiendaProfesionalPage() {
  const { brand } = useAuth();
  const contactPhone = brand?.phone || '+57 310 543 6281';
  const cleanPhone = contactPhone.replace(/\D/g, '');
  const whatsappHref = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hola, quiero escalar mi marca a una tienda profesional con Wilkie Devs.')}`
    : 'https://wa.me/573105436281';

  const features = [
    {
      title: 'Control total de inventario',
      description: 'Gestiona catalogos amplios con WordPress + WooCommerce y una operacion mucho mas flexible.',
      icon: <ShoppingBag className="w-6 h-6 text-[#FF5C3A]" />,
    },
    {
      title: 'SEO avanzado',
      description: 'Trabaja posicionamiento, categorias, contenidos y dominio propio para crecer en Google.',
      icon: <Globe className="w-6 h-6 text-[#FF5C3A]" />,
    },
    {
      title: 'Pasarelas propias',
      description: 'Integra Wompi, PayPal y otros medios con control directo sobre tus cobros.',
      icon: <Zap className="w-6 h-6 text-[#FF5C3A]" />,
    },
    {
      title: 'Diseno a medida',
      description: 'Construimos una tienda alineada con la identidad de tu marca y tu flujo comercial.',
      icon: <Layout className="w-6 h-6 text-[#FF5C3A]" />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-3 text-sm font-bold text-[var(--text-primary)] shadow-xl shadow-black/5 transition-all hover:border-[#FF5C3A]/30 hover:text-[#FF5C3A]"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>

        <a
          href="https://wilkiedevs.com/portfolio/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all hover:border-[#FF5C3A]/30 hover:text-[#FF5C3A]"
        >
          Ver portafolio
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-8 md:p-16">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Rocket className="w-64 h-64 rotate-12 text-[#FF5C3A]" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#FF5C3A]/20 bg-[#FF5C3A]/10 px-4 py-1.5"
          >
            <Star className="h-4 w-4 fill-[#FF5C3A] text-[#FF5C3A]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#FF5C3A]">
              Escala con Wilkie Devs
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-jakarta text-4xl font-black leading-none tracking-tight md:text-6xl"
          >
            Lleva tu marca de Lookitry a una
            <span className="text-[#FF5C3A]"> tienda profesional</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]"
          >
            Si tu mini landing ya valida mercado, el siguiente paso es una tienda completa con WooCommerce, dominio propio,
            mejor SEO y una operacion lista para crecer con mas catalogo y mas conversion.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl bg-[#FF5C3A] px-8 py-4 font-black uppercase tracking-widest text-white shadow-lg shadow-[#FF5C3A]/20 transition-all hover:scale-105"
            >
              Hablar por WhatsApp
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="https://wilkiedevs.com/portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] px-8 py-4 font-black uppercase tracking-widest text-[var(--text-primary)] transition-all hover:border-[#FF5C3A]/30 hover:text-[#FF5C3A]"
            >
              Ver proyectos reales
              <ExternalLink className="h-5 w-5" />
            </a>
          </motion.div>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-zinc-900 p-1 shadow-2xl"
      >
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF5C3A]/5 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center justify-between gap-12 rounded-[2.9rem] bg-zinc-900 p-10 text-center md:flex-row md:p-14 md:text-left">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#FF5C3A]/20 bg-[#FF5C3A]/10 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#FF5C3A] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C3A]">Upgrade partner</span>
            </div>
            <h2 className="font-jakarta text-4xl font-[950] leading-[0.9] tracking-tight text-white md:text-5xl">
              Oferta exclusiva
              <br />
              <span className="text-[#FF5C3A]">Partners Lookitry</span>
            </h2>
            <p className="text-base font-medium leading-relaxed text-zinc-400">
              Al escalar tu marca con Wilkie Devs, incluimos <span className="font-bold text-white">2 meses del Plan PRO</span> de Lookitry para impulsar tu conversion desde el primer mes.
            </p>
          </div>
          <div className="flex min-w-[220px] flex-col items-center justify-center rounded-[2.5rem] border border-white/10 bg-white/5 p-8 transition-colors duration-500 hover:bg-[#FF5C3A]/10">
            <div className="font-jakarta text-6xl font-[950] leading-none text-white">FREE</div>
            <div className="mt-3 text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5C3A]">
              PLAN PRO · 2 MESES
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-4 rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-8 transition-colors hover:border-[#FF5C3A]/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF5C3A]/10">
              {feature.icon}
            </div>
            <h3 className="font-jakarta text-lg font-bold leading-tight text-[var(--text-primary)]">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>

      <section className="space-y-8 pt-8 text-center">
        <div className="space-y-4">
          <h2 className="font-jakarta text-3xl font-black text-[var(--text-primary)]">
            ¿Listo para el siguiente nivel?
          </h2>
          <p className="mx-auto max-w-xl text-[var(--text-secondary)]">
            Revisa casos reales, valida el alcance del proyecto y escríbenos directamente para cotizar tu tienda profesional.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 transition-all hover:border-[#FF5C3A]/30"
          >
            <Phone className="h-6 w-6 text-[#FF5C3A]" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Asesoria WhatsApp</div>
              <div className="font-bold text-[var(--text-primary)]">{contactPhone}</div>
            </div>
          </a>

          <a
            href="https://wilkiedevs.com/portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 transition-all hover:border-[#FF5C3A]/30"
          >
            <Star className="h-6 w-6 text-[#FF5C3A]" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Portafolio</div>
              <div className="font-bold text-[var(--text-primary)]">wilkiedevs.com/portfolio</div>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
