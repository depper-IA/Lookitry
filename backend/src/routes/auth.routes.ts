import { Router, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { registerPostPayment, getPendingRegistration } from '../controllers/auth-post-payment.controller';
import { authRateLimiter, loginRateLimiter, publicRateLimiter, registerRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

const router = Router();
const authController = new AuthController();

// POST /api/auth/register — rate limit: 3 por hora por IP
router.post('/register', registerRateLimiter, asyncHandler((req, res) => authController.register(req, res)));

// POST /api/auth/register-post-payment — sin Turnstile, sin anti-abuso, sin rate limiter estricto
router.post('/register-post-payment', optionalAuth as any, asyncHandler(registerPostPayment));

// GET /api/auth/pending-registration/:ref
router.get('/pending-registration/:ref', asyncHandler(getPendingRegistration));

// POST /api/auth/login — rate limit más estricto: 5 intentos por 15 min
router.post('/login', loginRateLimiter, asyncHandler((req, res) => authController.login(req, res)));

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', asyncHandler((req, res) => authController.verifyEmail(req, res)));

// POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimiter, asyncHandler((req, res) => authController.forgotPassword(req, res)));

// POST /api/auth/reset-password
router.post('/reset-password', authRateLimiter, asyncHandler((req, res) => authController.resetPassword(req, res)));

// POST /api/auth/resend-verification
router.post('/resend-verification', authRateLimiter, asyncHandler((req, res) => authController.resendVerification(req, res)));

// POST /api/auth/change-password (requiere auth)
router.post('/change-password', authMiddleware, asyncHandler((req, res) => authController.changePassword(req as any, res)));

// GET /api/auth/check-email?email=xxx — verifica si el email ya existe
router.get('/check-email', asyncHandler((req, res) => authController.checkEmail(req, res)));

// GET /api/auth/slug-check?slug=xxx — verifica si el slug está disponible
router.get('/slug-check', publicRateLimiter, asyncHandler(async (req, res) => {
  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug requerido', available: false });
  }

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
    return res.json({ available: false, reason: 'El slug debe tener entre 3 y 50 caracteres' });
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalizedSlug)) {
    return res.json({ available: false, reason: 'Solo letras minúsculas, números y guiones' });
  }

  if (normalizedSlug.startsWith('-') || normalizedSlug.endsWith('-')) {
    return res.json({ available: false, reason: 'No puede empezar ni terminar con guión' });
  }

  if (RESERVED_SLUGS.includes(normalizedSlug)) {
    return res.json({ available: false, reason: 'Este URL no está disponible' });
  }

  const { data: existing } = await supabaseAdmin
    .from('brands')
    .select('id')
    .eq('slug', normalizedSlug)
    .maybeSingle();

  if (existing) {
    return res.json({ available: false, reason: 'Este URL ya está en uso' });
  }

  return res.json({ available: true });
}));

// POST /api/auth/google — Login/registro con Google
router.post('/google', authRateLimiter, asyncHandler((req, res) => authController.googleLogin(req, res)));

// POST /api/auth/google/onboarding — Completar setup después de registro con Google
// NO requiere authMiddleware porque puede ser llamado con ref (sin token) o con token
router.post('/google/onboarding', asyncHandler((req, res) => authController.completeGoogleOnboarding(req as any, res)));

// POST /api/auth/logout — limpia la cookie HTTP-Only del lado del servidor
router.post('/logout', (_req, res) => {
  const IS_PROD = process.env.NODE_ENV === 'production';
  const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
  
  const clearOptions: any = {
    path: '/',
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
  };
  
  if (COOKIE_DOMAIN && IS_PROD) {
    clearOptions.domain = COOKIE_DOMAIN;
  }
  
  res.clearCookie('token', clearOptions);
  res.json({ ok: true });
});

// POST /api/auth/refresh-session — renueva el JWT y la cookie
router.post('/refresh-session', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const { brand } = req;
  const { generateToken } = require('../utils/jwt');
  const newToken = generateToken({ brandId: brand.id, email: brand.email });
  
  const IS_PROD = process.env.NODE_ENV === 'production';
  const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
  const cookieOptions: any = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };
  if (COOKIE_DOMAIN && IS_PROD) {
    cookieOptions.domain = COOKIE_DOMAIN;
  }
  res.cookie('token', newToken, cookieOptions);
  res.json({ ok: true, message: 'Session refreshed' });
}));

export default router;
