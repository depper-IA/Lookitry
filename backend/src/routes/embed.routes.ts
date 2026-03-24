import { Router } from 'express';
import { EmbedController } from '../controllers/embed.controller';
import { apiKeyAuth } from '../middleware/apiKeyAuth';

const router = Router();
const embedController = new EmbedController();

// POST /api/embed/wordpress/init
router.post('/wordpress/init', apiKeyAuth, embedController.initWordPressEmbed);

export default router;
