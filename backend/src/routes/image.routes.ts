import { Router } from 'express';
import { ImageController } from '../controllers/image.controller';

const router = Router();
const imageController = new ImageController();

// Ruta pública para renderizar imágenes con marca de agua
router.get('/render', imageController.renderImage);

export default router;
