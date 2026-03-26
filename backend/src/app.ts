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
import embedRoutes from './routes/embed.routes';
import imageRoutes from './routes/image.routes';
import { getPublicPaymentSettings } from './controllers/paymentSettings.controller';
import { getHealthStatus } from './controllers/health.controller';
import { getTrialStatus } from './controllers/trialCampaign.controller';
import { uploadImage, uploadSelfie, multerMemory } from './controllers/upload.controller';
import { redeemCoupon, validateCoupon } from './controllers/coupons.controller';
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

// ── Seguridad: Helmet ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://challenges.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://minio.wilkiedevs.com", "https://vkdooutklowctuudjnkl.supabase.co"],
      connectSrc: ["'self'", "https://api.lookitry.com", "https://n8n.wilkiedevs.com", "http://localhost:3001"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"],
    },
  },
}));

// ── Cookie Parser ────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── Parsers (DEBEN IR ANTES DE LAS RUTAS) ───────────────────────────────────
// Webhook de Wompi necesita raw body para verificar firma HMAC
app.use('/api/payments/wompi/webhook', express.raw({ type: 'application/json' }));

// Aumentar límite de tamaño de payload para imágenes base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rutas Públicas (CORS Permisivo) ──────────────────────────────────────────
const publicCors = cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: false
});

app.use('/api/pruebalo', publicCors, pruebaloRoutes);
app.use('/api/embed', publicCors, embedRoutes);

// ── CORS Global ──────────────────────────────────────────────────────────────
app.use(globalRateLimiter);

const corsOriginEnv = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [
  ...new Set([
    process.env.FRONTEND_URL || '',
    process.env.API_URL || '',
    'https://api.lookitry.com',
    'https://lookitry.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    ...corsOriginEnv,
  ]),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origen no permitido: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rutas protegidas
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/generations', generationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/admin/revenue', revenueRoutes);
app.use('/api/payments/wompi', wompiRoutes);
app.use('/api/payments/paypal', paypalRoutes);
app.use('/api/images', imageRoutes);

app.get('/api/payment-settings/public', getPublicPaymentSettings);
app.post('/api/upload', authMiddleware, (req, res) => uploadImage(req as any, res));
app.post('/api/upload/selfie', multerMemory.single('file'), (req, res) => uploadSelfie(req, res));
app.use('/api/trial', trialRoutes);
app.use('/api/admin/coupons', couponsRoutes);
app.post('/api/coupons/redeem', redeemCoupon);
app.post('/api/coupons/validate', validateCoupon);

// Sitemap
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

app.get('/health', getHealthStatus);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
