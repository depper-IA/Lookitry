'use client';

import React from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  ShoppingBag, 
  Zap,
  Star,
  Layout,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function TiendaProfesionalPage() {
  const features = [
    {
      title: "Control Total de Inventario",
      description: "Gestiona miles de productos con WordPress + WooCommerce sin límites de slots.",
      icon: <ShoppingBag className="w-6 h-6 text-[#FF5C3A]" />
    },
    {
      title: "SEO Avanzado",
      description: "Aparece en los primeros resultados de Google con tu propio dominio .com.",
      icon: <Globe className="w-6 h-6 text-[#FF5C3A]" />
    },
    {
      title: "Pasarelas Propias",
      description: "Integra Wompi, PayPal, Stripe o MercadoPago con comisiones directas a ti.",
      icon: <Zap className="w-6 h-6 text-[#FF5C3A]" />
    },
    {
      title: "Diseño a Medida",
      description: "Una web única que refleja la identidad premium de tu marca de ropa.",
      icon: <Layout className="w-6 h-6 text-[#FF5C3A]" />
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] p-8 md:p-16">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Rocket className="w-64 h-64 text-[#FF5C3A] rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20"
          >
            <Star className="w-4 h-4 text-[#FF5C3A] fill-[#FF5C3A]" />
            <span className="text-[#FF5C3A] text-xs font-black uppercase tracking-widest italic">
              Salto al High-Ticket
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-jakarta font-black uppercase italic tracking-tighter leading-none"
          >
            ¿Tu Mini-landing se <span className="text-[#FF5C3A]">quedó pequeña?</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[var(--text-secondary)] leading-relaxed"
          >
            Es hora de escalar tu marca a una tienda profesional con WordPress + WooCommerce. 
            Automatiza tu inventario, mejora tu SEO y vende sin límites.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <a 
              href="https://wilkiedevs.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#FF5C3A]/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              Hablar con un Experto
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Offer Banner - Luxury Editorial Style */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-[3rem] bg-zinc-900 border border-white/5 p-1 relative overflow-hidden shadow-3xl group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5C3A]/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="bg-zinc-900 rounded-[2.9rem] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left relative z-10">
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20">
              <span className="w-2 h-2 rounded-full bg-[#FF5C3A] animate-pulse" />
              <span className="text-[#FF5C3A] text-[10px] font-black uppercase tracking-[0.2em]">Benefit for Partners</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-jakarta font-[950] uppercase italic leading-[0.9] text-white tracking-tighter">
              Oferta exclusiva <br />
              <span className="text-[#FF5C3A]">Partners Lookitry</span>
            </h2>
            <p className="text-zinc-400 text-base font-medium leading-relaxed">
              Al escalar tu marca con Wilkiedevs, incluimos <span className="text-white font-bold">2 meses del Plan PRO</span> de Lookitry. Un impulso total para tu conversión.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-[2.5rem] border border-white/10 min-w-[200px] group-hover:bg-[#FF5C3A]/10 transition-colors duration-500">
            <div className="text-6xl font-jakarta font-[950] italic text-white leading-none">
              FREE
            </div>
            <div className="mt-3 text-[10px] uppercase tracking-[0.4em] font-black text-[#FF5C3A]">
              PLAN PRO · 2 MESES
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="p-8 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 hover:border-[#FF5C3A]/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FF5C3A]/10 flex items-center justify-center">
              {feature.icon}
            </div>
            <h3 className="font-jakarta font-bold uppercase italic text-lg leading-tight">
              {feature.title}
            </h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Contact Section */}
      <section className="text-center space-y-8 pt-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-jakarta font-black uppercase italic">
            ¿Listo para el siguiente nivel?
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Únete a las marcas que ya están facturando miles de dólares con tecnología de Wilkiedevs.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <MessageSquare className="w-6 h-6 text-[#FF5C3A]" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Asesoría WhatsApp</div>
              <div className="font-bold">+57 300 000 0000</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
            <Star className="w-6 h-6 text-[#FF5C3A]" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Portafolio</div>
              <div className="font-bold">wilkiedevs.com</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
