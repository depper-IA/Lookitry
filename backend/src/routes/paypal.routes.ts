

import { Router } from 'express';

import { PaypalController } from '../controllers/paypal.controller';

import { optionalAuth } from '../middleware/auth';

import rateLimit from 'express-rate-limit';



const router = Router();

const controller = new PaypalController();



// Rate limiter específico para webhooks (más permisivo que general)

// Permite hasta 200 requests por minuto por IP

const webhookRateLimiter = rateLimit({

  windowMs: 60 * 1000, // 1 minuto

  max: 200,

  message: {

    error: 'RATE_LIMIT_EXCEEDED',

    message: 'Demasiadas solicitudes de webhook.',

  },

  standardHeaders: true,

  legacyHeaders: false,

  skip: (req) => !req.path.includes('webhook'),

});



// GET /api/payments/paypal/checkout-url

// Genera el link de pago oficial de PayPal

router.get('/checkout-url', optionalAuth, controller.getCheckoutUrl);



// POST /api/payments/paypal/capture

// Captura el pago después de la aprobación del usuario

// Requiere autenticación para validar que el usuario tiene acceso a la referencia

router.post('/capture', optionalAuth, controller.capturePayment);



// POST /api/payments/paypal/webhook

// Recibe notificaciones asíncronas de PayPal

// Rate limited para prevenir abuse

router.post('/webhook', webhookRateLimiter, controller.handleWebhook);





export default router;

