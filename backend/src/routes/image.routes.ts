import { Router } from 'express';
import { ImageController } from '../controllers/image.controller';

const router = Router();
const imageController = new ImageController();

// Ruta pública para ver imágenes
router.get('/look', imageController.renderImage);

export default router;
