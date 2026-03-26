
import { Router } from 'express';
import { PaypalController } from '../controllers/paypal.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const controller = new PaypalController();

// GET /api/payments/paypal/checkout-url
// Genera el link de pago oficial de PayPal
router.get('/checkout-url', optionalAuth, controller.getCheckoutUrl);

// POST /api/payments/paypal/capture
// Captura el pago después de la aprobación del usuario
router.post('/capture', controller.capturePayment);

// POST /api/payments/paypal/webhook
// Recibe notificaciones asíncronas de PayPal
router.post('/webhook', controller.handleWebhook);


export default router;
