'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, MessageCircle, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { LANDING_COPY } from './LandingCopy';

const LandingSocialProof = () => {
  const { title, instagram, whatsapp, metrics } = LANDING_COPY.social_proof;

  return (
    <section className="py-24 bg-[#0a0a0a] border-y border-white/[0.03]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-[#FF5C3A] font-bold tracking-widest uppercase text-xs mb-4 block"
          >
            Social OS
          </motion.span>
          <h2 className="text-3xl md:text-5xl font-bold text-white font-jakarta tracking-tight">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Instagram / WhatsApp Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Instagram Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-[#141414] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-orange-500/10 blur-3xl group-hover:opacity-100 opacity-0 transition-opacity" />
              
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20">
                <Instagram className="text-white w-7 h-7" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4 font-jakarta">{instagram.title}</h3>
              <p className="text-[#999] leading-relaxed mb-6">{instagram.description}</p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-xs font-medium text-white/70">
                <Zap className="w-3 h-3 text-[#FF5C3A]" />
                {instagram.tag}
              </div>

              {/* Floating notification micro-animation */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"
              />
            </motion.div>

            {/* WhatsApp Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-[#141414] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 blur-3xl group-hover:opacity-100 opacity-0 transition-opacity" />
              
              <div className="w-14 h-14 rounded-2xl bg-[#25D366] flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                <MessageCircle className="text-white w-7 h-7" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4 font-jakarta">{whatsapp.title}</h3>
              <p className="text-[#999] leading-relaxed mb-6">{whatsapp.description}</p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-xs font-medium text-white/70">
                <ShieldCheck className="w-3 h-3 text-[#25D366]" />
                {whatsapp.tag}
              </div>

              {/* Floating chat bubble micro-animation */}
              <motion.div
                animate={{ 
                  x: [0, 10, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -left-4 w-20 h-20 bg-green-500/5 rounded-full blur-2xl"
              />
            </motion.div>

          </div>

          {/* Metrics Column */}
          <div className="lg:pl-12">
            <div className="space-y-12">
              {metrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-6 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 flex items-center justify-center shrink-0 group-hover:bg-[#FF5C3A] transition-colors duration-500">
                    <TrendingUp className="text-[#FF5C3A] w-6 h-6 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-2 font-jakarta tracking-tight">
                      {metric.value}
                    </div>
                    <div className="text-[#999] font-medium uppercase tracking-widest text-[10px]">
                      {metric.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingSocialProof;
