import { Router } from 'express';
import { receiveWebhook, getConversations, getConversationMessages, replyToConversation } from '../controllers/chat.controller';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const router = Router();

// Webhook for incoming WhatsApp messages
router.post('/webhook', receiveWebhook);

// Admin endpoints
router.get('/conversations', adminAuthMiddleware, getConversations);
router.get('/conversations/:id', adminAuthMiddleware, getConversationMessages);
router.post('/conversations/:id/reply', adminAuthMiddleware, replyToConversation);

export default router;
