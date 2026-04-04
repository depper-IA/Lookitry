import { Request, Response } from 'express';
import { sanitizeError } from '../utils/sanitizeError';
import { PaymentSettingsService } from '../services/paymentSettings.service';

const service = new PaymentSettingsService();

/**
 * GET /api/admin/payment-settings
 * Obtener configuración completa (solo admin)
 */
export const getPaymentSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await service.getSettings();
    return res.json(settings);
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al obtener configuración') });
  }
};

/**
 * PUT /api/admin/payment-settings
 * Actualizar configuración (solo admin)
 */
export const updatePaymentSettings = async (req: Request, res: Response) => {
  try {
    const updated = await service.updateSettings(req.body);
    return res.json({ message: 'Configuración guardada', settings: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al obtener configuración') });
  }
};

/**
 * GET /api/payment-settings/public
 * Configuración pública para el frontend de marcas (sin claves privadas)
 */
export const getPublicPaymentSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await service.getPublicSettings();
    return res.json(settings);
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al obtener configuración') });
  }
};
