import { supabaseAdmin } from '../../config/supabase';
import { getReportingTrm, normalizePaymentRecordToCop } from '../../utils/paymentNormalization';
import { getPaymentDisplayBrand, inferBillingType, inferIncludesLanding } from '../../utils/paymentLedger';

/**
 * Payment Admin Service — Gestión de pagos y activación de planes.
 * Extraído de AdminService para mejorar mantenibilidad.
 */
export class PaymentAdminService {
  /**
   * Historial de pagos global con filtros y estadísticas
   */
  async getPayments(filters: {
    brand_id?: string;
    status?: string;
    payment_method?: string;
    from?: string;
    to?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const reportingTrm = await getReportingTrm();
    const trmCache = new Map<string, number | null>();

    // 1. Consulta de estadísticas (independiente de la paginación)
    let statsQuery = supabaseAdmin
      .from('subscription_payments')
      .select('amount, currency, notes')
      .eq('status', 'completed');

    if (filters.brand_id) statsQuery = statsQuery.eq('brand_id', filters.brand_id);
    if (filters.payment_method) statsQuery = statsQuery.eq('payment_method', filters.payment_method);
    if (filters.from) statsQuery = statsQuery.gte('payment_date', new Date(filters.from).toISOString());
    if (filters.to) {
      const endDate = new Date(filters.to);
      endDate.setHours(23, 59, 59, 999);
      statsQuery = statsQuery.lte('payment_date', endDate.toISOString());
    }

    const { data: statsRows, error: statsError } = await statsQuery;
    if (statsError) throw new Error('Error al calcular ingresos: ' + statsError.message);

    // 2. Consulta paginada principal
    let query = supabaseAdmin
      .from('subscription_payments')
      .select('*, brands(name, email, slug, plan, social_links)', { count: 'exact' })
      .order('payment_date', { ascending: false });

    if (filters.brand_id) query = query.eq('brand_id', filters.brand_id);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.payment_method) query = query.eq('payment_method', filters.payment_method);
    if (filters.from) query = query.gte('payment_date', new Date(filters.from).toISOString());
    if (filters.to) {
      const endDate = new Date(filters.to);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('payment_date', endDate.toISOString());
    }
    if (typeof filters.limit === 'number' && filters.limit > 0) {
      const offset = filters.offset || 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw new Error('Error al obtener pagos: ' + error.message);

    // 3. Filtrar por búsqueda de texto (post-fetch)
    const normalizedSearch = filters.search?.trim().toLowerCase();
    const filteredPayments = normalizedSearch
      ? (data || []).filter((payment: any) => {
          const displayBrand = getPaymentDisplayBrand(payment);
          const haystack = [displayBrand.name, displayBrand.email, displayBrand.slug, payment.reference, payment.transaction_id, payment.notes]
            .filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(normalizedSearch);
        })
      : (data || []);

    // 4. Normalizar monedas y enriquecer campos
    const normalizedPayments = await Promise.all(
      filteredPayments.map(async (payment: any) => {
        if (!payment.brands) {
          payment.brands = { name: 'Marca Desconocida', email: 'N/A', slug: 'unknown', plan: 'N/A' };
        }
        const normalized = await normalizePaymentRecordToCop(payment, reportingTrm, trmCache);
        const displayBrand = getPaymentDisplayBrand(payment);
        return {
          ...payment,
          brands: {
            name: displayBrand?.name || 'N/A',
            email: displayBrand?.email || 'N/A',
            slug: displayBrand?.slug || 'unknown',
            plan: displayBrand?.plan || 'N/A',
          },
          billing_type: inferBillingType(payment),
          includes_landing: inferIncludesLanding(payment),
          archived: Boolean(payment.brands?.social_links?.account_archived_at),
          amount: normalized?.amountCop || 0,
          amount_original: normalized?.originalAmount || 0,
          amount_cop: normalized?.amountCop || 0,
          exchange_rate_used: normalized?.exchangeRateUsed || 0,
          currency: normalized?.currency || 'COP',
          reference_used: normalized?.referenceUsed || false,
        };
      })
    );

    const completedPayments = normalizedPayments.filter((payment: any) => payment.status === 'completed');
    const normalizedStatsRows = await Promise.all(
      (statsRows || []).map((payment: any) => normalizePaymentRecordToCop(payment, reportingTrm, trmCache))
    );
    const totalRevenue = normalizedStatsRows.reduce((sum: number, payment) => sum + payment.amountCop, 0);

    return {
      payments: normalizedPayments,
      count: normalizedSearch ? normalizedPayments.length : (count || 0),
      stats: {
        total_revenue: totalRevenue,
        completed_count: completedPayments.length,
      },
    };
  }

  /**
   * Activar plan de una marca (convierte trial en suscripción activa pagada por 30 días)
   */
  async activateBrandPlan(
    brandId: string,
    options: {
      plan: 'BASIC' | 'PRO';
      amount: number;
      payment_method: string;
      notes: string;
    }
  ) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    const { data: updatedBrand, error } = await supabaseAdmin
      .from('brands')
      .update({
        plan: options.plan,
        subscription_status: 'active',
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        trial_end_date: null,
        trial_payment_status: null,
        last_payment_date: now.toISOString(),
        next_payment_date: endDate.toISOString(),
      })
      .eq('id', brandId)
      .select()
      .single();

    if (error || !updatedBrand) throw new Error('Error al activar plan: ' + error?.message);

    if (options.amount > 0) {
      await supabaseAdmin.from('subscription_payments').insert({
        brand_id: brandId,
        amount: options.amount,
        currency: 'COP',
        payment_date: now.toISOString(),
        payment_method: options.payment_method,
        status: 'completed',
        notes: options.notes,
      });
    }

    return updatedBrand;
  }
}

export const paymentAdminService = new PaymentAdminService();
