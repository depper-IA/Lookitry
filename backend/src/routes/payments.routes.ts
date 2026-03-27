import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { paymentsController } from '../controllers/payments.controller';

const router = Router();

router.post('/checkout-addon', authMiddleware, (req, res) => paymentsController.checkoutAddon(req, res));

export default router;
