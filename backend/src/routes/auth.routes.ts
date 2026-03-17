import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// POST /api/auth/register
router.post('/register', authRateLimiter, asyncHandler((req, res) => authController.register(req, res)));

// POST /api/auth/login
router.post('/login', authRateLimiter, asyncHandler((req, res) => authController.login(req, res)));

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', asyncHandler((req, res) => authController.verifyEmail(req, res)));

// POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimiter, asyncHandler((req, res) => authController.forgotPassword(req, res)));

// POST /api/auth/reset-password
router.post('/reset-password', authRateLimiter, asyncHandler((req, res) => authController.resetPassword(req, res)));

// POST /api/auth/change-password (requiere auth)
router.post('/change-password', authMiddleware, asyncHandler((req, res) => authController.changePassword(req as any, res)));

export default router;
