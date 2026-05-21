'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Camera, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';

const products = [
  { id: 'blouse', name: 'Camisa Vinotinto', src: '/assets/tryon/showcase/garment-product.webp' },
  { id: 'skirt', name: 'Falda Azul', src: '/assets/tryon/showcase/skirt-blue.webp' },
  { id: 'dress', name: 'Vestido Blanco', src: '/assets/tryon/showcase/dress-white.webp' },
];

const models = [
  { id: 'afro', name: 'Afro', desc: 'Estilo urbano', src: '/assets/tryon/showcase/blusa-satin-chica.jpg', productId: 'blouse' },
  { id: 'asian', name: 'Asiatica', desc: 'Estilo casual', src: '/assets/tryon/showcase/falda-azul-chica.jpg', productId: 'skirt' },
  { id: 'redhead', name: 'Pelirroja', desc: 'Estilo elegante', src: '/assets/tryon/showcase/vestido-blanco-chica.jpg', productId: 'dress' },
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
            Nuevo
          </div>
          <h3 className="text-3xl lg:text-5xl text-center text-gray-900 dark:text-white font-medium mb-6">
            Olvida el costoso estudio.
            <span className="block">Crea con <em className="text-[#FF5C3A] not-italic">LookBook</em> en su lugar.</span>
          </h3>
          <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed text-center">
            Olvida los costosos montajes de estudio o los almacenes caoticos. LookBook transforma cualquier prenda en fotografia de moda profesional en segundos, ahorrandote miles mientras ofrece resultados de calidad de revista.
          </p>
        </motion.div>

        {/* Selection Row: 3 Products | Arrow | Selected Product | Arrow | Logo */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 mb-16">
          {/* Left: 3 Product Thumbnails */}
          <div className="flex flex-row gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`relative rounded-xl p-2 border-2 transition-all duration-300 ${
                  selectedProductId === product.id
                    ? 'bg-[#FF5C3A]/5 border-[#FF5C3A] shadow-lg scale-105'
                    : 'bg-white dark:bg-[#141414] border-gray-200 dark:border-white/10 hover:border-[#FF5C3A]/50'
                }`}
              >
                <div className="relative w-14 h-14">
                  <Image
                    src={product.src}
                    alt={product.name}
                    fill
                    className="object-contain"
                    sizes="56px"
                  />
                </div>
                {selectedProductId === product.id && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#FF5C3A] flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Arrow 1 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-[#FF5C3A] text-white shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>

          {/* Center: Selected Product */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedProduct.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border-2 border-[#FF5C3A]/30 w-48 h-48 overflow-hidden group"
            >
              <div 
                className="absolute inset-0 opacity-[0.06] dark:opacity-[0.15]"
                style={{
                  backgroundImage: 'radial-gradient(circle, #FF5C3A 1px, transparent 1px)',
                  backgroundSize: '8px 8px',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-36 h-36">
                  <Image
                    src={selectedProduct.src}
                    alt={selectedProduct.name}
                    fill
                    className="object-contain"
                    sizes="144px"
                  />
                </div>
              </div>
              <div className="absolute bottom-3 left-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF5C3A] text-white text-[10px] font-bold">
                  <Camera size={10} />
                  {selectedProduct.name}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Arrow 2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-[#FF5C3A] text-white shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>

          {/* Right: Logo Box */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative z-10 bg-white dark:bg-[#141414] rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 p-5 w-56 flex flex-col items-center gap-3"
          >
            <div className="relative w-14 h-14">
              <Image
                src="/logo.svg"
                alt="LookBook AI Logo"
                fill
                className="object-contain"
                sizes="56px"
              />
            </div>
            <div className="text-center">
              <h4 className="text-base font-bold text-gray-900 dark:text-white">LookBook AI</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fotos de revista</p>
            </div>
            <div className="w-full h-px bg-gray-200 dark:bg-white/10" />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-relaxed">
              Transforma cualquier prenda en fotografia de moda profesional en segundos
            </p>
          </motion.div>
        </div>

        {/* Results: 3 Models with Middle One Highlighted */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto">
          {models.map((model, i) => {
            const isCenter = model.productId === selectedProductId;
            const isLeft = (i === 0 && selectedProductId !== 'blouse') || (i === 1 && selectedProductId === 'blouse');
            const isRight = (i === 2 && selectedProductId !== 'dress') || (i === 1 && selectedProductId === 'dress');
            
            // Center position based on selected product
            let position: 'left' | 'center' | 'right' = 'center';
            if (selectedProductId === 'blouse') {
              position = i === 0 ? 'center' : i === 1 ? 'right' : 'left';
            } else if (selectedProductId === 'skirt') {
              position = i === 1 ? 'center' : i === 0 ? 'left' : 'right';
            } else {
              position = i === 2 ? 'center' : i === 1 ? 'left' : 'right';
            }

            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${
                  position === 'center'
                    ? 'bg-white dark:bg-[#141414] shadow-xl border-2 border-[#FF5C3A] scale-105 z-10 order-2 lg:order-2'
                    : 'bg-white dark:bg-[#141414] shadow-lg border border-gray-200 dark:border-white/10 opacity-60 hover:opacity-100 order-1 lg:order-1'
                }`}
                style={{ order: position === 'center' ? 2 : position === 'left' ? 1 : 3 }}
              >
                {/* Header */}
                <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-white/10">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${position === 'center' ? 'bg-[#FF5C3A]' : 'bg-gray-900 dark:bg-white'}`}>
                    <div className={`w-2 h-2 rounded-full ${position === 'center' ? 'bg-white' : 'bg-gray-900 dark:bg-gray-900'}`} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-xs ${position === 'center' ? 'text-[#FF5C3A]' : 'text-gray-900 dark:text-white'}`}>{model.name}</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{model.desc}</p>
                  </div>
                  {position === 'center' && (
                    <span className="ml-auto text-[9px] font-bold text-white bg-[#FF5C3A] px-2 py-0.5 rounded-full">
                      Seleccionada
                    </span>
                  )}
                </div>
                {/* Image */}
                <div className={`relative w-full ${position === 'center' ? 'aspect-[3/4]' : 'aspect-[4/5]'}`}>
                  <Image
                    src={model.src}
                    alt={`Modelo ${model.name}`}
                    fill
                    className={`object-cover ${position === 'center' ? 'group-hover:scale-105' : ''} transition-transform duration-500`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 33vw"
                  />
                  {position === 'center' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  )}
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
            Sube cualquier foto de prenda y construye tu galeria de moda con IA — genera imagenes con modelo en multiples estilos, poses y fondos — listas para tu lookbook, tienda de e-commerce o campana en redes sociales.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#FF5C3A] text-white font-bold text-sm hover:bg-[#FF5C3A]/90 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-[#FF5C3A]/30"
          >
            <Sparkles size={16} />
            Prueba LookBook gratis
          </Link>
        </motion.div>
      </div>
    </section>
  );
}