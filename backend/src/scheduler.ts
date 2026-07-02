/**
 * Scheduler de tareas automáticas del backend
 *
 * Se ejecuta al iniciar el servidor y programa:
 * - Verificación diaria de suscripciones (cada día a las 08:00)
 * - Alertas de uso (cada 6 horas)
 * - Limpieza de archivos temporales (cada 24 horas)
 * - Rebecca 2.0: Sales Patterns Analyzer (domingo 2am)
 * - Rebecca 2.0: Reminder Processor (cada hora)
 * - Supabase Keep-Alive: ping semanal anti auto-pausa (domingo 01:00)
 */

import cron from 'node-cron';
import { supabaseAdmin } from './config/supabase';
import { runDailySubscriptionCheck } from './scripts/daily-subscription-check';
import { checkAndSendUsageAlerts } from './scripts/usage-alerts';
import { startEmailCampaignJob } from './jobs/email-campaign.job';
import { initSalesPatternsAnalyzer } from './scheduler/sales-patterns-analyzer';
import { initReminderProcessor } from './scheduler/reminder-processor';
import { GenerationsService } from './services/generations.service';

let scheduled = false;

export function startSchedulers() {
  if (scheduled) {
    console.log('[Scheduler] Ya están configurados, saltando...');
    return;
  }
  scheduled = true;

  // —Verificación diaria de suscripciones—
  // Se ejecuta todos los días a las 08:00 (hora del servidor)
  cron.schedule('0 8 * * *', async () => {
    console.log('\n[Scheduler] Ejecutando verificación diaria de suscripciones...');
    try {
      await runDailySubscriptionCheck();
    } catch (error) {
      console.error('[Scheduler] Error en verificación de suscripciones:', error);
    }
  });

  // —Alertas de uso de generaciones—
  // Se ejecuta cada 6 horas (08:00, 14:00, 20:00, 02:00)
  cron.schedule('0 */6 * * *', async () => {
    console.log('\n[Scheduler] Verificando alertas de uso...');
    try {
      await checkAndSendUsageAlerts();
    } catch (error) {
      console.error('[Scheduler] Error en alertas de uso:', error);
    }
  });

  // —Keep-alive de Supabase (anti auto-pausa)—
  // El plan Free de Supabase pausa proyectos inactivos tras 7 días. Este ping
  // semanal ejecutado los domingos a la 01:00 (hora del servidor) garantiza que
  // la base de datos registre actividad mínima y no entre en modo pausa.
  cron.schedule('0 1 * * 0', async () => {
    console.log('\n[Scheduler] Ejecutando keep-alive de Supabase...');
    try {
      const { error } = await supabaseAdmin.from('brands').select('id').limit(1);
      if (error) {
        console.error('[Scheduler] Keep-alive de Supabase terminó con error:', error.message);
      } else {
        console.log('[Scheduler] Keep-alive de Supabase OK');
      }
    } catch (err) {
      console.error('[Scheduler] Excepción en keep-alive de Supabase:', err);
    }
  });

  console.log('[Scheduler] Tareas automáticas configuradas:');
  console.log('  - Suscripciones: diario a las 08:00');
  console.log('  - Alertas de uso: cada 6 horas');
  console.log('  - Email Campaigns: cada 5 minutos');
  console.log('  - Sales Patterns Analyzer: domingo a las 02:00');
  console.log('  - Reminder Processor: cada hora');
  console.log('  - Purga resultados expirados: cada 6 horas');
  console.log('  - Supabase Keep-Alive: domingo a la 01:00');

  startEmailCampaignJob();
  // Phase 1: Rebecca 2.0 schedulers
  initSalesPatternsAnalyzer();
  initReminderProcessor();

  // —Purga de imágenes generadas expiradas (48h)—
  // Se ejecuta cada 6 horas
  cron.schedule('0 */6 * * *', async () => {
    console.log('\n[Scheduler] Purga de resultados expirados...');
    try {
      const gs = new GenerationsService();
      const purged = await gs.purgeExpiredResultImages(200);
      if (purged > 0) console.log(`[Scheduler] ${purged} resultados expirados purgados`);
    } catch (error) {
      console.error('[Scheduler] Error en purga de resultados:', error);
    }
  });
}