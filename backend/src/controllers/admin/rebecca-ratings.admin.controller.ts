/**
 * Rebecca Ratings Admin Controller
 *
 * Admin endpoints for managing Rebecca message ratings and feedback.
 */

import { Request, Response } from 'express';
import { rebeccaMessageRatingsService } from '../../services/rebecca-message-ratings.service';
import { sanitizeError } from '../../utils/sanitizeError';

export const getRatingsStats = async (req: Request, res: Response) => {
  try {
    const stats = await rebeccaMessageRatingsService.getStats();
    return res.json(stats);
  } catch (err: any) {
    console.error('[RebeccaRatingsAdmin] getRatingsStats:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener estadísticas') });
  }
};

export const getUnreviewedRatings = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const ratings = await rebeccaMessageRatingsService.getUnreviewed(limit);
    return res.json({ ratings });
  } catch (err: any) {
    console.error('[RebeccaRatingsAdmin] getUnreviewedRatings:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener ratings') });
  }
};

export const getNegativeRatings = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const ratings = await rebeccaMessageRatingsService.getNegativeConversations(limit);
    return res.json({ ratings });
  } catch (err: any) {
    console.error('[RebeccaRatingsAdmin] getNegativeRatings:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener ratings negativos') });
  }
};

export const markRatingReviewed = async (req: Request, res: Response) => {
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

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[RebeccaRatingsAdmin] markRatingReviewed:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al actualizar rating') });
  }
};

export const updateSessionOutcome = async (req: Request, res: Response) => {
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

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[RebeccaRatingsAdmin] updateSessionOutcome:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al actualizar outcome') });
  }
};