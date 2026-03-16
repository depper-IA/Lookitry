import cron from 'node-cron';
import { CleanupService } from '../services/cleanup.service';
import { SubscriptionService } from '../services/subscription.service';
import { notificationService } from '../services/notification.service';
import { supabaseAdmin } from '../config/supabase';

const cleanupService = new CleanupService();
const subscriptionService = new SubscriptionService();

/**
 * Suspende la mini-landing de marcas con suscripción suspendida que aún no tienen
 * landing_suspended_at seteado.
 * Condición: subscription_status = 'suspended' AND has_landing_page = true AND landing_suspended_at IS NULL
 */
async function suspenderMiniLandingsPendientes(): Promise<void> {
  const { data: marcas, error } = await supabaseAdmin
    .from('brands')
    .select('id, name, email')
    .eq('subscription_status', 'suspended')
    .eq('has_landing_page', true)
    .is('landing_suspended_at', null);

  if (error) {
    console.error('[Landing Job] Error consultando marcas a suspender:', error.message);
    return;
  }

  if (!marcas || marcas.length === 0) {
    console.log('[Landing Job] No hay mini-landings pendientes de suspender.');
    return;
  }

  for (const marca of marcas) {
    const { error: updateError } = await supabaseAdmin
      .from('brands')
      .update({ landing_suspended_at: new Date().toISOString() })
      .eq('id', marca.id);

    if (updateError) {
      console.error(`[Landing Job] Error suspendiendo landing de ${marca.name}:`, updateError.message);
    } else {
      console.log(`[Landing Job] Mini-landing suspendida: ${marca.name} (${marca.id})`);
    }
  }
}

/**
 * Envía aviso previo a los 75 días de suspensión y elimina definitivamente
 * la mini-landing a los 90 días.
 * - 75 días: email de aviso de eliminación próxima
 * - 90 días: has_landing_page = false, landing_suspended_at = null, elimina productos de MinIO
 */
async function procesarEliminacionDefinitiva(): Promise<void> {
  const ahora = new Date();

  // Umbral de 75 días para aviso previo
  const umbral75 = new Date(ahora);
  umbral75.setDate(umbral75.getDate() - 75);

  // Umbral de 90 días para eliminación definitiva
  const umbral90 = new Date(ahora);
  umbral90.setDate(umbral90.getDate() - 90);

  // ── Aviso a los 75 días ──────────────────────────────────────────────────
  // Marcas con landing_suspended_at entre 75 y 76 días atrás (ventana de 1 día)
  const umbral75Fin = new Date(umbral75);
  umbral75Fin.setDate(umbral75Fin.getDate() + 1);

  const { data: marcas75, error: err75 } = await supabaseAdmin
    .from('brands')
    .select('id, name, email, plan')
    .gte('landing_suspended_at', umbral75Fin.toISOString())
    .lte('landing_suspended_at', umbral75.toISOString())
    .not('landing_suspended_at', 'is', null);

  if (!err75 && marcas75 && marcas75.length > 0) {
    for (const marca of marcas75) {
      try {
        await notificationService.sendLandingDeletionWarning(marca as any, 15);
        console.log(`[Landing Job] Aviso 75 días enviado a ${marca.email}`);
      } catch (e) {
        console.error(`[Landing Job] Error enviando aviso 75 días a ${marca.email}:`, e);
      }
    }
  }

  // ── Eliminación definitiva a los 90 días ─────────────────────────────────
  const { data: marcas90, error: err90 } = await supabaseAdmin
    .from('brands')
    .select('id, name, email, plan')
    .lte('landing_suspended_at', umbral90.toISOString())
    .not('landing_suspended_at', 'is', null);

  if (err90) {
    console.error('[Landing Job] Error consultando marcas para eliminación definitiva:', err90.message);
    return;
  }

  if (!marcas90 || marcas90.length === 0) {
    console.log('[Landing Job] No hay mini-landings para eliminar definitivamente.');
    return;
  }

  for (const marca of marcas90) {
    try {
      // Eliminar imágenes de productos en MinIO
      await eliminarProductosMinIO(marca.id);

      // Marcar landing como eliminada definitivamente
      const { error: updateError } = await supabaseAdmin
        .from('brands')
        .update({
          has_landing_page: false,
          landing_suspended_at: null,
        })
        .eq('id', marca.id);

      if (updateError) {
        console.error(`[Landing Job] Error eliminando landing de ${marca.name}:`, updateError.message);
        continue;
      }

      // Enviar email de eliminación definitiva
      try {
        await notificationService.sendLandingDeletedNotice(marca as any);
        console.log(`[Landing Job] Email de eliminación enviado a ${marca.email}`);
      } catch (e) {
        console.error(`[Landing Job] Error enviando email de eliminación a ${marca.email}:`, e);
      }

      console.log(`[Landing Job] Mini-landing eliminada definitivamente: ${marca.name} (${marca.id})`);
    } catch (e) {
      console.error(`[Landing Job] Error procesando eliminación de ${marca.name}:`, e);
    }
  }
}

