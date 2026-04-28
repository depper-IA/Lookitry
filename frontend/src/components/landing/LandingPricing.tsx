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
}: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPct = hasDiscount ? Math.round((1 - price / originalPrice!) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as unknown as number[],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative w-full rounded-2xl p-6 sm:p-7 md:p-8
        flex flex-col transition-all duration-400
        ${isHovered ? '-translate-y-2' : ''}
        ${isDark
          ? 'bg-[#111] border border-[#FF5C3A]/30 shadow-xl'
          : 'bg-[#faf9f7] dark:bg-[#181818] border border-[#e5e2dd] dark:border-white/10 shadow-sm hover:shadow-md hover:border-[#FF5C3A]/20'
        }
        ${isPro ? 'z-10' : ''}
      `}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div
            className="text-white text-[9px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap"
            style={{ backgroundColor: badgeColor }}
          >
            <Sparkles size={9} aria-hidden="true" />
            {badge}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div className={`text-[#FF5C3A] font-semibold text-[9px] uppercase tracking-[.2em] mb-1.5 ${isDark ? 'text-[#FF5C3A]/80' : ''}`}>
          {name === 'Básico' ? 'Emprendedores' : name === 'Pro' ? 'Profesional' : 'Retail y Corp'}
        </div>
        <h3 className={`font-jakarta font-semibold text-2xl ${isDark ? 'text-white' : 'text-black dark:text-white'}`}>
          {name}
        </h3>
      </div>

      {/* Price */}
      <div className="mb-6">
        {/* Current price */}
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-jakarta font-medium text-3xl sm:text-4xl tracking-tight ${isDark ? 'text-white' : 'text-black dark:text-white'}`}
          >
            {currency === 'USD'
              ? formatDynamicPrice(price, 'USD', 0)
              : formatCurrency(price)
            }
          </span>
          <span className={`text-[10px] font-medium uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-black/40 dark:text-white/40'}`}>
            {currency}/{period}
          </span>
        </div>

        {/* Original price */}
        {hasDiscount && originalPrice && (
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-base font-normal line-through ${isDark ? 'text-white/30' : 'text-black/30 dark:text-white/30'}`}>
              {currency === 'USD'
                ? formatDynamicPrice(originalPrice, 'USD', 0)
                : formatCurrency(originalPrice)
              }
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}
            >
              -{discountPct}%
            </span>
          </div>
        )}

        {/* Savings */}
        {hasDiscount && (
          <div className={`mt-2 text-[10px] font-medium ${isDark ? 'text-white/50' : 'text-black/50 dark:text-white/50'}`}>
            Ahorras {currency === 'USD'
              ? formatDynamicPrice(originalPrice! - price, 'USD', 0)
              : formatCurrency(originalPrice! - price)
            }
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-3 mb-6 flex-1">
        {features.map((feature, idx) => (
          <li
            key={idx}
            className={`flex items-center gap-2.5 text-[13px] ${isDark ? 'text-white/70' : 'text-[#444] dark:text-white/70'}`}
          >
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-[#FF5C3A]/15' : 'bg-[#FF5C3A]/10'}`}
              aria-hidden="true"
            >
              <Check size={10} className="text-[#FF5C3A]" />
            </div>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Link
        href={ctaHref}
        className={`
          group w-full py-3.5 rounded-xl font-semibold text-[13px] text-center
          transition-all duration-300
          ${isDark
            ? 'bg-[#FF5C3A] text-white hover:bg-[#ff6f52] active:scale-[0.98]'
            : 'bg-black/6 dark:bg-white/10 text-black dark:text-white hover:bg-[#FF5C3A] hover:text-white active:scale-[0.98]'
          }
        `}
      >
        {ctaText}
      </Link>

      {/* Countdown */}
      {countdown && (
        <div className="flex items-center justify-center gap-1.5 mt-3 text-[9px] font-medium text-black/40 dark:text-white/40">
          <Clock size={10} aria-hidden="true" />
          {countdown}
        </div>
      )}
    </motion.div>
  );
}

const SectionTag = ({ text }: { text: string }) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 font-medium text-[10px] uppercase tracking-[.15em] bg-[#faf9f7] dark:bg-white/5 border border-[#e5e2dd] dark:border-white/10 text-black/50 dark:text-white/50">
    <span className="w-1 h-1 rounded-full bg-[#FF5C3A]" aria-hidden="true" />
    {text}
  </div>
);

export default function LandingPricing({ pricing, currency, trm }: LandingPricingProps) {
  const { planOverrides } = useActivePromotions();

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

  const getCountdown = () => {
    if (hasBasicDiscount || hasProDiscount) {
      return '3 días remaining';
    }
    return undefined;
  };

  return (
    <section
      id="planes"
      className="py-20 md:py-28 px-4 bg-white dark:bg-black relative overflow-hidden"
      aria-label="Planes y precios"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <SectionTag text="Planes de Crecimiento" />
          <h2 className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-black dark:text-white mb-3">
            Precios claros, <span className="text-[#FF5C3A]">sin sorpresas.</span>
          </h2>
          <p className="font-dm-sans text-base md:text-lg text-black/50 dark:text-white/50">
            Activa tu plan en minutos con pasarelas 100% seguras.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
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
              `${pricing.basic.generaciones_mensuales} gen. IA/mes`,
              'Widget embebible',
              'Logo y colores de marca',
            ]}
            ctaText="Contratar Básico"
            ctaHref={`/checkout?plan=BASIC&currency=${currency}`}
            delay={0.1}
            countdown={getCountdown()}
          />

          {/* Pro */}
          <PricingCard
            name="Pro"
            badge={hasProDiscount && proLabel ? proLabel : 'Más popular'}
            badgeColor={hasProDiscount ? '#10B981' : '#FF5C3A'}
            price={proPrice}
            originalPrice={proOriginal}
            currency={currency}
            period="mes"
            isDark
            isPro
            features={[
              '15 productos activos',
              `${pricing.pro.generaciones_mensuales} gen. IA/mes`,
              'Plugin WooCommerce',
              'Templates avanzados',
              'Soporte prioritario',
            ]}
            ctaText="Activar Plan Pro"
            ctaHref={`/checkout?plan=PRO&currency=${currency}`}
            delay={0.2}
            countdown={getCountdown()}
          />

          {/* Enterprise */}
          <PricingCard
            name="Enterprise"
            badge={undefined}
            price={pricing.enterprise.precio_mensual_cop}
            currency={currency}
            period="mes"
            features={[
              '50+ productos',
              'Generaciones ilimitadas',
              'Acceso API completo',
              'Gerente dedicado',
            ]}
            ctaText="Hablar con Ventas"
            ctaHref="/contacto"
            delay={0.3}
          />
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-10 text-[11px] text-black/30 dark:text-white/30"
        >
          <span className="flex items-center gap-1.5">
            <Check size={12} className="text-emerald-500" />
            Sin contratos
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={12} className="text-emerald-500" />
            Cancela cuando quieras
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-500" />
            Pagos seguros
          </span>
        </motion.div>
      </div>
    </section>
  );
}