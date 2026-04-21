import { Request, Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { sanitizeError } from '../../utils/sanitizeError';
import { auditService } from '../../services/audit.service';

/**
 * GET /api/admin/tickets
 * Lista tickets con filtros
 */
export const getTickets = async (req: any, res: Response) => {
  try {
    const {
      status,
      priority,
      brand_id,
      assigned_to,
      limit = '50',
      offset = '0'
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    let query = supabaseAdmin
      .from('admin_support_tickets')
      .select(`
        *,
        brand:brands(id, name, slug),
        creator:admins!admin_support_tickets_admin_id_fkey(id, name, email),
        assignee:admins!admin_support_tickets_assigned_to_fkey(id, name, email)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (brand_id) {
      query = query.eq('brand_id', brand_id);
    }
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (error) {
      console.error('[TicketsAdmin] getTickets:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener tickets' });
    }

    // Transformar datos para mejor estructura de respuesta
    const tickets = (data || []).map(ticket => ({
      ...ticket,
      brand: ticket.brand,
      creator: ticket.creator,
      assignee: ticket.assignee
    }));

    return res.json({
      tickets,
      total: count || 0,
      has_more: (count || 0) > offsetNum + limitNum
    });
  } catch (err: any) {
    console.error('[TicketsAdmin] getTickets:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener tickets') });
  }
};

/**
 * GET /api/admin/tickets/:id
 * Detalle de ticket con info de brand
 */
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('admin_support_tickets')
      .select(`
        *,
        brand:brands(id, name, slug, email, plan),
        creator:admins!admin_support_tickets_admin_id_fkey(id, name, email),
        assignee:admins!admin_support_tickets_assigned_to_fkey(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket no encontrado' });
    }

    return res.json({ data });
  } catch (err: any) {
    console.error('[TicketsAdmin] getTicketById:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener ticket') });
  }
};

/**
 * POST /api/admin/tickets
 * Crear ticket
 */
export const createTicket = async (req: any, res: Response) => {
  try {
    const { brand_id, subject, description, priority, category } = req.body;
    const admin = req.admin;

    // Validaciones
    if (!subject || !description) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Subject y description son requeridos'
      });
    }

    // Si se proporciona brand_id, verificar que existe
    if (brand_id) {
      const { data: brand, error: brandError } = await supabaseAdmin
        .from('brands')
        .select('id')
        .eq('id', brand_id)
        .single();

      if (brandError || !brand) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Brand no encontrada'
        });
      }
    }

    const { data: ticket, error: createError } = await supabaseAdmin
      .from('admin_support_tickets')
      .insert({
        brand_id: brand_id || null,
        admin_id: admin?.id || null,
        subject,
        description,
        priority: priority || 'medium',
        category: category || null,
        status: 'open'
      })
      .select()
      .single();

    if (createError || !ticket) {
      console.error('[TicketsAdmin] createTicket:', createError);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al crear ticket' });
    }

    // Registrar en audit log
    await auditService.log({
      admin_id: admin?.id || 'system',
      admin_email: admin?.email || 'system',
      action: 'ticket.create' as any,
      target_brand_id: brand_id || undefined,
      details: {
        ticket_id: ticket.id,
        subject,
        priority
      }
    });

    return res.status(201).json({ data: ticket });
  } catch (err: any) {
    console.error('[TicketsAdmin] createTicket:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al crear ticket') });
  }
};

/**
 * PATCH /api/admin/tickets/:id
 * Actualizar ticket
 */
