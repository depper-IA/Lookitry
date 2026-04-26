'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import type { Product } from '../types';

interface ProductGridEditorialProps {
  products: Product[];
  selected: Product | null;
  onSelect: (p: Product) => void;
  primaryColor: string;
  generatedProducts: Map<string, string>;
  cardBg: string;
  bgLuminance: boolean;
  textPrimary: string;
  textMuted: string;
  isSmall: boolean;
}

const BADGE_COLOR: Record<string, string> = {
  nuevo: '#10B981',
  top: '#F59E0B',
  oferta: '#EF4444',
};

// Stagger container
const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 28 } },
};

export function ProductGridEditorial({
  products,
  selected,
  onSelect,
  primaryColor,
  generatedProducts,
  cardBg,
  bgLuminance,
  textPrimary,
  textMuted,
  isSmall,
}: ProductGridEditorialProps) {
  // ── Empty state ──────────────────────────────────────────────────────────────
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center py-20 sm:py-28 gap-6"
      >
        <motion.div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background: bgLuminance ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${bgLuminance ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
          }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: textMuted }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </motion.div>
        <div className="text-center space-y-2">
          <p className="text-sm font-black uppercase italic tracking-tight" style={{ color: textPrimary }}>
            Sin piezas aún
          </p>
          <p className="text-xs font-medium max-w-[200px] mx-auto" style={{ color: textMuted, opacity: 0.6 }}>
            Pronto añadiremos nuevas piezas a la colección
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Responsive grid columns ──────────────────────────────────────────────────
  const gridCols = 'grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5 sm:gap-4 lg:gap-6 justify-center';

  return (
    <motion.div
      className={`w-full grid ${gridCols} pb-28 sm:pb-32`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {products.map((p) => {
        const sel = selected?.id === p.id;
        const done = generatedProducts.has(p.id);

        return (
          <motion.button
            key={p.id}
            onClick={() => onSelect(p)}
            className="group relative w-full text-left rounded-2xl sm:rounded-3xl overflow-hidden focus:outline-none"
            variants={cardVariants}
            whileTap={{ scale: 0.96 }}
            style={{
              boxShadow: sel
                ? `0 0 0 2px ${primaryColor}, 0 12px 40px ${primaryColor}25`
                : bgLuminance
                  ? '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)'
                  : '0 2px 12px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            {/* ── Card Shell ── */}
            <div
              className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden"
              style={{ backgroundColor: cardBg }}
            >
              {/* ── Image Zone ── */}
              <div className="relative aspect-[3/4] sm:aspect-[3/4] overflow-hidden bg-black/5">
                <motion.img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  animate={{ scale: sel ? 1.04 : 1 }}
                  whileHover={{ scale: 1.07 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                />

                {/* Gradient vignette — always visible */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)',
                  }}
                />

                {/* Selection glow overlay */}
                <AnimatePresence>
                  {sel && (
                    <motion.div
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        background: `radial-gradient(ellipse at center, ${primaryColor}25 0%, transparent 70%)`,
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* ── Badges: top-left ── */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {p.badge && (
                    <span
                      className="px-1.5 sm:px-2 py-0.5 rounded-md text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-white shadow-md"
                      style={{ backgroundColor: BADGE_COLOR[p.badge] ?? '#666' }}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* ── Done / Selected badge: top-right ── */}
                <div className="absolute top-2 right-2">
                  <AnimatePresence>
                    {(done || sel) && (
                      <motion.div
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: sel ? primaryColor : `${primaryColor}cc` }}
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      >
                        <svg className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Price: bottom-right overlay ── */}
                {p.price != null && (
                  <div className="absolute bottom-2 right-2">
                    <span
                      className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-black text-white shadow-lg"
                      style={{
                        backgroundColor: sel ? primaryColor : 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      ${p.price.toLocaleString('es-CO')}
                    </span>
                  </div>
                )}

                {/* ── Product name overlay (bottom) ── */}
                <div className="absolute bottom-0 left-0 right-0 px-2 sm:px-3 pb-2 sm:pb-3 pt-6">
                  <p
                    className="text-[10px] sm:text-[11px] font-black uppercase italic tracking-tight text-white truncate leading-tight drop-shadow-sm"
                  >
                    {p.name}
                  </p>
                  {p.category && (
                    <p
                      className="text-[7px] sm:text-[8px] font-semibold uppercase tracking-wider text-white/60 mt-0.5 truncate"
                    >
                      {p.category}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Footer (below image) — only on desktop ── */}
              {!isSmall && (
                <div
                  className="px-3 py-2.5"
                  style={{ backgroundColor: cardBg }}
                >
                  {/* Attributes pills */}
                  {p.attributes && Object.keys(p.attributes).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {p.attributes.material && (
                        <span
                          className="text-[7px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                          style={{
                            color: textMuted,
                            backgroundColor: bgLuminance ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                          }}
                        >
                          {p.attributes.material}
                        </span>
                      )}
                      {p.attributes.tallas && Array.isArray(p.attributes.tallas) && (
                        <span
                          className="text-[7px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                          style={{
                            color: textMuted,
                            backgroundColor: bgLuminance ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                          }}
                        >
                          {p.attributes.tallas.slice(0, 3).join(' · ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Selected bottom bar ── */}
              <AnimatePresence>
                {sel && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: primaryColor }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
