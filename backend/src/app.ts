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
import paypalRoutes from './routes/paypal.routes';
import trialRoutes from './routes/trial.routes';
import couponsRoutes from './routes/coupons.routes';
import { getPublicPaymentSettings } from './controllers/paymentSettings.controller';
import { getHealthStatus } from './controllers/health.controller';
import { getTrialStatus } from './controllers/trialCampaign.controller';
import { uploadImage, uploadSelfie, multerMemory } from './controllers/upload.controller';
import { listCoupons, createCoupon, updateCoupon, deleteCoupon, redeemCoupon, validateCoupon } from './controllers/coupons.controller';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimiter';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Necesario para que express-rate-limit funcione correctamente detrás de Traefik/Nginx
app.set('trust proxy', 1);

// ── Seguridad: Helmet (reemplaza los headers manuales y añade muchos más) ──────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Permite que el embed iframe de marcas funcione
  contentSecurityPolicy: false,     // CSP se configura opcionalmente en el gateway/nginx
}));

// ── Cookie Parser (necesario para leer cookies HTTP-Only del JWT) ──────────────
app.use(cookieParser());

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
    process.env.FRONTEND_URL || 'https://pruebalo.wilkiedevs.com',
    'https://pruebalo.wilkiedevs.com',
    'https://api.pruebalo.wilkiedevs.com',
    'https://pruebalo.wilkiedevs.com',
    // Desarrollo local
    'http://localhost:3000',
    'http://localhost:3001',
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
app.use('/api/payments/paypal', paypalRoutes);

// Configuración pública de medios de pago (sin auth, para el frontend de marcas)
app.get('/api/payment-settings/public', getPublicPaymentSettings);

// Ruta de upload de imágenes (alias directo, requiere auth de marca)
app.post('/api/upload', authMiddleware, (req, res) => uploadImage(req as any, res));

// Ruta de upload de selfies para n8n — acepta JSON base64 o multipart/form-data
app.post('/api/upload/selfie', multerMemory.single('file'), (req, res) => uploadSelfie(req, res));

// Estado público del trial (sin auth — el frontend lo consulta para mostrar/ocultar el botón)
app.get('/api/trial/status', getTrialStatus);
app.use('/api/trial', trialRoutes);
app.use('/api/admin/coupons', couponsRoutes);

// Redimir cupón — ruta pública (llamada desde el frontend de marca al confirmar pago)
app.post('/api/coupons/redeem', redeemCoupon);

// Validar cupón — ruta pública (llamada desde el checkout)
app.post('/api/coupons/validate', validateCoupon);

// Sitemap — slugs de mini-landings activas (sin auth, para Next.js sitemap.ts)
app.get('/api/sitemap/landings', async (_req, res) => {
  try {
    const { supabase } = await import('./config/supabase');
    const { data, error } = await supabase
      .from('brands')
      .select('slug')
      .eq('has_landing_page', true);
    if (error) return res.status(500).json({ slugs: [] });
    return res.json({ slugs: (data ?? []).map((b: any) => b.slug) });
  } catch {
    return res.status(500).json({ slugs: [] });
  }
});

// Ruta de health check
app.get('/health', getHealthStatus);

// Manejo de rutas no encontradas (404) - debe ir antes del errorHandler
app.use(notFoundHandler);

// Manejo de errores global - debe ser el último middleware
app.use(errorHandler);

export default app;
