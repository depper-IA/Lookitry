import { Router } from 'express';
import { GenerationsController } from '../controllers/generations.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const ctrl = new GenerationsController();

router.use(authMiddleware);

router.get('/', (req, res) => ctrl.getGenerations(req, res));
router.delete('/:id', (req, res) => ctrl.deleteGeneration(req, res));
router.delete('/', (req, res) => ctrl.deleteGenerations(req, res));

export default router;
