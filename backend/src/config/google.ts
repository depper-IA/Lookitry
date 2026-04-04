/**
 * Configuración de Google OAuth
 * 
 * Usa Google Identity Services (GIS) para verificar tokens JWT
 * emitidos por el frontend tras el login con Google.
 */

export const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  tokenInfoUrl: 'https://oauth2.googleapis.com/tokeninfo',
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
} as const;
