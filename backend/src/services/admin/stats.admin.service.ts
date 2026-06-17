import { supabaseAdmin } from '../../config/supabase';

import { getReportingTrm, normalizePaymentRecordToCop } from '../../utils/paymentNormalization';

import { inferBillingType, inferPlanPurchased } from '../../utils/paymentLedger';



/**

 * Stats Admin Service — Estadísticas globales del sistema.

 * Extraído de AdminService para mejorar mantenibilidad.

 */

export class StatsAdminService {

  /**

   * Estadísticas globales del panel de administración

   */

  async getGlobalStats() {

    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);



    const [

      { count: totalBrands },

      { count: totalProducts },

      { count: totalGenerations },

      { count: successfulGenerations },

      { count: generationsThisMonth },

      { count: pendingReviews },

      { data: recentApprovedReviews },

    ] = await Promise.all([

      supabaseAdmin.from('brands').select('*', { count: 'exact', head: true }),

      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),

      supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }),

      supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }).eq('status', 'SUCCESS'),

      supabaseAdmin.from('generations').select('*', { count: 'exact', head: true }).gte('generated_at', startOfMonth.toISOString()),

      supabaseAdmin.from('brand_reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),

      supabaseAdmin.from('brand_reviews').select('id, rating, comment, reviewer_name, created_at, status, is_featured').eq('status', 'approved').order('created_at', { ascending: false }).limit(3),

    ]);



    const { data: brandsForPlanStats, error: brandsForPlanStatsError } = await supabaseAdmin

      .from('brands')

      .select('plan, subscription_status, trial_end_date');



    if (brandsForPlanStatsError) {

      throw new Error('Error al obtener distribución de planes: ' + brandsForPlanStatsError.message);

    }



    const brandsByPlan = (brandsForPlanStats || []).reduce(

      (acc, brand) => {

        if (brand.plan === 'TRIAL') acc.TRIAL += 1;

        else if (brand.plan === 'PRO' || brand.plan === 'ENTERPRISE') acc.PRO += 1;

        else acc.BASIC += 1;

        return acc;

      },

      { BASIC: 0, PRO: 0, TRIAL: 0 }

    );



    const [

      { count: landingsActive },

      { count: landingsSuspended },

      { count: landingsInactive },

    ] = await Promise.all([

      supabaseAdmin.from('brands').select('*', { count: 'exact', head: true }).eq('has_landing_page', true),

      supabaseAdmin.from('brands').select('*', { count: 'exact', head: true }).not('landing_suspended_at', 'is', null),

      supabaseAdmin.from('brands').select('*', { count: 'exact', head: true }).eq('has_landing_page', false).is('landing_suspended_at', null),

    ]);



    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const { data: recentGenerations, error: recentGenerationsError } = await supabaseAdmin

      .from('generations')

      .select('generated_at, status')

      .gte('generated_at', sixMonthsAgo.toISOString())

      .order('generated_at', { ascending: true });



    if (recentGenerationsError) {

      throw new Error(`Error al obtener generaciones recientes: ${recentGenerationsError.message}`);

    }



    const monthlyMap = new Map<string, { total: number; success: number; failed: number }>();

    for (let i = 0; i < 6; i++) {

      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      monthlyMap.set(key, { total: 0, success: 0, failed: 0 });

    }



    recentGenerations?.forEach(generation => {

      if (!generation.generated_at) return;

      const generatedAt = new Date(generation.generated_at);

      if (Number.isNaN(generatedAt.getTime())) return;

      const key = `${generatedAt.getFullYear()}-${String(generatedAt.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(key)) return;

      const stats = monthlyMap.get(key)!;

      const normalizedStatus = String(generation.status || '').toUpperCase();

      stats.total++;

      if (normalizedStatus === 'SUCCESS') stats.success++;

      else if (normalizedStatus === 'FAILED') stats.failed++;

    });



    const generationsByMonth = Array.from(monthlyMap.entries())

      .map(([month, s]) => ({ month, ...s }))

      .sort((a, b) => a.month.localeCompare(b.month));



    return {

      totalBrands: totalBrands || 0,

      totalProducts: totalProducts || 0,

      totalGenerations: totalGenerations || 0,

      successfulGenerations: successfulGenerations || 0,

      failedGenerations: (totalGenerations || 0) - (successfulGenerations || 0),

      generationsThisMonth: generationsThisMonth || 0,

      successRate: totalGenerations ? ((successfulGenerations || 0) / totalGenerations) * 100 : 0,

      brandsByPlan,

      landingStats: {

        active: landingsActive || 0,

        suspended: landingsSuspended || 0,

        inactive: landingsInactive || 0,

      },

      generationsByMonth,

      reviewsStats: {

        pendingCount: pendingReviews || 0,

        recentApproved: recentApprovedReviews || [],

      },

    };

  }



  /**

   * Métricas de conversión: marcas en trial, convertidas, tasa de conversión

   */

  async getConversionStats() {

    const { data: brands, error } = await supabaseAdmin

      .from('brands')

      .select('id, name, email, slug, plan, subscription_status, trial_end_date, trial_payment_status, created_at, social_links')

      .order('created_at', { ascending: true });



    if (error || !brands) {

      throw new Error('Error al obtener datos de conversión: ' + error?.message);

    }



    const { data: completedPayments, error: paymentsError } = await supabaseAdmin

      .from('subscription_payments')

      .select('amount, currency, notes, status')

      .eq('status', 'completed');



    if (paymentsError) throw new Error('Error al obtener pagos: ' + paymentsError.message);



    const now = new Date();



    const inTrial = brands.filter(b =>

      b.plan === 'TRIAL' && !!b.trial_end_date && new Date(b.trial_end_date) > now && b.subscription_status !== 'suspended'

    );



    const paidTrialPayments = completedPayments || [];

    const reportingTrm = await getReportingTrm();

    const trmCache = new Map<string, number | null>();



    const trialActivationPayments = paidTrialPayments.filter(payment => {

      const planPurchased = inferPlanPurchased(payment);

      const billingType = inferBillingType(payment);

      return planPurchased === 'TRIAL' || billingType === 'trial_activation';

    });



    let trialRevenueCOP = 0;

    for (const payment of trialActivationPayments) {

      const normalized = await normalizePaymentRecordToCop(payment, reportingTrm, trmCache);

      trialRevenueCOP += normalized?.amountCop || 0;

    }



    const converted = brands.filter(b =>

      b.plan !== 'TRIAL' && (b.subscription_status === 'active' || b.subscription_status === 'expiring_soon')

    );



    const trialConversionEvents = brands.flatMap(brand => {

      if (!brand?.social_links) return [];

      const socialLinks: any = brand.social_links;

      const events = Array.isArray(socialLinks?.trial_events) ? socialLinks.trial_events : [];

      return events

        .filter((event: any) => event && typeof event === 'object' && event.type === 'trial_converted')

        .map((event: any) => ({

          brandId: brand.id,

          created_at: event.created_at || brand.created_at,

          planPurchased: String(event?.payload?.planPurchased || '').toUpperCase(),

        }));

    });



    const trialToBasic = trialConversionEvents.filter(e => e.planPurchased === 'BASIC').length;

    const trialToPro = trialConversionEvents.filter(e => e.planPurchased === 'PRO').length;

    const trialToEnterprise = trialConversionEvents.filter(e => e.planPurchased === 'ENTERPRISE').length;

    const trialToPaid = trialToBasic + trialToPro + trialToEnterprise;



    const totalBrands = brands.length;

    const conversionRate = totalBrands > 0 ? Math.round((converted.length / totalBrands) * 100) : 0;

    const trialRate = totalBrands > 0 ? Math.round((inTrial.length / totalBrands) * 100) : 0;



    const monthlyConversions: Record<string, number> = {};

    const sixMonthsAgo = new Date(now);

    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    sixMonthsAgo.setDate(1);

    sixMonthsAgo.setHours(0, 0, 0, 0);



    for (let i = 0; i < 6; i++) {

      const d = new Date(now);

      d.setMonth(d.getMonth() - (5 - i));

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      monthlyConversions[key] = 0;

    }



    trialConversionEvents.forEach(event => {

      const eventDate = new Date(event.created_at);

      if (eventDate >= sixMonthsAgo) {

        const key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;

        if (key in monthlyConversions) monthlyConversions[key]++;

      }

    });



    const conversionsByMonth = Object.entries(monthlyConversions).map(([month, count]) => ({ month, count }));



    const activeTrials = inTrial.map(brand => {

      const trialEnd = brand.trial_end_date ? new Date(brand.trial_end_date) : null;

      const diffMs = trialEnd ? trialEnd.getTime() - now.getTime() : 0;

      const daysRemaining = trialEnd ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 0;

      return { id: brand.id, name: brand.name, email: brand.email, slug: brand.slug, plan: brand.plan, subscription_status: brand.subscription_status, trial_end_date: brand.trial_end_date, created_at: brand.created_at, trial_days_remaining: daysRemaining };

    }).sort((a, b) => a.trial_days_remaining - b.trial_days_remaining);



    return {

      totalBrands, inTrial: inTrial.length, paidTrials: trialActivationPayments.length,

      trialRevenueCOP: Math.round(trialRevenueCOP), trialToBasic, trialToPro,

      trialToEnterprise, trialToPaid, converted: converted.length,

      conversionRate, trialRate, conversionsByMonth, activeTrials,

    };

  }



  /**

   * Análisis de economía: ingresos por plan, márgenes y cohortes

   */

  async getEconomics() {

    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);



    const { data: brands, error: brandsError } = await supabaseAdmin

      .from('brands')

      .select('id, name, plan, subscription_status, created_at');



    if (brandsError || !brands) {

      throw new Error('Error al obtener datos de economía: ' + brandsError?.message);

    }



    const { data: payments, error: payError } = await supabaseAdmin

      .from('subscription_payments')

      .select('brand_id, amount, currency, status, payment_date, payment_method, notes');



    if (payError) console.error('Error getting payments for economics:', payError);



    const completedPayments = (payments || []).filter(p => p.status === 'completed');

    const revenueByPlan: Record<string, { total: number; count: number }> = {

      BASIC: { total: 0, count: 0 }, PRO: { total: 0, count: 0 },

      TRIAL: { total: 0, count: 0 }, ENTERPRISE: { total: 0, count: 0 },

    };



    for (const payment of completedPayments) {

      const brand = brands.find(b => b.id === payment.brand_id);

      const plan = brand?.plan || 'BASIC';

      const amount = Number(payment.amount) || 0;

      if (!revenueByPlan[plan]) revenueByPlan[plan] = { total: 0, count: 0 };

      revenueByPlan[plan].total += amount;

      revenueByPlan[plan].count += 1;

    }



    const { data: generations, error: genError } = await supabaseAdmin

      .from('generations')

      .select('brand_id, status, generated_at')

      .gte('generated_at', startOfMonth.toISOString());



    if (genError) console.error('Error getting generations for economics:', genError);



    const genByPlan: Record<string, number> = { BASIC: 0, PRO: 0, TRIAL: 0, ENTERPRISE: 0 };

    for (const g of generations || []) {

      const brand = brands.find(b => b.id === g.brand_id);

      const plan = brand?.plan || 'BASIC';

      if (g.status === 'SUCCESS') genByPlan[plan] = (genByPlan[plan] || 0) + 1;

    }



    const COST_PER_GEN = 0.039;

    const estimatedCostPerGen = COST_PER_GEN;



    const economicsByPlan = Object.entries(revenueByPlan).map(([plan, rev]) => {

      const genCount = genByPlan[plan] || 0;

      const estimatedCost = genCount * estimatedCostPerGen;

      const margin = rev.total - estimatedCost;

      const marginPct = rev.total > 0 ? (margin / rev.total) * 100 : 0;

      return {

        plan, revenue: rev.total, payment_count: rev.count,

        generations_this_month: genCount, estimated_ia_cost: estimatedCost,

        margin, margin_percent: Math.round(marginPct * 10) / 10,

        avg_revenue_per_brand: rev.count > 0 ? rev.total / rev.count : 0,

      };

    });



    const totalRevenue = economicsByPlan.reduce((sum, e) => sum + e.revenue, 0);

    const totalCost = economicsByPlan.reduce((sum, e) => sum + e.estimated_ia_cost, 0);

    const totalMargin = totalRevenue - totalCost;

    const totalMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;



    const brandByCohort = new Map<string, { brands: Set<string>; revenue: number }>();

    for (const brand of brands) {

      const cohortMonth = brand.created_at ? new Date(brand.created_at).toISOString().slice(0, 7) : 'unknown';

      if (!brandByCohort.has(cohortMonth)) brandByCohort.set(cohortMonth, { brands: new Set(), revenue: 0 });

      brandByCohort.get(cohortMonth)!.brands.add(brand.id);

    }

    for (const payment of completedPayments) {

      const brand = brands.find(b => b.id === payment.brand_id);

      if (brand?.created_at) {

        const cohortMonth = new Date(brand.created_at).toISOString().slice(0, 7);

        if (brandByCohort.has(cohortMonth)) brandByCohort.get(cohortMonth)!.revenue += Number(payment.amount) || 0;

      }

    }

    const cohortData = Array.from(brandByCohort.entries())

      .map(([month, data]) => ({ month, brands: data.brands.size, revenue: data.revenue }))

      .sort((a, b) => a.month.localeCompare(b.month));



    return {

      by_plan: economicsByPlan,

      summary: {

        total_revenue: totalRevenue,

        total_estimated_ia_cost: totalCost,

        total_margin: totalMargin,

        total_margin_percent: Math.round(totalMarginPct * 10) / 10,

        total_generations_this_month: Object.values(genByPlan).reduce((s, v) => s + v, 0),

      },

      cohorts: cohortData.slice(-12),

    };

  }



  /**

   * Análisis de riesgo de churn por marca

   */

  async getRiskData() {

    const now = new Date();



    const { data: brands, error } = await supabaseAdmin

      .from('brands')

      .select('id, name, email, plan, subscription_status, trial_end_date, subscription_end_date, created_at, has_landing_page');



    if (error || !brands) throw new Error('Error al obtener datos de riesgo: ' + error?.message);



    const { data: generations, error: genError } = await supabaseAdmin

      .from('generations')

      .select('brand_id, status, generated_at')

      .gte('generated_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());



    if (genError) console.error('Error getting generations for risk:', genError);



    const genByBrand = new Map<string, { total: number; failed: number; last_at: string | null }>();

    for (const g of generations || []) {

      const existing = genByBrand.get(g.brand_id) || { total: 0, failed: 0, last_at: null };

      existing.total += 1;

      if (g.status === 'FAILED') existing.failed += 1;

      if (!existing.last_at || g.generated_at > existing.last_at) existing.last_at = g.generated_at;

      genByBrand.set(g.brand_id, existing);

    }



    const { data: failedPayments, error: payError } = await supabaseAdmin

      .from('subscription_payments')

      .select('brand_id, payment_date, amount')

      .eq('status', 'failed')

      .gte('payment_date', new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString());



    if (payError) console.error('Error getting failed payments for risk:', payError);



    const failedPayByBrand = new Map<string, number>();

    for (const p of failedPayments || []) {

      failedPayByBrand.set(p.brand_id, (failedPayByBrand.get(p.brand_id) || 0) + 1);

    }



    const riskBrands: Array<{

      id: string; name: string; email: string; plan: string;

      risk_score: number; risk_factors: string[];

      subscription_status: string | null; trial_end_date: string | null;

      generations_30d: number; failed_generations_30d: number;

      failed_payments_60d: number; last_generation: string | null;

    }> = [];



    for (const brand of brands) {

      const riskFactors: string[] = [];

      let riskScore = 0;

      const genStats = genByBrand.get(brand.id) || { total: 0, failed: 0, last_at: null };

      const failedPayCount = failedPayByBrand.get(brand.id) || 0;



      if (brand.plan === 'TRIAL' && brand.trial_end_date) {

        const trialEnd = new Date(brand.trial_end_date);

        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 3 && daysLeft >= 0) { riskFactors.push(`Trial expira en ${daysLeft} días`); riskScore += 30; }

        else if (daysLeft < 0) { riskFactors.push('Trial vencido sin conversión'); riskScore += 50; }

      }

      if (brand.plan !== 'TRIAL' && genStats.total === 0) { riskFactors.push('Sin generaciones registradas'); riskScore += 25; }

      if (genStats.total > 0 && genStats.total <= 2) { riskFactors.push('Uso muy bajo (1-2 generaciones en 30 días)'); riskScore += 20; }

      if (genStats.total > 0 && genStats.failed / genStats.total > 0.5) { riskFactors.push(`Alta tasa de error (${Math.round((genStats.failed / genStats.total) * 100)}%)`); riskScore += 25; }

      if (failedPayCount >= 2) { riskFactors.push(`${failedPayCount} pagos fallidos en 60 días`); riskScore += 30; }

      if (brand.subscription_status === 'suspended') { riskFactors.push('Suscripción suspendida'); riskScore += 40; }

      if (brand.has_landing_page === false && brand.plan !== 'TRIAL') { riskFactors.push('Sin mini-landing activada'); riskScore += 10; }

      if (genStats.last_at) {

        const daysSinceLastGen = Math.floor((now.getTime() - new Date(genStats.last_at).getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceLastGen > 14 && (brand.plan === 'PRO' || brand.plan === 'BASIC')) { riskFactors.push(`Sin uso hace ${daysSinceLastGen} días`); riskScore += 20; }

      }



      if (riskScore > 0) {

        riskBrands.push({

          id: brand.id, name: brand.name, email: brand.email, plan: brand.plan,

          risk_score: Math.min(riskScore, 100), risk_factors: riskFactors,

          subscription_status: brand.subscription_status, trial_end_date: brand.trial_end_date,

          generations_30d: genStats.total, failed_generations_30d: genStats.failed,

          failed_payments_60d: failedPayCount, last_generation: genStats.last_at,

        });

      }

    }



    riskBrands.sort((a, b) => b.risk_score - a.risk_score);



    return {

      risk_brands: riskBrands,

      summary: {

        total_at_risk: riskBrands.length,

        high_risk: riskBrands.filter(b => b.risk_score >= 50).length,

        medium_risk: riskBrands.filter(b => b.risk_score >= 25 && b.risk_score < 50).length,

        low_risk: riskBrands.filter(b => b.risk_score < 25).length,

      },

    };

  }

}



export const statsAdminService = new StatsAdminService();

