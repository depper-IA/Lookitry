import { Request, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { NotificationService } from '../services/notification.service';
import { auditService } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth';
import { CreatePaymentDto } from '../types';

const notificationService = new NotificationService();

// Extender Request para incluir admin
interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
  };
}

const subscriptionService = new SubscriptionService();

/**
 * SubscriptionController
 * 
 * Controlador para gestionar endpoints de suscripciones.
 * Incluye endpoints para marcas (obtener estado) y admin (gestión completa).
 * 
 * Requirements: 11.5, 11.6, 12.4, 12.5, 12.6
 */
export class SubscriptionController {
  /**
   * GET /api/brands/subscription
   * Obtener estado de suscripción de la marca autenticada
   * 
   * Requirement 11.5: Marca puede consultar su estado de suscripción
   */
  async getBrandSubscription(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const brandId = req.brand?.id;

      if (!brandId) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Marca no autenticada',
        });
      }

      const subscriptionInfo = await subscriptionService.getSubscriptionInfo(brandId);
      const paymentHistory = await subscriptionService.getPaymentHistory(brandId);

      return res.json({
        subscription: subscriptionInfo,
        payments: paymentHistory,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: error.message || 'Error al obtener información de suscripción',
      });
    }
  }

  /**
   * GET /api/admin/subscriptions
   * Listar todas las suscripciones con filtros opcionales
   * 
   * Requirement 12.1, 12.2: Admin puede ver todas las suscripciones con filtros
   */
  async getAllSubscriptions(req: AdminAuthRequest, res: Response): Promise<Response> {
    try {
      const { status } = req.query;

      // Importar supabaseAdmin para consultas
      const { supabaseAdmin } = await import('../config/supabase');

      let query = supabaseAdmin
        .from('brands')
        .select('id, name, email, slug, plan, subscription_status, subscription_start_date, subscription_end_date, last_payment_date, next_payment_date, is_in_trial, trial_days_remaining')
        .order('subscription_end_date', { ascending: true });

      // Aplicar filtro de estado si se proporciona
      if (status && typeof status === 'string') {
        query = query.eq('subscription_status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Calcular días restantes para cada marca
      const subscriptionsWithDays = await Promise.all(
        (data || []).map(async (brand) => {
          const daysRemaining = await subscriptionService.getDaysRemaining(brand.id);
          return {
            ...brand,
            daysRemaining,
          };
        })
      );

      return res.json({
        subscriptions: subscriptionsWithDays,
        total: subscriptionsWithDays.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: error.message || 'Error al obtener suscripciones',
      });
    }
  }

  /**
   * PATCH /api/admin/subscriptions/:brandId/renew
   * Renovar suscripción manualmente
   * 
   * Requirement 12.4: Admin puede renovar suscripciones manualmente
   */
  async renewSubscription(req: AdminAuthRequest, res: Response): Promise<Response> {
    try {
      const { brandId } = req.params;
      const paymentData: CreatePaymentDto = {
        brand_id: brandId,
        amount: req.body.amount || 0,
        currency: req.body.currency || 'COP',
        payment_date: req.body.payment_date || new Date().toISOString(),
        payment_method: req.body.payment_method || 'manual',
        status: 'completed',
        notes: req.body.notes || 'Renovación manual por administrador',
      };

      const updatedBrand = await subscriptionService.renewSubscription(brandId, paymentData);

      // Enviar email de confirmación de renovación (Req 13.6)
      notificationService.sendRenewalConfirmation(updatedBrand).catch((err) =>
        console.error('[Subscription] Error enviando email de renovación:', err)
      );

      // Auditoría
      auditService.log({
        admin_id: (req as any).admin?.id ?? 'unknown',
        admin_email: (req as any).admin?.email ?? 'unknown',
        action: 'subscription.renew',
        target_brand_id: brandId,
        details: { amount: paymentData.amount, payment_method: paymentData.payment_method },
      });

      return res.json({
        message: 'Suscripción renovada exitosamente',
        brand: {
          id: updatedBrand.id,
          name: updatedBrand.name,
          subscription_status: updatedBrand.subscription_status,
          subscription_start_date: updatedBrand.subscription_start_date,
          subscription_end_date: updatedBrand.subscription_end_date,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: error.message || 'Error al renovar suscripción',
      });
    }
  }

  /**
   * PATCH /api/admin/subscriptions/:brandId/suspend
   * Suspender marca
   * 
   * Requirement 12.5: Admin puede suspender marcas
   */
  async suspendSubscription(req: AdminAuthRequest, res: Response): Promise<Response> {
    try {
      const { brandId } = req.params;

      const updatedBrand = await subscriptionService.suspendSubscription(brandId);

      // Auditoría
      auditService.log({
        admin_id: (req as any).admin?.id ?? 'unknown',
        admin_email: (req as any).admin?.email ?? 'unknown',
        action: 'subscription.suspend',
        target_brand_id: brandId,
      });

      return res.json({
        message: 'Marca suspendida exitosamente',
        brand: {
          id: updatedBrand.id,
          name: updatedBrand.name,
          subscription_status: updatedBrand.subscription_status,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: error.message || 'Error al suspender marca',
      });
    }
  }

  /**
   * PATCH /api/admin/subscriptions/:brandId/reactivate
   * Reactivar marca suspendida
   * 
   * Requirement 12.6: Admin puede reactivar marcas suspendidas
   */
  async reactivateSubscription(req: AdminAuthRequest, res: Response): Promise<Response> {
    try {
      const { brandId } = req.params;

      const updatedBrand = await subscriptionService.reactivateSubscription(brandId);

      // Auditoría
      auditService.log({
        admin_id: (req as any).admin?.id ?? 'unknown',
        admin_email: (req as any).admin?.email ?? 'unknown',
        action: 'subscription.reactivate',
        target_brand_id: brandId,
      });

      return res.json({
        message: 'Marca reactivada exitosamente',
        brand: {
          id: updatedBrand.id,
          name: updatedBrand.name,
          subscription_status: updatedBrand.subscription_status,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: error.message || 'Error al reactivar marca',
      });
    }
  }

  /**
   * POST /api/admin/subscriptions/:brandId/payment
   * Registrar pago manual — soporta 1, 3 o 6 meses con descuento automático.
   * 3 meses = 5% descuento, 6 meses = 10% descuento.
   *
   * Requirement 11.14, 29.3
   */
  async registerPayment(req: AdminAuthRequest, res: Response): Promise<Response> {
    try {
      const { brandId } = req.params;
      const { amount, currency, payment_method, payment_date, notes, months } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'El monto del pago es requerido y debe ser mayor a 0',
        });
      }

      const periodMonths: number = months && [1, 3, 6].includes(Number(months)) ? Number(months) : 1;

      const DISCOUNTS: Record<number, number> = { 1: 0, 3: 0.05, 6: 0.10 };
      const discount = DISCOUNTS[periodMonths] ?? 0;
      const finalAmount = Math.round(Number(amount) * (1 - discount));

      const paymentData: CreatePaymentDto = {
        brand_id: brandId,
        amount: finalAmount,
        currency: currency || 'COP',
        payment_date: payment_date || new Date().toISOString(),
        payment_method: payment_method || 'manual',
        status: 'completed',
        notes: notes
          ? `${notes}${discount > 0 ? ` (descuento ${discount * 100}% por ${periodMonths} meses)` : ''}`
          : discount > 0
            ? `Descuento ${discount * 100}% por pago de ${periodMonths} meses`
            : undefined,
      };

      const updatedBrand = await subscriptionService.renewSubscription(brandId, paymentData, periodMonths);

      return res.json({
        message: 'Pago registrado y suscripción renovada exitosamente',
        discount: discount > 0 ? `${discount * 100}%` : null,
        months: periodMonths,
        amountCharged: finalAmount,
        brand: {
          id: updatedBrand.id,
          name: updatedBrand.name,
          subscription_status: updatedBrand.subscription_status,
          subscription_end_date: updatedBrand.subscription_end_date,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: error.message || 'Error al registrar pago',
      });
    }
  }
}
