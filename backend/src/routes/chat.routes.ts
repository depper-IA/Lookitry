import { Router } from 'express';
import { receiveWebhook, getConversations, getConversationMessages, replyToConversation } from '../controllers/chat.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Webhook for incoming WhatsApp messages
router.post('/webhook', receiveWebhook);

// Admin endpoints
router.get('/conversations', requireAdmin, getConversations);
router.get('/conversations/:id', requireAdmin, getConversationMessages);
router.post('/conversations/:id/reply', requireAdmin, replyToConversation);

export default router;
