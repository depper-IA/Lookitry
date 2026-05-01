import dotenv from 'dotenv';

// Cargar variables de entorno IMMEDIATELY before other imports

dotenv.config();



import express from 'express';

import cookieParser from 'cookie-parser';

import { requestLogger } from './middleware/requestLogger';



// Configuración de Seguridad

import { helmetConfig, publicCorsConfig, globalCorsConfig } from './config/security.config';



// Importación de rutas

import promotionsRoutes from './routes/promotions.routes';

import pricingConfigRoutes from './routes/pricingConfig.routes';

import pruebaloRoutes from './routes/pruebalo.routes';

import embedRoutes from './routes/embed.routes';

import reviewsPublicRoutes from './routes/reviewsPublic.routes';

import leadsPublicRoutes from './routes/leadsPublic.routes';

import apiRouter from './routes/index';

import queueRoutes from './routes/queue.routes';
import vertexRoutes from './routes/vertex.routes';



// Importación de controladores y middlewares

import { syncProductWebhook } from './controllers/enterprise.controller';

import { getPublicPaymentSettings } from './controllers/paymentSettings.controller';

import { getHealthStatus } from './controllers/health.controller';

import { uploadImage, uploadSelfie, cleanupTempSelfies, multerMemory } from './controllers/upload.controller';

import { redeemCoupon, validateCoupon } from './controllers/coupons.controller';

import { authMiddleware } from './middleware/auth';

import { authRateLimiter } from './middleware/rateLimiter';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import { globalRateLimiter } from './middleware/rateLimiter';



// Importación de servicios

import { systemService } from './services/system.service';

import { addonCreditsService } from './services/addonCredits.service';

import { startSchedulers } from './scheduler';



// n8n Description Webhook

// dotenv.config() ya fue llamado al inicio



addonCreditsService.ensureDefaultPackages().catch((err) => {

  console.error('[AddonCredits] Error inicializando paquetes por defecto:', err);

});



// Iniciar schedulers automáticos (suscripciones, alertas de uso, limpieza)

startSchedulers();



const app = express();



// Iniciar monitoreo de RAM cada 10 minutos

setInterval(() => {

  systemService.checkRamThreshold().catch(err => console.error('[System] Error in RAM check interval:', err));

}, 10 * 60 * 1000);



app.set('trust proxy', 1);



app.use(requestLogger);



// ââ Seguridad: Helmet ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

app.use(helmetConfig);



app.use(cookieParser());



// ââ Parsers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

app.use('/api/payments/wompi/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));



const publicCors = publicCorsConfig;



// ââ Rutas Públicas â registradas ANTES del CORS restrictivo global ââââââââââââ

// IMPORTANTE: estas rutas responden con CORS permisivo (origin: *) porque son

// consumidas desde dominios externos (plugin WooCommerce, iframes, widgets).

// La seguridad de acceso se valida internamente mediante API Key + dominio.

app.use('/api/pruebalo', publicCors, pruebaloRoutes);

app.use('/api/embed', publicCors, embedRoutes);

app.post('/api/enterprise/sync-product', publicCors, syncProductWebhook);

app.use('/api/reviews/public', publicCors, reviewsPublicRoutes);

app.use('/api/leads/public', publicCors, leadsPublicRoutes);

app.use('/api/queue', queueRoutes);



app.use(globalCorsConfig);



app.use(globalRateLimiter);



// ââ Rutas ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ



// Rutas Estándar

app.use('/api', apiRouter);



// Endpoints Sueltos

app.get('/api/payment-settings/public', publicCors, getPublicPaymentSettings);

app.use('/api/promotions', publicCors, promotionsRoutes);

app.use('/api/pricing-config', publicCors, pricingConfigRoutes);

app.post('/api/upload', authMiddleware, (req, res) => uploadImage(req as any, res));

app.post('/api/upload/selfie', multerMemory.single('file'), (req, res) => uploadSelfie(req, res));

app.delete('/api/upload/cleanup-temp', (req, res) => cleanupTempSelfies(req, res));

app.post('/api/coupons/redeem', authRateLimiter, authMiddleware, redeemCoupon);

app.post('/api/coupons/validate', validateCoupon);

// Vertex AI Routes
app.use('/api/vertex', vertexRoutes);

// Sitemap Dinámico

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



// Error Handling

app.use(notFoundHandler);

app.use(errorHandler);



export default app;

