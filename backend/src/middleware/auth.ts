import { Request, Response, NextFunction } from 'express';

import { verifyToken } from '../utils/jwt';

import { AuthService } from '../services/auth.service';

import { isTokenBlacklisted } from '../config/redis';


const authService = new AuthService();



export interface AuthRequest extends Request {

  brand?: {

    id: string;

    email: string;

    slug: string;

    plan?: string;

  };

}



/** Extrae el token JWT de la cookie HTTP-Only preferentemente */

function extractToken(req: Request): string | null {

  // 1ï¸â£ Cookie HTTP-Only (para sesiones persistentes)

  if ((req as any).cookies?.token) return (req as any).cookies.token;



  // 2ï¸â£ Solo como fallback: Header Bearer

  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);



  return null;

}



export const authMiddleware = async (

  req: AuthRequest,

  res: Response,

  next: NextFunction

): Promise<Response | void> => {

  try {

    const token = extractToken(req);



if (!token) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token de autenticación requerido',
      });
    }



    // Verificar token no está en blacklist (revocado)
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(401).json({
        error: 'TOKEN_REVOKED',
        message: 'Token ha sido revocado',
      });
    }

    // Verificar token
    const payload = verifyToken(token);



if (!payload.brandId) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token inválido',
      });
    }


// Verificar que la marca existe
    console.log('[DEBUG authMiddleware] brandId del token:', payload.brandId);

    const brand = await authService.getBrandById(payload.brandId);
    console.log('[DEBUG authMiddleware] brand encontrado:', brand);

    if (!brand) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Marca no encontrada',
      });
    }


    // Agregar información de la marca al request

    req.brand = {

      id: brand.id,

      email: brand.email,

      slug: (brand as any).slug,

      plan: (brand as any).plan,

    };



    next();

} catch (error: any) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: error.message || 'Token inválido',
    });
  }

};



/**

 * optionalAuth

 * Middleware que intenta autenticar si hay un token (cookie o header), pero no falla si no lo hay.

 */

export const optionalAuth = async (

  req: AuthRequest,

  res: Response,

  next: NextFunction

): Promise<void> => {

  try {

    const token = extractToken(req);

    if (token) {

      const payload = verifyToken(token);

      if (payload.brandId) {

        const brand = await authService.getBrandById(payload.brandId);

        if (brand) {

          req.brand = {

            id: brand.id,

            email: brand.email,

            slug: (brand as any).slug,

            plan: (brand as any).plan,

          };

        }

      }

    }

    next();

  } catch {

    // Si falla el token en optionalAuth, simplemente seguimos sin req.brand

    next();

  }

};

