import { supabaseAdmin } from '../config/supabase';
import { getPlanByType } from '../config/plans';

export interface UsageStats {
  currentMonth: {
    generationsUsed: number;
    generationsLimit: number;
    productsCount: number;
    productsLimit: number;
  };
  percentageUsed: number;
  resetDate: string;
}

export class UsageService {
  async checkGenerationLimit(brandId: string): Promise<boolean> {
    // Obtener el plan de la marca
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('plan, email_verified')
      .eq('id', brandId)
      .single();

    if (!brand) {
      return false;
    }

    // Bloquear generaciones si el email no está verificado
    if (!brand.email_verified) {
      return false;
    }

    const plan = getPlanByType(brand.plan);
    const currentMonth = this.getCurrentMonthRange();

    // Contar generaciones exitosas del mes actual
    const { count } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', 'SUCCESS')
      .gte('generated_at', currentMonth.start.toISOString())
      .lte('generated_at', currentMonth.end.toISOString());

    return (count || 0) < plan.maxGenerationsPerMonth;
  }

  async checkProductLimit(brandId: string): Promise<boolean> {
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('plan, trial_end_date, trial_generations_limit, subscription_status')
      .eq('id', brandId)
      .single();

    if (!brand) return false;

    const hasPaidSub = brand.subscription_status === 'active' || brand.subscription_status === 'expiring_soon';
    const inTrial = !hasPaidSub && brand.trial_end_date && new Date(brand.trial_end_date) > new Date();
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
    // Obtener el plan y datos de trial de la marca
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('plan, trial_end_date, trial_generations_limit, subscription_status')
      .eq('id', brandId)
      .single();

    if (!brand) {
      throw new Error('Marca no encontrada');
    }

    // Determinar si está en trial activo (sin suscripción pagada)
    const hasPaidSub = brand.subscription_status === 'active' || brand.subscription_status === 'expiring_soon';
    const inTrial = !hasPaidSub && brand.trial_end_date && new Date(brand.trial_end_date) > new Date();

    // Límites del trial: 1 producto, generaciones = trial_generations_limit (default 30)
    const plan = getPlanByType(brand.plan);
    const generationsLimit = inTrial
      ? (brand.trial_generations_limit ?? 30)
      : plan.maxGenerationsPerMonth;
    const productsLimit = inTrial ? 1 : plan.maxProducts;
    const currentMonth = this.getCurrentMonthRange();

    // Contar productos activos
    const { count: productsCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('is_active', true);

    // Contar generaciones exitosas del mes actual
    const { count: generationsUsed } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', 'SUCCESS')
      .gte('generated_at', currentMonth.start.toISOString())
      .lte('generated_at', currentMonth.end.toISOString());

    const percentageUsed =
      ((generationsUsed || 0) / generationsLimit) * 100;

    return {
      currentMonth: {
        generationsUsed: generationsUsed || 0,
        generationsLimit,
        productsCount: productsCount || 0,
        productsLimit,
      },
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      resetDate: this.getNextMonthStart().toISOString(),
    };
  }

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
}
