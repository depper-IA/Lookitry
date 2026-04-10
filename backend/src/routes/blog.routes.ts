import { Request, Response, Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { blogSettingsController } from '../controllers/blogSettings.controller';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import { multerMemory } from '../controllers/upload.controller';

const router = Router();

/** PUBLIC / n8n // Webhook de n8n para crear posts **/
router.post('/webhook', (req, res) => blogController.webhookCreatePost(req, res));

// Webhook de n8n para subir imágenes
router.post('/upload', multerMemory.single('file'), (req, res) => blogController.uploadBlogImage(req, res));

// NUEVO: Recibir contenido HTML del artículo (sin imágenes)
router.post('/article-content', (req, res) => blogController.articleContent(req, res));

// NUEVO: Ensamblar y publicar artículo con imágenes
router.post('/assemble-article', (req, res) => blogController.assembleArticle(req, res));

// Webhook de n8n para reportar status de ejecución
router.post('/execution-status', (req, res) => blogSettingsController.reportExecutionStatus(req, res));

// Webhook de n8n para notificar que no había topics pendientes
router.post('/settings/notify-no-topics', (req, res) => blogSettingsController.notifyNoTopics(req, res));

// Rutas de administración (requieren JWT de admin)
router.use('/admin', adminAuthMiddleware);

router.get('/admin', blogController.adminGetPosts);
router.post('/admin', blogController.adminCreatePost);
router.get('/admin/categories', blogController.adminGetCategories);
router.get('/admin/:id', blogController.adminGetPost);
router.put('/admin/:id', blogController.adminUpdatePost);
router.delete('/admin/:id', blogController.adminDeletePost);

// Configuración del Pulso Editorial
router.get('/settings', adminAuthMiddleware, blogSettingsController.getSettings);
router.put('/settings', adminAuthMiddleware, blogSettingsController.updateSettings);
router.post('/settings/trigger', adminAuthMiddleware, blogSettingsController.triggerNow);

export default router;
