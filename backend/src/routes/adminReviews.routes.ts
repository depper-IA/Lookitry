import { Router } from 'express';
import { adminAuthMiddleware, requirePermission } from '../middleware/adminAuth';
import { reviewsController } from '../controllers/reviewsController';

const router = Router();

router.use(adminAuthMiddleware);
router.use(requirePermission('brands'));

router.get('/', (req, res) => reviewsController.listAdminReviews(req as any, res));
router.patch('/:id', (req, res) => reviewsController.moderateReview(req as any, res));
router.delete('/:id', (req, res) => reviewsController.deleteReview(req as any, res));

export default router;
