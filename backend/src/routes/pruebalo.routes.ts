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

// GET /api/pruebalo/session-token - Generar token efímero JWT para embebidos
router.get('/session-token', publicRateLimiter, pruebaloController.generateSessionToken);

// GET /api/pruebalo/validate-api-key - Validar clave de API desde el plugin
router.get('/validate-api-key', publicRateLimiter, pruebaloController.validateApiKey);

// GET /api/pruebalo/synced-products - Obtener productos ya sincronizados
router.get('/synced-products', publicRateLimiter, pruebaloController.getSyncedProducts);

// POST /api/pruebalo/sync-woocommerce - Sincronizar productos desde el plugin
router.post('/sync-woocommerce', publicRateLimiter, pruebaloController.syncWooCommerceProducts);

// POST /api/pruebalo/unsync-woocommerce - Desincronizar productos desde el plugin
router.post('/unsync-woocommerce', publicRateLimiter, pruebaloController.unsyncWooCommerceProducts);

// POST /api/pruebalo/plugin-telemetry - Registrar telemetria tecnica del plugin
router.post('/plugin-telemetry', publicRateLimiter, pruebaloController.recordPluginTelemetry);

// POST /api/pruebalo/app-uninstalled - Pausar integracion al desinstalar plugin/app
router.post('/app-uninstalled', publicRateLimiter, pruebaloController.appUninstalled);

// GET /api/pruebalo/img-proxy - Proxy de imágenes
router.get('/img-proxy', publicRateLimiter, pruebaloController.imgProxy);

// GET /api/pruebalo/:brandSlug - Obtener configuración pública de marca y productos
router.get('/:brandSlug', publicRateLimiter, pruebaloController.getBrandConfig);

// POST /api/pruebalo/:brandSlug/generate - Generar imagen de try-on
router.post(
  '/:brandSlug/generate',
  slugGenerationRateLimiter,
  generationRateLimiter,
  uploadSingleImage,
  handleMulterError,
  pruebaloController.generateTryOn
);

// GET /api/pruebalo/:brandSlug/generation/:generationId - Obtener estado de una generación (polling público)
router.get(
  '/:brandSlug/generation/:generationId',
  publicRateLimiter,
  pruebaloController.getGenerationStatus
);

// POST /api/pruebalo/:brandSlug/generation/:generationId/feedback - Reportar error de generación
router.post(
  '/:brandSlug/generation/:generationId/feedback',
  publicRateLimiter,
  pruebaloController.reportGenerationFeedback
);

export default router;
