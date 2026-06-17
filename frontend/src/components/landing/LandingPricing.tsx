'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Sparkles, Phone, ArrowRight, Info } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { PricingConfig } from '@/lib/pricing';
import { formatCurrency, formatPrice as formatDynamicPrice } from '@/utils/currency';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { LANDING_COPY } from './LandingCopy';

interface LandingPricingProps {
  pricing: PricingConfig;
  currency: 'COP' | 'USD';
  trm: number;
}

type Feature = { label: string; info: string };

const EASING_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Tooltip ───────────────────────────────────────────────────────────────────

function FeatureItem({ label, info }: Feature) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <div className="flex items-center gap-3 cursor-default group select-none">
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-accent/15 flex items-center justify-center">
              <Check size={9} className="text-accent" strokeWidth={3} />
            </span>
            <span className="text-[12px] text-white/60 group-hover:text-white/85 transition-colors leading-tight">
              {label}
            </span>
            <Info size={11} className="text-white/15 group-hover:text-white/35 transition-colors flex-shrink-0 ml-auto" />
          </div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={6}
            className="z-50 max-w-[220px] rounded-xl bg-[#1f1f1f] px-3 py-2 text-[12px] text-white/80 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          >
            {info}
            <TooltipPrimitive.Arrow className="fill-[#1f1f1f]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface PricingCardProps {
  name: string;
  category: string;
  badge?: string;
  badgeColor?: string;
  priceDisplay: string;
  originalDisplay?: string;
  period: string;
  features: Feature[];
  ctaText: string;
  ctaHref: string;
  isPro?: boolean;
  isEnterprise?: boolean;
  delay: number;
}

