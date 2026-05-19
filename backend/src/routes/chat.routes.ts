import { Router } from 'express';
import { receiveWebhook, getConversations, getConversationMessages, replyToConversation, updateConversationStatus, widgetReply, trackPage, whatsappReply, updateLeadContact, getLeadContext } from '../controllers/chat.controller';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import { rebeccaRateLimitBySession, rebeccaRateLimitByIP } from '../middleware/rebecca-rate-limit';

const router = Router();

// Rebecca web chat widget — public, rate limited
router.post('/widget', rebeccaRateLimitByIP, rebeccaRateLimitBySession, widgetReply);

// Track page visits for abandoned cart detection (Spec: Rebecca 2.0 §6.4)
router.post('/track-page', trackPage);

// Lead management endpoints (públicos, llamados por Rebecca)
router.post('/lead/contact', updateLeadContact);
router.get('/lead/:phone', getLeadContext);

// Webhook for incoming WhatsApp messages
router.post('/webhook', receiveWebhook);

// n8n WhatsApp workflow endpoints — no auth, called server-to-server
router.post('/whatsapp', whatsappReply);
router.patch('/conversations/:id/status', updateConversationStatus);

// Admin endpoints
router.get('/conversations', adminAuthMiddleware, getConversations);
router.get('/conversations/:id', adminAuthMiddleware, getConversationMessages);
router.post('/conversations/:id/reply', adminAuthMiddleware, replyToConversation);

export default router;