/**
 * Elimina las imágenes de productos de una marca en MinIO.
 * Solo elimina imágenes alojadas en minio.wilkiedevs.com.
 */
async function eliminarProductosMinIO(brandId: string): Promise<void> {
  const { data: productos, error } = await supabaseAdmin
    .from('products')
    .select('id, image_url')
    .eq('brand_id', brandId)
    .not('image_url', 'is', null);

  if (error || !productos || productos.length === 0) return;

  const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'https://minio.wilkiedevs.com';
  const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || '';
  const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || '';
  const MINIO_BUCKET = process.env.MINIO_BUCKET || 'images';

  // Importar el cliente de MinIO dinámicamente para no romper si no está instalado
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Minio = require('minio');
    const minioClient = new Minio.Client({
      endPoint: MINIO_ENDPOINT.replace('https://', '').replace('http://', ''),
      useSSL: MINIO_ENDPOINT.startsWith('https'),
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });

    for (const producto of productos) {
      if (!producto.image_url || !producto.image_url.includes('minio.wilkiedevs.com')) continue;
      try {
        // Extraer la ruta del objeto desde la URL
        const url = new URL(producto.image_url);
        // La URL tiene formato: /images/products/xxx.jpg → objectName = products/xxx.jpg
        const objectName = url.pathname.replace(`/${MINIO_BUCKET}/`, '');
        await minioClient.removeObject(MINIO_BUCKET, objectName);
        console.log(`[Landing Job] Imagen MinIO eliminada: ${objectName}`);
      } catch (e) {
        console.error(`[Landing Job] Error eliminando imagen MinIO ${producto.image_url}:`, e);
      }
    }
  } catch {
    // Si minio no está disponible, solo loguear
    console.warn('[Landing Job] Cliente MinIO no disponible, omitiendo eliminación de imágenes.');
  }
}

/**
 * Cron job para limpieza automática de imágenes, purga de marcas suspendidas,
 * suspensión/eliminación de mini-landings y limpieza de notificaciones admin antiguas.
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

  // Suspensión de mini-landings por falta de pago — todos los días a las 3:45 AM
  cron.schedule('45 3 * * *', async () => {
    console.log('[Landing Job] Verificando mini-landings a suspender...');
    try {
      await suspenderMiniLandingsPendientes();
    } catch (error) {
      console.error('[Landing Job] Error en suspensión de mini-landings:', error);
    }
  });

  // Eliminación definitiva de mini-landings (75 días aviso, 90 días eliminación) — 4:15 AM
  cron.schedule('15 4 * * *', async () => {
    console.log('[Landing Job] Procesando eliminaciones definitivas de mini-landings...');
    try {
      await procesarEliminacionDefinitiva();
    } catch (error) {
      console.error('[Landing Job] Error en eliminación definitiva de mini-landings:', error);
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

  console.log('[Jobs] Cron jobs programados: limpieza 3:00 AM, purga 3:30 AM, suspensión landing 3:45 AM, eliminación landing 4:15 AM, notificaciones 4:00 AM');
}
