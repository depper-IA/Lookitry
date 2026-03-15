import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

// POST /api/auth/register - Registrar nueva marca (con rate limiting)
router.post('/register', authRateLimiter, (req, res) => authController.register(req, res));

// POST /api/auth/login - Iniciar sesión (con rate limiting)
router.post('/login', authRateLimiter, (req, res) => authController.login(req, res));

export default router;
