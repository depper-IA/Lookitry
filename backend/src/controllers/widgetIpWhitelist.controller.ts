import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sanitizeError } from '../utils/sanitizeError';
import { refreshWhitelistCache } from '../middleware/rateLimiter';

const TABLE = 'widget_ip_whitelist';

/**
 * GET /api/admin/widget-ip-whitelist
 * List all IPs in the widget whitelist
 */
export const getWidgetIpWhitelist = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ ips: data });
  } catch (error: any) {
    console.error('[WidgetIpWhitelist] Error fetching:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al obtener whitelist') });
  }
};

/**
 * POST /api/admin/widget-ip-whitelist
 * Add a new IP to the widget whitelist
 */
export const addWidgetIpWhitelist = async (req: Request, res: Response) => {
  try {
    const { ip_address, description } = req.body;

    if (!ip_address) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'ip_address es requerido' });
    }

    // Validate IP format (basic IPv4/IPv6 validation)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    if (!ipv4Regex.test(ip_address) && !ipv6Regex.test(ip_address)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Formato de IP inválido' });
    }

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert({
        ip_address,
        description: description || '',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'DUPLICATE_IP', message: 'Esta IP ya está en la whitelist' });
      }
      throw error;
    }

    return res.status(201).json({ ip: data });
  } catch (error: any) {
    console.error('[WidgetIpWhitelist] Error adding:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al agregar IP') });
  }
};

/**
 * PUT /api/admin/widget-ip-whitelist/:id
 * Update an IP in the widget whitelist
 */
export const updateWidgetIpWhitelist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ip_address, description, is_active } = req.body;

    const updates: any = {};
    if (ip_address !== undefined) updates.ip_address = ip_address;
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'NOT_FOUND', message: 'IP no encontrada' });

    return res.json({ ip: data });
  } catch (error: any) {
    console.error('[WidgetIpWhitelist] Error updating:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al actualizar IP') });
  }
};

/**
 * DELETE /api/admin/widget-ip-whitelist/:id
 * Remove an IP from the widget whitelist
 */
export const deleteWidgetIpWhitelist = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ message: 'IP eliminada de la whitelist' });
  } catch (error: any) {
    console.error('[WidgetIpWhitelist] Error deleting:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al eliminar IP') });
  }
};

/**
 * GET /api/admin/widget-ip-whitelist/check/:ip
 * Check if an IP is whitelisted (for testing)
 */
export const checkWidgetIpWhitelist = async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select('id, ip_address, is_active')
      .eq('ip_address', ip)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    return res.json({
      ip,
      is_whitelisted: !!data,
      found: data,
    });
  } catch (error: any) {
    console.error('[WidgetIpWhitelist] Error checking:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al verificar IP') });
  }
};

/**
 * POST /api/admin/widget-ip-whitelist/refresh-cache
 * Force refresh the whitelist cache (for immediate effect after adding IPs)
 */
export const refreshWidgetIpWhitelistCache = async (_req: Request, res: Response) => {
  try {
    await refreshWhitelistCache();
    return res.json({ message: 'Cache refreshed successfully' });
  } catch (error: any) {
    console.error('[WidgetIpWhitelist] Error refreshing cache:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: sanitizeError(error, 'Error al refrescar cache') });
  }
};
