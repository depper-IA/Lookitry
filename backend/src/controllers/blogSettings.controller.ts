import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { inferBlogWebhookAuthMode, triggerBlogWebhook } from '../utils/blogWebhook';

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

      const { data: notifications } = await supabaseAdmin
        .from('admin_notifications')
        .select('message, created_at')
        .eq('type', 'blog_error')
        .order('created_at', { ascending: false })
        .limit(1);

      const latestError = notifications?.[0] ?? null;

      return res.json({
        ...data,
        webhook_secret: undefined,
        has_webhook_secret: Boolean(data?.webhook_secret),
        webhook_auth_mode: inferBlogWebhookAuthMode(data?.webhook_secret),
        last_error: latestError?.message ?? null,
        last_error_at: latestError?.created_at ?? null,
      });
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

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (frequency !== undefined) updates.frequency = frequency;
      if (is_enabled !== undefined) updates.is_enabled = is_enabled;
      if (webhook_url !== undefined) updates.webhook_url = webhook_url;
      if (webhook_secret !== undefined) updates.webhook_secret = webhook_secret;
      if (next_run) updates.next_run = next_run;

      const { data, error } = await supabaseAdmin
        .from('blog_settings')
        .update(updates)
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;
      return res.json({
        message: 'Configuración actualizada',
        settings: {
          ...data,
          webhook_secret: undefined,
          has_webhook_secret: Boolean(data?.webhook_secret),
          webhook_auth_mode: inferBlogWebhookAuthMode(data?.webhook_secret),
        },
      });
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
      const secret = settings.webhook_secret || process.env.N8N_BLOG_WEBHOOK_SECRET || process.env.BLOG_WEBHOOK_SECRET || '';

      if (!url) throw new Error('URL de webhook n8n no configurada');

      // 2. Llamar a n8n
      console.log(`[Blog Job] Disparando n8n manualmente: ${url}`);
      
      try {
        const triggerResult = await triggerBlogWebhook(url, secret, 'admin_manual');

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

        return res.json({
          message: `Flujo n8n disparado exitosamente (${triggerResult.attempt})`,
          attempt: triggerResult.attempt,
          status: triggerResult.status,
        });
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
