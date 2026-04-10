import { Router } from 'express';
import { GenerationsController } from '../controllers/generations.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const ctrl = new GenerationsController();

router.use(authMiddleware);

router.get('/', (req, res, next) => ctrl.getGenerations(req, res, next));
router.delete('/', (req, res, next) => ctrl.deleteGenerations(req, res, next));
router.delete('/:id', (req, res, next) => ctrl.deleteGeneration(req, res, next));

export default router;
