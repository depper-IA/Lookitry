'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

const products = [
  { id: 'blouse', name: 'Camisa Vinotinto', src: '/assets/tryon/showcase/garment-product.webp' },
  { id: 'skirt', name: 'Falda Azul', src: '/assets/tryon/showcase/skirt-blue.webp' },
  { id: 'dress', name: 'Vestido Blanco', src: '/assets/tryon/showcase/dress-white.webp' },
];

const models = [
  { id: 'afro', name: 'Look Vinotinto', desc: 'Blusa de satin vinotinto', src: '/assets/tryon/showcase/satin-bg.png', productId: 'blouse' },
  { id: 'asian', name: 'Look Azul', desc: 'Falda azul plisada', src: '/assets/tryon/showcase/falda-azul-bg.png', productId: 'skirt' },
  { id: 'redhead', name: 'Look Blanco', desc: 'Vestido blanco midi', src: '/assets/tryon/showcase/vestido-blanco-bg.png', productId: 'dress' },
];

export default function LookBookShowcase() {
  const [selectedProductId, setSelectedProductId] = useState('blouse');
  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  return (
    <section className="relative -mx-4 sm:-mx-8 md:-mx-16 px-4 sm:px-8 md:px-16 py-16 sm:py-20 lg:py-24 bg-white dark:bg-[#0a0a0a] transition-colors duration-300 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF5C3A]/10 text-[#FF5C3A] text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles size={12} />
            Como funciona
          </div>
          <h3 className="font-jakarta text-3xl lg:text-5xl text-center text-gray-900 dark:text-white font-medium mb-6">
            Tres pasos.
            <span className="block">Fotos de <em className="text-[#FF5C3A] not-italic">moda profesional</em>.</span>
          </h3>
          <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed text-center">
            Sube la foto de tu prenda, elige el estilo y Lookitry genera las fotos con modelo en segundos. Sin estudio. Sin modelos. Sin costos.
          </p>
        </motion.div>

        {/* Selection Row: 3 Products | Arrow | Selected Product | Arrow | Logo */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0 mb-6">
          {/* Left: Product Thumbnails Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col items-center gap-2"
          >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/40">Elige una prenda</p>
          <div className="relative z-10 bg-white dark:bg-[#141414] rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 px-5 w-48 h-24 flex flex-row items-end justify-center gap-2 overflow-visible">
            {products.map((product) => {
              const isSelected = selectedProductId === product.id;
              return (
                <motion.button
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  animate={{
                    y: isSelected ? -14 : 0,
                    scale: isSelected ? 1.15 : 1,
                    opacity: isSelected ? 1 : 0.45,
                  }}
                  whileHover={{
                    y: isSelected ? -16 : -10,
                    scale: isSelected ? 1.2 : 1.1,
                    opacity: 1,
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className="relative flex flex-col items-center gap-1 pb-2 cursor-pointer"
                >
                  <div className="relative w-10 h-12">
                    <Image
                      src={product.src}
                      alt={product.name}
                      fill
                      className="object-contain drop-shadow-md"
                      sizes="40px"
                    />
                  </div>
                  <motion.div
                    animate={{ opacity: isSelected ? 1 : 0, scale: isSelected ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A]"
                  />
                </motion.button>
              );
            })}
          </div>
          </motion.div>

          {/* Connector 1 */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="hidden lg:block origin-left h-px w-10 bg-gray-300 dark:bg-white/20 shrink-0"
          />

          {/* Center: Selected Product */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedProduct.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border-2 border-[#FF5C3A]/30 w-56 h-72 overflow-hidden group"
            >
              <div
                className="absolute inset-0 opacity-[0.06] dark:opacity-[0.15]"
                style={{
                  backgroundImage: 'radial-gradient(circle, #FF5C3A 1px, transparent 1px)',
                  backgroundSize: '8px 8px',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-44 h-56">
                  <Image
                    src={selectedProduct.src}
                    alt={selectedProduct.name}
                    fill
                    className="object-contain"
                    sizes="144px"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Connector 2 */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="hidden lg:block origin-left h-px w-10 bg-gray-300 dark:bg-white/20 shrink-0"
          />

          {/* Right: Steps Box */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative z-10 bg-white dark:bg-[#141414] rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 p-5 w-48 h-24 flex flex-row items-center justify-center gap-3"
          >
            <div className="relative w-10 h-10 shrink-0">
              <Image src="/Lookitry-logo-dark.svg" alt="Lookitry" fill className="object-contain dark:opacity-0 opacity-100 transition-opacity duration-300" sizes="40px" />
              <Image src="/logo.svg" alt="Lookitry" fill className="object-contain dark:opacity-100 opacity-0 transition-opacity duration-300" sizes="40px" />
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              Look<span className="text-[#FF5C3A]">itry</span>
            </h4>
          </motion.div>
        </div>

        {/* Arrow connector: center product → center model */}
        <div className="flex justify-center mb-2">
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="origin-top flex flex-col items-center"
          >
            <div className="w-px h-8 bg-gray-300 dark:bg-white/20" />
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1l5 6 5-6" stroke="#FF5C3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </div>

        {/* Results: 3 Models — center slightly larger */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:gap-5 max-w-4xl mx-auto px-6 sm:px-4 lg:px-0">
          {models.map((model, i) => {
            let position: 'left' | 'center' | 'right' = 'center';
            if (selectedProductId === 'blouse') {
              position = i === 0 ? 'center' : i === 1 ? 'right' : 'left';
            } else if (selectedProductId === 'skirt') {
              position = i === 1 ? 'center' : i === 0 ? 'left' : 'right';
            } else {
              position = i === 2 ? 'center' : i === 1 ? 'left' : 'right';
            }

            const isCenter = position === 'center';

            return (
              <motion.div
                key={model.id}
                layout
                animate={{
                  opacity: isCenter ? 1 : 0.6,
                  y: isCenter ? -6 : 0,
                }}
                transition={{
                  layout: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.4, ease: 'easeInOut' },
                  y: { duration: 0.4, ease: 'easeInOut' },
                }}
                className={`group relative rounded-2xl overflow-hidden w-full cursor-default transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  isCenter
                    ? 'sm:w-[42%] bg-white dark:bg-[#141414] shadow-2xl border-2 border-[#FF5C3A] z-10'
                    : 'hidden sm:block sm:w-[26%] bg-white dark:bg-[#141414] shadow-lg border border-gray-200 dark:border-white/10'
                }`}
                style={{ order: position === 'center' ? 2 : position === 'left' ? 1 : 3 }}
              >
                {/* Header */}
                <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-white/10">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isCenter ? 'bg-[#FF5C3A]' : 'bg-gray-900 dark:bg-white'}`}>
                    <div className={`w-2 h-2 rounded-full ${isCenter ? 'bg-white' : 'bg-white dark:bg-gray-900'}`} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-xs ${isCenter ? 'text-[#FF5C3A]' : 'text-gray-900 dark:text-white'}`}>{model.name}</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{model.desc}</p>
                  </div>
                </div>
                {/* Image */}
                <div className="relative w-full aspect-[4/5] rounded-b-2xl overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${model.id}-${isCenter}`}
                      initial={{ opacity: 0, filter: 'blur(6px)', scale: 1.03 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                      exit={{ opacity: 0, filter: 'blur(6px)', scale: 0.98 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={model.src}
                        alt={model.name}
                        fill
                        className="object-contain group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 34vw"
                      />
                    </motion.div>
                  </AnimatePresence>
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FF5C3A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-base mb-8">
            Cada imagen que ves fue generada por IA a partir de una foto de producto. Lista para tu tienda, tu lookbook o tus redes sociales.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#FF5C3A] text-white font-bold text-sm hover:bg-[#FF5C3A]/90 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-[#FF5C3A]/30"
          >
            <Sparkles size={16} />
            Pruebalo ahora gratis
          </Link>
        </motion.div>
      </div>

    </section>
  );
}