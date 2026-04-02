import { supabaseAdmin } from '../../config/supabase';

type PricingMetaData = {
  replicate_api_token?: string;
  replicate_monthly_budget_usd?: number;
  replicate_cost_per_generation_usd?: number;
};

/**
 * Operational Admin Service — Mission Control, Admin Metadata y Audit Log.
 * Extraído de AdminService para mejorar mantenibilidad.
 */
export class OperationalAdminService {
  /**
   * Vista unificada del estado operacional del sistema (Mission Control)
   */
  async getMissionControl() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [brandsRes, paymentsRes, feedbackRes, generationsRes] = await Promise.all([
      supabaseAdmin.from('brands').select('id, name, email, plan, subscription_status, trial_end_date, subscription_end_date, has_landing_page, landing_suspended_at, created_at'),
      supabaseAdmin.from('subscription_payments').select('id, brand_id, amount, status, payment_date, payment_method, brands(name, email, plan)').eq('status', 'failed').order('payment_date', { ascending: false }).limit(20),
      supabaseAdmin.from('generation_feedback').select('id, brand_id, error_type, created_at, resolved').eq('resolved', false).order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('generations').select('id, brand_id, status, generated_at, error_message').eq('status', 'FAILED').gte('generated_at', startOfMonth.toISOString()).order('generated_at', { ascending: false }).limit(50),
    ]);

    const brands = brandsRes.data || [];
    const failedPayments = paymentsRes.data || [];
    const unresolvedFeedback = feedbackRes.data || [];
    const failedGenerations = generationsRes.data || [];

    const trialsExpiringSoon = brands
      .filter(b => {
        if (b.plan !== 'TRIAL' || !b.trial_end_date) return false;
        const daysLeft = Math.ceil((new Date(b.trial_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft >= 0 && daysLeft <= 3;
      })
      .map(b => {
        const daysLeft = Math.ceil((new Date(b.trial_end_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { id: b.id, name: b.name, email: b.email, days_left: daysLeft, trial_end_date: b.trial_end_date };
      });

    const trialsStalled = brands.filter(b => {
      if (b.plan !== 'TRIAL' || !b.trial_end_date) return false;
      const daysLeft = Math.ceil((new Date(b.trial_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft > 3;
    });

    const suspendedLandings = brands
      .filter(b => b.landing_suspended_at)
      .map(b => ({ id: b.id, name: b.name, email: b.email, suspended_at: b.landing_suspended_at }));

    const expiringSubscriptions = brands
      .filter(b => {
        if (!b.subscription_end_date) return false;
        if (b.subscription_status !== 'active' && b.subscription_status !== 'expiring_soon') return false;
        const daysLeft = Math.ceil((new Date(b.subscription_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft >= 0 && daysLeft <= 7;
      })
      .map(b => {
        const daysLeft = Math.ceil((new Date(b.subscription_end_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { id: b.id, name: b.name, email: b.email, plan: b.plan, days_left: daysLeft, subscription_end_date: b.subscription_end_date };
      });

    const brandsWithFailedPayments = new Set(failedPayments.map(p => p.brand_id));

    const criticalAlerts: Array<{ type: string; message: string; severity: 'critical' | 'warning'; count?: number }> = [];
    if (failedPayments.length > 0) criticalAlerts.push({ type: 'failed_payments', message: `${failedPayments.length} pagos fallidos recientes`, severity: 'critical', count: failedPayments.length });
    if (trialsExpiringSoon.length > 0) criticalAlerts.push({ type: 'trials_expiring', message: `${trialsExpiringSoon.length} trials expiran en 3 días o menos`, severity: 'warning', count: trialsExpiringSoon.length });
    if (unresolvedFeedback.length > 5) criticalAlerts.push({ type: 'feedback_backlog', message: `${unresolvedFeedback.length} feedbacks sin resolver`, severity: 'warning', count: unresolvedFeedback.length });
    if (expiringSubscriptions.length > 0) criticalAlerts.push({ type: 'subscriptions_expiring', message: `${expiringSubscriptions.length} suscripciones expiran en 7 días`, severity: 'warning', count: expiringSubscriptions.length });

    const operationalQueue: Array<{ type: string; label: string; brand_id?: string; priority: 'high' | 'medium' | 'low' }> = [];
    for (const trial of trialsExpiringSoon) operationalQueue.push({ type: 'trial_expiring', label: `Trial de ${trial.name} expira en ${trial.days_left}d`, brand_id: trial.id, priority: 'high' });
    for (const sub of expiringSubscriptions) operationalQueue.push({ type: 'subscription_expiring', label: `Suscripción de ${sub.name} (${sub.plan}) expira en ${sub.days_left}d`, brand_id: sub.id, priority: 'high' });
    for (const brandId of brandsWithFailedPayments) {
      const brand = brands.find(b => b.id === brandId);
      if (brand) operationalQueue.push({ type: 'failed_payment', label: `Pago fallido de ${brand.name}`, brand_id: brandId, priority: 'high' });
    }

    return {
      alerts: criticalAlerts,
      operational_queue: operationalQueue,
      trials_expiring_soon: trialsExpiringSoon,
      trials_stalled: trialsStalled.map(b => ({ id: b.id, name: b.name, email: b.email, trial_end_date: b.trial_end_date })),
      subscriptions_expiring: expiringSubscriptions,
      failed_payments_recent: failedPayments.slice(0, 10),
      unresolved_feedback_count: unresolvedFeedback.length,
      failed_generations_recent: failedGenerations.slice(0, 10),
      suspended_landings: suspendedLandings,
      summary: {
        total_brands: brands.length,
        total_trials: brands.filter(b => b.plan === 'TRIAL').length,
        total_active_subscriptions: brands.filter(b => b.subscription_status === 'active' || b.subscription_status === 'expiring_soon').length,
        critical_alerts_count: criticalAlerts.filter(a => a.severity === 'critical').length,
        queue_items_count: operationalQueue.length,
      },
    };
  }

  /**
   * Obtener metadata de configuración administrativa (pricing_config.meta)
   */
  async getAdminMeta(): Promise<PricingMetaData> {
    const { data, error } = await supabaseAdmin
      .from('pricing_config')
      .select('data')
      .eq('id', 'meta')
      .maybeSingle();

    if (error) throw new Error('Error al obtener metadata administrativa: ' + error.message);
    return (data?.data || {}) as PricingMetaData;
  }

  /**
   * Obtener el log de auditoría de acciones administrativas
   */
  async getAuditLog(filters: {
    limit?: number;
    offset?: number;
    action?: string;
    admin_email?: string;
    from?: string;
    to?: string;
  }) {
    let query = supabaseAdmin
      .from('admin_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.action) query = query.eq('action', filters.action);
    if (filters.admin_email) query = query.ilike('admin_email', `%${filters.admin_email}%`);
    if (filters.from) query = query.gte('created_at', new Date(filters.from).toISOString());
    if (filters.to) {
      const endDate = new Date(filters.to);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      if (error.code === 'PGRST200' || error.message.includes('admin_audit_log')) {
        return { entries: [], count: 0, message: 'Tabla de auditoría no disponible aún' };
      }
      throw new Error('Error al obtener audit log: ' + error.message);
    }

    return { entries: data || [], count: count || 0 };
  }
}

export const operationalAdminService = new OperationalAdminService();
