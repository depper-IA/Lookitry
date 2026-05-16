'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, MessageCircle, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { LANDING_COPY } from './LandingCopy';

const LandingSocialProof = () => {
  const { title, instagram, whatsapp, metrics } = LANDING_COPY.social_proof;

  const tiktok = {
    title: 'Videos en TikTok',
    description: 'Convierte tus videos virales en ventas. Agrega el link del probador en tu bio y que tus seguidoras se prueben la ropa antes de comprar.',
    tag: '@Lookitry',
  };

  return (
    <section className="py-24 bg-black dark:bg-white border-y border-white/10 dark:border-gray-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-[#FF5C3A] font-bold tracking-widest uppercase text-xs mb-4 block"
          >
            Social OS
          </motion.span>
          <h2 className="text-3xl md:text-5xl font-bold text-white dark:text-gray-900 font-jakarta tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex flex-col gap-12">

          {/* Social Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Instagram Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/10 dark:bg-gray-50 p-8 rounded-[2.5rem] border border-white/20 dark:border-gray-200 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-orange-500/10 blur-3xl group-hover:opacity-100 opacity-0 transition-opacity" />

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20">
                <Instagram className="text-white w-7 h-7" />
              </div>

              <h3 className="text-2xl font-bold text-white dark:text-gray-900 mb-4 font-jakarta">{instagram.title}</h3>
              <p className="text-white/60 dark:text-gray-500 leading-relaxed mb-6">{instagram.description}</p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-gray-100 rounded-full text-xs font-medium text-white/80 dark:text-gray-600">
                <Zap className="w-3 h-3 text-[#FF5C3A]" />
                {instagram.tag}
              </div>

              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 w-24 h-24 bg-pink-100 rounded-full blur-2xl"
              />
            </motion.div>

            {/* TikTok Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/10 dark:bg-gray-50 p-8 rounded-[2.5rem] border border-white/20 dark:border-gray-200 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-pink-500/10 blur-3xl group-hover:opacity-100 opacity-0 transition-opacity" />

              <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-6 shadow-lg shadow-black/20">
                {/* TikTok logo SVG */}
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-white dark:text-gray-900 mb-4 font-jakarta">{tiktok.title}</h3>
              <p className="text-white/60 dark:text-gray-500 leading-relaxed mb-6">{tiktok.description}</p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-gray-100 rounded-full text-xs font-medium text-white/80 dark:text-gray-600">
                <Zap className="w-3 h-3 text-[#FF5C3A]" />
                {tiktok.tag}
              </div>

              <motion.div
                animate={{ y: [0, -8, 0], x: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 w-24 h-24 bg-cyan-100 rounded-full blur-2xl"
              />
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/10 dark:bg-gray-50 p-8 rounded-[2.5rem] border border-white/20 dark:border-gray-200 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 blur-3xl group-hover:opacity-100 opacity-0 transition-opacity" />

              <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                <MessageCircle className="text-white w-7 h-7" />
              </div>

              <h3 className="text-2xl font-bold text-white dark:text-gray-900 mb-4 font-jakarta">{whatsapp.title}</h3>
              <p className="text-white/60 dark:text-gray-500 leading-relaxed mb-6">{whatsapp.description}</p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-gray-100 rounded-full text-xs font-medium text-white/80 dark:text-gray-600">
                <ShieldCheck className="w-3 h-3 text-[#25D366]" />
                {whatsapp.tag}
              </div>

              <motion.div
                animate={{ x: [0, 10, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -left-4 w-20 h-20 bg-green-100 rounded-full blur-2xl"
              />
            </motion.div>

          </div>

          {/* Metrics Row */}
          <div className="flex flex-wrap justify-center gap-10 pt-4 border-t border-white/10 dark:border-gray-100">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 flex items-center justify-center shrink-0 group-hover:bg-[#FF5C3A] transition-colors duration-500">
                  <TrendingUp className="text-[#FF5C3A] w-5 h-5 group-hover:text-white transition-colors duration-500" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white dark:text-gray-900 font-jakarta tracking-tight">
                    {metric.value}
                  </div>
                  <div className="text-white/60 dark:text-gray-500 font-medium uppercase tracking-widest text-[10px]">
                    {metric.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingSocialProof;
