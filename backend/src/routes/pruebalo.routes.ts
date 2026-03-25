import { Router } from 'express';
import { PruebaloController } from '../controllers/pruebalo.controller';
import { uploadSingleImage, handleMulterError } from '../middleware/multer.middleware';
import { publicRateLimiter, generationRateLimiter, slugGenerationRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const pruebaloController = new PruebaloController();

// GET /api/pruebalo/resolve-domain - Resolver slug mediante host/dominio
router.get('/resolve-domain', publicRateLimiter, pruebaloController.resolveDomain);

// GET /api/pruebalo/allowed-origins - Obtener dominios permitidos (Whitelist dinámica iframe)
router.get('/allowed-origins', publicRateLimiter, pruebaloController.getAllowedOrigins);

// GET /api/pruebalo/validate-api-key - Validar clave de API desde el plugin
router.get('/validate-api-key', publicRateLimiter, pruebaloController.validateApiKey);

// GET /api/pruebalo/synced-products - Obtener productos ya sincronizados
router.get('/synced-products', publicRateLimiter, pruebaloController.getSyncedProducts);

// POST /api/pruebalo/sync-woocommerce - Sincronizar productos desde el plugin
router.post('/sync-woocommerce', publicRateLimiter, pruebaloController.syncWooCommerceProducts);

// GET /api/pruebalo/:brandSlug - Obtener configuración pública de marca y productos
router.get('/:brandSlug', publicRateLimiter, pruebaloController.getBrandConfig);

// GET /api/pruebalo/img-proxy - Proxy de imágenes
router.get('/img-proxy', publicRateLimiter, pruebaloController.imgProxy);

// POST /api/pruebalo/:brandSlug/generate - Generar imagen de try-on
router.post(
  '/:brandSlug/generate',
  slugGenerationRateLimiter,
  generationRateLimiter,
  uploadSingleImage,
  handleMulterError,
  pruebaloController.generateTryOn
);

// POST /api/pruebalo/:brandSlug/generation/:generationId/feedback - Reportar error de generación
router.post(
  '/:brandSlug/generation/:generationId/feedback',
  publicRateLimiter,
  pruebaloController.reportGenerationFeedback
);

export default router;
