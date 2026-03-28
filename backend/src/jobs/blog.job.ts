import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase';
import { triggerBlogWebhook } from '../utils/blogWebhook';

/**
 * Job para gestionar la publicación automática del blog.
 * Se ejecuta cada hora para verificar si corresponde un disparo según la frecuencia.
 */
export async function startBlogJob() {
  // Correr cada hora en el minuto 5
  cron.schedule('5 * * * *', async () => {
    console.log('[Blog Job] Verificando pulso editorial...');

    try {
      const { data: settings, error: fetchError } = await supabaseAdmin
        .from('blog_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (fetchError || !settings) {
        console.error('[Blog Job] No se pudo obtener la configuración del blog.');
        return;
      }

      if (!settings.is_enabled) {
        console.log('[Blog Job] Automatización desactivada.');
        return;
      }

      const now = new Date();
      const nextRun = new Date(settings.next_run);

      if (now >= nextRun) {
        const url = settings.webhook_url || process.env.N8N_BLOG_WEBHOOK_URL;
        const secret =
          settings.webhook_secret ||
          process.env.N8N_BLOG_WEBHOOK_SECRET ||
          process.env.BLOG_WEBHOOK_SECRET ||
          '';

        if (!url) {
          console.error('[Blog Job] Error: N8N_BLOG_WEBHOOK_URL no configurada.');
          return;
        }

        console.log(`[Blog Job] Disparando n8n: ${url}`);

        try {
          const triggerResult = await triggerBlogWebhook(url, secret, 'backend_cron_job');

          const next = new Date(now);
          if (settings.frequency === 'daily') next.setDate(next.getDate() + 1);
          else if (settings.frequency === 'weekly') next.setDate(next.getDate() + 7);
          else if (settings.frequency === 'monthly') next.setMonth(next.getMonth() + 1);

          await supabaseAdmin
            .from('blog_settings')
            .update({
              last_run: now.toISOString(),
              next_run: next.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', 1);

          console.log(
            `[Blog Job] Flujo disparado con éxito usando ${triggerResult.attempt}. Próxima ejecución: ${next.toISOString()}`
          );
        } catch (error: any) {
          console.error(`[Blog Job] Error al disparar flujo: ${error.message}`);

          await supabaseAdmin.from('admin_notifications').insert({
            type: 'blog_error',
            title: 'Fallo en Automatización de Blog',
            message: `El servidor no pudo despertar a n8n para generar el artículo programado. Detalles: ${error.message}`,
            severity: 'error',
            metadata: { error: error.message, url },
          });
        }
      } else {
        console.log(`[Blog Job] Aún no es tiempo. Próxima ejecución programada para: ${settings.next_run}`);
      }
    } catch (err: any) {
      console.error('[Blog Job] Error crítico en el job:', err.message);
    }
  });

  console.log('[Blog Job] Automatización de Lookitry Editorial iniciada (chequeo cada hora).');
}
