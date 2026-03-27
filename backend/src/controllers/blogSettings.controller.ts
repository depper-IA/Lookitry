import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import axios from 'axios';

export const blogSettingsController = {
  /**
   * Obtener configuración actual del blog
   */
  async getSettings(req: Request, res: Response) {
    try {
      const { data, error } = await supabaseAdmin
        .from('blog_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      return res.json(data);
    } catch (error: any) {
      console.error('[BlogSettings] Error fetching settings:', error);
      return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  },

  /**
   * Actualizar configuración del blog
   */
  async updateSettings(req: Request, res: Response) {
    try {
      const { frequency, is_enabled, webhook_url, webhook_secret } = req.body;

      // Calcular próxima ejecución si cambia la frecuencia o se activa
      let next_run = undefined;
      if (frequency) {
        const now = new Date();
        if (frequency === 'daily') now.setDate(now.getDate() + 1);
        else if (frequency === 'weekly') now.setDate(now.getDate() + 7);
        else if (frequency === 'monthly') now.setMonth(now.getMonth() + 1);
        next_run = now.toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('blog_settings')
        .update({
          frequency,
          is_enabled,
          webhook_url,
          webhook_secret,
          ...(next_run ? { next_run } : {}),
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;
      return res.json({ message: 'Configuración actualizada', settings: data });
    } catch (error: any) {
      console.error('[BlogSettings] Error updating settings:', error);
      return res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  },

  /**
   * Disparar flujo n8n manualmente
   */
  async triggerNow(req: Request, res: Response) {
    try {
      // 1. Obtener config
      const { data: settings, error: fetchError } = await supabaseAdmin
        .from('blog_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (fetchError || !settings) throw new Error('No se pudo cargar la configuración del blog');

      const url = settings.webhook_url || process.env.N8N_BLOG_WEBHOOK_URL;
      const secret = settings.webhook_secret || 'Travis2305**_blog_n8n';

      if (!url) throw new Error('URL de webhook n8n no configurada');

      // 2. Llamar a n8n
      console.log(`[Blog Job] Disparando n8n manualmente: ${url}`);
      
      try {
        await axios.post(url, { triggered_by: 'admin_manual' }, {
          headers: {
            'Content-Type': 'application/json',
            'x-n8n-secret': secret
          },
          timeout: 10000
        });

        // 3. Actualizar last_run y calcular next_run
        const now = new Date();
        const next = new Date(now);
        if (settings.frequency === 'daily') next.setDate(next.getDate() + 1);
        else if (settings.frequency === 'weekly') next.setDate(next.getDate() + 7);
        else if (settings.frequency === 'monthly') next.setMonth(next.getMonth() + 1);

        await supabaseAdmin
          .from('blog_settings')
          .update({
            last_run: now.toISOString(),
            next_run: next.toISOString()
          })
          .eq('id', 1);

        return res.json({ message: 'Flujo n8n disparado exitosamente' });
      } catch (axiosError: any) {
        // Registrar error en admin_notifications
        await supabaseAdmin.from('admin_notifications').insert({
          type: 'blog_error',
          title: 'Fallo al disparar Blog (Manual)',
          message: `Error al conectar con n8n: ${axiosError.message}`,
          severity: 'error',
          metadata: { error: axiosError.message, url }
        });

        throw axiosError;
      }
    } catch (error: any) {
      console.error('[BlogSettings] Error triggering n8n:', error.message);
      return res.status(500).json({ error: 'TRIGGER_ERROR', message: error.message });
    }
  }
};
