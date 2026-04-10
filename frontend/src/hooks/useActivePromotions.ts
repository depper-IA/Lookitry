import { useState, useEffect } from 'react';

interface PlanOverrideConfig {
  plan: 'BASIC' | 'PRO';
  override_price: number;
  original_price: number;
  label: string;
}

interface ActiveCoupon {
  id: string;
  code: string;
  discount_type: 'pct' | 'fixed';
  discount_value: number;
  plan_ids: string[];
}

interface UseActivePromotionsReturn {
  planOverrides: Record<'BASIC' | 'PRO', PlanOverrideConfig | null>;
  activeCoupons: ActiveCoupon[];
  loading: boolean;
}

export function useActivePromotions(): UseActivePromotionsReturn {
  const [planOverrides, setPlanOverrides] = useState<Record<'BASIC' | 'PRO', PlanOverrideConfig | null>>({
    BASIC: null,
    PRO: null,
  });
  const [activeCoupons, setActiveCoupons] = useState<ActiveCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promotions')
      .then(r => r.ok ? r.json() : null)
      .then((d: { ok: boolean; data: any[] } | null) => {
        if (!d?.ok) {
          setLoading(false);
          return;
        }

        const promos = d.data || [];

        // Procesar overrides de planes
        const overrides: Record<'BASIC' | 'PRO', PlanOverrideConfig | null> = { BASIC: null, PRO: null };
        for (const promo of promos) {
          if (promo.type === 'plan_override' && promo.active) {
            const cfg = promo.config;
            const plan = cfg.plan as 'BASIC' | 'PRO';
            if (plan && cfg.override_price) {
              overrides[plan] = {
                plan,
                override_price: cfg.override_price,
                original_price: cfg.original_price || 0,
                label: cfg.label || 'Oferta especial',
              };
            }
          }
        }
        setPlanOverrides(overrides);

        // Extraer cupones de las promociones activas
        const coupons = promos
          .filter((promo: any) => promo.type === 'coupon' && promo.active)
          .map((promo: any) => ({
            id: promo.id,
            code: promo.config?.code || '',
            discount_type: promo.config?.discount_type || 'pct',
            discount_value: promo.config?.discount_value || 0,
            plan_ids: promo.config?.plan_ids || [],
          }));
        setActiveCoupons(coupons);

        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { planOverrides, activeCoupons, loading };
}
