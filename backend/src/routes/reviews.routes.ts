import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { reviewsController } from '../controllers/reviewsController';

const router = Router();

router.use(authMiddleware);
router.post('/', (req, res) => reviewsController.createReview(req, res));
router.get('/me', (req, res) => reviewsController.getMyReview(req, res));
router.post('/mark-prompted', (req, res) => reviewsController.markPrompted(req, res));

export default router;