export const updateTicket = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to, resolution_notes } = req.body;
    const admin = req.admin;

    // Obtener ticket actual
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('admin_support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket no encontrado' });
    }

    // Validaciones de transicion de estado
    if (status === 'resolved' && current.status !== 'resolved' && current.status !== 'in_progress') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Un ticket debe estar en in_progress antes de marcarse como resolved'
      });
    }

    // Preparar update
    const updates: any = {};
    if (status) {
      updates.status = status;
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
    }
    if (priority) {
      updates.priority = priority;
    }
    if (assigned_to !== undefined) {
      updates.assigned_to = assigned_to || null;
    }
    if (resolution_notes !== undefined) {
      updates.resolution_notes = resolution_notes;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('admin_support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('[TicketsAdmin] updateTicket:', updateError);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar ticket' });
    }

    // Registrar en audit log
    await auditService.log({
      admin_id: admin?.id || 'system',
      admin_email: admin?.email || 'system',
      action: 'ticket.update' as any,
      target_brand_id: current.brand_id || undefined,
      details: {
        ticket_id: id,
        changes: updates
      }
    });

    return res.json({ data: updated });
  } catch (err: any) {
    console.error('[TicketsAdmin] updateTicket:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al actualizar ticket') });
  }
};

/**
 * DELETE /api/admin/tickets/:id
 * Eliminar ticket (solo si esta open)
 */
export const deleteTicket = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const admin = req.admin;

    // Obtener ticket actual
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from('admin_support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !ticket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket no encontrado' });
    }

    // Solo permitir eliminar si esta open
    if (ticket.status !== 'open') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Solo se pueden eliminar tickets con estado open'
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('admin_support_tickets')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[TicketsAdmin] deleteTicket:', deleteError);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al eliminar ticket' });
    }

    // Registrar en audit log
    await auditService.log({
      admin_id: admin?.id || 'system',
      admin_email: admin?.email || 'system',
      action: 'ticket.delete' as any,
      target_brand_id: ticket.brand_id || undefined,
      details: {
        ticket_id: id,
        subject: ticket.subject
      }
    });

    return res.json({ message: 'Ticket eliminado' });
  } catch (err: any) {
    console.error('[TicketsAdmin] deleteTicket:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al eliminar ticket') });
  }
};

/**
 * POST /api/admin/tickets/bulk-action
 * Bulk actions: change_status o assign
 */
export const bulkActionTickets = async (req: any, res: Response) => {
  try {
    const { action, ticket_ids, new_status, assigned_to } = req.body;
    const admin = req.admin;

    if (!action || !ticket_ids || !Array.isArray(ticket_ids) || ticket_ids.length === 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'action y ticket_ids (array) son requeridos'
      });
    }

    if (action === 'change_status' && !new_status) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'new_status es requerido para accion change_status'
      });
    }

    if (action === 'assign' && !assigned_to) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'assigned_to es requerido para accion assign'
      });
    }

    if (!['change_status', 'assign'].includes(action)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'action debe ser change_status o assign'
      });
    }

    // Validar que todos los tickets existen
    const { data: existingTickets, error: fetchError } = await supabaseAdmin
      .from('admin_support_tickets')
      .select('id, status, brand_id')
      .in('id', ticket_ids);

    if (fetchError) {
      console.error('[TicketsAdmin] bulkActionTickets - fetch:', fetchError);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al verificar tickets' });
    }

    if (!existingTickets || existingTickets.length !== ticket_ids.length) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Algunos tickets no fueron encontrados'
      });
    }

    // Preparar update
    const updates: any = {};
    if (action === 'change_status') {
      updates.status = new_status;
      if (new_status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
    } else if (action === 'assign') {
      updates.assigned_to = assigned_to || null;
    }

    // Ejecutar bulk update
    const { error: updateError } = await supabaseAdmin
      .from('admin_support_tickets')
      .update(updates)
      .in('id', ticket_ids);

    if (updateError) {
      console.error('[TicketsAdmin] bulkActionTickets - update:', updateError);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al actualizar tickets' });
    }

    // Obtener brands afectados para audit
    const brandIds = [...new Set(existingTickets.map(t => t.brand_id).filter(Boolean))];

    // Registrar en audit log
    await auditService.log({
      admin_id: admin?.id || 'system',
      admin_email: admin?.email || 'system',
      action: 'ticket.bulk_action' as any,
      target_brand_id: brandIds.length === 1 ? brandIds[0] : undefined,
      details: {
        action,
        ticket_ids,
        new_status,
        assigned_to,
        updated_count: ticket_ids.length
      }
    });

    return res.json({ updated_count: ticket_ids.length });
  } catch (err: any) {
    console.error('[TicketsAdmin] bulkActionTickets:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error en bulk action') });
  }
};

