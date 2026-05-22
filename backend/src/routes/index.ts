// backend/src/routes/index.ts

import { Router } from 'express';
import { generateEmbedding } from '../services/rag-context.service';
import { supabaseAdmin } from '../config/supabase';

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
// KB sync endpoints — used by n8n / scripts (x-admin-key, no JWT)
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
  if (!embedding) return res.status(500).json({ error: 'Embedding generation failed' });
  return res.json({ embedding });
});

router.post('/admin/sync-kb', async (req: any, res: any) => {
  if (req.headers['x-admin-key'] !== KB_SYNC_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array required' });
  }
  const results: string[] = [];
  for (const item of items) {
    if (!item.id || !item.category || !item.title || !item.content) continue;
    const text = `${item.title}\n\n${item.content}`.slice(0, 2000);
    const embedding = await generateEmbedding(text);
    if (!embedding) { results.push(`SKIP:${item.id} (embedding failed)`); continue; }
    const { error } = await supabaseAdmin.from('lookitry_knowledge').upsert({
      id: item.id,
      category: item.category,
      title: item.title,
      content: item.content,
      is_active: item.is_active ?? true,
      embedding,
    }, { onConflict: 'id' });
    if (error) results.push(`ERR:${item.id} ${error.message}`);
    else results.push(`OK:${item.id}`);
  }
  const synced = results.filter(r => r.startsWith('OK')).length;
  console.log(`[sync-kb] ${synced}/${items.length} synced`);
  return res.json({ synced, total: items.length, results });
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
router.use('/category-attributes', categoryAttributesRoutes);
router.use('/home/tryon', homeRoutes);
router.use('/vertex', vertexRoutes);
router.use('/ai', aiRoutes);
router.use('/chat', chatRoutes);
router.use('/chat', ycloudRoutes);

export default router;