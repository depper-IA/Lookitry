import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/coupons.controller';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', listCoupons);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

export default router;
