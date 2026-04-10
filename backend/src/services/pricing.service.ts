import { supabaseAdmin } from '../config/supabase';
import { PaymentSettingsService } from './paymentSettings.service';
import { TrmService } from '../utils/trm';

export interface PricingConfig {
  id: string;
  data: any;
}

interface ActivePromotion {
  type: string;
  config: any;
  starts_at?: string | null;
  ends_at?: string | null;
}

export class PricingService {
  private async getActivePromotions(): Promise<ActivePromotion[]> {
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select('type, config, starts_at, ends_at')
      .eq('active', true);

    if (error || !data) {
      return [];
    }

    const now = new Date();
    return data.filter((promo: any) => {
      const startsOk = !promo.starts_at || new Date(promo.starts_at) <= now;
      const endsOk = !promo.ends_at || new Date(promo.ends_at) >= now;
      return startsOk && endsOk;
    });
  }

  private applyExternalPlanPromotions(planKey: string, baseMonthlyPrice: number, promotions: ActivePromotion[]): number {
    const normalizedPlan = planKey.toUpperCase();
    const overridePromo = promotions.find((promo) =>
      promo.type === 'plan_override' &&
      String(promo.config?.plan || '').toUpperCase() === normalizedPlan &&
      Number(promo.config?.override_price) > 0
    );

    let effectiveBasePrice = overridePromo
      ? Number(overridePromo.config.override_price)
      : baseMonthlyPrice;

    const globalDiscountPct = promotions.reduce((max, promo) => {
      if (['launch_offer', 'modal_timer'].includes(promo.type) && Number(promo.config?.discount_pct) > 0) {
        return Math.max(max, Number(promo.config.discount_pct));
      }
      return max;
    }, 0);

    if (globalDiscountPct > 0) {
      effectiveBasePrice = Math.ceil(effectiveBasePrice * (1 - globalDiscountPct / 100));
    }

    return effectiveBasePrice;
  }

  /**
   * Obtiene la configuración de precios desde la base de datos
   */
  async getPricingConfig(): Promise<PricingConfig[]> {
    const { data, error } = await supabaseAdmin
      .from('pricing_config')
      .select('id, data');

    if (error) {
      console.error('[PricingService] Error al obtener pricing_config:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Calcula el monto total a cobrar de forma segura en el backend.
   * Ignora montos enviados desde el frontend para evitar manipulaciones.
   * 
   * @param plan - 'BASIC' | 'PRO'
   * @param months - 1, 3, 6, 12
   * @param includesLanding - si incluye mini-landing
   * @returns Monto total en COP
   */
  async calculateTotal(plan: string, months: number, includesLanding: boolean = false): Promise<number> {
    const configs = await this.getPricingConfig();
    const planKey = plan.toLowerCase(); // 'basic' o 'pro'
    
    // Buscar el plan de forma insensible a mayúsculas en el ID
    const planConfig = configs.find(c => c.id.toLowerCase() === planKey);
    const planData = planConfig?.data;
    const discounts = configs.find(c => c.id.toLowerCase() === 'descuentos_duracion')?.data;
    
    // 1. Precio base del plan (fallback si no está en DB)
    const baseMonthlyPrice = planData?.precio_mensual_cop || (planKey === 'pro' ? 350000 : 180000);
    
    // 2. Aplicar descuento por duración
    const discountKey = `meses_${months}`;
    const discountPct = discounts?.[discountKey] || 0;
    
    const planTotal = Math.round(baseMonthlyPrice * months * (1 - discountPct / 100));
    
    // 3. Sumar landing page si aplica
    let landingTotal = 0;
    if (includesLanding) {
      // El servicio se instancia localmente para evitar dependencia circular extrema
      const settingsService = new PaymentSettingsService();
      const settings = await settingsService.getSettings();
      landingTotal = settings.landing_price || 650000;
    }
    
    const finalTotal = planTotal + landingTotal;
    
    console.log(`[PricingService] Calculado: plan=${plan} months=${months} landing=${includesLanding} -> Total=${finalTotal} (Base=${baseMonthlyPrice} Desc=${discountPct}%)`);
    
    return finalTotal;
  }

  async calculateExternalCheckoutTotal(plan: string, months: number, includesLanding: boolean = false): Promise<number> {
    const configs = await this.getPricingConfig();
    const promotions = await this.getActivePromotions();
    const planKey = plan.toLowerCase();

    const planConfig = configs.find(c => c.id.toLowerCase() === planKey);
    const planData = planConfig?.data;
    const discounts = configs.find(c => c.id.toLowerCase() === 'descuentos_duracion')?.data;

    const baseMonthlyPrice = planData?.precio_mensual_cop || (planKey === 'pro' ? 350000 : 180000);
    const effectiveMonthlyPrice = this.applyExternalPlanPromotions(planKey, baseMonthlyPrice, promotions);

    const discountKey = `meses_${months}`;
    const discountPct = discounts?.[discountKey] || 0;
    const planTotal = Math.ceil(effectiveMonthlyPrice * months * (1 - discountPct / 100));

    let landingTotal = 0;
    if (includesLanding) {
      // El servicio se instancia localmente para evitar dependencia circular extrema
      const settingsService = new PaymentSettingsService();
      const settings = await settingsService.getSettings();
      landingTotal = settings.landing_price || 650000;
    }

    const finalTotal = planTotal + landingTotal;
    console.log(`[PricingService] Checkout externo: plan=${plan} months=${months} landing=${includesLanding} -> Total=${finalTotal} (BasePromo=${effectiveMonthlyPrice} Desc=${discountPct}%)`);
    return finalTotal;
  }

  /**
   * Obtiene la TRM efectiva respetando configuración en pricing_config.meta.
   * - Si trm_auto = false y hay trm_referencia válida → usa ese valor (manual).
   * - En otro caso → usa TRM automática (servicio externo + caché).
   * - En desarrollo se puede pasar un override explícito para pruebas.
   */
  async getEffectiveTrm(overrideFromQuery?: number | null): Promise<{ trm: number; source: 'query' | 'meta_manual' | 'meta_auto' }> {
    // Permitir override solo en desarrollo para evitar manipulaciones en producción
    if (process.env.NODE_ENV === 'development' && overrideFromQuery && overrideFromQuery > 0) {
      console.log(`[PricingService] TRM override desde query (solo dev): ${overrideFromQuery}`);
      return { trm: overrideFromQuery, source: 'query' };
    }

    const configs = await this.getPricingConfig();
    const metaConfig = configs.find(c => c.id.toLowerCase() === 'meta')?.data || {};

    const trmAuto = metaConfig.trm_auto !== false; // por defecto true
    const trmRefRaw = metaConfig.trm_referencia;
    const trmReferencia = typeof trmRefRaw === 'number' ? trmRefRaw : Number(trmRefRaw);

    // Preferir valor manual cuando trm_auto = false y el valor es válido
    if (!trmAuto && trmReferencia && trmReferencia > 0) {
      console.log(`[PricingService] TRM manual desde pricing_config.meta: ${trmReferencia}`);
      return { trm: trmReferencia, source: 'meta_manual' };
    }

    // Fallback: TRM automática desde servicio externo (con caché + fallback interno)
    const hadFreshCache = TrmService.isCacheFresh();
    const autoTrm = await TrmService.getCurrentTrm();
    if (!hadFreshCache) {
      console.log(`[PricingService] TRM automática refrescada: ${autoTrm}`);
    }
    return { trm: autoTrm, source: 'meta_auto' };
  }
}

export const pricingService = new PricingService();
