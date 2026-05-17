import { Router } from 'express';
import { receiveWebhook, getConversations, getConversationMessages, replyToConversation, updateConversationStatus, widgetReply } from '../controllers/chat.controller';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import { rebeccaRateLimitBySession, rebeccaRateLimitByIP } from '../middleware/rebecca-rate-limit';

const router = Router();

// Rebecca web chat widget — public, rate limited
router.post('/widget', rebeccaRateLimitByIP, rebeccaRateLimitBySession, widgetReply);

// Webhook for incoming WhatsApp messages
router.post('/webhook', receiveWebhook);

// n8n WhatsApp workflow endpoint — no auth, called server-to-server
router.patch('/conversations/:id/status', updateConversationStatus);

// Admin endpoints
router.get('/conversations', adminAuthMiddleware, getConversations);
router.get('/conversations/:id', adminAuthMiddleware, getConversationMessages);
router.post('/conversations/:id/reply', adminAuthMiddleware, replyToConversation);

export default router;
