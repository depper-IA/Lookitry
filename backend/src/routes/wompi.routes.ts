import { Router, Request, Response, NextFunction } from 'express';
import { WompiController } from '../controllers/wompi.controller';
import { verifyToken } from '../utils/jwt';
import { AuthService } from '../services/auth.service';
import { optionalAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const wompiController = new WompiController();
const authService = new AuthService();

// Rate limiter específico para webhooks (más permisivo que general)
// Permite hasta 200 requests por minuto por IP (suficiente para webhooks de Wompi)
const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Demasiadas solicitudes de webhook.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Solo aplicar a endpoints de webhook
    return !req.path.includes('webhook');
  },
});

// Se usa optionalAuth importado desde ../middleware/auth

/**
 * POST /api/payments/wompi/webhook
 * Recibe eventos de Wompi — NO requiere auth (llamado directamente por Wompi)
 * Rate limited para prevenir abuse
 */
router.post('/webhook', webhookRateLimiter, (req, res) => wompiController.handleWebhook(req, res));

/**
 * GET /api/payments/wompi/upgrade-preview
 * Calcula el prorrateo de un upgrade. Requiere auth de marca.
 */
router.get('/upgrade-preview', optionalAuth, (req, res) => wompiController.getUpgradePreview(req, res));

/**
 * POST /api/payments/wompi/apply-free-upgrade
 * Aplica upgrade gratuito cuando el crédito cubre el costo. Requiere auth de marca.
 */
router.post('/apply-free-upgrade', optionalAuth, (req, res) => wompiController.applyFreeUpgrade(req, res));

/**
 * POST /api/payments/wompi/free-checkout
 * Activa servicios directamente cuando el total es $0 (cupón del 100%). Requiere auth de marca.
 */
router.post('/free-checkout', optionalAuth, (req, res) => wompiController.freeCheckout(req, res));

/**
 * GET /api/payments/wompi/config
 * Auth opcional: adjunta brand si hay token válido, pero no bloquea visitantes.
 */
router.get('/config', optionalAuth, (req, res) => wompiController.getWidgetConfig(req, res));

/**
 * GET /api/payments/wompi/checkout-url
 * Genera la URL del checkout hosted de Wompi y la retorna al frontend.
 * Auth opcional: si hay sesión se usa el brandId real, si no se usa ID temporal.
 */
router.get('/checkout-url', optionalAuth, (req, res) => wompiController.getCheckoutUrl(req, res));

/**
 * GET /api/payments/wompi/transaction/:id
 * Consulta el estado y otros metadatos (como reference) de una transacción de Wompi
 * Endpoint público, el ID de transacción ya es el identificador seguro.
 */
router.get('/transaction/:id', (req, res) => wompiController.getTransaction(req, res));

export default router;
