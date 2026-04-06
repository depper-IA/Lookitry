// backend/src/config/security.config.ts
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

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
      connectSrc: ["'self'", "https://api.lookitry.com", "https://n8n.wilkiedevs.com", "http://localhost:3001"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"],
    },
  },
});

export const publicCorsConfig = cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está en la whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.warn(`[CORS] Origen no permitido en publicCorsConfig: ${origin}`);
    callback(new Error(`CORS: origen no permitido: ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-store-domain'],
  credentials: true
});

const corsOriginEnv = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [
  ...new Set([
    process.env.FRONTEND_URL || '',
    process.env.API_URL || '',
    'https://api.lookitry.com',
    'https://lookitry.com',
    'https://www.lookitry.com',
    'http://lookitry.com',
    'http://www.lookitry.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:3004',
    ...corsOriginEnv,
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
