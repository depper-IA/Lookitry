import { Router } from 'express';
import { BrandsController } from '../controllers/brands.controller';
import { authMiddleware } from '../middleware/auth';
import { checkActiveSubscription } from '../middleware/checkSubscription';
import { SubscriptionService } from '../services/subscription.service';
import { getReferralInfo, validateReferralCode, claimReferralBonus } from '../controllers/referral.controller';
import { asyncHandler } from '../middleware/errorHandler';
import { publicRateLimiter } from '../middleware/rateLimiter';
import { supabaseAdmin } from '../config/supabase';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const router = Router();
const brandsController = new BrandsController();
const subscriptionService = new SubscriptionService();

// POST /api/brands/check-availability — verifica disponibilidad de nombre y slug
router.post('/check-availability', publicRateLimiter, asyncHandler(async (req, res) => {
  const { brandName } = req.body;
  
  if (!brandName || typeof brandName !== 'string' || brandName.trim().length === 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El nombre de marca es requerido' });
  }

  const normalizedBrandName = brandName.trim();
  const slug = slugify(normalizedBrandName);

  if (!slug) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El nombre de marca no genera un slug válido. Usa al menos una letra o número.' });
  }

  // Validaciones del slug (consistentes con auth.routes.ts)
  const RESERVED_SLUGS = [
    'admin', 'api', 'dashboard', 'login', 'register', 'checkout', 'planes',
    'blog', 'ayuda', 'sobre-nosotros', 'contacto', 'estado', 'terminos',
    'politicas-privacidad', 'politica-de-uso', 'pruebalo', 'sitio', 'probador-virtual',
    'auth', 'verify', 'reset', 'confirmar', 'wompi', 'paypal', 'subscription',
    'brand', 'brands', 'product', 'products', 'generation', 'generations',
    'payment', 'payments', 'invoice', 'receipt', 'success', 'cancel', 'error',
    'www', 'mail', 'email', 'support', 'help', 'docs', 'documentation',
    'app', 'panel', 'cms', 'manage', 'settings', 'config', '密', '的公司',
    'lookitry', 'wwwlookitry', 'cdn', 'static', 'assets', 'images', 'css', 'js',
    'robots', 'sitemap', 'humans', 'feed', 'rss', 'atom', 'xml', 'json',
    'oauth', 'saml', 'ldap', 'ws', 'wss', 'ftp', 'sftp', 'ssh', 'telnet',
    'smtp', 'pop', 'imap', 'dns', 'mx', 'txt', 'cname', 'a', 'aaaa',
  ];

  const normalizedSlug = slug.toLowerCase().trim();

  if (normalizedSlug.length < 3 || normalizedSlug.length > 50) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El slug generado debe tener entre 3 y 50 caracteres' });
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalizedSlug)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El slug solo puede contener letras minúsculas, números y guiones (no puede empezar ni terminar con guión)' });
  }

  if (normalizedSlug.startsWith('-') || normalizedSlug.endsWith('-')) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El slug no puede empezar ni terminar con guión' });
  }

  if (RESERVED_SLUGS.includes(normalizedSlug)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Este URL no está disponible' });
  }

  // Verificar si el nombre de marca ya existe (case-insensitive)
  const { data: existingBrandByName } = await supabaseAdmin
    .from('brands')
    .select('id, name')
    .ilike('name', normalizedBrandName)
    .maybeSingle();

  // Verificar si el slug ya existe
  const { data: existingBrandBySlug } = await supabaseAdmin
    .from('brands')
    .select('id, slug')
    .eq('slug', normalizedSlug)
    .maybeSingle();

  const brandExists = !!existingBrandByName;
  const slugExists = !!existingBrandBySlug;

  const response = {
    slug: normalizedSlug,
    brandExists,
    slugExists,
    suggestedSuffix: ''
  };

  return res.json(response);
}));

// Todas las rutas de brands requieren autenticación
router.use(authMiddleware);

