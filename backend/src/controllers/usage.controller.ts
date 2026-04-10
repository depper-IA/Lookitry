import { Response } from 'express';
import { UsageService } from '../services/usage.service';
import { AuthRequest } from '../middleware/auth';
import { sanitizeError } from '../utils/sanitizeError';

const usageService = new UsageService();

export class UsageController {
  async getStats(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      const stats = await usageService.getUsageStats(req.brand.id);

      return res.status(200).json(stats);
    } catch (error: any) {
      console.error('Error en getStats:', error);

      if (error.message === 'Marca no encontrada') {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: sanitizeError(error, 'Marca no encontrada'),
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al obtener estadísticas de uso',
      });
    }
  }
}
