import { Response } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { AdminAuthRequest } from '../../middleware/adminAuth';

export const getRebeccaConfig = async (req: AdminAuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('rebecca_config')
      .select('config_key, config_value, description, updated_at, updated_by')
      .order('config_key', { ascending: true });

    if (error) {
      console.error('[RebeccaAdmin] Error fetching config:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener configuración' });
    }

    const config: Record<string, string> = {};
    const items = (data || []).map((row: any) => {
      config[row.config_key] = row.config_value;
      return {
        key: row.config_key,
        value: row.config_value,
        description: row.description,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
      };
    });

    return res.status(200).json({ config: items, values: config });
  } catch (error: any) {
    console.error('[RebeccaAdmin] Error in getRebeccaConfig:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
};

export const getSalesPatterns = async (req: AdminAuthRequest, res: Response) => {
  try {
    // TODO: implementar cuando se defina la tabla/estructura de sales patterns
    return res.status(200).json({ patterns: [], total: 0 });
  } catch (error: any) {
    console.error('[RebeccaAdmin] Error in getSalesPatterns:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
};

export const updateRebeccaConfig = async (req: AdminAuthRequest, res: Response) => {
  try {
    const updates = req.body as Record<string, string>;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Se requiere al menos una configuración para actualizar' });
    }

    const adminEmail = req.admin?.email || 'unknown';
    const now = new Date().toISOString();

    const updatePromises = Object.entries(updates).map(async ([key, value]) => {
      const { error } = await supabaseAdmin
        .from('rebecca_config')
        .update({
          config_value: value,
          updated_at: now,
          updated_by: adminEmail,
        })
        .eq('config_key', key);

      if (error) {
        console.error(`[RebeccaAdmin] Error updating ${key}:`, error);
        throw error;
      }
    });

    await Promise.all(updatePromises);

    const { data } = await supabaseAdmin
      .from('rebecca_config')
      .select('config_key, config_value, description, updated_at, updated_by')
      .order('config_key', { ascending: true });

    const items = (data || []).map((row: any) => ({
      key: row.config_key,
      value: row.config_value,
      description: row.description,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    }));

    return res.status(200).json({ success: true, config: items });
  } catch (error: any) {
    console.error('[RebeccaAdmin] Error in updateRebeccaConfig:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
};