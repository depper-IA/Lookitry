import { Request, Response } from 'express';

import { sanitizeError } from '../utils/sanitizeError';

import { supabaseAdmin } from '../config/supabase';

import { inferBlogWebhookAuthMode, triggerBlogWebhook } from '../utils/blogWebhook';

import { createAdminNotification } from '../utils/adminNotifications';



type BlogExecutionStatus = 'idle' | 'running' | 'success' | 'error';



function mapNotificationTypeToExecutionStatus(type?: string | null): BlogExecutionStatus {

  if (type === 'blog_running') return 'running';

  if (type === 'blog_success') return 'success';

  if (type === 'blog_error') return 'error';

  return 'idle';

}



async function resolveExpectedBlogSecret(): Promise<string> {

  const { data } = await supabaseAdmin

    .from('blog_settings')

    .select('webhook_secret')

    .eq('id', 1)

    .single();



  return data?.webhook_secret || process.env.BLOG_WEBHOOK_SECRET;

}



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

        .select('type, title, message, created_at')

        .in('type', ['blog_running', 'blog_error', 'blog_success'])

        .order('created_at', { ascending: false })

        .limit(10);



      const latestExecution = notifications?.[0] ?? null;

      const latestError = notifications?.find((notification) => notification.type === 'blog_error') ?? null;



      // Timeout automático: si la última notificación es blog_running con más de 3 horas,

      // se considera expirada y se reporta como 'idle' para no bloquear el panel admin.

      const RUNNING_TIMEOUT_MS = 3 * 60 * 60 * 1000; // 3 horas en ms

      let effectiveExecution = latestExecution;

      if (

        latestExecution?.type === 'blog_running' &&

        latestExecution?.created_at

      ) {

        const elapsedMs = Date.now() - new Date(latestExecution.created_at).getTime();

        if (elapsedMs > RUNNING_TIMEOUT_MS) {

          // La ejecución lleva más de 3 horas sin novedades — se marca como expirada

          effectiveExecution = null;

        }

      }



      return res.json({

        ...data,

        image_generation_provider: data?.image_generation_provider || 'vertex',

        image_generator_webhook: data?.image_generator_webhook || null,

        webhook_secret: undefined,

        has_webhook_secret: Boolean(data?.webhook_secret),

        webhook_auth_mode: inferBlogWebhookAuthMode(data?.webhook_secret),

        last_error: latestError?.message ?? null,

        last_error_at: latestError?.created_at ?? null,

        execution_status: mapNotificationTypeToExecutionStatus(effectiveExecution?.type),

        execution_title: effectiveExecution?.title ?? null,

        execution_message: effectiveExecution?.message ?? null,

        execution_updated_at: effectiveExecution?.created_at ?? null,

      });

    } catch (error: any) {

      console.error('[BlogSettings] Error fetching settings:', error);

      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error al obtener configuración') });

    }

  },



  /**

   * Actualizar configuración del blog

   */

  async updateSettings(req: Request, res: Response) {

    try {

      const { frequency, is_enabled, webhook_url, webhook_secret, image_generation_provider, image_generator_webhook } = req.body;



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

      if (image_generation_provider !== undefined) updates.image_generation_provider = image_generation_provider;

      if (image_generator_webhook !== undefined) updates.image_generator_webhook = image_generator_webhook;

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

          image_generation_provider: data?.image_generation_provider || 'vertex',

          webhook_secret: undefined,

          has_webhook_secret: Boolean(data?.webhook_secret),

          webhook_auth_mode: inferBlogWebhookAuthMode(data?.webhook_secret),

        },

      });

    } catch (error: any) {

      console.error('[BlogSettings] Error updating settings:', error);

      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error al obtener configuración') });

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

      const secret = settings.webhook_secret || process.env.N8N_BLOG_WEBHOOK_SECRET || process.env.BLOG_WEBHOOK_SECRET;



      if (!url) throw new Error('URL de webhook n8n no configurada');



      // 2. Llamar a n8n

      console.log(`[Blog Job] Disparando n8n manualmente: ${url}`);

      

      try {

        await createAdminNotification({

          type: 'blog_running',

          title: 'Generación de blog iniciada',

          message: 'Se disparó una ejecución manual del flujo editorial en n8n.',

          severity: 'info',

          metadata: { source: 'admin_manual' },

        });



        const triggerResult = await triggerBlogWebhook(url, secret, 'admin_manual', {

          article_model: 'google/gemini-2.5-flash',

          image_provider: settings.image_generation_provider || 'vertex',

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

      return res.status(500).json({ error: 'TRIGGER_ERROR', message: sanitizeError(error, 'Error al disparar n8n') });

    }

  },



  async reportExecutionStatus(req: Request, res: Response) {

    try {

      const secret = String(req.headers['x-blog-secret'] || '');

      const expectedSecret = await resolveExpectedBlogSecret();



      if (!expectedSecret || secret !== expectedSecret) {

        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Secreto de blog inválido' });

      }



      const status = String(req.body?.status || '').toLowerCase();

      const title = String(req.body?.title || '').trim();

      const message = String(req.body?.message || '').trim();

      const metadata = typeof req.body?.metadata === 'object' && req.body?.metadata

        ? req.body.metadata

        : {};



      if (!['running', 'success', 'error'].includes(status)) {

        return res.status(400).json({ error: 'BAD_REQUEST', message: 'status inválido' });

      }



      await createAdminNotification({

        type: status === 'running' ? 'blog_running' : status === 'success' ? 'blog_success' : 'blog_error',

        title: title || (

          status === 'running'

            ? 'Generación de blog en curso'

            : status === 'success'

              ? 'Generación de blog completada'

              : 'Generación de blog fallida'

        ),

        message: message || (

          status === 'running'

            ? 'n8n está procesando una nueva ejecución del blog.'

            : status === 'success'

              ? 'n8n completó la generación del artículo del blog.'

              : 'n8n reportó un fallo durante la generación del artículo.'

        ),

        severity: status === 'error' ? 'error' : status === 'success' ? 'success' : 'info',

        metadata,

      });



      return res.json({ ok: true });

    } catch (error: any) {

      console.error('[BlogSettings] Error reporting execution status:', error);

      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error al obtener configuración') });

    }

  },



  /**

   * Notificar que no había topics pendientes para procesar

   */

  async notifyNoTopics(req: Request, res: Response) {

    try {

      const secret = String(req.headers['x-blog-secret'] || '');

      const expectedSecret = await resolveExpectedBlogSecret();



      if (!expectedSecret || secret !== expectedSecret) {

        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Secreto de blog inválido' });

      }



      const message = String(req.body?.message || '').trim() || 'No había topics pendientes para procesar';



      await createAdminNotification({

        type: 'blog_success',

        title: 'Article Producer: Sin topics pendientes',

        message,

        severity: 'info',

        metadata: { source: 'article_producer', reason: 'no_pending_topics' },

      });



      return res.json({ ok: true });

    } catch (error: any) {

      console.error('[BlogSettings] Error notifying no topics:', error);

      return res.status(500).json({ error: 'SERVER_ERROR', message: sanitizeError(error, 'Error al notificar') });

    }

  }

};

