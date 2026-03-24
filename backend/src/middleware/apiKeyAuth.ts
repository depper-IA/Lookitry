import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from './auth';

const authService = new AuthService();

/**
 * apiKeyAuth
 * Middleware para autenticar peticiones externas usando un API Key en el header x-api-key.
 */
export const apiKeyAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'API Key requerida en el header x-api-key',
      });
    }

    // Verificar que la marca existe con esa API Key
    const brand = await authService.getBrandByApiKey(apiKey);

    if (!brand) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'API Key inválida',
      });
    }

    // Agregar información de la marca al request (mismo formato que authMiddleware)
    req.brand = {
      id: brand.id,
      email: brand.email,
      slug: brand.slug,
      plan: brand.plan,
    };

    next();
  } catch (error: any) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Error al validar la API Key',
    });
  }
};
