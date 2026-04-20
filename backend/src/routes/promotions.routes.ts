import { Router } from 'express';
import { getActivePromotions } from '../controllers/publicPromotions.controller';

const router = Router();

// GET /api/promotions - Promociones activas (público)
router.get('/', getActivePromotions);

export default router;