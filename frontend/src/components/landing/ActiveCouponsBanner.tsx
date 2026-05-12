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
      .then((r) => (r.ok ? r.json() : null))
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
    return planIds
      .map((p) => {
        if (p === 'BASIC') return 'Basico';
        if (p === 'PRO') return 'Pro';
        if (p === 'LANDING') return 'Mini-Landing';
        return p;
      })
      .join(', ');
  };

  if (loading) return null;
  if (!visible || coupons.length === 0) return null;

  return (
    <div className="relative z-50 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-900/90 via-emerald-800/90 to-teal-900/90">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <Tag size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Cupones Disponibles</span>
          </div>
          <button
            onClick={handleClose}
            className="text-emerald-400/60 transition-colors hover:text-emerald-300"
            aria-label="Cerrar cupones"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex min-w-[260px] flex-shrink-0 items-center gap-3 rounded-xl border border-emerald-500/20 bg-white/5 px-4 py-2.5 transition-all duration-300 hover:border-emerald-500/40 hover:bg-white/10"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold text-white">{formatDiscount(coupon)}</span>
                <span className="block truncate text-[10px] text-emerald-300/60">{formatPlans(coupon.plan_ids)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[12px] font-bold text-emerald-300">
                  {coupon.code}
                </span>
                <button
                  onClick={() => handleCopy(coupon.code, coupon.id)}
                  className="rounded p-1 text-emerald-300/60 transition-colors hover:bg-white/10 hover:text-emerald-300"
                  title="Copiar codigo"
                >
                  {copiedId === coupon.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-emerald-400/40">
          <span>Haz clic en copiar y aplica el codigo al pagar</span>
          <ChevronRight size={10} />
          <a href="/checkout" className="text-emerald-300 underline underline-offset-2 transition-colors hover:text-emerald-200">
            Ir al checkout
          </a>
        </div>
      </div>
    </div>
  );
}
