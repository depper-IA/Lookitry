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
  listAdmins,
  createAdmin,
  updateAdminPermissions,
  deleteAdmin,
  sendAdminCredentials,
  changeOwnPassword,
} from '../controllers/admin.controller';
import {
  getPaymentSettings,
  updatePaymentSettings,
} from '../controllers/paymentSettings.controller';
import { getAdminNotifications } from '../controllers/notifications.controller';
import {
  getTrialCampaign,
  createTrialCampaign,
  updateTrialCampaign,
} from '../controllers/trialCampaign.controller';

const router = Router();

router.post('/auth/login', adminLogin);

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
router.get('/payment-settings', requirePermission('settings'), getPaymentSettings);
router.put('/payment-settings', requirePermission('settings'), updatePaymentSettings);
router.get('/notifications', requirePermission('notifications'), getAdminNotifications);

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

export default router;
