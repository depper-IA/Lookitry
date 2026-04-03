import { Router, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { registerPostPayment, getPendingRegistration } from '../controllers/auth-post-payment.controller';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// POST /api/auth/register
router.post('/register', authRateLimiter, asyncHandler((req, res) => authController.register(req, res)));

// POST /api/auth/register-post-payment — sin Turnstile, sin anti-abuso, sin rate limiter estricto
router.post('/register-post-payment', optionalAuth as any, asyncHandler(registerPostPayment));

// GET /api/auth/pending-registration/:ref
router.get('/pending-registration/:ref', asyncHandler(getPendingRegistration));

// POST /api/auth/login
router.post('/login', authRateLimiter, asyncHandler((req, res) => authController.login(req, res)));

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

// POST /api/auth/logout — limpia la cookie HTTP-Only del lado del servidor
router.post('/logout', (_req, res) => {
  const IS_PROD = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    path: '/',
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
  });
  res.json({ ok: true });
});

// POST /api/auth/refresh-session — renueva el JWT y la cookie
router.post('/refresh-session', authMiddleware, asyncHandler((req: any, res: Response) => {
  const { brand } = req;
  const { generateToken } = require('../utils/jwt');
  const newToken = generateToken({ brandId: brand.id, email: brand.email });
  
  const IS_PROD = process.env.NODE_ENV === 'production';
  const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
  const cookieOptions: any = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
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
