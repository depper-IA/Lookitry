/**
 * Rebecca Ratings Controller
 *
 * API endpoints para gestionar ratings de mensajes de Rebecca.
 * POST /api/chat/rating - Registrar un rating
 * GET /api/chat/ratings/stats - Obtener estadísticas
 * GET /api/chat/ratings/unreviewed - Obtener ratings sin revisar
 * PATCH /api/chat/ratings/:id/review - Marcar como revisado
 */

import { Router, Request, Response } from 'express';
import { rebeccaMessageRatingsService } from '../services/rebecca-message-ratings.service';
import { sanitizeError } from '../utils/errors';

const router = Router();

// POST /api/chat/rating - Registrar un rating de mensaje
router.post('/rating', async (req: Request, res: Response) => {
  try {
    const { session_id, message_index, message_content, rebecca_response, rating, rating_label, lead_intent, brand_id } = req.body;

    // Validation
    if (!session_id || message_index === undefined || !message_content || !rating || !rating_label) {
      return res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS', message: 'Faltan campos requeridos' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'INVALID_RATING', message: 'Rating debe ser 1-5' });
    }

    if (!['thumbs_up', 'thumbs_down'].includes(rating_label)) {
      return res.status(400).json({ error: 'INVALID_RATING_LABEL', message: 'rating_label debe ser thumbs_up o thumbs_down' });
    }

    const entry = await rebeccaMessageRatingsService.rateMessage({
      session_id,
      message_index,
      message_content,
      rebecca_response,
      rating,
      rating_label,
      lead_intent,
      brand_id,
    });

    if (!entry) {
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al guardar rating' });
    }

    return res.status(201).json({ success: true, id: entry.id });
  } catch (error: any) {
    console.error('[RatingsController] POST /rating error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error interno') });
  }
});

// GET /api/chat/ratings/stats - Obtener estadísticas de ratings
router.get('/ratings/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await rebeccaMessageRatingsService.getStats();
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('[RatingsController] GET /ratings/stats error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error interno') });
  }
});

// GET /api/chat/ratings/unreviewed - Obtener ratings sin revisar
router.get('/ratings/unreviewed', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const ratings = await rebeccaMessageRatingsService.getUnreviewed(limit);
    return res.status(200).json({ ratings });
  } catch (error: any) {
    console.error('[RatingsController] GET /ratings/unreviewed error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error interno') });
  }
});

// GET /api/chat/ratings/negative - Obtener conversaciones con ratings negativos
router.get('/ratings/negative', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const ratings = await rebeccaMessageRatingsService.getNegativeConversations(limit);
    return res.status(200).json({ ratings });
  } catch (error: any) {
    console.error('[RatingsController] GET /ratings/negative error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error interno') });
  }
});

// PATCH /api/chat/ratings/:id/review - Marcar rating como revisado
router.patch('/ratings/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'MISSING_ID', message: 'ID requerido' });
    }

    const success = await rebeccaMessageRatingsService.markReviewed(id, notes);

    if (!success) {
      return res.status(500).json({ error: 'UPDATE_FAILED', message: 'Error al marcar como revisado' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[RatingsController] PATCH /ratings/:id/review error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error interno') });
  }
});

// PATCH /api/chat/ratings/session/:sessionId/outcome - Actualizar outcome de sesión
router.patch('/ratings/session/:sessionId/outcome', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { outcome } = req.body;

    if (!sessionId || !outcome) {
      return res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS', message: 'sessionId y outcome requeridos' });
    }

    if (!['converted', 'abandoned'].includes(outcome)) {
      return res.status(400).json({ error: 'INVALID_OUTCOME', message: 'outcome debe ser converted o abandoned' });
    }

    const success = await rebeccaMessageRatingsService.updateOutcome(sessionId, outcome);

    if (!success) {
      return res.status(500).json({ error: 'UPDATE_FAILED', message: 'Error al actualizar outcome' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[RatingsController] PATCH /ratings/session/:sessionId/outcome error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error interno') });
  }
});

export default router;