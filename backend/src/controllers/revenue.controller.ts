import { Request, Response } from 'express';

import { supabaseAdmin } from '../config/supabase';

import { PaymentSettingsService } from '../services/paymentSettings.service';

import { getReportingTrm, normalizePaymentRecordToCop, convertPaymentToCop } from '../utils/paymentNormalization';

import { inferBillingType, inferPlanPurchased } from '../utils/paymentLedger';

import { sanitizeError } from '../utils/sanitizeError';


const paymentSettingsService = new PaymentSettingsService();



/**

 * RevenueController

 * 

 * Controlador para gestionar reportes de ingresos del sistema.

 * 

 * Requirements: 12.9

 */

export class RevenueController {

  /**

   * GET /api/admin/revenue/stats

   * Obtener estadísticas de ingresos mensuales

   * 

   * Requirement 12.9: Generar reporte mensual de ingresos por suscripciones

   */

  async getRevenueStats(_req: Request, res: Response): Promise<Response> {

    try {

      const paymentSettings = await paymentSettingsService.getSettings().catch(() => null);

      const landingPrice = Number(paymentSettings?.landing_price || 650000);

      const reportingTrm = await getReportingTrm();

      const trmCache = new Map<string, number | null>();



      const splitPaymentAmounts = (amount: number, payment: any) => {
        const billingType = inferBillingType(payment);
        const notes = typeof payment.notes === 'string' ? payment.notes.toLowerCase() : '';
        const hasLandingMention = notes.includes('landing');

        if (billingType === 'landing') {
          return { landing: amount, subscription: 0, billingType };
        }

        if (billingType === 'trial_activation') {
          return { landing: 0, subscription: 0, billingType };
        }

        if (hasLandingMention) {
          const landingComponent = Math.min(amount, landingPrice);
          return {
            landing: landingComponent,
            subscription: Math.max(0, amount - landingComponent),
            billingType,
          };
        }

        return { landing: 0, subscription: amount, billingType };
      };


      // Precios por plan en COP (para proyecciones)

      const PLAN_PRICES = {

        BASIC: 150000,

        PRO: 250000,

        LANDING: 650000, // Aunque suele ser pago único, lo definimos por si acaso

      };



      // 1. Obtener ingresos mensuales de los últimos 12 meses

      const { data: monthlyRevenue, error: monthlyError } = await supabaseAdmin

        .from('subscription_payments')

        .select('payment_date, amount, currency, notes, months_paid')
        .eq('status', 'completed')

        .gte('payment_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

        .order('payment_date', { ascending: true });



      if (monthlyError) {

        throw new Error(monthlyError.message);

      }



      // 2. Agrupar por mes y plan

      const monthlyData: Record<string, { total: number; basic: number; pro: number; landing: number; count: number }> = {};



      const normalizedMonthlyRevenue = await Promise.all(

        (monthlyRevenue || []).map(async (payment: any) => ({

          payment,

          normalized: await normalizePaymentRecordToCop(payment, reportingTrm, trmCache),

        }))

      );



      normalizedMonthlyRevenue.forEach(({ payment, normalized }) => {

        const month = new Date(payment.payment_date).toISOString().substring(0, 7); // YYYY-MM



        if (!monthlyData[month]) {

          monthlyData[month] = { total: 0, basic: 0, pro: 0, landing: 0, count: 0 };

        }



        const amount = normalized.amountCop;

        const split = splitPaymentAmounts(amount, payment);



        monthlyData[month].total += amount;

        monthlyData[month].count += 1;



        if (split.landing > 0) {

          monthlyData[month].landing += split.landing;

        }



        if (split.subscription > 0) {
          const planPurchased = inferPlanPurchased(payment);
          if (planPurchased === 'BASIC') {
            monthlyData[month].basic += split.subscription;
          } else if (planPurchased === 'PRO') {
            monthlyData[month].pro += split.subscription;
          } else if (split.billingType !== 'trial_activation') {
            monthlyData[month].basic += split.subscription;
          }
        } else if (split.landing === 0 && split.billingType !== 'trial_activation') {
          monthlyData[month].basic += amount;
        }
      });



      // 3. Convertir a array ordenado

      const monthlyRevenueArray = Object.entries(monthlyData)

        .map(([month, data]) => ({

          month,

          total: data.total,

          basic: data.basic,

          pro: data.pro,

          landing: data.landing,

          count: data.count,

        }))

        .sort((a, b) => a.month.localeCompare(b.month));



      // 4. Calcular ingresos del mes actual

      const currentMonth = new Date().toISOString().substring(0, 7);

      const currentMonthRevenue = monthlyData[currentMonth] || { total: 0, basic: 0, pro: 0, landing: 0, count: 0 };



      // 5. Calcular proyección del próximo mes basado en suscripciones activas

      const { data: brandsStats, error: brandsError } = await supabaseAdmin

        .from('brands')

        .select('plan, subscription_status, has_landing_page');



      if (brandsError) throw new Error(brandsError.message);



      // Filtro estricto de marcas activas según requerimiento

      const activeBrands = (brandsStats || []).filter(b => 

        ['active', 'expiring_soon'].includes(b.subscription_status)

      );



      let projectedRevenue = 0;

      let projectedBasic = 0;

      let projectedPro = 0;



      activeBrands.forEach((brand: any) => {

        if (brand.plan === 'BASIC') {

          projectedBasic += PLAN_PRICES.BASIC;

          projectedRevenue += PLAN_PRICES.BASIC;

        } else if (brand.plan === 'PRO') {

          projectedPro += PLAN_PRICES.PRO;

          projectedRevenue += PLAN_PRICES.PRO;

        }

        // Nota: LANDING suele ser pago único, no se proyecta a menos que sea recurrente

      });



      // Conteo de landings activas (basado en el flag has_landing_page = true)

      // Aseguramos que solo contamos las de marcas activas si se considera "activa"

      const activeLandings = (brandsStats || []).filter(b => b.has_landing_page === true).length;



      // 6. Desglose por plan (totales históricos)

      const { data: planBreakdown, error: planError } = await supabaseAdmin

        .from('subscription_payments')

        .select('amount, currency, notes, months_paid')
        .eq('status', 'completed');



      if (planError) throw new Error(planError.message);



      let totalBasicRevenue = 0;

      let totalProRevenue = 0;

      let totalLandingRevenue = 0;

      let basicPaymentsCount = 0;

      let proPaymentsCount = 0;

      let landingPaymentsCount = 0;



      const normalizedPlanBreakdown = await Promise.all(

        (planBreakdown || []).map(async (payment: any) => ({

          payment,

          normalized: await normalizePaymentRecordToCop(payment, reportingTrm, trmCache),

        }))

      );



      normalizedPlanBreakdown.forEach(({ payment, normalized }) => {

        const split = splitPaymentAmounts(normalized.amountCop, payment);



        if (split.landing > 0) {

          totalLandingRevenue += split.landing;

          landingPaymentsCount += 1;

        }



        if (split.subscription > 0) {
          const planPurchased = inferPlanPurchased(payment);
          if (planPurchased === 'BASIC') {
            totalBasicRevenue += split.subscription;
            basicPaymentsCount += 1;
          } else if (planPurchased === 'PRO') {
            totalProRevenue += split.subscription;
            proPaymentsCount += 1;
          } else if (split.billingType !== 'trial_activation') {
            totalBasicRevenue += split.subscription;
            basicPaymentsCount += 1;
          }
        } else if (split.landing === 0 && split.billingType !== 'trial_activation') {
          totalBasicRevenue += normalized.amountCop;
          basicPaymentsCount += 1;
        } else if (split.billingType !== 'trial_activation') {
          totalLandingRevenue += normalized.amountCop;
          landingPaymentsCount += 1;
        }
      });



      return res.json({

        monthlyRevenue: monthlyRevenueArray,

        currentMonth: {

          month: currentMonth,

          total: currentMonthRevenue.total,

          basic: currentMonthRevenue.basic,

          pro: currentMonthRevenue.pro,

          landing: currentMonthRevenue.landing,

          paymentsCount: currentMonthRevenue.count,

        },

        projection: {

          nextMonth: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().substring(0, 7),

          total: projectedRevenue,

          basic: projectedBasic,

          pro: projectedPro,

          activeSubscriptions: activeBrands.length,

          activeLandings, // Entregado dentro de projection como se pidió

        },

        planBreakdown: {

          basic: {

            totalRevenue: totalBasicRevenue,

            paymentsCount: basicPaymentsCount,

            averagePayment: basicPaymentsCount > 0 ? totalBasicRevenue / basicPaymentsCount : 0,

          },

          pro: {

            totalRevenue: totalProRevenue,

            paymentsCount: proPaymentsCount,

            averagePayment: proPaymentsCount > 0 ? totalProRevenue / proPaymentsCount : 0,

          },

          landing: {

            totalRevenue: totalLandingRevenue,

            paymentsCount: landingPaymentsCount,

            averagePayment: landingPaymentsCount > 0 ? totalLandingRevenue / landingPaymentsCount : 0,

          },

        },

      });

    } catch (error: any) {

      console.error('Error in getRevenueStats:', error);

      return res.status(500).json({

        error: 'INTERNAL_ERROR',

        message: sanitizeError(error, 'Error al obtener estadísticas de ingresos'),

      });

    }

  }



  /**

   * GET /api/admin/revenue/payments

   * Listar todos los pagos con filtros

   */

  async getAllPayments(req: Request, res: Response): Promise<Response> {
    try {
      const { method, payment_method, status, from, to, search, plan } = req.query;
      const reportingTrm = await getReportingTrm();

      let query = supabaseAdmin
        .from('subscription_payments')
        .select(`
          id, brand_id, amount, currency, payment_date,
          payment_method, status, notes, created_at,
          brands(name, email, slug, plan, social_links)
        `)
        .order('payment_date', { ascending: false });

      const methodFilter = (payment_method || method) as string | undefined;
      if (methodFilter && methodFilter !== 'all') query = query.eq('payment_method', methodFilter);
      if (status && status !== 'all') query = query.eq('status', status as string);
      if (from) query = query.gte('payment_date', from as string);
      if (to) query = query.lte('payment_date', `${to}T23:59:59`);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      let payments = (data || []).map((p: any) => {
        const normalized = convertPaymentToCop(p.amount, p.currency, reportingTrm);
        const brandPlan = inferPlanPurchased(p);
        return {
          id: p.id,
          brandId: p.brand_id,
          brandName: p.brands?.name ?? '?',
          brandEmail: p.brands?.email ?? '?',
          brandSlug: p.brands?.slug ?? '?',
          brandPlan,
          billingType: inferBillingType(p),
          archived: Boolean(p.brands?.social_links?.account_archived_at),
          amount: normalized.amountCop,
          amount_original: normalized.originalAmount,
          amount_cop: normalized.amountCop,
          exchange_rate_used: normalized.exchangeRateUsed,
          currency: normalized.currency,
          paymentDate: p.payment_date,
          paymentMethod: p.payment_method,
          status: p.status,
          notes: p.notes,
          createdAt: p.created_at,
          isLanding: inferBillingType(p) === 'landing',
        };
      });

      if (plan && plan !== 'all') {
        payments = payments.filter((payment) => payment.brandPlan === plan);
      }

      if (search) {
        const q = (search as string).toLowerCase();
        payments = payments.filter(
          p => p.brandName.toLowerCase().includes(q) ||
               p.brandEmail.toLowerCase().includes(q) ||
               p.brandSlug.toLowerCase().includes(q)
        );
      }

      const completedPayments = payments.filter((payment) => payment.status === 'completed');
      const total = completedPayments.reduce((sum, payment) => sum + payment.amount_cop, 0);
      return res.json({
        payments,
        total,
        count: payments.length,
        stats: {
          total_revenue: total,
          completed_count: completedPayments.length,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: sanitizeError(error, 'Error al obtener pagos'),
      });
    }
  }
}

