import { Router } from 'express';
import { adminAuthMiddleware, requirePermission } from '../middleware/adminAuth';
import { authRateLimiter, adminLoginRateLimiter } from '../middleware/rateLimiter';
import { supabaseAdmin } from '../config/supabase';

// Todas las funciones de controladores admin modularizados se exportan desde admin.controller facade
import {
  // Auth
  adminLogin, adminLogout, adminForgotPassword, adminResetPassword,
  listAdmins, createAdmin, updateAdminPermissions, deleteAdmin, 
  sendAdminCredentials, changeOwnPassword, changeAdminPassword,
  // Brands
  getAllBrands, createBrand, deleteBrand, getBrandProducts, 
  deleteInactiveProduct, changeBrandPlan, activateBrandPlan, 
  toggleLandingPage, updateBrandNotes, updateModalConfig, 
  sendBrandResetEmail, getMiniLandingsAdmin, suspendMiniLanding, 
  restoreMiniLanding, getBrandFull, getBrandsList, resetBrand,
  // Stats
  getGlobalStats, getConversionStats, getTopBrands, getAlerts, 
  getRiskData, getEconomics, getMissionControl,
  // Payments
  getPayments, getAllSubscriptions, registerSubscriptionPayment, 
  suspendSubscription, reactivateSubscription, searchPayments,
  // Operational (Pricing, Audit)
  getAuditLog, getPricingConfig, updatePricingConfig,
  // Promotion
  getAllPromotions, createPromotion, updatePromotion, deletePromotion,
  // Feedback
  getFeedbacks, getFeedbackStats, resolveFeedback, deleteFeedback, 
  getUnresolvedFeedbackCount,
  // System
  getSystemStats,
  // Woo Integration
  getWooBrandsSummary, getWooBrandProducts, setWooProductActive
} from '../controllers/admin.controller';

// Otros controladores fuera de la carpeta admin/ o casos específicos
import { getAdminReferrals, creditReferralBonus } from '../controllers/referral.controller';
import { getPaymentSettings, updatePaymentSettings } from '../controllers/paymentSettings.controller';
import { getAdminNotifications, getNotificationPreferences, updateNotificationPreference } from '../controllers/notifications.controller';
import { getTrialCampaign, createTrialCampaign, updateTrialCampaign } from '../controllers/trialCampaign.controller';
import {
  getEmailCampaigns,
  getEmailCampaign,
  createEmailCampaign,
  previewEmailCampaign,
  sendTestEmail,
  sendAdHocTestEmail,
  launchEmailCampaign,
  scheduleEmailCampaign,
  cancelEmailCampaign,
  deleteEmailCampaign,
  getEmailCampaignQuota,
  verifyBrevoConnection,
} from '../controllers/admin/email-campaign.admin.controller';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  getLeadsByCity,
  addOutreachLog,
  getLeadSearches,
  createLeadSearch,
  runLeadSearch,
  deleteLeadSearch,
  getGooglePlacesQuota,
  getSocialApiConfigs,
  upsertSocialApiConfig,
  testSocialApiConfig,
  deleteSocialApiConfig,
  setSocialApiActive,
  getLeadFilterOptions,
} from '../controllers/admin/lead.admin.controller';
import {
  getGenerations,
  getGenerationById,
  retryGeneration,
  getBrandGenerations,
  getGenerationsStats,
} from '../controllers/admin/generations.admin.controller';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  bulkActionTickets,
  getTicketsStats,
  getTicketMessages,
  addTicketMessage,
} from '../controllers/admin/tickets.admin.controller';
import {
  getGenerationFeedback,
  resolveFeedbackAdmin,
} from '../controllers/admin/feedback.admin.controller';
import { getRebeccaConfig, updateRebeccaConfig } from '../controllers/admin/rebecca.admin.controller';
import {
  getWidgetIpWhitelist,
  addWidgetIpWhitelist,
  updateWidgetIpWhitelist,
  deleteWidgetIpWhitelist,
  checkWidgetIpWhitelist,
  refreshWidgetIpWhitelistCache,
} from '../controllers/widgetIpWhitelist.controller';

