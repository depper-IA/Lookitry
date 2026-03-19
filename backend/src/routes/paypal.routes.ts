
import { Router } from 'express';
import { PaypalController } from '../controllers/paypal.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();
const controller = new PaypalController();

// GET /api/payments/paypal/checkout-url
// Genera el link de pago oficial de PayPal
router.get('/checkout-url', optionalAuth, controller.getCheckoutUrl);

export default router;
