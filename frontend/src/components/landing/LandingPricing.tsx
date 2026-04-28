'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Tag, Flame, Clock, Sparkles, ShieldCheck } from 'lucide-react';
import { PricingConfig } from '@/lib/pricing';
import { formatCurrency, formatPrice as formatDynamicPrice } from '@/utils/currency';
import { useActivePromotions } from '@/hooks/useActivePromotions';

interface LandingPricingProps {
  pricing: PricingConfig;
  currency: 'COP' | 'USD';
  trm: number;
}

const EASING = {
  outQuart: [0.25, 1, 0.5, 1] as const,
  outQuint: [0.22, 1, 0.36, 1] as const,
};

const cardHoverVariants = {
  rest: { scale: 1, rotateX: 0, rotateY: 0, boxShadow: '0 0 0 rgba(255,92,58,0)' },
  hover: (direction: number) => ({
    scale: 1.03,
    rotateX: -5,
    rotateY: direction * 3,
    boxShadow: '0 25px 50px rgba(255,92,58,0.15)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

interface PricingCardProps {
  name: string;
  badge?: string;
  badgeColor?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  period: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  isDark?: boolean;
  isPro?: boolean;
  delay: number;
  countdown?: string;
  direction: number;
}

function PricingCard({
  name,
  badge,
  badgeColor = '#10B981',
  price,
  originalPrice,
  currency,
  period,
  features,
  ctaText,
  ctaHref,
  isDark = false,
  isPro = false,
  delay,
  countdown,
  direction,
}: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPct = hasDiscount ? Math.round((1 - price / originalPrice!) * 100) : 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60, scale: 0.9, rotateX: 15 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] as unknown as number[],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      className={`
        relative w-full max-w-sm rounded-3xl p-8 md:p-10
        flex flex-col transition-all duration-500
        ${isDark
          ? 'bg-[#1c1c1c] border border-[#FF5C3A]/40 shadow-[0_40px_100px_rgba(255,92,58,0.12)]'
          : 'bg-[#f8f6f4] dark:bg-[#1a1a1a] border border-[#e8e4df] dark:border-white/10'
        }
        ${isPro ? 'z-10 shadow-2xl' : ''}
      `}
      animate={isHovered ? cardHoverVariants.hover(direction) : cardHoverVariants.rest}
    >
      {/* Glow effect on hover */}
      <div
        className={`
          absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-500
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,92,58,0.15) 0%, transparent 50%)`,
        }}
      />

      {/* Badges */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {badge && (
          <div
            className="text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-5 py-2 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap z-10"
            style={{ backgroundColor: badgeColor }}
          >
            <Sparkles size={10} aria-hidden="true" />
            {badge}
          </div>
        )}
        {countdown && (
          <div className="flex items-center gap-1.5 bg-black/90 text-white text-[9px] sm:text-[10px] font-bold px-3 py-1 rounded-full">
            <Clock size={10} aria-hidden="true" />
            {countdown}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="text-[#FF5C3A] font-bold text-[10px] uppercase tracking-[.25em] mb-2">
          {name === 'Básico' ? 'Emprendedores' : name === 'Pro' ? 'Profesional' : 'Retail y Corp'}
        </div>
        <h3 className={`font-jakarta font-bold text-3xl ${isDark ? 'text-white' : 'text-black dark:text-white'}`}>
          {name}
        </h3>
      </div>

      {/* Price */}
      <div className="mb-8">
        {/* Current price - large and prominent */}
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className={`font-jakarta font-black text-5xl md:text-6xl tracking-tighter ${isDark ? 'text-white' : 'text-black dark:text-white'}`}
          >
            {currency === 'USD'
              ? formatDynamicPrice(price, 'USD', 0)
              : formatCurrency(price)
            }
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-black/40 dark:text-white/40'}`}>
            {currency} / {period}
          </span>
        </div>

        {/* Original price - clearly struck through */}
        {hasDiscount && originalPrice && (
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-lg font-medium line-through ${isDark ? 'text-white/40' : 'text-black/30 dark:text-white/30'}`}
              >
                {currency === 'USD'
                  ? formatDynamicPrice(originalPrice, 'USD', 0)
                  : formatCurrency(originalPrice)
                }
              </span>
              <span
                className="text-sm font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
              >
                -{discountPct}%
              </span>
            </div>
            <span className={`text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/40 dark:text-white/40'}`}>
              Ahorras {currency === 'USD'
                ? formatDynamicPrice(originalPrice - price, 'USD', 0)
                : formatCurrency(originalPrice - price)
              }
            </span>
          </div>
        )}

        {/* Savings callout */}
        {hasDiscount && (
          <div className={`
            mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold
            ${isDark
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
            }
          `}>
            <Flame size={12} aria-hidden="true" />
            ¡Precio especial de lanzamiento!
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={`h-[1px] w-full mb-8 ${isDark ? 'bg-white/10' : 'bg-black/10 dark:bg-white/10'}`} />

      {/* Features */}
      <ul className="flex flex-col gap-4 mb-10 flex-1">
        {features.map((feature, idx) => (
          <li
            key={idx}
            className={`flex items-center gap-3 text-sm font-medium ${isDark ? 'text-white/80' : 'text-[#333] dark:text-white/90'}`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-[#FF5C3A]/20' : 'bg-[#FF5C3A]/10'}`}
              aria-hidden="true"
            >
              <Check size={12} className="text-[#FF5C3A]" />
            </div>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Link
        href={ctaHref}
        className={`
          group relative mt-auto w-full py-5 rounded-2xl font-bold text-sm text-center
          transition-all duration-300 overflow-hidden
          ${isDark
            ? 'bg-[#FF5C3A] text-white shadow-xl shadow-[#FF5C3A]/30 hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-black dark:text-white hover:bg-[#FF5C3A] hover:text-white hover:border-[#FF5C3A] hover:scale-[1.02] active:scale-[0.98]'
          }
        `}
      >
        <span className="relative z-10">{ctaText}</span>
        <div
          className={`
            absolute inset-0 transform -translate-x-full
            bg-gradient-to-r from-transparent via-white/20 to-transparent
            group-hover:animate-[shimmer_1.5s_infinite]
          `}
        />
      </Link>
    </motion.div>
  );
}

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`
    inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 font-medium text-[10px] uppercase tracking-[.2em] border shadow-sm
    ${light
      ? 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/60 dark:text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    }
  `}>
    <span className={`w-1.5 h-1.5 rounded-full ${light ? 'bg-black/30 dark:bg-white/40' : 'bg-[#FF5C3A]'}`} aria-hidden="true" />
    {text}
  </div>
);

export default function LandingPricing({ pricing, currency, trm }: LandingPricingProps) {
  const { planOverrides } = useActivePromotions();
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const formatPrice = (cop: number) => {
    return currency === 'USD'
      ? formatDynamicPrice(cop, 'USD', trm)
      : formatCurrency(cop);
  };

  // Basic plan
  const basicOverride = planOverrides.BASIC;
  const basicPrice = basicOverride ? basicOverride.override_price : pricing.basic.precio_mensual_cop;
  const basicOriginal = basicOverride ? basicOverride.original_price : pricing.basic.precio_original_cop || pricing.basic.precio_mensual_cop;
  const basicLabel = basicOverride?.label;
  const hasBasicDiscount = basicPrice < (pricing.basic.precio_mensual_cop);

  // Pro plan
  const proOverride = planOverrides.PRO;
  const proPrice = proOverride ? proOverride.override_price : pricing.pro.precio_mensual_cop;
  const proOriginal = proOverride ? proOverride.original_price : pricing.pro.precio_original_cop || pricing.pro.precio_mensual_cop;
  const proLabel = proOverride?.label;
  const hasProDiscount = proPrice < (pricing.pro.precio_mensual_cop);

  // Countdown for urgency (example - in real app this would come from promotion data)
  const getCountdown = () => {
    if (hasBasicDiscount || hasProDiscount) {
      return '3 días remaining';
    }
    return undefined;
  };

  return (
    <section
      id="planes"
      ref={sectionRef}
      className="py-24 md:py-32 lg:py-40 px-4 bg-white dark:bg-black relative overflow-hidden"
      aria-label="Planes y precios"
    >
      {/* Background gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF5C3A]/[0.02] to-transparent pointer-events-none" aria-hidden="true" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <SectionTag text="Planes de Crecimiento" />
          <h2 className="font-jakarta text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-black dark:text-white mb-4">
            Precios claros, <span className="text-[#FF5C3A]">sin sorpresas.</span>
          </h2>
          <p className="font-dm-sans text-lg md:text-xl text-[#555] dark:text-white/70 max-w-2xl mx-auto">
            Activa tu plan en minutos con pasarelas 100% seguras y soporte en español.
          </p>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mt-8 text-[11px] font-medium text-black/40 dark:text-white/40 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Check size={14} className="text-emerald-500" />
              Sin contratos
            </span>
            <span className="flex items-center gap-2">
              <Check size={14} className="text-emerald-500" />
              Cancela cuando quieras
            </span>
            <span className="flex items-center gap-2">
              <Check size={14} className="text-emerald-500" />
              Setup en 5 min
            </span>
          </div>
        </motion.div>

        {/* Cards Grid */}
        <div
          className={`
            grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-stretch
            transition-all duration-700
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}
          style={{ transitionDelay: '0.2s' }}
        >
          {/* Basic */}
          <PricingCard
            name="Básico"
            badge={hasBasicDiscount && basicLabel ? basicLabel : undefined}
            badgeColor={hasBasicDiscount ? '#10B981' : undefined}
            price={basicPrice}
            originalPrice={basicOriginal}
            currency={currency}
            period="mes"
            features={[
              '5 productos activos',
              `${pricing.basic.generaciones_mensuales} generaciones IA / mes`,
              'Widget embebible (iframe)',
              'Logo y colores de marca',
              'Analytics de uso',
              'Soporte vía correo',
            ]}
            ctaText="Contratar Básico"
            ctaHref={`/checkout?plan=BASIC&currency=${currency}`}
            delay={0.1}
            countdown={getCountdown()}
            direction={-1}
          />

          {/* Pro */}
          <PricingCard
            name="Pro"
            badge={hasProDiscount && proLabel ? proLabel : 'Plan Más Solicitado'}
            badgeColor={hasProDiscount ? '#10B981' : '#FF5C3A'}
            price={proPrice}
            originalPrice={proOriginal}
            currency={currency}
            period="mes"
            isDark
            isPro
            features={[
              '15 productos activos',
              `${pricing.pro.generaciones_mensuales} generaciones IA / mes`,
              'Plugin WooCommerce',
              'Templates Minimal, Modern y Bold',
              'Texto botón personalizado',
              'Prioridad en soporte',
            ]}
            ctaText="Activar Plan Pro"
            ctaHref={`/checkout?plan=PRO&currency=${currency}`}
            delay={0.25}
            countdown={getCountdown()}
            direction={0}
          />

          {/* Enterprise */}
          <PricingCard
            name="Enterprise"
            badge={undefined}
            price={pricing.enterprise.precio_mensual_cop}
            currency={currency}
            period="mes"
            features={[
              '50+ productos (ilimitado)',
              'Generaciones ilimitadas',
              'Acceso API completo',
              'Marca blanca',
              'Gerente de cuenta 24/7',
              'Embed especializado',
            ]}
            ctaText="Hablar con Ventas"
            ctaHref="/contacto"
            delay={0.4}
            direction={1}
          />
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-16 md:mt-20"
        >
          <p className="text-[11px] md:text-sm text-black/40 dark:text-white/40 mb-4">
            ¿No sabes qué plan elegir? <Link href="/planes#comparacion" className="text-[#FF5C3A] hover:underline">Compara todos los features →</Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-black/30 dark:text-white/30">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Pagos procesados por Wompi · SSL 256-bit · Moneda local</span>
          </div>
        </motion.div>
      </div>

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
}