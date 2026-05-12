import { Request, Response } from 'express';
import { FeedbackService } from '../../services/feedback.service';
import { sanitizeError } from '../../utils/sanitizeError';

const feedbackService = new FeedbackService();

/**
 * GET /api/admin/feedback
 */
export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const { error_type, brand_id, resolved, limit } = req.query;
    const feedbacks = await feedbackService.getFeedbacks({
      error_type: error_type as any,
      brand_id: brand_id as string | undefined,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string) : 100,
    });
    return res.status(200).json({ feedbacks });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al obtener feedbacks') });
  }
};

/**
 * GET /api/admin/feedback/stats
 */
export const getFeedbackStats = async (_req: Request, res: Response) => {
  try {
    const stats = await feedbackService.getErrorStats();
    return res.status(200).json({ stats });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al obtener estadísticas') });
  }
};

/**
 * PATCH /api/admin/feedback/:id/resolve
 */
export const resolveFeedback = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await feedbackService.resolveFeedback(id, req.admin?.email ?? 'admin');
    return res.status(200).json({ message: 'Feedback marcado como resuelto' });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al resolver feedback') });
  }
};

/**
 * DELETE /api/admin/feedback/:id
 */
export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await feedbackService.deleteFeedback(id);
    return res.status(200).json({ message: 'Feedback eliminado del RAG' });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al eliminar feedback') });
  }
};

/**
 * GET /api/admin/feedback/count-unresolved
 */
export const getUnresolvedFeedbackCount = async (_req: Request, res: Response) => {
  try {
    const feedbacks = await feedbackService.getUnresolvedFeedbacks(1000);
    return res.status(200).json({ count: feedbacks.length });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 0 });
  }
};

/**
 * GET /api/admin/generations/:id/feedback
 * Obtiene todos los feedbacks para una generación específica
 */
export const getGenerationFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const feedbacks = await feedbackService.getFeedbacksByGenerationId(id);
    return res.status(200).json({ feedbacks });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al obtener feedbacks de la generación') });
  }
};

/**
 * POST /api/admin/feedback/:id/resolve
 * Marca un feedback como resuelto (versón admin con body opcional)
 */
export const resolveFeedbackAdmin = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body || {};
    const resolvedBy = req.admin?.email ?? 'admin';
    await feedbackService.resolveFeedback(id, resolvedBy);
    return res.status(200).json({ success: true, resolved_by: resolvedBy, comment: comment || null });
  } catch (error: any) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al resolver feedback') });
  }
};
