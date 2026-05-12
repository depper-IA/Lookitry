/**
 * Scheduler de tareas automáticas del backend
 * 
 * Se ejecuta al iniciar el servidor y programa:
 * - Verificación diaria de suscripciones (cada día a las 08:00)
 * - Alertas de uso (cada 6 horas)
 * - Limpieza de archivos temporales (cada 24 horas)
 */

import cron from 'node-cron';
import { runDailySubscriptionCheck } from './scripts/daily-subscription-check';
import { checkAndSendUsageAlerts } from './scripts/usage-alerts';
import { cleanupTempSelfies } from './controllers/upload.controller';
import { startEmailCampaignJob } from './jobs/email-campaign.job';

let scheduled = false;

export function startSchedulers() {
  if (scheduled) {
    console.log('[Scheduler] Ya están configurados, saltando...');
    return;
  }
  scheduled = true;

  // — Verificación diaria de suscripciones —
  // Se ejecuta todos los días a las 08:00 (hora del servidor)
  cron.schedule('0 8 * * *', async () => {
    console.log('\n[Scheduler] Ejecutando verificación diaria de suscripciones...');
    try {
      await runDailySubscriptionCheck();
    } catch (error) {
      console.error('[Scheduler] Error en verificación de suscripciones:', error);
    }
  });

  // — Alertas de uso de generaciones —
  // Se ejecuta cada 6 horas (08:00, 14:00, 20:00, 02:00)
  cron.schedule('0 */6 * * *', async () => {
    console.log('\n[Scheduler] Verificando alertas de uso...');
    try {
      await checkAndSendUsageAlerts();
    } catch (error) {
      console.error('[Scheduler] Error en alertas de uso:', error);
    }
  });

  // — Limpieza de archivos temporales —
  // Se ejecuta todos los días a las 03:00
  cron.schedule('0 3 * * *', async () => {
    console.log('\n[Scheduler] Limpiando archivos temporales...');
    try {
      await cleanupTempSelfies({} as any, {} as any);
    } catch (error) {
      console.error('[Scheduler] Error en limpieza de temporales:', error);
    }
  });

  console.log('[Scheduler] Tareas automáticas configuradas:');
  console.log('  - Suscripciones: diario a las 08:00');
  console.log('  - Alertas de uso: cada 6 horas');
  console.log('  - Limpieza temporales: diario a las 03:00');
  console.log('  - Email Campaigns: cada 5 minutos');

  startEmailCampaignJob();
}
