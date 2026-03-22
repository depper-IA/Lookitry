import { Router, Request, Response, NextFunction } from 'express';
import { WompiController } from '../controllers/wompi.controller';
import { verifyToken } from '../utils/jwt';
import { AuthService } from '../services/auth.service';

const router = Router();
const wompiController = new WompiController();
const authService = new AuthService();

/**
 * Middleware de auth opcional — adjunta req.brand si hay token válido,
 * pero NO bloquea si no hay token o si es inválido.
 */
async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload?.brandId) {
        const brand = await authService.getBrandById(payload.brandId);
        if (brand) {
          (req as any).brand = { id: brand.id, email: brand.email, plan: (brand as any).plan };
        }
      }
    }
  } catch {
    // Token inválido o expirado — continuar sin brand
  }
  next();
}

/**
 * POST /api/payments/wompi/webhook
 * Recibe eventos de Wompi — NO requiere auth (llamado directamente por Wompi)
 */
router.post('/webhook', (req, res) => wompiController.handleWebhook(req, res));

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
