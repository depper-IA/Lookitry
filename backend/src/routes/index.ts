// backend/src/routes/index.ts

import { Router } from 'express';
import { generateEmbedding } from '../services/rag-context.service';

import authRoutes from './auth.routes';
import brandsRoutes from './brands.routes';
import usageRoutes from './usage.routes';
import productsRoutes from './products.routes';
import generationsRoutes from './generations.routes';
import analyticsRoutes from './analytics.routes';
import paymentsRoutes from './payments.routes';
import adminRoutes from './admin.routes';
import subscriptionRoutes from './subscription.routes';
import cleanupRoutes from './cleanup.routes';
import revenueRoutes from './revenue.routes';
import wompiRoutes from './wompi.routes';
import paypalRoutes from './paypal.routes';
import imageRoutes from './image.routes';
import blogRoutes from './blog.routes';
import trialRoutes from './trial.routes';
import reviewsRoutes from './reviews.routes';
import reviewsPublicRoutes from './reviewsPublic.routes';
import adminReviewsRoutes from './adminReviews.routes';
import couponsRoutes from './coupons.routes';
import couponsPublicRoutes from './couponsPublic.routes';
import enterpriseRoutes from './enterprise.routes';
import agentRoutes from './agent.routes';
import categoryAttributesRoutes from './categoryAttributes.routes';
import landingStatsRoutes from './landingStats.routes';
import homeRoutes from './home.routes';
import vertexRoutes from './vertex.routes';
import aiRoutes from './ai.routes';
import chatRoutes from './chat.routes';
import ycloudRoutes from './ycloud.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/brands', brandsRoutes);
router.use('/usage', usageRoutes);
router.use('/products', productsRoutes);
router.use('/generations', generationsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/payments', paymentsRoutes);
// KB embed — n8n sync workflow (x-admin-key only, no JWT)
const KB_SYNC_KEY = 'lookitry_kb_sync_2026';
router.post('/admin/embed', async (req: any, res: any) => {
  if (req.headers['x-admin-key'] !== KB_SYNC_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text required' });
  }
  const embedding = await generateEmbedding(text.slice(0, 2000));
  if (!embedding) {
    return res.status(500).json({ error: 'Embedding generation failed' });
  }
  return res.json({ embedding });
});

router.use('/admin', adminRoutes);
router.use('/', subscriptionRoutes);
router.use('/cleanup', cleanupRoutes);
router.use('/admin/revenue', revenueRoutes);
router.use('/payments/wompi', wompiRoutes);
router.use('/payments/paypal', paypalRoutes);
router.use('/images', imageRoutes);
router.use('/blog', blogRoutes);
router.use('/trial', trialRoutes);
router.use('/reviews/public', reviewsPublicRoutes);
router.use('/landing-stats', landingStatsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/admin/reviews', adminReviewsRoutes);
router.use('/admin/coupons', couponsRoutes);
router.use('/admin/enterprise', enterpriseRoutes);
router.use('/coupons', couponsPublicRoutes);
router.use('/agent', agentRoutes);
router.use('/category-attributes', categoryAttributesRoutes);
router.use('/home/tryon', homeRoutes);
router.use('/vertex', vertexRoutes);
router.use('/ai', aiRoutes);
router.use('/chat', chatRoutes);
router.use('/chat', ycloudRoutes);

export default router;