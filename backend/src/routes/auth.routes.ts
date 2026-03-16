import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const authController = new AuthController();

// POST /api/auth/register
router.post('/register', authRateLimiter, asyncHandler((req, res) => authController.register(req, res)));

// POST /api/auth/login
router.post('/login', authRateLimiter, asyncHandler((req, res) => authController.login(req, res)));

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', asyncHandler((req, res) => authController.verifyEmail(req, res)));

export default router;
