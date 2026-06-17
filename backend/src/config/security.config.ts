// backend/src/config/security.config.ts

import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Request } from 'express';
import { redis } from './redis';
import { supabaseAdmin } from './supabase';
import { normalizeOrigin } from '../utils/storeDomain';



dotenv.config();



export const helmetConfig = helmet({

  crossOriginEmbedderPolicy: false,

  crossOriginResourcePolicy: { policy: "cross-origin" },

  contentSecurityPolicy: {

    directives: {

      defaultSrc: ["'self'"],

      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://challenges.cloudflare.com"],

      styleSrc: ["'self'", "'unsafe-inline'"],

      imgSrc: ["'self'", "data:", "blob:", "https://minio.wilkiedevs.com", "https://vkdooutklowctuudjnkl.supabase.co"],

      connectSrc: ["'self'", "https://api.lookitry.com", "https://n8n.wilkiedevs.com"],

      fontSrc: ["'self'", "https:", "data:"],

      objectSrc: ["'none'"],

      mediaSrc: ["'self'"],

      frameSrc: ["'self'", "https://challenges.cloudflare.com"],

    },

  },

});



export const publicCorsConfig = cors((async (req: any, callback: any) => {
  const origin = req.headers.origin;
  let isAllowed = false;
  try {
    isAllowed = await checkIsOriginAllowed(origin, req);
  } catch (err) {
    console.error('[CORS publicCorsConfig] Error en validación:', err);
  }

  const corsOptions = {
    origin: isAllowed ? origin : false, // Si es válido, reflejar el origen; si no, CORS bloquea
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-store-domain'],
    credentials: true
  };
  callback(null, corsOptions);
}) as any);

/**
 * Verifica dinámicamente si el origen de la petición está permitido para la marca (VULN-002).
 */
export async function checkIsOriginAllowed(origin: string | undefined, req: Request): Promise<boolean> {
  if (!origin) {
    // Permitir peticiones sin Origin (herramientas de terminal, mobile apps, curl, etc.)
    return true;
  }

  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('::1');
  if (isLocalhost) {
    return true;
  }

  // Siempre permitir los dominios principales de Lookitry
  const lookitryDomains = ['lookitry.com', 'www.lookitry.com', 'lookitry.vercel.app'];
  const isLookitryDomain = lookitryDomains.some(d => origin.includes(d));
  if (isLookitryDomain) {
    return true;
  }

  const normalizedIncoming = normalizeOrigin(origin);
  if (!normalizedIncoming) {
    return false;
  }

  try {
    // Intentar extraer brandSlug de la URL original
    const match = req.originalUrl.match(/^\/api\/pruebalo\/([^?/]+)/);
    const excludeSlugs = [
      'resolve-domain', 'allowed-origins', 'session-token', 
      'validate-api-key', 'synced-products', 'sync-woocommerce', 
      'unsync-woocommerce', 'plugin-telemetry', 'app-uninstalled', 
      'img-proxy'
    ];
    const brandSlug = match && !excludeSlugs.includes(match[1]) ? match[1] : undefined;

    let allowedOrigins: string[] = [];
    const redisAvailable = redis && redis.status === 'ready';

    if (brandSlug) {
      const cacheKey = `widget_origins:${brandSlug}`;

      if (redisAvailable) {
        try {
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));
          const redisPromise = redis.get(cacheKey);
          const cached = await Promise.race([redisPromise, timeoutPromise]);
          if (cached) {
            allowedOrigins = JSON.parse(cached);
          }
        } catch (e) {
          console.warn('[CORS Redis] Error leyendo cache:', e);
        }
      }

      if (allowedOrigins.length === 0) {
        const { data, error } = await supabaseAdmin
          .from('brands')
          .select('social_links')
          .eq('slug', brandSlug)
          .single();

        if (!error && data?.social_links) {
          const socialLinks = data.social_links as any;
          if (Array.isArray(socialLinks?.allowed_origins)) {
            allowedOrigins = socialLinks.allowed_origins;
          }
        }

        if (redisAvailable && allowedOrigins.length > 0) {
          redis.setex(cacheKey, 3600, JSON.stringify(allowedOrigins)).catch(() => {});
        }
      }
    } else {
      // Para rutas generales, buscamos en cache global de origenes
      const cacheKey = 'widget_origins:global';

      if (redisAvailable) {
        try {
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));
          const redisPromise = redis.get(cacheKey);
          const cached = await Promise.race([redisPromise, timeoutPromise]);
          if (cached) {
            allowedOrigins = JSON.parse(cached);
          }
        } catch (e) {
          console.warn('[CORS Redis Global] Error leyendo cache:', e);
        }
      }

      if (allowedOrigins.length === 0) {
        const { data, error } = await supabaseAdmin
          .from('brands')
          .select('social_links');

        if (!error && data) {
          allowedOrigins = data.flatMap((d: any) => {
            if (d.social_links && Array.isArray(d.social_links.allowed_origins)) {
              return d.social_links.allowed_origins;
            }
            return [];
          }).filter(Boolean);
        }

        if (redisAvailable && allowedOrigins.length > 0) {
          redis.setex(cacheKey, 3600, JSON.stringify(allowedOrigins)).catch(() => {});
        }
      }
    }

    return allowedOrigins.some(allowed => normalizeOrigin(allowed) === normalizedIncoming);
  } catch (error) {
    console.error('[CORS Validation] Error:', error);
    return false;
  }
}



const corsOriginEnv = process.env.CORS_ORIGIN

  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)

  : [];



// Agregar localhost para desarrollo local

const isDev = process.env.NODE_ENV !== 'production';

const devOrigins = isDev

  ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:3000', 'http://[::1]:3000']

  : [];



const allowedOrigins = [

  ...new Set([

    process.env.FRONTEND_URL || '',

    process.env.API_URL || '',

    'https://api.lookitry.com',

    'https://lookitry.com',

    'https://www.lookitry.com',

    ...corsOriginEnv,

    ...devOrigins,

  ]),

].filter(Boolean);



export const globalCorsConfig = cors({

  origin: (origin, callback) => {

    // Permitir requests sin origin (como mobile apps o curl)

    if (!origin) return callback(null, true);

    

    // Verificar si el origen está en la whitelist

    if (allowedOrigins.includes(origin)) {

      return callback(null, true);

    }

    

    console.warn(`[CORS] Intento de acceso desde origen no permitido: ${origin}`);

    callback(new Error(`CORS: origen no permitido: ${origin}`));

  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [

    'Content-Type', 

    'Authorization', 

    'X-Requested-With', 

    'Accept', 

    'Origin', 

    'X-Api-Key', 

    'X-Store-Domain', 

    'Cache-Control', 

    'Pragma'

  ],

  exposedHeaders: ['Set-Cookie'], // Importante para depuración de cookies cross-origin

});

