'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check, Rocket, ArrowRight, Video, ExternalLink, Loader2 } from 'lucide-react';

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const PLAN_MESSAGES = {
  TRIAL: {
    title: '¡Tu prueba está activa!',
    subtitle: 'Ya puedes configurar tu probador virtual',
    description: 'Explora todas las funcionalidades durante los próximos días sin costo.',
    cta: 'Comenzar ahora',
  },
  BASIC: {
    title: '¡Bienvenido a Básico!',
    subtitle: 'Tu plan está activo',
    description: 'Tienes acceso a todas las funcionalidades de tu plan. Configura tu marca y empieza a usar el probador.',
    cta: 'Ir a mi dashboard',
  },
  PRO: {
    title: '¡Bienvenido a Pro!',
    subtitle: 'Tu plan está activo',
    description: 'Disfruta de todas las funcionalidades Pro. Plugin WooCommerce, templates avanzados y más.',
    cta: 'Ir a mi dashboard',
  },
  ENTERPRISE: {
    title: '¡Bienvenido a Enterprise!',
    subtitle: 'Tu plan está activo',
    description: 'Tienes acceso completo con SLA prioritario y soporte dedicado.',
    cta: 'Ir a mi dashboard',
  },
};

const PLAN_FEATURES = {
  TRIAL: ['1 producto en el probador', '15 generaciones', '7 días de acceso', 'Logo y colores de marca'],
  BASIC: ['Hasta 5 productos', '400 generaciones/mes', 'Branding básico', 'URL propia del probador', 'Plugin WooCommerce'],
  PRO: ['Hasta 15 productos', '1.200 generaciones/mes', 'Plugin WooCommerce', 'Templates Pro', 'Branding avanzado'],
  ENTERPRISE: ['Hasta 50 productos', '2.000+ generaciones/mes', 'Todo lo de Pro', 'SLA prioritario', 'Soporte dedicado'],
};

export default function PaymentSuccessScreen() {
  const searchParams = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(true);
  const [plan, setPlan] = useState<string>('BASIC');
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState(150000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const planParam = searchParams.get('plan')?.toUpperCase() || 'BASIC';
    const monthsParam = parseInt(searchParams.get('months') || '1', 10);
    const amountParam = parseInt(searchParams.get('amount') || '150000', 10);

    setPlan(['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE'].includes(planParam) ? planParam : 'BASIC');
    setMonths(monthsParam);
    setAmount(amountParam);

    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FF5C3A] animate-spin mx-auto mb-4" />
          <p className="text-[#666] text-sm">Preparando tu espacio...</p>
        </div>
      </div>
    );
  }

  const message = PLAN_MESSAGES[plan as keyof typeof PLAN_MESSAGES] || PLAN_MESSAGES.BASIC;
  const features = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.BASIC;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#050505]">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                y: -20,
                rotate: 0,
                opacity: 1
              }}
              animate={{ 
                y: typeof window !== 'undefined' ? window.innerHeight + 20 : 1000,
                rotate: 360 * (i % 2 === 0 ? 1 : -1),
                opacity: [1, 1, 0]
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                delay: Math.random() * 0.5,
                ease: 'linear'
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#FF5C3A', '#6366f1', '#10b981', '#f59e0b', '#ec4899'][i % 5],
                left: `${(i / 20) * 100}%`,
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/logo.svg" alt="Lookitry" width={32} height={32} className="group-hover:rotate-12 transition-transform duration-500" priority />
            <span className="font-jakarta font-extrabold text-2xl text-white tracking-tighter">
              Look<span className="text-[#FF5C3A]">itry</span>
            </span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="relative overflow-hidden rounded-3xl border border-[#FF5C3A]/12 bg-[#0a0a0a] shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FF5C3A]/50 to-transparent" />
          
          <div className="p-8 md:p-10 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="relative w-20 h-20 mx-auto mb-6"
            >
              <div className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                <Check className="w-10 h-10 text-[#10b981]" strokeWidth={3} />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-jakarta font-bold text-white mb-2"
            >
              {message.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-[#999] text-sm mb-6"
            >
              {message.subtitle}
            </motion.p>

            {/* Plan Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 mb-6"
            >
              <span className="text-[#FF5C3A] font-bold text-sm uppercase tracking-wider">
                Plan {plan}
              </span>
              {plan !== 'TRIAL' && months > 1 && (
                <span className="text-[#10b981] text-xs font-medium">
                  {months} meses
                </span>
              )}
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-[#999] text-sm leading-relaxed mb-8"
            >
              {message.description}
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-[#141414] rounded-2xl p-4 mb-8 text-left"
            >
              <p className="text-[11px] text-[#666] uppercase tracking-wider mb-3 font-bold">
                Lo que incluye tu plan
              </p>
              <ul className="space-y-2">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#999]">
                    <Check className="w-4 h-4 text-[#FF5C3A] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Amount paid */}
            {plan !== 'TRIAL' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="border-t border-white/10 pt-6 mb-8"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[#666] text-sm">Total pagado</span>
                  <span className="text-white font-bold text-lg">
                    {formatCOP(amount)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Link
                href="/dashboard"
                className="group relative h-14 w-full overflow-hidden rounded-2xl bg-[#FF5C3A] font-bold text-white shadow-xl shadow-[#FF5C3A]/20 transition-all active:scale-95 hover:bg-[#ff6c4d] inline-flex items-center justify-center gap-3"
              >
                <Rocket className="w-5 h-5 text-white group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-[13px] uppercase tracking-[0.2em] font-black">
                  {message.cta}
                </span>
                <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Secondary CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4"
            >
              <Link
                href="/ayuda"
                className="inline-flex items-center gap-2 text-[#666] text-sm hover:text-[#999] transition-colors"
              >
                <Video className="w-4 h-4" />
                Ver tutorial de configuración
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center items-center gap-4 opacity-40">
          <Image src="/logo.svg" alt="SSL" width={16} height={16} className="invert brightness-0" />
          <p className="text-[10px] font-black text-[#999] uppercase tracking-widest">
            Pago seguro
          </p>
        </div>
      </motion.div>
    </div>
  );
}