// GET /api/brands/me - Obtener datos de la marca autenticada
// No requiere verificación de suscripción para que marcas suspendidas puedan ver su estado
router.get('/me', (req, res) => brandsController.getMe(req, res));

// GET /api/brands/me/woocommerce-metrics - Metricas reales del plugin para la marca autenticada
router.get('/me/woocommerce-metrics', (req, res) => brandsController.getWooCommerceMetrics(req, res));

// PATCH /api/brands/me - Actualizar configuración de la marca
// Permitimos actualización para TRIAL para que puedan configurar su landing
router.patch('/me', (req, res) => brandsController.updateMe(req, res));

// GET /api/brands/me/payments - Historial de pagos de la marca autenticada
router.get('/me/payments', async (req: any, res) => {
  try {
    const brandId = req.brand?.id;
    if (!brandId) return res.status(401).json({ error: 'No autenticado' });
    const payments = await subscriptionService.getPaymentHistory(brandId);
    return res.json({ payments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al obtener pagos' });
  }
});

// GET /api/brands/me/legal-requests - Historial de solicitudes legales/autoservicio
router.get('/me/legal-requests', (req, res) => brandsController.getLegalRequests(req, res));

// POST /api/brands/me/legal-requests - Crear solicitud legal/autoservicio
router.post('/me/legal-requests', (req, res) => brandsController.createLegalRequest(req, res));

// POST /api/brands/me/trial-events - Registrar eventos comerciales de trial
router.post('/me/trial-events', (req, res) => brandsController.createTrialEvent(req, res));

// GET /api/brands/me/widget-products - Obtener productos del widget
router.get('/me/widget-products', async (req: any, res) => {
  try {
    const brandId = req.brand?.id;
    if (!brandId) return res.status(401).json({ error: 'No autenticado' });

    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('widget_product_ids')
      .eq('id', brandId)
      .single();

    const productIds = brand?.widget_product_ids || [];

    if (productIds.length === 0) {
      return res.json({ productIds: [], products: [] });
    }

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true);

    // Mantener el orden definido en widget_product_ids
    const orderedProducts = productIds
      .map(id => products?.find(p => p.id === id))
      .filter(Boolean);

    return res.json({ productIds, products: orderedProducts });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al obtener widget products' });
  }
});

// PUT /api/brands/me/widget-products - Actualizar productos del widget
router.put('/me/widget-products', async (req: any, res) => {
  try {
    const brandId = req.brand?.id;
    if (!brandId) return res.status(401).json({ error: 'No autenticado' });

    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds debe ser un array' });
    }

    const { error } = await supabaseAdmin
      .from('brands')
      .update({ widget_product_ids: productIds })
      .eq('id', brandId);

    if (error) throw error;

    return res.json({ success: true, productIds });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al actualizar widget products' });
  }
});

// POST /api/brands/request-plan-change - Solicitar cambio de plan (upgrade o downgrade)
// Fuera de checkActiveSubscription para que marcas suspendidas/vencidas también puedan solicitarlo
router.post('/request-plan-change', (req, res) =>
  brandsController.requestPlanChange(req, res)
);

// Verificar suscripción activa para todas las demás rutas
router.use(checkActiveSubscription);

// PATCH /api/brands/me - Actualizar configuración de la marca
router.patch('/me', (req, res) => brandsController.updateMe(req, res));

// GET /api/brands/notification-preferences - Obtener preferencias de notificaciones
router.get('/notification-preferences', (req, res) => 
  brandsController.getNotificationPreferences(req, res)
);

// PATCH /api/brands/notification-preferences - Actualizar preferencias de notificaciones
router.patch('/notification-preferences', (req, res) => 
  brandsController.updateNotificationPreferences(req, res)
);

// POST /api/brands/request-upgrade - Solicitar upgrade a Plan PRO
router.post('/request-upgrade', (req, res) =>
  brandsController.requestUpgrade(req, res)
);

// ==== REFERRALS ====
router.get('/me/referral', getReferralInfo);
router.post('/me/referral/validate', validateReferralCode);
router.post('/me/referral/claim', claimReferralBonus);

export default router;
