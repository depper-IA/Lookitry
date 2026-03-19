import { supabaseAdmin } from '../config/supabase';

/**
 * AuditService
 *
 * Registra acciones administrativas en la tabla admin_audit_log.
 * Requirement 12.10: Registrar todas las acciones del admin en log de auditoría.
 */

export type AuditAction =
  | 'brand.create'
  | 'brand.plan_change'
  | 'brand.plan_activate'
  | 'brand.product_delete'
  | 'brand.delete'
  | 'brand.landing_page_toggle'
  | 'brand.landing_suspend'
  | 'brand.landing_restore'
  | 'brand.modal_config_update'
  | 'brand.send_reset_email'
  | 'subscription.renew'
  | 'subscription.suspend'
  | 'subscription.reactivate'
  | 'admin.login'
  | 'admin.send_credentials'
  | 'admin.change_password';

export interface AuditEntry {
  admin_id: string;
  admin_email: string;
  action: AuditAction;
  target_brand_id?: string;
  details?: Record<string, unknown>;
}

class AuditService {
  /**
   * Registra una acción administrativa.
   * No lanza errores — falla silenciosamente para no interrumpir el flujo principal.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: entry.admin_id,
        admin_email: entry.admin_email,
        action: entry.action,
        target_brand_id: entry.target_brand_id ?? null,
        details: entry.details ?? null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Audit] Error registrando acción:', err);
    }
  }
}

export const auditService = new AuditService();
