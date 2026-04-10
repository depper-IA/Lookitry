import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { checkActiveSubscription } from '../middleware/checkSubscription';
import {
  getAnalyticsOverview,
  getGenerationsStats,
  getMostUsedProducts,
} from '../controllers/analytics.controller';

const router = Router();

// Todas las rutas de analytics requieren autenticación
router.use(authMiddleware);

// Verificar suscripción activa
router.use(checkActiveSubscription);

/**
 * GET /api/analytics/overview
 * Obtener analytics completos (generaciones + productos más usados + tendencias)
 */
router.get('/overview', getAnalyticsOverview);

/**
 * GET /api/analytics/generations
 * Obtener estadísticas de generaciones
 */
router.get('/generations', getGenerationsStats);

/**
 * GET /api/analytics/products/most-used
 * Obtener productos más usados
 * Query params: ?limit=10
 */
router.get('/products/most-used', getMostUsedProducts);

export default router;
