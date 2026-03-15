import cron from 'node-cron';
import { CleanupService } from '../services/cleanup.service';
import { SubscriptionService } from '../services/subscription.service';
import { supabaseAdmin } from '../config/supabase';

const cleanupService = new CleanupService();
const subscriptionService = new SubscriptionService();

/**
 * Cron job para limpieza automática de imágenes, purga de marcas suspendidas
 * y limpieza de notificaciones admin antiguas.
 * Se ejecuta todos los días a las 3:00 AM.
 */
export function startCleanupJob() {
  // Limpieza de imágenes — todos los días a las 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[Cleanup Job] Iniciando limpieza automática programada...');
    try {
      const result = await cleanupService.runFullCleanup();
      console.log(`[Cleanup Job] Limpieza de imágenes completada: ${result.totalDeleted} eliminadas, ${result.totalErrors} errores`);
    } catch (error) {
      console.error('[Cleanup Job] Error en limpieza de imágenes:', error);
    }
  });

  // Purga de marcas suspendidas hace más de 90 días — todos los días a las 3:30 AM
  cron.schedule('30 3 * * *', async () => {
    console.log('[Cleanup Job] Iniciando purga de marcas suspendidas (>90 días)...');
    try {
      const result = await subscriptionService.purgeExpiredSuspendedBrands();
      console.log(`[Cleanup Job] Purga completada: ${result.purged} marcas purgadas, ${result.errors} errores`);
    } catch (error) {
      console.error('[Cleanup Job] Error en purga de marcas:', error);
    }
  });

  // Limpieza de admin_notifications con más de 30 días — todos los días a las 4:00 AM
  cron.schedule('0 4 * * *', async () => {
    console.log('[Cleanup Job] Limpiando notificaciones admin antiguas (>30 días)...');
    try {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error, count } = await supabaseAdmin
        .from('admin_notifications')
        .delete({ count: 'exact' })
        .lt('created_at', cutoff);
      if (error) throw error;
      console.log(`[Cleanup Job] Notificaciones eliminadas: ${count ?? 0}`);
    } catch (error) {
      console.error('[Cleanup Job] Error limpiando notificaciones admin:', error);
    }
  });

  console.log('[Jobs] Cron jobs programados: limpieza 3:00 AM, purga 3:30 AM, notificaciones 4:00 AM');
}