const router = Router();

// Auth routes (not requiring adminAuthMiddleware yet, but using adminLoginRateLimiter)
router.post('/auth/login', adminLoginRateLimiter, adminLogin);
router.post('/auth/logout', adminLogout);
router.post('/auth/forgot-password', authRateLimiter, adminForgotPassword);
router.post('/auth/reset-password', authRateLimiter, adminResetPassword);
router.post('/auth/google', authRateLimiter, (req, res) => require('../controllers/admin/auth.admin.controller').adminGoogleLogin(req, res));

// Ruta de verificación de token (usada por Next.js API routes)
router.get('/verify', adminAuthMiddleware, (req: any, res) => {
  return res.status(200).json({ ok: true, admin: req.admin });
});

// Middleware de autenticación para el resto de las rutas
router.use(adminAuthMiddleware);

// Estadísticas y Métricas
router.get('/stats', requirePermission('conversion'), getGlobalStats);
router.get('/stats/conversion', requirePermission('conversion'), getConversionStats);
router.get('/stats/top-brands', requirePermission('conversion'), getTopBrands);
router.get('/alerts', requirePermission('conversion'), getAlerts);

// Gestión de Marcas (Brands)
router.get('/brands', requirePermission('brands'), getAllBrands);
router.post('/brands', requirePermission('brands'), createBrand);
router.delete('/brands/:id', requirePermission('brands'), deleteBrand);
router.get('/brands/:id/products', requirePermission('brands'), getBrandProducts);
router.delete('/brands/:id/products/:productId', requirePermission('brands'), deleteInactiveProduct);
router.patch('/brands/:id/plan', requirePermission('subscriptions'), changeBrandPlan);
router.patch('/brands/:id/activate-plan', requirePermission('subscriptions'), activateBrandPlan);
router.patch('/brands/:id/landing-page', requirePermission('brands'), toggleLandingPage);
router.patch('/brands/:id/notes', requirePermission('brands'), updateBrandNotes);
router.patch('/brands/:id/modal-config', requirePermission('brands'), updateModalConfig);
router.post('/brands/:id/send-reset-email', requirePermission('brands'), sendBrandResetEmail);
router.post('/brands/:id/reset', requirePermission('brands'), resetBrand);
router.get('/brands/list', requirePermission('brands'), getBrandsList);

// Mini-landings — panel de control
router.get('/mini-landings', requirePermission('brands'), getMiniLandingsAdmin);
router.patch('/mini-landings/:id/suspend', requirePermission('brands'), suspendMiniLanding);
router.patch('/mini-landings/:id/restore', requirePermission('brands'), restoreMiniLanding);

// Configuración y Notificaciones
router.get('/payment-settings', requirePermission('settings'), getPaymentSettings);
router.put('/payment-settings', requirePermission('settings'), updatePaymentSettings);
router.get('/notifications', requirePermission('notifications'), getAdminNotifications);
router.get('/notification-preferences', requirePermission('notifications'), getNotificationPreferences);
router.patch('/notification-preferences/:type', requirePermission('notifications'), updateNotificationPreference);

// Gestión de admins — solo quien tenga permiso 'admins'
router.get('/admins', requirePermission('admins'), listAdmins);
router.post('/admins', requirePermission('admins'), createAdmin);
router.patch('/admins/:id/permissions', requirePermission('admins'), updateAdminPermissions);
router.put('/admins/:id/password', requirePermission('admins'), changeAdminPassword);
router.post('/admins/:id/send-credentials', requirePermission('admins'), sendAdminCredentials);
router.delete('/admins/:id', requirePermission('admins'), deleteAdmin);

// Perfil propio — cualquier admin autenticado
router.put('/admins/me/password', changeOwnPassword);

