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

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET!, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch (error) {
    throw new Error('Access Token inválido o expirado');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET!) as JwtPayload;
  } catch (error) {
    throw new Error('Refresh Token inválido o expirado');
  }
};

// Backward compatibility (fallback to access token behavior but with old 7d expiration logic if needed,
// though here we just alias to generateAccessToken which now uses 15m.
// Note: If transition requires 7d for existing endpoints, we could keep generateToken with 7d.
// But for dual token, access token should be short. 
// We will just keep it mapped to generateAccessToken for simplicity, unless it breaks existing tests.
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
};
export const verifyToken = (token: string): JwtPayload => {

  try {

    return jwt.verify(token, JWT_SECRET!) as JwtPayload;

  } catch (error) {

    throw new Error('Token inválido o expirado');

  }

};

