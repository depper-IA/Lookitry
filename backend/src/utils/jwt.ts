import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno. Configúralo antes de iniciar el servidor.');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Access token is short-lived
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

if (!process.env.JWT_REFRESH_SECRET) {
  console.warn('[jwt] JWT_REFRESH_SECRET not set — falling back to JWT_SECRET. Set a separate secret in production.');
}
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Refresh token is long-lived

// C-4: cada token lleva un claim `type` para que un refresh token nunca pueda
// usarse donde se espera un access token, independientemente del secret.
type TokenType = 'access' | 'refresh';

/**
 * Verifica firma y, si el token trae claim `type`, que coincida con el esperado.
 * Los tokens viejos sin claim `type` se aceptan (retrocompatibilidad durante la transición).
 */
function verifyWithType(token: string, secret: string, expected: TokenType): JwtPayload {
  const decoded = jwt.verify(token, secret) as JwtPayload;
  if (decoded.type && decoded.type !== expected) {
    throw new Error(`Token type inválido: se esperaba ${expected}`);
  }
  return decoded;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_REFRESH_SECRET!, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return verifyWithType(token, JWT_SECRET!, 'access');
  } catch (error) {
    throw new Error('Access Token inválido o expirado');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return verifyWithType(token, JWT_REFRESH_SECRET!, 'refresh');
  } catch (error) {
    throw new Error('Refresh Token inválido o expirado');
  }
};

// Backward compatibility: alias histórico usado por admin/google/trial.
// Emite un access token (con claim type=access) usando el secret de access.
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
};

export const generateAdminToken = (payload: JwtPayload): string => {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET!, {
    expiresIn: '7d', // Admin tokens always have a consistent 7-day TTL
  });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return verifyWithType(token, JWT_SECRET!, 'access');
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};
