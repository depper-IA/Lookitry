import { Router } from 'express';
import { validateCoupon, redeemCoupon } from '../controllers/coupons.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/validate', validateCoupon);
router.post('/redeem', authMiddleware, redeemCoupon);

export default router;
