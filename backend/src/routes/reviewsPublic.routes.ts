import { Router } from 'express';
import { reviewsController } from '../controllers/reviewsController';

const router = Router();

router.get('/', (req, res) => reviewsController.getPublicReviews(req as any, res));

export default router;
