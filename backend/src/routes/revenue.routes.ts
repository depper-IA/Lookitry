import { Router } from 'express';
import { RevenueController } from '../controllers/revenue.controller';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const router = Router();
const revenueController = new RevenueController();

/**
 * Revenue Routes
 * 
 * Rutas para gestionar reportes de ingresos.
 * Todas las rutas requieren autenticación de administrador.
 * 
 * Requirements: 12.9
 */

// GET /api/admin/revenue/stats - Obtener estadísticas de ingresos
router.get('/stats', adminAuthMiddleware, (req, res) => 
  revenueController.getRevenueStats(req, res)
);

// GET /api/admin/revenue/payments - Listar todos los pagos con filtros
router.get('/payments', adminAuthMiddleware, (req, res) =>
  revenueController.getAllPayments(req, res)
);

export default router;
