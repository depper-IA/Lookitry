import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import brandsRoutes from './routes/brands.routes';
import usageRoutes from './routes/usage.routes';
import productsRoutes from './routes/products.routes';
import pruebaloRoutes from './routes/pruebalo.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import subscriptionRoutes from './routes/subscription.routes';
import generationsRoutes from './routes/generations.routes';
import cleanupRoutes from './routes/cleanup.routes';
import revenueRoutes from './routes/revenue.routes';
import wompiRoutes from './routes/wompi.routes';
import trialRoutes from './routes/trial.routes';
import { getPublicPaymentSettings } from './controllers/paymentSettings.controller';
import { getHealthStatus } from './controllers/health.controller';
import { getTrialStatus } from './controllers/trialCampaign.controller';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimiter';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Necesario para que express-rate-limit funcione correctamente detrás de Traefik/Nginx
app.set('trust proxy', 1);

// Security headers básicos (sin helmet)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
});

// Rate limiting global (debe ir antes de otros middlewares)
app.use(globalRateLimiter);

// CORS — solo orígenes permitidos
// CORS_ORIGIN puede ser un dominio único o una lista separada por comas
// Ejemplo producción: CORS_ORIGIN=https://pruebalo.wilkiedevs.com,https://www.pruebalo.wilkiedevs.com
const corsOriginEnv = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [
  ...new Set([
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://pruebalo.wilkiedevs.com',
    ...corsOriginEnv,
  ]),
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, curl, Postman en dev)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origen no permitido: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Webhook de Wompi necesita raw body para verificar firma HMAC
app.use('/api/payments/wompi/webhook', express.raw({ type: 'application/json' }));

// Aumentar límite de tamaño de payload para imágenes base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/generations', generationsRoutes);
app.use('/api/pruebalo', pruebaloRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/admin/revenue', revenueRoutes);
app.use('/api/payments/wompi', wompiRoutes);

// Configuración pública de medios de pago (sin auth, para el frontend de marcas)
app.get('/api/payment-settings/public', getPublicPaymentSettings);

// Estado público del trial (sin auth — el frontend lo consulta para mostrar/ocultar el botón)
app.get('/api/trial/status', getTrialStatus);
app.use('/api/trial', trialRoutes);

// Ruta de health check
app.get('/health', getHealthStatus);

// Manejo de rutas no encontradas (404) - debe ir antes del errorHandler
app.use(notFoundHandler);

// Manejo de errores global - debe ser el último middleware
app.use(errorHandler);

export default app;
