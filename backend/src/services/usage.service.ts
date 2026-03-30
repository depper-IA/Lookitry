import { supabaseAdmin } from '../config/supabase';
import { getPlanByType } from '../config/plans';

export interface UsageStats {
  currentMonth: {
    generationsUsed: number;
    generationsLimit: number;
    generationsRemaining: number;
    productsCount: number;
    productsLimit: number;
  };
  extraCreditsBalance: number;
  availableCredits: number;
  percentageUsed: number;
  resetDate: string;
}

export interface GenerationConsumptionReservation {
  source: 'monthly' | 'extra';
  usage: UsageStats;
}

export class UsageService {
  private getCurrentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }

  private getNextMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  private async getPlanGenerationsLimit(plan: string): Promise<number> {
    const normalizedPlan = String(plan || 'BASIC').toLowerCase();
    const { data } = await supabaseAdmin
      .from('pricing_config')
      .select('data')
      .eq('id', normalizedPlan)
      .maybeSingle();

    const pricingData = (data?.data as any) || {};
    const dynamicLimit = Number(
      pricingData.generaciones_mensuales ??
      pricingData.generaciones_mes
    );
    if (Number.isFinite(dynamicLimit) && dynamicLimit > 0) {
      return dynamicLimit;
    }

    return getPlanByType(plan).maxGenerationsPerMonth;
  }

  private async getBrandUsageContext(brandId: string) {
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('plan, email_verified, trial_end_date, trial_generations_limit, subscription_status, extra_credits_balance')
      .eq('id', brandId)
      .single();

    if (!brand) {
      throw new Error('Marca no encontrada');
    }

    if (!brand.email_verified) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    const inTrial =
      brand.plan === 'TRIAL' &&
      brand.subscription_status !== 'suspended' &&
      !!brand.trial_end_date &&
      new Date(brand.trial_end_date) > new Date();
    const generationsLimit = inTrial
      ? (brand.trial_generations_limit ?? 15)
      : await this.getPlanGenerationsLimit(brand.plan);

    return {
      brand,
      inTrial,
      generationsLimit,
      extraCreditsBalance: Number(brand.extra_credits_balance || 0),
    };
  }

  async reserveGenerationCredit(brandId: string): Promise<GenerationConsumptionReservation> {
    const usage = await this.getUsageStats(brandId);

    if (usage.currentMonth.generationsRemaining > 0) {
      return { source: 'monthly', usage };
    }

    const { data, error } = await supabaseAdmin.rpc('consume_extra_credit', {
      p_brand_id: brandId,
    });

    if (error) {
      throw new Error(`No se pudo reservar un crédito extra: ${error.message}`);
    }

    if (!data) {
      throw new Error('INSUFFICIENT_CREDITS');
    }

    return {
      source: 'extra',
      usage: {
        ...usage,
        extraCreditsBalance: Math.max(0, usage.extraCreditsBalance - 1),
        availableCredits: Math.max(0, usage.availableCredits - 1),
      },
    };
  }

  async refundReservedExtraCredit(brandId: string): Promise<void> {
    const { error } = await supabaseAdmin.rpc('refund_extra_credit', {
      p_brand_id: brandId,
    });

    if (error) {
      throw new Error(`No se pudo devolver el crédito extra reservado: ${error.message}`);
    }
  }

  async checkGenerationLimit(brandId: string): Promise<boolean> {
    try {
      await this.reserveGenerationCredit(brandId);
      return true;
    } catch {
      return false;
    }
  }

  async checkProductLimit(brandId: string): Promise<boolean> {
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('plan, trial_end_date, trial_generations_limit, subscription_status')
      .eq('id', brandId)
      .single();

    if (!brand) return false;

    const inTrial =
      brand.plan === 'TRIAL' &&
      brand.subscription_status !== 'suspended' &&
      !!brand.trial_end_date &&
      new Date(brand.trial_end_date) > new Date();
    const plan = getPlanByType(brand.plan);
    const productsLimit = inTrial ? 1 : plan.maxProducts;

    const { count } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('is_active', true);

    return (count || 0) < productsLimit;
  }

  async getUsageStats(brandId: string): Promise<UsageStats> {
    const { brand, inTrial, generationsLimit, extraCreditsBalance } = await this.getBrandUsageContext(brandId);

    let trialProductsLimit = 1;
    if (inTrial) {
      const { data: pricingMeta } = await supabaseAdmin
        .from('pricing_config')
        .select('data')
        .eq('id', 'meta')
        .single();

      if (pricingMeta?.data) {
        const meta = pricingMeta.data as any;
        trialProductsLimit = meta.trial_products_max ?? 1;
      }
    }

    const plan = getPlanByType(brand.plan);
    const productsLimit = inTrial ? trialProductsLimit : plan.maxProducts;
    const currentMonth = this.getCurrentMonthRange();

    const { count: productsCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('is_active', true);

    const { count: generationsUsed } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', 'SUCCESS')
      .gte('generated_at', currentMonth.start.toISOString())
      .lte('generated_at', currentMonth.end.toISOString());

    const safeGenerationsUsed = generationsUsed || 0;
    const generationsRemaining = Math.max(0, generationsLimit - safeGenerationsUsed);
    const percentageUsed = (safeGenerationsUsed / generationsLimit) * 100;

    return {
      currentMonth: {
        generationsUsed: safeGenerationsUsed,
        generationsLimit,
        generationsRemaining,
        productsCount: productsCount || 0,
        productsLimit,
      },
      extraCreditsBalance,
      availableCredits: generationsRemaining + extraCreditsBalance,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      resetDate: this.getNextMonthStart().toISOString(),
    };
  }
}
