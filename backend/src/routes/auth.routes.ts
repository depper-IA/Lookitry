import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const authController = new AuthController();

// POST /api/auth/register - Registrar nueva marca (con rate limiting)
router.post('/register', authRateLimiter, asyncHandler((req, res) => authController.register(req, res)));

// POST /api/auth/login - Iniciar sesión (con rate limiting)
router.post('/login', authRateLimiter, asyncHandler((req, res) => authController.login(req, res)));

export default router;