/**
 * GET /api/admin/tickets/stats
 * Estadisticas de tickets
 */
export const getTicketsStats = async (_req: any, res: Response) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { data: allTickets, error } = await supabaseAdmin
      .from('admin_support_tickets')
      .select('status, priority, created_at, resolved_at');

    if (error) {
      console.error('[TicketsAdmin] getTicketsStats:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener estadisticas' });
    }

    const openTickets = allTickets.filter(t => t.status === 'open');
    const inProgressTickets = allTickets.filter(t => t.status === 'in_progress');
    const resolvedTickets = allTickets.filter(t => t.status === 'resolved');
    const closedTickets = allTickets.filter(t => t.status === 'closed');

    const highPriorityOpen = openTickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length;

    const resolvedThisWeek = resolvedTickets.filter(t => {
      if (!t.resolved_at) return false;
      return new Date(t.resolved_at) >= startOfWeek;
    }).length;

    const byStatus = {
      open: openTickets.length,
      in_progress: inProgressTickets.length,
      resolved: resolvedTickets.length,
      closed: closedTickets.length
    };

    const byPriority = {
      low: allTickets.filter(t => t.priority === 'low').length,
      medium: allTickets.filter(t => t.priority === 'medium').length,
      high: allTickets.filter(t => t.priority === 'high').length,
      urgent: allTickets.filter(t => t.priority === 'urgent').length
    };

    return res.json({
      total_open: openTickets.length + inProgressTickets.length,
      high_priority_open: highPriorityOpen,
      resolved_this_week: resolvedThisWeek,
      by_status: byStatus,
      by_priority: byPriority
    });
  } catch (err: any) {
    console.error('[TicketsAdmin] getTicketsStats:', err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: sanitizeError(err, "Error al obtener estadisticas") });
  }
};

/**
 * GET /api/admin/tickets/:id/messages
 * Obtener mensajes de un ticket
 */
export const getTicketMessages = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const { data: messages, error } = await supabaseAdmin
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[TicketsAdmin] getTicketMessages:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener mensajes' });
    }

    return res.json({ messages: messages || [] });
  } catch (err: any) {
    console.error('[TicketsAdmin] getTicketMessages:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al obtener mensajes') });
  }
};

/**
 * POST /api/admin/tickets/:id/messages
 * Agregar mensaje a un ticket
 */
export const addTicketMessage = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const admin = req.admin;

    if (!content || !content.trim()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Content es requerido'
      });
    }

    // Verificar que el ticket existe
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('admin_support_tickets')
      .select('id, status, brand_id')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket no encontrado' });
    }

    const { data: message, error: messageError } = await supabaseAdmin
      .from('ticket_messages')
      .insert({
        ticket_id: id,
        sender_type: 'admin',
        sender_id: admin?.id || null,
        content: content.trim()
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error('[TicketsAdmin] addTicketMessage:', messageError);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al agregar mensaje' });
    }

    // Si el ticket estaba en 'open', pasarlo a 'in_progress'
    if (ticket.status === 'open') {
      await supabaseAdmin
        .from('admin_support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', id);
    }

    // Registrar en audit log
    await auditService.log({
      admin_id: admin?.id || 'system',
      admin_email: admin?.email || 'system',
      action: 'ticket.message' as any,
      target_brand_id: ticket.brand_id || undefined,
      details: {
        ticket_id: id,
        message_id: message.id
      }
    });

    return res.status(201).json({ data: message });
  } catch (err: any) {
    console.error('[TicketsAdmin] addTicketMessage:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(err, 'Error al agregar mensaje') });
  }
};
