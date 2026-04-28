'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, ShieldCheck } from 'lucide-react';
import { PricingConfig } from '@/lib/pricing';
import { formatCurrency, formatPrice as formatDynamicPrice } from '@/utils/currency';
import { useActivePromotions } from '@/hooks/useActivePromotions';

interface LandingPricingProps {
  pricing: PricingConfig;
  currency: 'COP' | 'USD';
  trm: number;
}

interface PricingCardProps {
  name: string;
  category: string;
  badge?: string;
  badgeColor?: string;
  price: number | null;
  originalPrice?: number;
  currency: string;
  period: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  isDark?: boolean;
  isPro?: boolean;
  isEnterprise?: boolean;
  delay: number;
}

function PricingCard({
  name,
  category,
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
  isEnterprise = false,
  delay,
}: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const hasDiscount = originalPrice && originalPrice > price!;
  const discountPct = hasDiscount ? Math.round((1 - price! / originalPrice!) * 100) : 0;

  return (
    <motion.div
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
      className={`
        relative w-full max-w-sm rounded-3xl p-8 md:p-10
        flex flex-col
        transition-all duration-500 ease-out
        hover:-translate-y-2 hover:shadow-2xl
        ${isDark
          ? 'bg-[#1c1c1c] border border-[#FF5C3A]/40 shadow-[0_30px_80px_rgba(255,92,58,0.12)]'
          : 'bg-[#f8f6f4] dark:bg-[#1a1a1a] border border-[#e8e4df] dark:border-white/10 shadow-sm'
        }
        ${isPro ? 'z-10' : ''}
      `}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div
            className="text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-5 py-2 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap z-10"
            style={{ backgroundColor: badgeColor }}
          >
            <Sparkles size={10} aria-hidden="true" />
            {badge}
          </div>
        </div>
      )}

      {/* Category */}
      <div className={`font-bold text-[9px] sm:text-[10px] uppercase tracking-[.25em] mb-3 sm:mb-4 ${isDark ? 'text-[#FF5C3A]/80' : 'text-[#FF5C3A]'}`}>
        {category}
      </div>

      {/* Plan name */}
      <h3 className={`font-jakarta font-bold text-2xl sm:text-3xl mb-5 sm:mb-6 ${isDark ? 'text-white' : 'text-black dark:text-white'}`}>
        {name}
      </h3>

      {/* Price - hide for Enterprise */}
      {!isEnterprise && price !== null && (
        <div className="mb-6 sm:mb-8">
          <div className="flex items-baseline gap-2">
            <span
              className={`font-jakarta font-black text-3xl sm:text-4xl tracking-tighter ${isDark ? 'text-white' : 'text-black dark:text-white'}`}
            >
              {currency === 'USD'
                ? formatDynamicPrice(price, 'USD', 0)
                : formatCurrency(price)
              }
            </span>
            <span className={`text-[10px] sm:text-[12px] font-bold uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-black/60 dark:text-white/60'}`}>
              {currency}/{period}
            </span>
          </div>

          {/* Original + discount */}
          {hasDiscount && originalPrice && (
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-[14px] sm:text-[16px] font-medium line-through ${isDark ? 'text-white/40' : 'text-black/40 dark:text-white/40'}`}>
                {currency === 'USD'
                  ? formatDynamicPrice(originalPrice, 'USD', 0)
                  : formatCurrency(originalPrice)
                }
              </span>
              <span
                className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
              >
                -{discountPct}%
              </span>
            </div>
          )}

          {/* Savings */}
          {hasDiscount && (
            <div className={`mt-1.5 text-[10px] sm:text-[11px] font-medium ${isDark ? 'text-white/50' : 'text-black/50 dark:text-white/50'}`}>
              Ahorras {currency === 'USD'
                ? formatDynamicPrice(originalPrice! - price, 'USD', 0)
                : formatCurrency(originalPrice! - price)
              }
            </div>
          )}
        </div>
      )}

      {/* Enterprise placeholder */}
      {isEnterprise && (
        <div className="mb-6 sm:mb-8">
          <div className="flex items-baseline gap-2">
            <span className={`font-jakarta font-black text-2xl sm:text-3xl tracking-tight ${isDark ? 'text-white/60' : 'text-black/60 dark:text-white/60'}`}>
              Consultar
            </span>
          </div>
          <p className={`text-[11px] sm:text-[12px] mt-1 ${isDark ? 'text-white/40' : 'text-black/40 dark:text-white/40'}`}>
            Precio según necesidades
          </p>
        </div>
      )}

      {/* Divider */}
      <div className={`h-[1px] w-full mb-6 sm:mb-8 ${isDark ? 'bg-white/10' : 'bg-black/10 dark:bg-white/10'}`} />

      {/* Features */}
      <ul className="flex flex-col gap-4 sm:gap-5 mb-8 sm:mb-10 flex-1">
        {features.map((feature, idx) => (
          <li
            key={idx}
            className={`flex items-center gap-3 text-[13px] sm:text-[14px] font-medium ${isDark ? 'text-white/80' : 'text-[#333] dark:text-white/80'}`}
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
          group mt-auto w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-sm text-center
          transition-all duration-300 ease-out
          ${isEnterprise
            ? 'bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-black dark:text-white hover:bg-[#FF5C3A] hover:text-white hover:border-[#FF5C3A] hover:scale-[1.02] active:scale-[0.98]'
            : isDark
              ? 'bg-[#FF5C3A] text-white shadow-xl shadow-[#FF5C3A]/20 hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-black dark:text-white hover:bg-[#FF5C3A] hover:text-white hover:border-[#FF5C3A] hover:scale-[1.02] active:scale-[0.98]'
          }
        `}
      >
        {ctaText}
      </Link>
    </motion.div>
  );
}

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 sm:mb-8 font-medium text-[10px] uppercase tracking-[.2em] border shadow-sm ${
    light
      ? 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/60 dark:text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${light ? 'bg-black/30 dark:bg-white/40' : 'bg-[#FF5C3A]'}`} aria-hidden="true" />
    {text}
  </div>
);

export default function LandingPricing({ pricing, currency, trm }: LandingPricingProps) {
  const { planOverrides } = useActivePromotions();

  // Basic plan
  const basicOverride = planOverrides.BASIC;
  const basicPrice = basicOverride ? basicOverride.override_price : pricing.basic.precio_mensual_cop;
  const basicOriginal = basicOverride ? basicOverride.original_price : pricing.basic.precio_original_cop || pricing.basic.precio_mensual_cop;
  const basicLabel = basicOverride?.label;
  const hasBasicDiscount = basicPrice < pricing.basic.precio_mensual_cop;

  // Pro plan
  const proOverride = planOverrides.PRO;
  const proPrice = proOverride ? proOverride.override_price : pricing.pro.precio_mensual_cop;
  const proOriginal = proOverride ? proOverride.original_price : pricing.pro.precio_original_cop || pricing.pro.precio_mensual_cop;
  const proLabel = proOverride?.label;
  const hasProDiscount = proPrice < pricing.pro.precio_mensual_cop;

  return (
    <section id="planes" className="py-20 sm:py-24 md:py-32 lg:py-40 px-4 sm:px-6 bg-white dark:bg-black relative overflow-hidden" aria-label="Planes y precios">
      {/* Decorative top border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100%] h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-0 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24"
        >
          <SectionTag text="Planes de Crecimiento" light />
          <h2 className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white mb-4 sm:mb-6">
            Precios claros, <span className="text-[#FF5C3A]">sin sorpresas.</span>
          </h2>
          <p className="font-dm-sans text-base sm:text-lg text-[#555] dark:text-white/70 max-w-xl mx-auto">
            Activa tu plan en minutos con pasarelas 100% seguras y soporte en español.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="features-grid flex flex-wrap justify-center items-stretch gap-6 sm:gap-8 lg:gap-10"
        >
          {/* Basic */}
          <PricingCard
            name="Básico"
            category="Emprendedores"
            badge={hasBasicDiscount && basicLabel ? basicLabel : undefined}
            badgeColor={hasBasicDiscount ? '#10B981' : undefined}
            price={basicPrice}
            originalPrice={basicOriginal}
            currency={currency}
            period="mes"
            features={[
              '5 productos activos',
              `${pricing.basic.generaciones_mensuales} IA generations / mes`,
              'Widget embebible',
              'Soporte vía correo',
            ]}
            ctaText="Contratar Básico"
            ctaHref={`/checkout?plan=BASIC&currency=${currency}`}
            delay={0}
          />

          {/* Pro */}
          <PricingCard
            name="Pro"
            category="Profesional"
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
              `${pricing.pro.generaciones_mensuales} IA generations / mes`,
              'Multi-templates avanzados',
              'Prioridad y Config Asistida',
            ]}
            ctaText="Activar Plan Pro"
            ctaHref={`/checkout?plan=PRO&currency=${currency}`}
            delay={0.15}
          />

          {/* Enterprise */}
          <PricingCard
            name="Enterprise"
            category="Retail y Corp"
            price={null}
            isEnterprise
            features={[
              '50+ productos',
              'Generaciones ilimitadas',
              'Acceso API completo',
              'Gerente de cuenta 24/7',
            ]}
            ctaText="Hablar con Ventas"
            ctaHref="/contacto"
            delay={0.3}
          />
        </motion.div>

        {/* Compare link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12 sm:mt-16"
        >
          <p className="text-[11px] sm:text-sm text-black/40 dark:text-white/40 mb-4">
            ¿No sabes qué plan elegir?{' '}
            <Link href="/planes#comparacion" className="text-[#FF5C3A] hover:underline font-medium">
              Compara todos los features →
            </Link>
          </p>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 text-[11px] sm:text-[12px] font-medium text-black/40 dark:text-white/40 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Check size={14} className="text-emerald-500" />
              Sin contratos
            </span>
            <span className="flex items-center gap-2">
              <Check size={14} className="text-emerald-500" />
              Cancela cuando quieras
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              Pagos seguros
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}