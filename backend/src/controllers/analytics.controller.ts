import { Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { AuthRequest } from '../middleware/auth';

const analyticsService = new AnalyticsService();

/**
 * GET /api/analytics/overview
 * Obtener analytics completos de la marca autenticada
 */
export const getAnalyticsOverview = async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.brand?.id;

    if (!brandId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'No autenticado',
      });
    }

    const analytics = await analyticsService.getBrandAnalytics(brandId);

    return res.status(200).json(analytics);
  } catch (error: any) {
    console.error('Error in getAnalyticsOverview:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/analytics/generations
 * Obtener estadísticas de generaciones de la marca autenticada
 */
export const getGenerationsStats = async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.brand?.id;

    if (!brandId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'No autenticado',
      });
    }

    const stats = await analyticsService.getGenerationsByBrand(brandId);

    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error in getGenerationsStats:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener estadísticas de generaciones',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/analytics/products/most-used
 * Obtener productos más usados de la marca autenticada
 */
export const getMostUsedProducts = async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.brand?.id;

    if (!brandId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'No autenticado',
      });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const products = await analyticsService.getMostUsedProducts(brandId, limit);

    return res.status(200).json({
      products,
      count: products.length,
    });
  } catch (error: any) {
    console.error('Error in getMostUsedProducts:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al obtener productos más usados',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
