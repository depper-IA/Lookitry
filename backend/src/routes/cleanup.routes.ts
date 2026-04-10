import { Router } from 'express';
import { runCleanup, getStorageStats } from '../controllers/cleanup.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/cleanup/run - Ejecutar limpieza manual
router.post('/run', (req, res) => runCleanup(req, res));

// GET /api/cleanup/stats - Obtener estadísticas de almacenamiento
router.get('/stats', (req, res) => getStorageStats(req, res));

export default router;
