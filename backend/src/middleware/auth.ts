import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export interface AuthRequest extends Request {
  brand?: {
    id: string;
    email: string;
    slug: string;
    plan?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token de autenticación requerido',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const payload = verifyToken(token);

    if (!payload.brandId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token inválido',
      });
    }

    // Verificar que la marca existe
    const brand = await authService.getBrandById(payload.brandId);

    if (!brand) {
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
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: error.message || 'Token inválido',
    });
  }
};

/**
 * optionalAuth
 * Middleware que intenta autenticar si hay un token, pero no falla si no lo hay.
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
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
