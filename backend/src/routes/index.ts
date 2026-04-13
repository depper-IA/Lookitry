// backend/src/routes/index.ts
import { Router } from 'express';

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
import adminReviewsRoutes from './adminReviews.routes';
import couponsRoutes from './coupons.routes';
import enterpriseRoutes from './enterprise.routes';
import agentRoutes from './agent.routes';
import reviewsPublicRoutes from './reviewsPublic.routes';
import categoryAttributesRoutes from './categoryAttributes.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/brands', brandsRoutes);
router.use('/usage', usageRoutes);
router.use('/products', productsRoutes);
router.use('/generations', generationsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/payments', paymentsRoutes);
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
router.use('/reviews', reviewsRoutes);
router.use('/admin/reviews', adminReviewsRoutes);
router.use('/admin/coupons', couponsRoutes);
router.use('/admin/enterprise', enterpriseRoutes);
router.use('/agent', agentRoutes);
router.use('/category-attributes', categoryAttributesRoutes);

export default router;
