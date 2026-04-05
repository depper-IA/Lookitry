import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { SubscriptionService } from '../services/subscription.service';

const subscriptionService = new SubscriptionService();

/**
 * Middleware para verificar que la suscripción de una marca esté activa.
 * También permite acceso durante el período de prueba (trial).
 *
 * Requirements: 11.4, 11.11, 11 (Opción C)
 */
export const checkActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    if (!req.brand || !req.brand.id) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Autenticación requerida',
      });
    }

    const brandId = req.brand.id;
    const isActive = await subscriptionService.checkSubscriptionStatus(brandId);

    if (!isActive) {
      const subscriptionInfo = await subscriptionService.getSubscriptionInfo(brandId);

      // Distinguir entre trial vencido y suscripción suspendida
      const isTrialExpired =
        subscriptionInfo.trialEndDate !== null &&
        subscriptionInfo.trialDaysRemaining === 0 &&
        subscriptionInfo.status !== 'active' &&
        subscriptionInfo.status !== 'expiring_soon';

      if (isTrialExpired) {
        return res.status(403).json({
          error: 'TRIAL_EXPIRED',
          message:
            'Tu período de prueba ha vencido. Contacta a soporte para activar tu plan.',
          subscriptionStatus: subscriptionInfo.status,
          details: {
            trialEndDate: subscriptionInfo.trialEndDate,
            contactInfo: 'Contacta a soporte para activar tu plan',
          },
        });
      }

      return res.status(403).json({
        error: 'SUBSCRIPTION_SUSPENDED',
        message:
          'Tu suscripción está suspendida. Por favor renueva tu plan para continuar usando el servicio.',
        subscriptionStatus: subscriptionInfo.status,
        details: {
          endDate: subscriptionInfo.endDate,
          daysRemaining: subscriptionInfo.daysRemaining,
          contactInfo: 'Contacta a soporte para renovar tu suscripción',
        },
      });
    }

    next();
  } catch (error: any) {
    console.error('Error en checkActiveSubscription:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al verificar estado de suscripción',
    });
  }
};
