import { Router, Request, Response, NextFunction } from 'express';
import { handleYCloudWebhook } from '../controllers/ycloud.controller';

const router = Router();

function ycloudWebhookAuth(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.YCLOUD_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[YCloud-Auth] YCLOUD_WEBHOOK_SECRET not set — webhook unprotected');
    return next();
  }
  const provided = req.headers['x-ycloud-secret'] as string | undefined;
  if (!provided || provided !== secret) {
    console.error('[YCloud-Auth] Invalid or missing X-YCloud-Secret header');
    return res.status(401).json({ status: 'error', code: 'UNAUTHORIZED' });
  }
  next();
}

router.post('/ycloud-webhook', ycloudWebhookAuth, handleYCloudWebhook);

export default router;