function PricingCard({
  name,
  category,
  badge,
  badgeColor = '#10B981',
  priceDisplay,
  originalDisplay,
  period,
  features,
  ctaText,
  ctaHref,
  isPro = false,
  isEnterprise = false,
  delay,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={
        isPro
          ? { y: -8, boxShadow: '0 0 90px rgba(255,92,58,0.28), 0 24px 48px rgba(0,0,0,0.5)' }
          : { y: -6, boxShadow: '0 24px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)' }
      }
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay, duration: 0.7, ease: EASING_OUT }}
      style={{ willChange: 'transform' }}
      className={`
        group relative flex flex-col rounded-[22px] p-4 gap-3.5 cursor-default
        ${isPro
          ? 'bg-[#1a0d06] shadow-[0_0_70px_rgba(255,92,58,0.14)]'
          : 'bg-[#141414]'
        }
      `}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 z-10">
          <div
            className="flex items-center gap-1.5 text-white text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap"
            style={{ backgroundColor: badgeColor }}
          >
            <Sparkles size={9} aria-hidden="true" />
            {badge}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pt-0.5">
        <p className={`text-[8px] font-bold uppercase tracking-[.28em] mb-1 ${isPro ? 'text-accent/80' : 'text-accent/70'}`}>
          {category}
        </p>
        <h3 className={`font-jakarta font-bold text-[20px] leading-tight transition-colors duration-300 ${isPro ? 'text-white group-hover:text-accent' : 'text-white group-hover:text-white/90'}`}>
          {name}
        </h3>
      </div>

      {/* Features panel */}
      <div className="rounded-[16px] bg-[#0a0a0a] group-hover:bg-[#0d0d0d] transition-colors duration-300 px-4 py-4 flex flex-col gap-[11px] flex-1">
        {features.map((f, i) => (
          <FeatureItem key={i} label={f.label} info={f.info} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-end justify-between gap-3 px-1">
        {/* Price */}
        {isEnterprise ? (
          <div>
            <p className="text-[10px] text-white/30 mb-0.5">precio</p>
            <span className="font-jakarta text-[22px] font-semibold text-white/55 leading-none">
              Consultar
            </span>
          </div>
        ) : (
          <div>
            <p className="text-[10px] text-white/30 mb-0.5">desde</p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-jakarta text-[22px] font-bold text-white leading-none">
                {priceDisplay}
              </span>
              {originalDisplay && (
                <span className="text-[11px] text-white/25 line-through leading-none">
                  {originalDisplay}
                </span>
              )}
            </div>
            <p className="text-[9px] text-white/25 mt-0.5 uppercase tracking-wide">{period}</p>
          </div>
        )}

        {/* CTA */}
        <Link
          href={ctaHref}
          className={`
            flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-[12px] transition-all duration-200
            hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
            ${isPro
              ? 'bg-accent text-white hover:shadow-lg hover:shadow-accent/30'
              : isEnterprise
                ? 'bg-white/8 text-white/80 hover:bg-white/12'
                : 'bg-white/10 text-white hover:bg-white/15'
            }
          `}
        >
          {isEnterprise ? (
            <><Phone size={13} aria-hidden="true" /><span>Contactar</span></>
          ) : (
            <><span>{ctaText}</span><ArrowRight size={13} aria-hidden="true" /></>
          )}
        </Link>
      </div>
    </motion.div>
  );
}

// ── Section Tag ───────────────────────────────────────────────────────────────

const SectionTag = ({ text }: { text: string }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 sm:mb-8 font-medium text-[10px] uppercase tracking-[.2em] bg-accent/5 text-accent">
    <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
    {text}
  </div>
);

// ── Main Export ───────────────────────────────────────────────────────────────

export default function LandingPricing({ pricing, currency, trm }: LandingPricingProps) {
  const { planOverrides } = useActivePromotions();
  const [trialPrice, setTrialPrice] = useState<number>(20000);

  React.useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${apiUrl}/api/trial/status`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.priceCOP && Number(data.priceCOP) > 0) setTrialPrice(Number(data.priceCOP));
      })
      .catch(() => {});
  }, []);

  const fmt = (n: number) =>
    currency === 'USD' ? formatDynamicPrice(n, 'USD', 0) : formatCurrency(n);

  // Basic
  const basicOverride = planOverrides.BASIC;
  const basicPrice = basicOverride ? basicOverride.override_price : pricing.basic.precio_mensual_cop;
  const basicOriginal = basicOverride ? basicOverride.original_price : pricing.basic.precio_original_cop || pricing.basic.precio_mensual_cop;
  const basicLabel = basicOverride?.label;
  const hasBasicDiscount = basicPrice < pricing.basic.precio_mensual_cop;

  // Pro
  const proOverride = planOverrides.PRO;
  const proPrice = proOverride ? proOverride.override_price : pricing.pro.precio_mensual_cop;
  const proOriginal = proOverride ? proOverride.original_price : pricing.pro.precio_original_cop || pricing.pro.precio_mensual_cop;
  const proLabel = proOverride?.label;
  const hasProDiscount = proPrice < pricing.pro.precio_mensual_cop;

  // Feature arrays
  const trialFeatures: Feature[] = [
    { label: '50 generaciones con IA', info: 'Procesa hasta 50 imágenes de prueba virtual durante los 7 días.' },
    { label: '7 días de acceso completo', info: 'Acceso a todas las funciones sin restricción durante la prueba.' },
    { label: '1 producto activo', info: 'Carga y activa 1 prenda de tu catálogo con probador virtual.' },
    { label: 'Widget personalizable', info: 'Tu probador con tu logo y colores, listo para compartir.' },
    { label: 'Logo y colores de marca', info: 'El probador refleja la identidad visual de tu negocio.' },
  ];

  const basicFeatures: Feature[] = [
    { label: `Hasta ${pricing.basic.productos_max ?? 5} productos activos`, info: 'Carga y activa hasta este número de prendas con probador virtual.' },
    { label: `${pricing.basic.generaciones_mensuales} pruebas virtuales / mes`, info: 'Tus clientes pueden hacer hasta este número de pruebas al mes.' },
    { label: 'Logo y colores de marca', info: 'El probador refleja la identidad visual de tu negocio.' },
    { label: 'Diseño limpio y elegante', info: 'Interfaz moderna y profesional lista para compartir.' },
    { label: 'Link para tu página web', info: 'Integra el probador en cualquier sitio web con un iframe.' },
    { label: 'Estadísticas de uso', info: 'Ve cuántas pruebas realiza cada cliente y qué prendas se prueban más.' },
  ];

  const proFeatures: Feature[] = [
    { label: `Hasta ${pricing.pro.productos_max ?? 15} productos activos`, info: 'Catálogo amplio con probador virtual para cada prenda.' },
    { label: `${pricing.pro.generaciones_mensuales} pruebas virtuales / mes`, info: 'Volumen alto diseñado para tiendas con mayor tráfico.' },
    { label: 'Plugin WooCommerce', info: 'Integra el probador directamente en tu tienda WooCommerce sin código.' },
    { label: 'Diseños personalizados', info: 'Varios estilos visuales para que el probador encaje con tu marca.' },
    { label: 'Botones y mensajes propios', info: 'Texto de botones CTA y mensaje de bienvenida adaptados a tu voz.' },
    { label: 'Estadísticas avanzadas', info: 'Reportes de conversión, comportamiento de usuarios y prendas más probadas.' },
    { label: 'Enlace 100% personalizado', info: 'URL con tu dominio para compartir en Instagram, WhatsApp y web.' },
    { label: 'Soporte prioritario', info: 'Atención directa con tiempo de respuesta garantizado.' },
  ];

  const enterpriseFeatures: Feature[] = [
    { label: '50+ productos activos', info: 'Catálogo sin límite práctico para grandes tiendas y retailers.' },
    { label: 'Generaciones ilimitadas', info: 'Sin tope mensual de pruebas virtuales para tus clientes.' },
    { label: 'Acceso API completo', info: 'Integra el probador en cualquier sistema a través de nuestra API.' },
    { label: 'Gerente de cuenta 24/7', info: 'Un profesional dedicado exclusivamente a tu cuenta.' },
    { label: 'SLA garantizado', info: 'Contrato de nivel de servicio con uptime y tiempos de respuesta garantizados.' },
    { label: 'Integraciones a medida', info: 'Conectamos el probador con tu ERP, CRM o plataforma existente.' },
  ];

  return (
    <section
      id="planes"
      className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 bg-white dark:bg-black relative overflow-hidden"
      aria-label="Planes y precios"
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASING_OUT }}
          className="text-center mb-14 sm:mb-18"
        >
          <SectionTag text={LANDING_COPY.trust.badge} />
          <h2 className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white mb-4">
            {LANDING_COPY.pricing.title}, <span className="text-accent">sin sorpresas.</span>
          </h2>
          <p className="text-base sm:text-lg text-text-muted dark:text-white/60 max-w-xl mx-auto">
            {LANDING_COPY.trust.guarantee}
          </p>
        </motion.div>

        {/* Cards — 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-4 items-stretch">

          {/* Basic */}
          <PricingCard
            name="Básico"
            category="Emprendedores"
            badge={hasBasicDiscount && basicLabel ? basicLabel : undefined}
            badgeColor="#10B981"
            priceDisplay={fmt(basicPrice)}
            originalDisplay={hasBasicDiscount ? fmt(basicOriginal) : undefined}
            period={`${currency}/mes`}
            features={basicFeatures}
            ctaText="Contratar"
            ctaHref={`/checkout?plan=BASIC&currency=${currency}`}
            delay={0.1}
          />

          {/* Pro */}
          <PricingCard
            name="Pro"
            category="Profesional"
            badge={hasProDiscount && proLabel ? proLabel : 'Más solicitado'}
            badgeColor={hasProDiscount ? '#10B981' : '#FF5C3A'}
            priceDisplay={fmt(proPrice)}
            originalDisplay={hasProDiscount ? fmt(proOriginal) : undefined}
            period={`${currency}/mes`}
            features={proFeatures}
            ctaText="Activar Pro"
            ctaHref={`/checkout?plan=PRO&currency=${currency}`}
            isPro
            delay={0.2}
          />

          {/* Enterprise */}
          <PricingCard
            name="Enterprise"
            category="Retail y Corp"
            priceDisplay=""
            period=""
            features={enterpriseFeatures}
            ctaText="Hablar con Ventas"
            ctaHref="/contacto"
            isEnterprise
            delay={0.3}
          />
        </div>

        {/* Trial — horizontal card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASING_OUT }}
          className="mt-6 rounded-2xl border border-white/[0.06] bg-[#111] px-5 py-4 sm:px-8 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[.25em] text-white/30 mb-1">Primeros pasos</p>
            <h3 className="font-jakarta font-bold text-[17px] text-white mb-2">Trial — 7 dias</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {trialFeatures.map((f, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[11px] text-white/45">
                  <Check size={9} className="text-white/25" />
                  {f.label}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/trial-checkout"
            className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white font-bold text-[12px] transition-all active:scale-95"
          >
            <span>Empezar prueba</span>
            <ArrowRight size={13} />
          </Link>
        </motion.div>

        {/* Bottom trust bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease: EASING_OUT }}
          className="text-center mt-12 sm:mt-14"
        >
          <p className="text-sm text-black/40 dark:text-white/40 mb-4">
            ¿No sabes qué plan elegir?{' '}
            <Link href="/planes" className="text-accent hover:underline font-medium">
              Compara todos los features →
            </Link>
          </p>
          <div className="flex items-center justify-center gap-6 sm:gap-10 text-[11px] font-medium text-black/35 dark:text-white/35 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Check size={13} className="text-emerald-500" />
              Sin contratos
            </span>
            <span className="flex items-center gap-2">
              <Check size={13} className="text-emerald-500" />
              Cancela cuando quieras
            </span>
            <span className="flex items-center gap-2">
              <Check size={13} className="text-emerald-500" />
              Pagos seguros
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
