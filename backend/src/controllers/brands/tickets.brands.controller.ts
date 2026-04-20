import { Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { AuthRequest } from '../../middleware/auth';
import { sanitizeError } from '../../utils/sanitizeError';

/**
 * GET /api/brands/me/tickets
 * Lista tickets de la marca autenticada
 */
export const getMyTickets = async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.brand?.id;
    if (!brandId) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
    }

    const {
      status,
      priority,
      limit = '20',
      offset = '0'
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = supabaseAdmin
      .from('admin_support_tickets')
      .select(`
        id,
        subject,
        description,
        priority,
        status,
        category,
        created_at,
        updated_at,
        resolved_at,
        resolution_notes
      `, { count: 'exact' })
      .eq('brand_id', brandId);

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (error) {
      console.error('[BrandsTickets] getMyTickets:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener tickets' });
    }

    return res.json({
      data: data || [],
      total: count || 0,
      has_more: (count || 0) > offsetNum + limitNum
    });
  } catch (err: any) {
    console.error('[BrandsTickets] getMyTickets:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener tickets') });
  }
};

/**
 * POST /api/brands/me/tickets
 * Crear un nuevo ticket para la marca autenticada
 */
export const createMyTicket = async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.brand?.id;
    if (!brandId) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
    }

    const { subject, description, priority, category } = req.body;

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'El asunto es requerido'
      });
    }

    const { data: ticket, error: createError } = await supabaseAdmin
      .from('admin_support_tickets')
      .insert({
        brand_id: brandId,
        admin_id: null,
        subject: subject.trim(),
        description: (description || '').trim(),
        priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
        category: ['technical', 'billing', 'feature_request', 'bug', 'other'].includes(category) ? category : 'technical',
        status: 'open'
      })
      .select('id, subject, description, priority, status, category, created_at, updated_at')
      .single();

    if (createError || !ticket) {
      console.error('[BrandsTickets] createMyTicket:', createError);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al crear ticket' });
    }

    return res.status(201).json({ data: ticket });
  } catch (err: any) {
    console.error('[BrandsTickets] createMyTicket:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al crear ticket') });
  }
};

/**
 * GET /api/brands/me/tickets/stats
 * Estadísticas de tickets para la marca autenticada
 */
export const getMyTicketsStats = async (req: AuthRequest, res: Response) => {
  try {
    const brandId = req.brand?.id;
    if (!brandId) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
    }

    const { data, error } = await supabaseAdmin
      .from('admin_support_tickets')
      .select('status, priority, created_at')
      .eq('brand_id', brandId);

    if (error) {
      console.error('[BrandsTickets] getMyTicketsStats:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas' });
    }

    const openTickets = data.filter((t: any) => t.status === 'open');
    const inProgressTickets = data.filter((t: any) => t.status === 'in_progress');
    const resolvedTickets = data.filter((t: any) => t.status === 'resolved');
    const closedTickets = data.filter((t: any) => t.status === 'closed');

    return res.json({
      total_open: openTickets.length + inProgressTickets.length,
      in_progress: inProgressTickets.length,
      resolved: resolvedTickets.length + closedTickets.length
    });
  } catch (err: any) {
    console.error('[BrandsTickets] getMyTicketsStats:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener estadísticas') });
  }
};
