import { Router } from 'express';
import { PaypalController } from '../controllers/paypal.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const paypalController = new PaypalController();

// PayPal Checkout (Público para registros, Privado para renovaciones)
router.get('/paypal/checkout-url', (req, res, next) => {
  // Intentar autenticar si hay token, si no, permitir como público
  authMiddleware(req, res, () => {
    paypalController.getCheckoutUrl(req, res, next);
  });
});

// Captura de PayPal (Público)
router.post('/paypal/capture', paypalController.capturePayment);

export default router;
