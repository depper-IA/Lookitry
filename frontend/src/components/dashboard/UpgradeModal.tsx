'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X, Zap, Check, ArrowRight, Sparkles } from 'lucide-react';
import { subscriptionService } from '@/services/subscription.service';

interface UpgradeModalProps {
  onClose: () => void;
}

const BASIC_FEATURES = [
  'Hasta 5 productos',
  '400 fotos por mes',
  'Logo y colores de tu marca',
  'Tu propia página de pruebas',
  'Soporte por WhatsApp',
];

const PRO_FEATURES = [
  'Hasta 15 productos',
  '1.200 fotos por mes',
  'Diseños Minimal, Modern y Bold',
  'Texto del botón personalizado',
  'Mensaje de bienvenida',
  'Tu propia URL para el probador',
  'Soporte prioritario',
];

function formatCOP(n: number) {
  return '$' + n.toLocaleString('es-CO');
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const router = useRouter();
  const [isInTrial, setIsInTrial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [basicPrice, setBasicPrice] = useState(150000);
  const [proPrice, setProPrice] = useState(250000);

  useEffect(() => {
    subscriptionService.getSubscriptionInfo()
      .then((info) => setIsInTrial(info.isInTrial ?? false))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?select=id,data&id=in.(basic,pro)`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
    })
      .then(r => r.ok ? r.json() : null)
      .then((rows: any[]) => {
        if (!Array.isArray(rows)) return;
        const b = rows.find(r => r.id === 'basic')?.data;
        const p = rows.find(r => r.id === 'pro')?.data;
        if (b?.precio_mensual_cop) setBasicPrice(b.precio_mensual_cop);
        if (p?.precio_mensual_cop) setProPrice(p.precio_mensual_cop);
      })
      .catch(() => {});
  }, []);

  const handleUpgrade = (plan: 'BASIC' | 'PRO') => {
    onClose();
    router.push(`/dashboard/checkout?plan=${plan}`);
  };

  // ── TRIAL: selector de plan ──────────────────────────────────────────────
  if (!loading && isInTrial) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg rounded-3xl md:rounded-[2rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          style={{ background: 'var(--bg-card)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 py-5 shrink-0" style={{ background: 'linear-gradient(135deg, #FF5C3A 0%, #e04e30 100%)' }}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors z-10"
              style={{ background: 'rgba(255,255,255,0.2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="pr-8">
                <h2 className="text-lg font-bold text-white leading-tight">Elige tu plan</h2>
                <p className="text-white/75 text-[11px] md:text-sm uppercase font-black tracking-widest opacity-80">Haz que tu tienda brille</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-6 overflow-y-auto custom-scrollbar">
            <p className="text-xs md:text-sm mb-6 font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Tu período de prueba está activo. Elige un plan para seguir usando Lookitry.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plan Básico */}
              <div
                className="rounded-2xl border p-5 flex flex-col gap-4 transition-all hover:border-[#FF5C3A]/30"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)' }}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--text-muted)' }}>Básico</p>
                  <p className="text-2xl font-[950] tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                    {formatCOP(basicPrice)}
                    <span className="text-xs font-bold opacity-40 ml-1" style={{ color: 'var(--text-muted)' }}>/mes</span>
                  </p>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {BASIC_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3 text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'rgba(255,92,58,0.1)' }}>
                        <Check className="w-2.5 h-2.5 text-[#FF5C3A]" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade('BASIC')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg"
                  style={{ borderColor: '#FF5C3A', color: '#FF5C3A', background: 'transparent' }}
                >
                  Elegir Básico <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Plan Pro */}
              <div
                className="rounded-2xl border-2 p-5 flex flex-col gap-4 relative transition-all shadow-xl shadow-[#FF5C3A]/5"
                style={{ borderColor: '#FF5C3A', background: 'rgba(255,92,58,0.04)' }}
              >
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full text-white whitespace-nowrap shadow-lg"
                  style={{ background: 'linear-gradient(90deg, #FF5C3A, #FF8C70)' }}
                >
                  Más Popular
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: '#FF5C3A' }}>Pro</p>
                  <p className="text-2xl font-[950] tracking-tighter" style={{ color: '#FF5C3A' }}>
                    {formatCOP(proPrice)}
                    <span className="text-xs font-bold opacity-40 ml-1" style={{ color: 'var(--text-muted)' }}>/mes</span>
                  </p>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {PRO_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3 text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'rgba(255,92,58,0.1)' }}>
                        <Check className="w-2.5 h-2.5 text-[#FF5C3A]" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade('PRO')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-xl shadow-[#FF5C3A]/30"
                  style={{ background: '#FF5C3A' }}
                >
                  <Zap className="w-3.5 h-3.5" /> Elegir Pro
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer opacity-40 hover:opacity-100"
              style={{ color: 'var(--text-muted)' }}
            >
              Cerrar y seguir probando
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── BASIC → PRO ──────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="relative px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #FF5C3A 0%, #e04e30 100%)' }}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            style={{ background: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Actualiza tu plan</h2>
              <p className="text-white/75 text-sm">{formatCOP(proPrice)} COP / mes</p>
            </div>
          </div>

          {/* Price highlight */}
          <div className="flex items-baseline gap-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
            <span className="text-3xl font-bold text-white">{formatCOP(proPrice)}</span>
            <span className="text-sm text-white/70">COP/mes</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Con el Plan Pro obtienes más fotos y más funcionalidades:
          </p>

          <ul className="space-y-2.5 mb-5">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,92,58,0.1)' }}
                >
                  <Check className="w-3 h-3 text-[#FF5C3A]" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Cancelar
            </button>
            <button
              onClick={() => handleUpgrade('PRO')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity cursor-pointer"
              style={{ background: '#FF5C3A' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Zap className="w-4 h-4" /> Elegir Plan Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
