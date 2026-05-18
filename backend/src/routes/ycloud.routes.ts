import { Router } from 'express';
import { handleYCloudWebhook } from '../controllers/ycloud.controller';

const router = Router();

// YCloud WhatsApp webhook — no auth required, called by YCloud directly
router.post('/ycloud-webhook', handleYCloudWebhook);

export default router;