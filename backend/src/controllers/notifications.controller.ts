import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export type NotificationType =
  | 'new_brand'
  | 'upgrade_request'
  | 'plan_change_request'
  | 'trial_expiring'
  | 'trial_expired'
  | 'trial_converted'
  | 'high_usage'
  | 'credits_exhausted'
  | 'suspended'
  | 'payment_received'
  | 'multi_month_purchase'
  | 'subscription_expiring'
  | 'service_down'
  | 'service_recovered'
  | 'smtp_down'
  | 'smtp_recovered'
  | 'plugin_error_spike';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  brandId?: string;
  brandName?: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, unknown>;
}

export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
}

const BASIC_LIMIT = 100;
const PRO_LIMIT = 1200;

/** Carga las preferencias activas desde Supabase. Devuelve un Set de tipos desactivados. */
async function getDisabledTypes(): Promise<Set<string>> {
  const { data } = await supabaseAdmin
    .from('admin_notification_preferences')
    .select('type, enabled')
    .eq('enabled', false);
  return new Set((data ?? []).map((r: { type: string }) => r.type));
}

export async function getAdminNotifications(_req: Request, res: Response): Promise<void> {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [brandsRes, generationsRes, paymentsRes, persistentRes, disabledTypes] = await Promise.all([
      supabaseAdmin
        .from('brands')
        .select('id, name, email, plan, subscription_status, trial_end_date, subscription_end_date, created_at, upgrade_requested_at')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('generations')
        .select('brand_id, generated_at')
        .gte('generated_at', last7Days.toISOString()),
      supabaseAdmin
        .from('subscription_payments')
        .select('id, brand_id, amount, status, months_paid, created_at, brands(name)')
        .eq('status', 'completed')
        .gte('created_at', last7Days.toISOString())
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseAdmin
        .from('admin_notifications')
        .select('*')
        .gte('created_at', last7Days.toISOString())
        .order('created_at', { ascending: false })
        .limit(200),
      getDisabledTypes(),
    ]);

    const brands = brandsRes.data || [];
    const generations = generationsRes.data || [];
    const payments = paymentsRes.data || [];
    const persistentNotifications = persistentRes.data || [];
    const notifications: AdminNotification[] = [];

    const push = (n: AdminNotification) => {
      if (!disabledTypes.has(n.type)) notifications.push(n);
    };

    // 1. Marcas nuevas (últimos 7 días)
    brands
      .filter(b => new Date(b.created_at) >= last7Days)
      .forEach(b => push({
        id: 'new_brand_' + b.id,
        type: 'new_brand',
        title: 'Nueva marca registrada',
        message: `${b.name} (${b.email}) se registró en el plan ${b.plan}`,
        brandId: b.id, brandName: b.name,
        createdAt: b.created_at, severity: 'info',
      }));

    // 2. Solicitudes de upgrade pendientes
    brands
      .filter(b => b.upgrade_requested_at)
      .forEach(b => push({
        id: 'upgrade_' + b.id,
        type: 'upgrade_request',
        title: 'Solicitud de upgrade a Pro',
        message: `${b.name} solicitó actualizar al Plan Pro`,
        brandId: b.id, brandName: b.name,
        createdAt: b.upgrade_requested_at, severity: 'warning',
      }));

    // 3. Trials por vencer (1-3 días)
    brands
      .filter(b => {
        if (!b.trial_end_date) return false;
        const daysLeft = Math.ceil((new Date(b.trial_end_date).getTime() - now.getTime()) / 86400000);
        return daysLeft >= 0 && daysLeft <= 3;
      })
      .forEach(b => {
        const daysLeft = Math.ceil((new Date(b.trial_end_date).getTime() - now.getTime()) / 86400000);
        push({
          id: 'trial_expiring_' + b.id,
          type: 'trial_expiring',
          title: 'Trial por vencer',
          message: `${b.name} tiene ${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''} de prueba`,
          brandId: b.id, brandName: b.name,
          createdAt: now.toISOString(), severity: 'warning',
        });
      });

    // 4. Trials vencidos sin convertir
    brands
      .filter(b => {
        if (!b.trial_end_date) return false;
        return new Date(b.trial_end_date) < now &&
          b.subscription_status !== 'suspended';
      })
      .slice(0, 5)
      .forEach(b => push({
        id: 'trial_expired_' + b.id,
        type: 'trial_expired',
        title: 'Trial vencido sin conversión',
        message: `${b.name} terminó su prueba y no ha contratado un plan`,
        brandId: b.id, brandName: b.name,
        createdAt: b.trial_end_date, severity: 'error',
      }));

    // 5. Suscripción activa por vencer (≤7 días)
    brands
      .filter(b => {
        if (!b.subscription_end_date) return false;
        if (b.trial_end_date && new Date(b.trial_end_date) > now) return false;
        if (b.subscription_status !== 'active' && b.subscription_status !== 'expiring_soon') return false;
        const daysLeft = Math.ceil((new Date(b.subscription_end_date).getTime() - now.getTime()) / 86400000);
        return daysLeft >= 0 && daysLeft <= 7;
      })
      .forEach(b => {
        const daysLeft = Math.ceil((new Date(b.subscription_end_date).getTime() - now.getTime()) / 86400000);
        push({
          id: 'sub_expiring_' + b.id,
          type: 'subscription_expiring',
          title: 'Suscripción por vencer',
          message: `${b.name} (${b.plan}) vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
          brandId: b.id, brandName: b.name,
          createdAt: now.toISOString(),
          severity: daysLeft <= 2 ? 'error' : 'warning',
          metadata: { plan: b.plan, daysLeft },
        });
      });

    // 6. Créditos agotados (100%) y uso alto (≥80%)
    const genByBrand: Record<string, number> = {};
    generations.forEach(g => { genByBrand[g.brand_id] = (genByBrand[g.brand_id] || 0) + 1; });

    brands.forEach(b => {
      const used = genByBrand[b.id] || 0;
      const limit = b.plan === 'PRO' ? PRO_LIMIT : BASIC_LIMIT;
      const pct = (used / limit) * 100;
      if (pct >= 100) {
        push({
          id: 'credits_exhausted_' + b.id,
          type: 'credits_exhausted',
          title: 'Créditos agotados',
          message: `${b.name} agotó sus ${limit} generaciones del mes`,
          brandId: b.id, brandName: b.name,
          createdAt: now.toISOString(), severity: 'error',
          metadata: { used, limit, plan: b.plan },
        });
      } else if (pct >= 80) {
        push({
          id: 'high_usage_' + b.id,
          type: 'high_usage',
          title: 'Uso alto de generaciones',
          message: `${b.name} usó ${used} de ${limit} generaciones este mes (${Math.round(pct)}%)`,
          brandId: b.id, brandName: b.name,
          createdAt: now.toISOString(), severity: 'warning',
          metadata: { used, limit, pct: Math.round(pct) },
        });
      }
    });

    // 7. Marcas suspendidas
    brands
      .filter(b => b.subscription_status === 'suspended')
      .slice(0, 5)
      .forEach(b => push({
        id: 'suspended_' + b.id,
        type: 'suspended',
        title: 'Marca suspendida',
        message: `${b.name} tiene su cuenta suspendida`,
        brandId: b.id, brandName: b.name,
        createdAt: now.toISOString(), severity: 'error',
      }));

    // 8. Pagos recibidos
    payments.forEach((p: any) => {
      const brandName = p.brands?.name || 'Marca desconocida';
      const months = p.months_paid || 1;
      if (months > 1) {
        const discountPct = months >= 12 ? 15 : months >= 6 ? 10 : months >= 3 ? 5 : 0;
        push({
          id: 'payment_' + p.id,
          type: 'multi_month_purchase',
          title: `Compra de ${months} meses`,
          message: `${brandName} pagó ${months} meses por adelantado${discountPct > 0 ? ` (${discountPct}% descuento)` : ''}`,
          brandId: p.brand_id, brandName,
          createdAt: p.created_at, severity: 'success',
          metadata: { months, amount: p.amount, discountPct },
        });
      } else {
        push({
          id: 'payment_' + p.id,
          type: 'payment_received',
          title: 'Pago recibido',
          message: `${brandName} realizó un pago de ${Number(p.amount).toLocaleString('es-CO')} COP`,
          brandId: p.brand_id, brandName,
          createdAt: p.created_at, severity: 'success',
        });
      }
    });

    // 9. Notificaciones persistentes (n8n, health, acciones del cliente)
    const dynamicIds = new Set(notifications.map(n => n.id));
    persistentNotifications.forEach((n: any) => {
      if (disabledTypes.has(n.type)) return;
      if (n.type === 'upgrade_request' && dynamicIds.has('upgrade_' + n.brand_id)) return;
      push({
        id: 'persistent_' + n.id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        brandId: n.brand_id,
        brandName: n.brand_name,
        createdAt: n.created_at,
        severity: n.severity,
        metadata: n.metadata || {},
      });
    });

    notifications.sort((a, b) => {
      // Prioridad: 1=cliente (pagos, upgrades, nuevas marcas), 2=alertas, 3=sistema
      const priority = (n: AdminNotification): number => {
        if (['payment_received', 'multi_month_purchase', 'upgrade_request', 'plan_change_request', 'trial_converted', 'new_brand'].includes(n.type)) return 1;
        if (['credits_exhausted', 'suspended', 'trial_expired', 'subscription_expiring'].includes(n.type)) return 2;
        if (['trial_expiring', 'high_usage'].includes(n.type)) return 3;
        return 4; // sistema
      };
      const pa = priority(a), pb = priority(b);
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    res.json({ notifications, total: notifications.length });
  } catch (error: any) {
    console.error('Error in getAdminNotifications:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener notificaciones' });
  }
}

/** GET /api/admin/notification-preferences */
export async function getNotificationPreferences(_req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_notification_preferences')
      .select('type, enabled')
      .order('type');
    if (error) throw error;
    res.json({ preferences: data });
  } catch (error: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
}

/** PATCH /api/admin/notification-preferences/:type */
export async function updateNotificationPreference(req: Request, res: Response): Promise<void> {
  try {
    const { type } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'INVALID_BODY', message: 'enabled debe ser boolean' });
      return;
    }
    const { error } = await supabaseAdmin
      .from('admin_notification_preferences')
      .upsert({ type, enabled, updated_at: new Date().toISOString() }, { onConflict: 'type' });
    if (error) throw error;
    res.json({ ok: true, type, enabled });
  } catch (error: any) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
}
