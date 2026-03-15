import { supabase } from '../config/supabase';
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
    const { data: brand } = await supabase
      .from('brands')
      .select('plan')
      .eq('id', brandId)
      .single();

    if (!brand) {
      return false;
    }

    const plan = getPlanByType(brand.plan);
    const currentMonth = this.getCurrentMonthRange();

    // Contar generaciones exitosas del mes actual
    const { count } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', 'SUCCESS')
      .gte('generated_at', currentMonth.start.toISOString())
      .lte('generated_at', currentMonth.end.toISOString());

    return (count || 0) < plan.maxGenerationsPerMonth;
  }

  async checkProductLimit(brandId: string): Promise<boolean> {
    // Obtener el plan de la marca
    const { data: brand } = await supabase
      .from('brands')
      .select('plan')
      .eq('id', brandId)
      .single();

    if (!brand) {
      return false;
    }

    const plan = getPlanByType(brand.plan);

    // Contar productos activos
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('is_active', true);

    return (count || 0) < plan.maxProducts;
  }

  async getUsageStats(brandId: string): Promise<UsageStats> {
    // Obtener el plan de la marca
    const { data: brand } = await supabase
      .from('brands')
      .select('plan')
      .eq('id', brandId)
      .single();

    if (!brand) {
      throw new Error('Marca no encontrada');
    }

    const plan = getPlanByType(brand.plan);
    const currentMonth = this.getCurrentMonthRange();

    // Contar productos activos
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('is_active', true);

    // Contar generaciones exitosas del mes actual
    const { count: generationsUsed } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('status', 'SUCCESS')
      .gte('generated_at', currentMonth.start.toISOString())
      .lte('generated_at', currentMonth.end.toISOString());

    const percentageUsed =
      ((generationsUsed || 0) / plan.maxGenerationsPerMonth) * 100;

    return {
      currentMonth: {
        generationsUsed: generationsUsed || 0,
        generationsLimit: plan.maxGenerationsPerMonth,
        productsCount: productsCount || 0,
        productsLimit: plan.maxProducts,
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
