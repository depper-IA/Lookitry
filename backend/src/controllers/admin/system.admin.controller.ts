import { Request, Response } from 'express';
import { systemService } from '../../services/system.service';

/**
 * GET /api/admin/system/stats
 * Obtener estadísticas de RAM y uptime del servidor
 */
export const getSystemStats = async (_req: Request, res: Response) => {
  try {
    const stats = await systemService.getStats();
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('[system.admin.controller] getSystemStats error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas del sistema' });
  }
};