// Campañas de trial
router.get('/trial-campaign', requirePermission('settings'), getTrialCampaign);
router.post('/trial-campaign', requirePermission('settings'), createTrialCampaign);
router.patch('/trial-campaign/:id', requirePermission('settings'), updateTrialCampaign);

// Feedback de generaciones
router.get('/feedback/count-unresolved', requirePermission('brands'), getUnresolvedFeedbackCount);
router.get('/feedback/stats', requirePermission('brands'), getFeedbackStats);
router.get('/feedback', requirePermission('brands'), getFeedbacks);
router.patch('/feedback/:id/resolve', requirePermission('brands'), resolveFeedback);
router.post('/feedback/:id/resolve', requirePermission('brands'), resolveFeedbackAdmin);
router.delete('/feedback/:id', requirePermission('brands'), deleteFeedback);

// Estadísticas del sistema (RAM, Uptime)
router.get('/system/stats', requirePermission('settings'), getSystemStats);

// Historial de pagos global (Auditoría Marzo 2026)
router.get('/revenue/payments', requirePermission('subscriptions'), getPayments);

// Gestión de promociones
router.get('/promotions', requirePermission('settings'), getAllPromotions);
router.post('/promotions', requirePermission('settings'), createPromotion);
router.put('/promotions/:id', requirePermission('settings'), updatePromotion);
router.delete('/promotions/:id', requirePermission('settings'), deletePromotion);

// Gestión de precios (pricing_config)
router.get('/pricing', requirePermission('settings'), getPricingConfig);
router.put('/pricing', requirePermission('settings'), updatePricingConfig);

// Control WooCommerce desde panel admin
router.get('/woocommerce/brands-summary', requirePermission('brands'), getWooBrandsSummary);
router.get('/woocommerce/brands/:id/products', requirePermission('brands'), getWooBrandProducts);
router.patch('/woocommerce/brands/:id/products/:productId/active', requirePermission('brands'), setWooProductActive);

// Mission Control, Riesgo, Economía, Auditoría, Ficha 360
router.get('/stats/mission-control', requirePermission('conversion'), getMissionControl);
router.get('/risk', requirePermission('brands'), getRiskData);
router.get('/economics', requirePermission('settings'), getEconomics);
router.get('/audit-log', requirePermission('admins'), getAuditLog);
router.get('/brands/:id/full', requirePermission('brands'), getBrandFull);

// Health check para panel admin (extended info)
router.get('/health', requirePermission('health'), async (_req: any, res: any) => {
  const { getHealthDeep } = await import('../controllers/health.controller');
  return getHealthDeep(_req, res);
});

// Gestión de Suscripciones
router.get('/subscriptions', requirePermission('subscriptions'), getAllSubscriptions);
router.post('/subscriptions/:id/payment', requirePermission('subscriptions'), registerSubscriptionPayment);
router.patch('/subscriptions/:id/suspend', requirePermission('subscriptions'), suspendSubscription);
router.patch('/subscriptions/:id/reactivate', requirePermission('subscriptions'), reactivateSubscription);

// Búsqueda de pagos
router.get('/payments/search', requirePermission('subscriptions'), searchPayments);

// Programa de Referidos
router.get('/referrals', requirePermission('brands'), getAdminReferrals);
router.post('/referrals/:referralId/credit', requirePermission('brands'), creditReferralBonus);

// Email Campaigns (Brevo)
router.get('/email-campaigns/quota', requirePermission('marketing'), getEmailCampaignQuota);
router.get('/email-campaigns/brevo-status', requirePermission('marketing'), verifyBrevoConnection);
router.get('/email-campaigns', requirePermission('marketing'), getEmailCampaigns);
router.get('/email-campaigns/:id', requirePermission('marketing'), getEmailCampaign);
router.post('/email-campaigns', requirePermission('marketing'), createEmailCampaign);
router.post('/email-campaigns/:id/preview', requirePermission('marketing'), previewEmailCampaign);
router.post('/email-campaigns/test-ad-hoc', requirePermission('marketing'), sendAdHocTestEmail);
router.post('/email-campaigns/:id/test', requirePermission('marketing'), sendTestEmail);
router.post('/email-campaigns/:id/launch', requirePermission('marketing'), launchEmailCampaign);
router.post('/email-campaigns/:id/schedule', requirePermission('marketing'), scheduleEmailCampaign);
router.post('/email-campaigns/:id/cancel', requirePermission('marketing'), cancelEmailCampaign);
router.delete('/email-campaigns/:id', requirePermission('marketing'), deleteEmailCampaign);

