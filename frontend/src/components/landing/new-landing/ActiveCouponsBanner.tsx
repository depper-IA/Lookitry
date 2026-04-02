'use client';

import { useState, useEffect } from 'react';
import { Tag, Copy, Check, ChevronRight } from 'lucide-react';

interface ActiveCoupon {
  id: string;
  code: string;
  discount_type: 'pct' | 'fixed';
  discount_value: number;
  plan_ids: string[];
  expires_at?: string;
}

export default function ActiveCouponsBanner() {
  const [coupons, setCoupons] = useState<ActiveCoupon[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('coupons_banner_dismissed');
    if (dismissed) {
      setLoading(false);
      return;
    }

    fetch('/api/promotions')
      .then(r => r.ok ? r.json() : null)
      .then((d: { ok: boolean; data: any[] } | null) => {
        if (d?.ok && d.data) {
          const active = d.data
            .filter((promo: any) => promo.type === 'coupon' && promo.active)
            .map((promo: any) => ({
              id: promo.id,
              code: promo.config?.code || '',
              discount_type: promo.config?.discount_type || 'pct',
              discount_value: promo.config?.discount_value || 0,
              plan_ids: promo.config?.plan_ids || [],
              expires_at: promo.expires_at || promo.config?.expires_at,
            }));
          if (active.length > 0) {
            setCoupons(active);
            setVisible(true);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('coupons_banner_dismissed', '1');
  };

  const formatDiscount = (coupon: ActiveCoupon) => {
    if (coupon.discount_type === 'pct') {
      return `${coupon.discount_value}% de descuento`;
    }
    return `$${coupon.discount_value.toLocaleString('es-CO')} de descuento`;
  };

  const formatPlans = (planIds: string[]) => {
    if (!planIds.length) return 'Todos los planes';
    return planIds.map(p => {
      if (p === 'BASIC') return 'Básico';
      if (p === 'PRO') return 'Pro';
      if (p === 'LANDING') return 'Mini-Landing';
      return p;
    }).join(', ');
  };

  if (loading) return null;
  if (!visible || coupons.length === 0) return null;

  return (
    <div className="relative z-50 bg-gradient-to-r from-emerald-900/90 via-emerald-800/90 to-teal-900/90 border-b border-emerald-500/20">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <Tag size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Cupones Disponibles</span>
          </div>
          <button
            onClick={handleClose}
            className="text-emerald-400/60 hover:text-emerald-300 transition-colors"
            aria-label="Cerrar cupones"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {coupons.map(coupon => (
            <div
              key={coupon.id}
              className="flex-shrink-0 bg-white/5 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 hover:border-emerald-500/40 transition-all duration-300 min-w-[260px]"
            >
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[11px] font-bold text-white truncate">{formatDiscount(coupon)}</span>
                <span className="text-[10px] text-emerald-300/60 truncate">{formatPlans(coupon.plan_ids)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[12px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {coupon.code}
                </span>
                <button
                  onClick={() => handleCopy(coupon.code, coupon.id)}
                  className="p-1 rounded hover:bg-white/10 transition-colors text-emerald-300/60 hover:text-emerald-300"
                  title="Copiar código"
                >
                  {copiedId === coupon.id ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-emerald-400/40">
          <span>Haz clic en copiar y aplica el código al pagar</span>
          <ChevronRight size={10} />
          <a href="/checkout" className="text-emerald-300 hover:text-emerald-200 transition-colors underline underline-offset-2">Ir al checkout</a>
        </div>
      </div>
    </div>
  );
}
