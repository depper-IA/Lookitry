/**
 * Job de onboarding post-registro
 * 
 * Envía email de recordatorio para subir productos 24h después de verificar el email,
 * si la marca no ha subido ningún producto.
 * 
 * Uso:
 * - Manual: npm run job:onboarding
 * - Cron: ejecutar diariamente
 */

import { notificationService } from '../services/notification.service';
import { Brand } from '../types';

export async function runOnboardingReminder() {
  console.log('=================================================');
  console.log('Iniciando job de onboarding post-registro...');
  console.log('Fecha y hora:', new Date().toISOString());
  console.log('=================================================\n');

  try {
    const { supabaseAdmin } = await import('../config/supabase');

    // Marcas con email_verified_at en las últimas 25-48h (ventana de 24h desde verificación)
    // y que no han subido productos
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    // Buscar marcas verificadas recientemente (entre 24h y 48h atrás)
    const { data: brands, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, email, email_verified_at, has_landing_page')
      .not('email_verified_at', 'is', null)
      .gte('email_verified_at', twoDaysAgo.toISOString())
      .lte('email_verified_at', oneDayAgo.toISOString());

    if (error) throw new Error('Error al obtener marcas verificadas: ' + error.message);

    if (!brands || brands.length === 0) {
      console.log('â¹ï¸  No hay marcas verificadas en ventana de 24h para notificar');
      console.log('\n=================================================');
      console.log('Job completado â no había marcas para procesar');
      console.log('=================================================');
      return { processed: 0, sent: 0 };
    }

    // Para cada marca, verificar si tiene productos
    const { data: productCounts, error: countError } = await supabaseAdmin
      .from('products')
      .select('brand_id, count')
      .in('brand_id', brands.map(b => b.id));

    if (countError) throw new Error('Error al obtener conteo de productos: ' + countError.message);

    const productCountMap = new Map<string, number>();
    for (const row of productCounts || []) {
      productCountMap.set(row.brand_id, row.count);
    }

    let sentCount = 0;
    for (const brand of brands) {
      const productsCount = productCountMap.get(brand.id) ?? 0;
      if (productsCount === 0) {
        try {
          await notificationService.sendOnboardingProductReminder(brand as Brand);
          sentCount++;
        } catch (err) {
          console.error(`   â Error enviando onboarding reminder a ${brand.email}:`, err);
        }
      } else {
        console.log(`   â­ï¸  ${brand.email} ya tiene productos â omitido`);
      }
    }

    console.log(`\n   â ${sentCount} recordatorio(s) de onboarding enviado(s)`);
    console.log('\n=================================================');
    console.log('Job completado');
    console.log('=================================================');

    return { processed: brands.length, sent: sentCount };
  } catch (error) {
    console.error('\nâ Error durante job de onboarding:', error);
    console.error('\n=================================================');
    console.error('Job finalizado con errores');
    console.error('=================================================');
    throw error;
  }
}

// Ejecutar si se corre directamente
if (require.main === module) {
  runOnboardingReminder()
    .then((result) => {
      console.log('Result:', result);
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}