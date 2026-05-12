import { supabaseAdmin } from '../config/supabase';



export interface GenerationsByBrandStats {

  brandId: string;

  brandName: string;

  totalGenerations: number;

  successfulGenerations: number;

  failedGenerations: number;

  successRate: number;

}



export interface ProductUsageStats {

  productId: string;

  productName: string;

  productImageUrl: string;

  category: string;

  totalGenerations: number;

  successfulGenerations: number;

  lastUsed: string;

}



export interface BrandAnalytics {

  totalGenerations: number;

  successfulGenerations: number;

  failedGenerations: number;

  successRate: number;

  mostUsedProducts: ProductUsageStats[];

  generationsByMonth: {

    month: string;

    count: number;

  }[];

}



export class AnalyticsService {

  /**

   * Obtener estadísticas de generaciones por marca

   */

  async getGenerationsByBrand(brandId: string): Promise<GenerationsByBrandStats> {

    // Obtener información de la marca

    const { data: brand } = await supabaseAdmin

      .from('brands')

      .select('id, name')

      .eq('id', brandId)

      .single();



    if (!brand) {

      throw new Error('Marca no encontrada');

    }



    // Contar todas las generaciones

    const { count: totalGenerations } = await supabaseAdmin

      .from('generations')

      .select('*', { count: 'exact', head: true })

      .eq('brand_id', brandId);



    // Contar generaciones exitosas

    const { count: successfulGenerations } = await supabaseAdmin

      .from('generations')

      .select('*', { count: 'exact', head: true })

      .eq('brand_id', brandId)

      .eq('status', 'SUCCESS');



    // Contar generaciones fallidas

    const { count: failedGenerations } = await supabaseAdmin

      .from('generations')

      .select('*', { count: 'exact', head: true })

      .eq('brand_id', brandId)

      .eq('status', 'FAILED');



    const total = totalGenerations || 0;

    const successful = successfulGenerations || 0;

    const failed = failedGenerations || 0;

    const successRate = total > 0 ? (successful / total) * 100 : 0;



    return {

      brandId: brand.id,

      brandName: brand.name,

      totalGenerations: total,

      successfulGenerations: successful,

      failedGenerations: failed,

      successRate: Math.round(successRate * 100) / 100,

    };

  }



  /**

   * Obtener productos más usados de una marca

   */

  async getMostUsedProducts(brandId: string, limit = 10): Promise<ProductUsageStats[]> {

    // Obtener generaciones agrupadas por producto

    const { data: generations, error } = await supabaseAdmin

      .from('generations')

      .select(`

        product_id,

        status,

        generated_at,

        products (

          id,

          name,

          image_url,

          category

        )

      `)

      .eq('brand_id', brandId)

      .order('generated_at', { ascending: false });



    if (error) {

      throw new Error('Error al obtener productos más usados: ' + error.message);

    }



    if (!generations || generations.length === 0) {

      return [];

    }



    // Agrupar por producto y contar

    const productMap = new Map<string, {

      product: any;

      totalGenerations: number;

      successfulGenerations: number;

      lastUsed: string;

    }>();



    for (const gen of generations) {

      const productId = gen.product_id;

      const product = (gen as any).products;



      if (!product) continue;



      if (!productMap.has(productId)) {

        productMap.set(productId, {

          product,

          totalGenerations: 0,

          successfulGenerations: 0,

          lastUsed: gen.generated_at,

        });

      }



      const stats = productMap.get(productId)!;

      stats.totalGenerations++;

      if (gen.status === 'SUCCESS') {

        stats.successfulGenerations++;

      }

      // Actualizar última fecha de uso (más reciente)

      if (new Date(gen.generated_at) > new Date(stats.lastUsed)) {

        stats.lastUsed = gen.generated_at;

      }

    }



    // Convertir a array y ordenar por total de generaciones

    const productStats: ProductUsageStats[] = Array.from(productMap.entries())

      .map(([productId, stats]) => ({

        productId,

        productName: stats.product.name,

        productImageUrl: stats.product.image_url,

        category: stats.product.category,

        totalGenerations: stats.totalGenerations,

        successfulGenerations: stats.successfulGenerations,

        lastUsed: stats.lastUsed,

      }))

      .sort((a, b) => b.totalGenerations - a.totalGenerations)

      .slice(0, limit);



    return productStats;

  }



  /**

   * Obtener analytics completos de una marca

   */

  async getBrandAnalytics(brandId: string): Promise<BrandAnalytics> {

    // Obtener estadísticas generales

    const generalStats = await this.getGenerationsByBrand(brandId);



    // Obtener productos más usados

    const mostUsedProducts = await this.getMostUsedProducts(brandId, 5);



    // Obtener generaciones por mes (últimos 6 meses)

    const generationsByMonth = await this.getGenerationsByMonth(brandId, 6);



    return {

      totalGenerations: generalStats.totalGenerations,

      successfulGenerations: generalStats.successfulGenerations,

      failedGenerations: generalStats.failedGenerations,

      successRate: generalStats.successRate,

      mostUsedProducts,

      generationsByMonth,

    };

  }



  /**

   * Obtener generaciones agrupadas por mes

   */

  private async getGenerationsByMonth(

    brandId: string,

    monthsBack = 6

  ): Promise<{ month: string; count: number }[]> {

    const now = new Date();

    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);



    const { data: generations, error } = await supabaseAdmin

      .from('generations')

      .select('generated_at, status')

      .eq('brand_id', brandId)

      .eq('status', 'SUCCESS')

      .gte('generated_at', startDate.toISOString());



    if (error) {

      throw new Error('Error al obtener generaciones por mes: ' + error.message);

    }



    // Agrupar por mes

    const monthMap = new Map<string, number>();



    // Inicializar todos los meses con 0

    for (let i = 0; i < monthsBack; i++) {

      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      monthMap.set(monthKey, 0);

    }



    // Contar generaciones por mes

    if (generations) {

      for (const gen of generations) {

        const date = new Date(gen.generated_at);

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);

      }

    }



    // Convertir a array y ordenar por fecha

    return Array.from(monthMap.entries())

      .map(([month, count]) => ({ month, count }))

      .sort((a, b) => a.month.localeCompare(b.month));

  }

}

