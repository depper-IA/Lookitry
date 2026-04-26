import { Router } from 'express';

import { UsageController } from '../controllers/usage.controller';

import { authMiddleware } from '../middleware/auth';

import { checkActiveSubscription } from '../middleware/checkSubscription';



const router = Router();

const usageController = new UsageController();



// Todas las rutas de usage requieren autenticación

router.use(authMiddleware);



// Verificar suscripción activa

router.use(checkActiveSubscription);



// GET /api/usage/stats - Obtener estadísticas de uso de la marca

router.get('/stats', (req, res) => usageController.getStats(req, res));



export default router;