// Lead Generation & CRM
router.get('/leads/filters', requirePermission('brands'), getLeadFilterOptions);
router.get('/leads/stats', requirePermission('brands'), getLeadStats);
router.get('/leads/by-city', requirePermission('brands'), getLeadsByCity);
router.get('/leads', requirePermission('brands'), getLeads);
router.get('/leads/:id', requirePermission('brands'), getLead);
router.post('/leads', requirePermission('brands'), createLead);
router.patch('/leads/:id', requirePermission('brands'), updateLead);
router.delete('/leads/:id', requirePermission('brands'), deleteLead);
router.post('/leads/:id/outreach', requirePermission('brands'), addOutreachLog);

// Lead Searches
router.get('/lead-searches', requirePermission('brands'), getLeadSearches);
router.post('/lead-searches', requirePermission('brands'), createLeadSearch);
router.post('/lead-searches/:id/run', requirePermission('brands'), runLeadSearch);
router.delete('/lead-searches/:id', requirePermission('brands'), deleteLeadSearch);
router.get('/lead-searches/quota', requirePermission('brands'), getGooglePlacesQuota);

// Social API Configuration
router.get('/social-api-configs', requirePermission('settings'), getSocialApiConfigs);
router.post('/social-api-configs', requirePermission('settings'), upsertSocialApiConfig);
router.post('/social-api-configs/:platform/test', requirePermission('settings'), testSocialApiConfig);
router.patch('/social-api-configs/:platform/active', requirePermission('settings'), setSocialApiActive);
router.delete('/social-api-configs/:platform', requirePermission('settings'), deleteSocialApiConfig);

// Historial de Generaciones (Try-On)
router.get('/generations/stats', requirePermission('brands'), getGenerationsStats);
router.get('/generations', requirePermission('brands'), getGenerations);
router.get('/generations/:id', requirePermission('brands'), getGenerationById);
router.get('/generations/:id/feedback', requirePermission('brands'), getGenerationFeedback);
router.patch('/generations/:id/retry', requirePermission('brands'), retryGeneration);
router.get('/brands/:brandId/generations', requirePermission('brands'), getBrandGenerations);

