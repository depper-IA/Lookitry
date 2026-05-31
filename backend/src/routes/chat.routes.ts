import { Router, Request, Response, NextFunction } from 'express';
import { receiveWebhook, getConversations, getConversationMessages, replyToConversation, updateConversationStatus, widgetReply, trackPage, whatsappReply, updateLeadContact, getLeadContext, updateLeadProfileEndpoint, getWidgetHistory, saveWidgetMessage } from '../controllers/chat.controller';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import { rebeccaRateLimitBySession, rebeccaRateLimitByIP } from '../middleware/rebecca-rate-limit';

const router = Router();

const n8nKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const n8nKey = process.env.N8N_WEBHOOK_SECRET;
  if (!n8nKey || req.headers['x-n8n-key'] !== n8nKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

// Rebecca web chat widget — public, rate limited
router.post('/widget', rebeccaRateLimitByIP, rebeccaRateLimitBySession, widgetReply);

// Widget history — persistencia de chat (Spec: Rebecca bugs §3.1)
router.get('/widget/history', getWidgetHistory);
router.post('/widget/message', rebeccaRateLimitByIP, rebeccaRateLimitBySession, saveWidgetMessage);

// Track page visits for abandoned cart detection (Spec: Rebecca 2.0 §6.4)
router.post('/track-page', trackPage);

// Lead management endpoints (públicos, llamados por Rebecca)
router.post('/lead/contact', updateLeadContact);
router.post('/lead/profile', updateLeadProfileEndpoint);
router.get('/lead/:phone', getLeadContext);

// Webhook for incoming WhatsApp messages
router.post('/webhook', receiveWebhook);

// n8n WhatsApp workflow endpoints — server-to-server, protected by N8N_WEBHOOK_SECRET
router.post('/whatsapp', n8nKeyMiddleware, whatsappReply);
router.patch('/conversations/:id/status', n8nKeyMiddleware, updateConversationStatus);

// Admin endpoints
router.get('/conversations', adminAuthMiddleware, getConversations);
router.get('/conversations/:id', adminAuthMiddleware, getConversationMessages);
router.post('/conversations/:id/reply', adminAuthMiddleware, replyToConversation);

export default router;
