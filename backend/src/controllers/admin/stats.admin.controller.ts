import { Request, Response } from 'express';
import { AdminService } from '../../services/admin.service';

const adminService = new AdminService();

/**
 * GET /api/admin/stats
 */
export const getGlobalStats = async (_req: Request, res: Response) => {
  try {
    const stats = await adminService.getGlobalStats();
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error in getGlobalStats:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas' });
  }
};

/**
 * GET /api/admin/stats/conversion
 */
export const getConversionStats = async (_req: Request, res: Response) => {
  try {
    const stats = await adminService.getConversionStats();
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error in getConversionStats:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener métricas de conversión' });
  }
};

/**
 * GET /api/admin/revenue/stats
 */
export const getRevenueStats = async (_req: Request, res: Response) => {
  try {
    // Note: getRevenueStats is still using direct logic in original controller, 
    // but in AdminService facade we might need to delegate it if we move it there later.
    // For now, I'll implement the logic here calling whatever is needed.
    const { supabaseAdmin } = await import('../../config/supabase');
    const { data: payments, error } = await supabaseAdmin
      .from('subscription_payments')
      .select('amount, currency, payment_date, status, plan_before, plan_after')
      .eq('status', 'completed')
      .order('payment_date', { ascending: false });

    if (error) throw error;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let paymentCount = 0;
    let monthlyPaymentCount = 0;
    const planCounts: Record<string, number> = {};

    (payments || []).forEach((p: any) => {
      const amount = Number(p.amount || 0);
      totalRevenue += amount;
      paymentCount++;
      const payDate = new Date(p.payment_date);
      if (payDate.getMonth() === thisMonth && payDate.getFullYear() === thisYear) {
        monthlyRevenue += amount;
        monthlyPaymentCount++;
      }
      const plan = p.plan_after || 'UNKNOWN';
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    const avgTicket = paymentCount > 0 ? totalRevenue / paymentCount : 0;
    const recentPayments = (payments || []).slice(0, 20).map((p: any) => ({
      id: p.id,
      amount: Number(p.amount || 0),
      currency: p.currency || 'COP',
      payment_date: p.payment_date,
      plan: p.plan_after || 'N/A',
    }));

    return res.status(200).json({ totalRevenue, monthlyRevenue, avgTicket, paymentCount, monthlyPaymentCount, planDistribution: planCounts, recentPayments });
  } catch (error: any) {
    console.error('Error in getRevenueStats:', error);
    return res.status(200).json({ totalRevenue: 0, monthlyRevenue: 0, avgTicket: 0, paymentCount: 0, monthlyPaymentCount: 0, planDistribution: {}, recentPayments: [], warnings: ['Error al cargar estadísticas'] });
  }
};

/**
 * GET /api/admin/stats/risk
 */
export const getRiskData = async (_req: Request, res: Response) => {
  try {
    const result = await adminService.getRiskData();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener datos de riesgo' });
  }
};

/**
 * GET /api/admin/stats/economics
 */
export const getEconomics = async (_req: Request, res: Response) => {
  try {
    const result = await adminService.getEconomics();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener datos de economía unitaria' });
  }
};

/**
 * GET /api/admin/alerts - Alertas críticas para el dashboard
 */
export const getAlerts = async (_req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import('../../config/supabase');
    
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Suscripciones por vencer en 7 días
    const { data: expiring } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('subscription_status', 'active')
      .lte('subscription_end_date', in7Days.toISOString())
      .gte('subscription_end_date', now.toISOString());
    
    // Pagos fallidos recientes
    const { data: failed } = await supabaseAdmin
      .from('subscription_payments')
      .select('id')
      .eq('status', 'failed')
      .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    return res.status(200).json({
      expiring: expiring?.length || 0,
      failed: failed?.length || 0,
      critical: (expiring?.length || 0) + (failed?.length || 0),
    });
  } catch (error: any) {
    console.error('Error in getAlerts:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener alertas' });
  }
};

/**
 * GET /api/admin/stats/top-brands - Top 10 marcas por uso
 */
export const getTopBrands = async (_req: Request, res: Response) => {
  try {
    const { supabaseAdmin } = await import('../../config/supabase');
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    
    const { data: generations, error } = await supabaseAdmin
      .from('generations')
      .select('brand_id, status, brands(id, name, slug, plan)')
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const grouped = generations?.reduce((acc: Record<string, { count: number; success: number; brand: any }>, g) => {
      if (!acc[g.brand_id]) {
        acc[g.brand_id] = { count: 0, success: 0, brand: g.brands };
      }
      acc[g.brand_id].count++;
      if (g.status === 'success') {
        acc[g.brand_id].success++;
      }
      return acc;
    }, {});
    
    const top10 = Object.values(grouped || {})
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)
      .map((item: any, index: number) => ({
        rank: index + 1,
        brand_id: item.brand?.id,
        name: item.brand?.name,
        slug: item.brand?.slug,
        plan: item.brand?.plan,
        generations: item.count,
        success: item.success,
        successRate: item.count > 0 ? Math.round((item.success / item.count) * 100) : 0,
      }));
    
    return res.status(200).json({ topBrands: top10, month: startOfMonth.toISOString() });
  } catch (error: any) {
    console.error('Error in getTopBrands:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener top marcas' });
  }
};