// Monitor de Actividad en Tiempo Real
router.get('/realtime/stats', requirePermission('conversion'), async (req: any, res: any) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(200).json({
        globalActive: 0,
        activeBrands: [],
        activityHistory: [],
        timestamp: new Date().toISOString(),
        _warning: 'Redis unavailable, returned partial data',
      });
    }
  }, 3000);

  try {
    const { generationConcurrencyService } = await import('../services/generation-concurrency.service');

    const [globalActive, activeBrands, activityHistory] = await Promise.all([
      generationConcurrencyService.getGlobalActiveCount(),
      generationConcurrencyService.getBrandsWithActiveGenerations(),
      generationConcurrencyService.getActivityHistory(2),
    ]);

    clearTimeout(timeout);
    return res.json({
      globalActive,
      activeBrands,
      activityHistory,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    clearTimeout(timeout);
    console.error('[Admin/Realtime] Error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Tickets de Soporte
router.get('/tickets', requirePermission('brands'), getTickets);
router.get('/tickets/:id', requirePermission('brands'), getTicketById);
router.post('/tickets', requirePermission('brands'), createTicket);
router.patch('/tickets/:id', requirePermission('brands'), updateTicket);
router.delete('/tickets/:id', requirePermission('admins'), deleteTicket);
router.post('/tickets/bulk-action', requirePermission('brands'), bulkActionTickets);
router.get('/tickets/stats', requirePermission('brands'), getTicketsStats);
router.get('/tickets/:id/messages', requirePermission('brands'), getTicketMessages);
router.post('/tickets/:id/messages', requirePermission('brands'), addTicketMessage);

// Widget IP Whitelist
router.get('/widget-ip-whitelist', requirePermission('settings'), getWidgetIpWhitelist);
router.post('/widget-ip-whitelist', requirePermission('settings'), addWidgetIpWhitelist);
router.put('/widget-ip-whitelist/:id', requirePermission('settings'), updateWidgetIpWhitelist);
router.delete('/widget-ip-whitelist/:id', requirePermission('settings'), deleteWidgetIpWhitelist);
router.get('/widget-ip-whitelist/check/:ip', requirePermission('settings'), checkWidgetIpWhitelist);
router.post('/widget-ip-whitelist/refresh-cache', requirePermission('settings'), refreshWidgetIpWhitelistCache);

// Knowledge Base (WhatsApp Agent — Rebecca)
import {
  getKnowledgeItems,
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  backfillEmbeddings,
} from '../controllers/admin/knowledge.admin.controller';

router.get('/knowledge', requirePermission('settings'), getKnowledgeItems);
router.post('/knowledge', requirePermission('settings'), createKnowledgeItem);
router.patch('/knowledge/:id', requirePermission('settings'), updateKnowledgeItem);
router.delete('/knowledge/:id', requirePermission('settings'), deleteKnowledgeItem);
// Backfill: regenera embeddings para todos los items sin embedding (correr una sola vez post-migración)
router.post('/knowledge/backfill-embeddings', requirePermission('settings'), backfillEmbeddings);

// Rebecca AI Agent Config
router.get('/rebecca/config', requirePermission('settings'), getRebeccaConfig);
router.patch('/rebecca/config', requirePermission('settings'), updateRebeccaConfig);

// Rebecca System Prompt (stored in rebecca_config as 'system_prompt' key)
router.get('/rebecca/system-prompt', requirePermission('settings'), async (req: any, res: any) => {
  try {
    const { data } = await supabaseAdmin
      .from('rebecca_config')
      .select('config_value')
      .eq('config_key', 'system_prompt')
      .single();

    return res.json({ config: data?.config_value || '' });
  } catch (err: any) {
    console.error('[RebeccaAdmin] getSystemPrompt:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener prompt' });
  }
});

router.post('/rebecca/system-prompt', requirePermission('settings'), async (req: any, res: any) => {
  try {
    const { config } = req.body;
    const adminEmail = req.admin?.email || 'unknown';
    const now = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('rebecca_config')
      .upsert({
        config_key: 'system_prompt',
        config_value: config || '',
        updated_at: now,
        updated_by: adminEmail,
      }, { onConflict: 'config_key' });

    if (error) throw error;

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[RebeccaAdmin] saveSystemPrompt:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al guardar prompt' });
  }
});

// Rebecca Message Ratings (Feedback Loop)
import {
  getRatingsStats,
  getUnreviewedRatings,
  getNegativeRatings,
  markRatingReviewed,
  updateSessionOutcome,
} from '../controllers/admin/rebecca-ratings.admin.controller';

router.get('/chat/ratings/stats', requirePermission('settings'), getRatingsStats);
router.get('/chat/ratings/unreviewed', requirePermission('settings'), getUnreviewedRatings);
router.get('/chat/ratings/negative', requirePermission('settings'), getNegativeRatings);
router.patch('/chat/ratings/:id/review', requirePermission('settings'), markRatingReviewed);
router.patch('/chat/ratings/session/:sessionId/outcome', requirePermission('settings'), updateSessionOutcome);

// Sales Patterns
import { getSalesPatterns } from '../controllers/admin/rebecca.admin.controller';

router.get('/sales-patterns', requirePermission('settings'), getSalesPatterns);

export default router;
