import { Router } from 'express';
import { BrandsController } from '../controllers/brands.controller';
import { authMiddleware } from '../middleware/auth';
import { checkActiveSubscription } from '../middleware/checkSubscription';
import { SubscriptionService } from '../services/subscription.service';
import { getReferralInfo, validateReferralCode, claimReferralBonus } from '../controllers/referral.controller';

const router = Router();
const brandsController = new BrandsController();
const subscriptionService = new SubscriptionService();

// Todas las rutas de brands requieren autenticación
router.use(authMiddleware);

// GET /api/brands/me - Obtener datos de la marca autenticada
// No requiere verificación de suscripción para que marcas suspendidas puedan ver su estado
router.get('/me', (req, res) => brandsController.getMe(req, res));

// GET /api/brands/me/woocommerce-metrics - Metricas reales del plugin para la marca autenticada
router.get('/me/woocommerce-metrics', (req, res) => brandsController.getWooCommerceMetrics(req, res));

// PATCH /api/brands/me - Actualizar configuración de la marca
// Permitimos actualización para TRIAL para que puedan configurar su landing
router.patch('/me', (req, res) => brandsController.updateMe(req, res));

// GET /api/brands/me/payments - Historial de pagos de la marca autenticada
router.get('/me/payments', async (req: any, res) => {
  try {
    const brandId = req.brand?.id;
    if (!brandId) return res.status(401).json({ error: 'No autenticado' });
    const payments = await subscriptionService.getPaymentHistory(brandId);
    return res.json({ payments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al obtener pagos' });
  }
});

// GET /api/brands/me/legal-requests - Historial de solicitudes legales/autoservicio
router.get('/me/legal-requests', (req, res) => brandsController.getLegalRequests(req, res));

// POST /api/brands/me/legal-requests - Crear solicitud legal/autoservicio
router.post('/me/legal-requests', (req, res) => brandsController.createLegalRequest(req, res));

// POST /api/brands/me/trial-events - Registrar eventos comerciales de trial
router.post('/me/trial-events', (req, res) => brandsController.createTrialEvent(req, res));

// POST /api/brands/request-plan-change - Solicitar cambio de plan (upgrade o downgrade)
// Fuera de checkActiveSubscription para que marcas suspendidas/vencidas también puedan solicitarlo
router.post('/request-plan-change', (req, res) =>
  brandsController.requestPlanChange(req, res)
);

// Verificar suscripción activa para todas las demás rutas
router.use(checkActiveSubscription);

// PATCH /api/brands/me - Actualizar configuración de la marca
router.patch('/me', (req, res) => brandsController.updateMe(req, res));

// GET /api/brands/notification-preferences - Obtener preferencias de notificaciones
router.get('/notification-preferences', (req, res) => 
  brandsController.getNotificationPreferences(req, res)
);

// PATCH /api/brands/notification-preferences - Actualizar preferencias de notificaciones
router.patch('/notification-preferences', (req, res) => 
  brandsController.updateNotificationPreferences(req, res)
);

// POST /api/brands/request-upgrade - Solicitar upgrade a Plan PRO
router.post('/request-upgrade', (req, res) =>
  brandsController.requestUpgrade(req, res)
);

// ==== REFERRALS ====
router.get('/me/referral', getReferralInfo);
router.post('/me/referral/validate', validateReferralCode);
router.post('/me/referral/claim', claimReferralBonus);

export default router;
