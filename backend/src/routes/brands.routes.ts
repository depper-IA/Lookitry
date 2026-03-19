import { Router } from 'express';
import { BrandsController } from '../controllers/brands.controller';
import { authMiddleware } from '../middleware/auth';
import { checkActiveSubscription } from '../middleware/checkSubscription';
import { SubscriptionService } from '../services/subscription.service';

const router = Router();
const brandsController = new BrandsController();
const subscriptionService = new SubscriptionService();

// Todas las rutas de brands requieren autenticación
router.use(authMiddleware);

// GET /api/brands/me - Obtener datos de la marca autenticada
// No requiere verificación de suscripción para que marcas suspendidas puedan ver su estado
router.get('/me', (req, res) => brandsController.getMe(req, res));

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

export default router;
