import { supabaseAdmin } from '../config/supabase';

export type AdminNotificationType =
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
  | 'plugin_error_spike'
  | 'blog_running'
  | 'blog_error'
  | 'blog_success';

export interface CreateAdminNotificationDto {
  type: AdminNotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  brandId?: string;
  brandName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Inserta una notificación persistente en la tabla admin_notifications.
 * No lanza error si falla — solo loguea para no interrumpir el flujo principal.
 */
export async function createAdminNotification(dto: CreateAdminNotificationDto): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('admin_notifications').insert({
      type: dto.type,
      title: dto.title,
      message: dto.message,
      severity: dto.severity,
      brand_id: dto.brandId ?? null,
      brand_name: dto.brandName ?? null,
      metadata: dto.metadata ?? {},
    });

    if (error) {
      console.error('[adminNotifications] Error al insertar notificación:', error.message);
    }
  } catch (err) {
    console.error('[adminNotifications] Error inesperado:', err);
  }
}
