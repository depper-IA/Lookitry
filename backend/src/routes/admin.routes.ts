import { Router } from 'express';
import { adminAuthMiddleware, requirePermission } from '../middleware/adminAuth';
import {
  adminLogin,
  getAllBrands,
  changeBrandPlan,
  getGlobalStats,
  getBrandProducts,
  activateBrandPlan,
  deleteInactiveProduct,
  createBrand,
  deleteBrand,
  getConversionStats,
  toggleLandingPage,
  updateModalConfig,
  getMiniLandingsAdmin,
  suspendMiniLanding,
  restoreMiniLanding,
  listAdmins,
  createAdmin,
  updateAdminPermissions,
  deleteAdmin,
  sendAdminCredentials,
  changeOwnPassword,
  getFeedbacks,
  getFeedbackStats,
  resolveFeedback,
  deleteFeedback,
  getUnresolvedFeedbackCount,
  getOpenRouterCredits,
  sendBrandResetEmail,
  getPayments,
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../controllers/admin.controller';
import {
  getPaymentSettings,
  updatePaymentSettings,
} from '../controllers/paymentSettings.controller';
import {
  getAdminNotifications,
  getNotificationPreferences,
  updateNotificationPreference,
} from '../controllers/notifications.controller';
import {
  getTrialCampaign,
  createTrialCampaign,
  updateTrialCampaign,
} from '../controllers/trialCampaign.controller';

const router = Router();

router.post('/auth/login', adminLogin);

// Ruta de verificación de token (usada por Next.js API routes)
router.get('/verify', adminAuthMiddleware, (req: any, res) => {
  return res.status(200).json({ ok: true, admin: req.admin });
});

router.use(adminAuthMiddleware);

router.get('/stats', requirePermission('conversion'), getGlobalStats);
router.get('/stats/conversion', requirePermission('conversion'), getConversionStats);
router.get('/brands', requirePermission('brands'), getAllBrands);
router.post('/brands', requirePermission('brands'), createBrand);
router.delete('/brands/:id', requirePermission('brands'), deleteBrand);
router.get('/brands/:id/products', requirePermission('brands'), getBrandProducts);
router.delete('/brands/:id/products/:productId', requirePermission('brands'), deleteInactiveProduct);
router.patch('/brands/:id/plan', requirePermission('subscriptions'), changeBrandPlan);
router.patch('/brands/:id/activate-plan', requirePermission('subscriptions'), activateBrandPlan);
router.patch('/brands/:id/landing-page', requirePermission('brands'), toggleLandingPage);
router.patch('/brands/:id/modal-config', requirePermission('brands'), updateModalConfig);
router.post('/brands/:id/send-reset-email', requirePermission('brands'), sendBrandResetEmail);

// Mini-landings — panel de control
router.get('/mini-landings', requirePermission('brands'), getMiniLandingsAdmin);
router.patch('/mini-landings/:id/suspend', requirePermission('brands'), suspendMiniLanding);
router.patch('/mini-landings/:id/restore', requirePermission('brands'), restoreMiniLanding);
router.get('/payment-settings', requirePermission('settings'), getPaymentSettings);
router.put('/payment-settings', requirePermission('settings'), updatePaymentSettings);
router.get('/notifications', requirePermission('notifications'), getAdminNotifications);
router.get('/notification-preferences', requirePermission('notifications'), getNotificationPreferences);
router.patch('/notification-preferences/:type', requirePermission('notifications'), updateNotificationPreference);

// Gestión de admins — solo quien tenga permiso 'admins'
router.get('/admins', requirePermission('admins'), listAdmins);
router.post('/admins', requirePermission('admins'), createAdmin);
router.patch('/admins/:id/permissions', requirePermission('admins'), updateAdminPermissions);
router.post('/admins/:id/send-credentials', requirePermission('admins'), sendAdminCredentials);
router.delete('/admins/:id', requirePermission('admins'), deleteAdmin);

// Perfil propio — cualquier admin autenticado
router.put('/admins/me/password', changeOwnPassword);

// Campañas de trial
router.get('/trial-campaign', requirePermission('settings'), getTrialCampaign);
router.post('/trial-campaign', requirePermission('settings'), createTrialCampaign);
router.patch('/trial-campaign/:id', requirePermission('settings'), updateTrialCampaign);

// Feedback de generaciones (51.8)
router.get('/feedback/count-unresolved', requirePermission('brands'), getUnresolvedFeedbackCount);
router.get('/feedback/stats', requirePermission('brands'), getFeedbackStats);
router.get('/feedback', requirePermission('brands'), getFeedbacks);
router.patch('/feedback/:id/resolve', requirePermission('brands'), resolveFeedback);
router.delete('/feedback/:id', requirePermission('brands'), deleteFeedback);

// Monitor de créditos OpenRouter
router.get('/openrouter-credits', requirePermission('settings'), getOpenRouterCredits);

// Historial de pagos global (Auditoría Marzo 2026)
router.get('/revenue/payments', requirePermission('subscriptions'), getPayments);

// Gestión de promociones (Nueva ruta centralizada en backend)
router.get('/promotions', requirePermission('settings'), getAllPromotions);
router.post('/promotions', requirePermission('settings'), createPromotion);
router.put('/promotions/:id', requirePermission('settings'), updatePromotion);
router.delete('/promotions/:id', requirePermission('settings'), deletePromotion);

export default router;
