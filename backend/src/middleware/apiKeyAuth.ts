import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from './auth';
import { getExpectedStoreHost, getIncomingStoreHost, isAllowedStoreHost } from '../utils/storeDomain';

const authService = new AuthService();

/**
 * apiKeyAuth
 * Middleware para autenticar peticiones externas usando un API Key en el header x-api-key.
 * Si la marca ya registro un dominio de tienda, tambien valida que la peticion venga de ese host.
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

    const brand = await authService.getBrandByApiKey(apiKey);

    if (!brand) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'API Key invalida',
      });
    }

    if (!isAllowedStoreHost(brand, req)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Dominio no autorizado para esta API Key. Esperado: ${getExpectedStoreHost(brand)}. Recibido: ${getIncomingStoreHost(req)}`,
      });
    }

    req.brand = {
      id: brand.id,
      email: brand.email,
      slug: brand.slug,
      plan: brand.plan,
    };

    // Verificar que el plan permita uso del plugin (PRO o ENTERPRISE)
    const allowedPlans = ['PRO', 'ENTERPRISE'];
    if (!allowedPlans.includes(brand.plan)) {
      return res.status(403).json({
        error: 'PLAN_NOT_ALLOWED',
        message: `El plugin de WooCommerce requiere un plan PRO o ENTERPRISE. Tu plan actual es ${brand.plan}.`,
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Error al validar la API Key',
    });
  }
};
