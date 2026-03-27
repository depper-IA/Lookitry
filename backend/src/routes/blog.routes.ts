import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import { multerMemory } from '../controllers/upload.controller';

const router = Router();

/** PUBLIC / n8n// Webhook de n8n para crear posts **/
router.post('/webhook', (req, res) => blogController.webhookCreatePost(req, res));

// Webhook de n8n para subir imágenes
router.post('/upload', multerMemory.single('file'), (req, res) => blogController.uploadBlogImage(req, res));

// Rutas de administración (requieren JWT de admin)
router.use('/admin', adminAuthMiddleware);

router.get('/admin', blogController.adminGetPosts);
router.get('/admin/categories', blogController.adminGetCategories);
router.get('/admin/:id', blogController.adminGetPost);
router.put('/admin/:id', blogController.adminUpdatePost);
router.delete('/admin/:id', blogController.adminDeletePost);

export default router;
