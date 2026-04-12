/**
 * Script de verificación diaria de suscripciones
 * 
 * Este script debe ejecutarse diariamente para:
 * - Verificar suscripciones que vencen hoy y cambiar estado a 'expired'
 * - Cambiar estado a 'expiring_soon' para suscripciones con < 7 días
 * - Suspender marcas con suscripción vencida
 * - Enviar notificaciones por email según el estado de la suscripción
 * - Logging de acciones realizadas
 * 
 * Uso:
 * - Manual: npm run subscription:check
 * - Cron: Configurar en crontab o servicio de scheduling
 * 
 * Requirements: 11.3, 11.4, 13.2, 13.3, 13.4, 13.5
 */

import { SubscriptionService } from '../services/subscription.service';
import { notificationService } from '../services/notification.service';
import { Brand } from '../types';

const subscriptionService = new SubscriptionService();

/**
 * Envía notificaciones a marcas que vencen en exactamente X días
 * 
 * @param days - Número de días hasta el vencimiento (7, 3, o 0)
 */
async function sendExpirationNotifications(days: number): Promise<number> {
  try {
    console.log(`\n📧 Enviando notificaciones para marcas que vencen en ${days} días...`);
    
    // Obtener marcas que vencen en exactamente X días
    const brands = await subscriptionService.getExpiringSubscriptions(days);
    
    // Filtrar para obtener solo las que vencen exactamente en X días
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const brandsExpiringInExactDays = brands.filter((brand: Brand) => {
      if (!brand.subscription_end_date) return false;
      const endDate = new Date(brand.subscription_end_date);
      endDate.setHours(0, 0, 0, 0);
      return endDate >= targetDate && endDate < nextDay;
    });

    let sentCount = 0;
    for (const brand of brandsExpiringInExactDays) {
      try {
        await notificationService.sendExpirationReminder(brand, days);
        sentCount++;
      } catch (error) {
        console.error(`   ❌ Error al enviar notificación a ${brand.email}:`, error);
      }
    }

    console.log(`   ✅ ${sentCount} notificación(es) enviada(s) para ${days} días`);
    return sentCount;
  } catch (error) {
    console.error(`   ❌ Error al enviar notificaciones para ${days} días:`, error);
    return 0;
  }
}

/**
 * Envía notificaciones de trial por vencer a marcas con plan TRIAL.
 * Solo para trials que vencen en 2 o 3 días.
 */
async function sendTrialEndingNotifications(): Promise<number> {
  try {
    console.log('\n📧 Enviando notificaciones de trial por vencer...');
    const { supabaseAdmin } = await import('../config/supabase');
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const fourDaysFromNow = new Date();
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);

    const { data: trialBrands, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('plan', 'TRIAL')
      .eq('trial_payment_status', 'active')
      .not('trial_end_date', 'is', null)
      .gte('trial_end_date', now.toISOString())
      .lte('trial_end_date', fourDaysFromNow.toISOString());

    if (error) throw new Error('Error al obtener trials: ' + error.message);
    if (!trialBrands || trialBrands.length === 0) {
      console.log('   ℹ️  No hay trials por vencer');
      return 0;
    }

    // Filtrar solo los que vencen en 2 o 3 días
    const targetStart = new Date();
    targetStart.setDate(targetStart.getDate() + 2);
    targetStart.setHours(0, 0, 0, 0);
    const targetEnd = new Date();
    targetEnd.setDate(targetEnd.getDate() + 4);
    targetEnd.setHours(0, 0, 0, 0);

    let sentCount = 0;
    for (const brand of trialBrands) {
      const endDate = new Date(brand.trial_end_date);
      endDate.setHours(0, 0, 0, 0);
      if (endDate >= targetStart && endDate < targetEnd) {
        const diffMs = endDate.getTime() - now.getTime();
        const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (daysRemaining >= 2 && daysRemaining <= 3) {
          try {
            await notificationService.sendTrialEndingSoon(brand as Brand, daysRemaining);
            sentCount++;
          } catch (err) {
            console.error(`   ❌ Error al enviar trial ending a ${brand.email}:`, err);
          }
        }
      }
    }
    console.log(`   ✅ ${sentCount} notificación(es) de trial por vencer enviada(s)`);
    return sentCount;
  } catch (error) {
    console.error('   ❌ Error enviando notificaciones de trial por vencer:', error);
    return 0;
  }
}

/**
 * Envía email de nudge a trials que no han completado setup (sin productos o sin landing).
 * Solo para trials que vencen en 2 o 3 días Y no han subido productos o no tienen landing.
 */
async function sendTrialNudgeSetupNotifications(): Promise<number> {
  try {
    console.log('\n📧 Enviando notificaciones de nudge de setup a trials...');
    const { supabaseAdmin } = await import('../config/supabase');
    const now = new Date();
    const fourDaysFromNow = new Date();
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);

    const { data: trialBrands, error } = await supabaseAdmin
      .from('brands')
      .select('*, products:products(count)')
      .eq('plan', 'TRIAL')
      .eq('trial_payment_status', 'active')
      .not('trial_end_date', 'is', null)
      .gte('trial_end_date', now.toISOString())
      .lte('trial_end_date', fourDaysFromNow.toISOString());

    if (error) throw new Error('Error al obtener trials para nudge: ' + error.message);
    if (!trialBrands || trialBrands.length === 0) {
      console.log('   ℹ️  No hay trials para nudge de setup');
      return 0;
    }

    const targetStart = new Date();
    targetStart.setDate(targetStart.getDate() + 2);
    targetStart.setHours(0, 0, 0, 0);
    const targetEnd = new Date();
    targetEnd.setDate(targetEnd.getDate() + 4);
    targetEnd.setHours(0, 0, 0, 0);

    let sentCount = 0;
    for (const brand of trialBrands) {
      const endDate = new Date(brand.trial_end_date);
      endDate.setHours(0, 0, 0, 0);
      if (endDate >= targetStart && endDate < targetEnd) {
        const diffMs = endDate.getTime() - now.getTime();
        const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (daysRemaining >= 2 && daysRemaining <= 3) {
          const productsCount = (brand as any).products?.[0]?.count ?? 0;
          const hasProducts = productsCount > 0;
          const hasLanding = brand.has_landing_page === true;
          if (!hasProducts || !hasLanding) {
            try {
              await notificationService.sendTrialNudgeSetup(brand as Brand, daysRemaining);
              sentCount++;
            } catch (err) {
              console.error(`   ❌ Error al enviar nudge setup a ${brand.email}:`, err);
            }
          }
        }
      }
    }
    console.log(`   ✅ ${sentCount} notificación(es) de nudge setup enviada(s)`);
    return sentCount;
  } catch (error) {
    console.error('   ❌ Error enviando notificaciones de nudge setup:', error);
    return 0;
  }
}

/**
 * Envía notificaciones de suspensión a marcas suspendidas
 * Solo envía a marcas suspendidas en las últimas 24 horas para evitar spam.
 */
async function sendSuspensionNotifications(): Promise<number> {
  try {
    console.log('\n📧 Enviando notificaciones de suspensión...');
    
    const { supabaseAdmin } = await import('../config/supabase');
    
    // Solo marcas suspendidas en las últimas 24 horas
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: suspendedBrands, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('subscription_status', 'suspended')
      .gte('subscription_end_date', yesterday.toISOString());

    if (error) {
      throw new Error('Error al obtener marcas suspendidas: ' + error.message);
    }

    if (!suspendedBrands || suspendedBrands.length === 0) {
      console.log('   ℹ️  No hay marcas recién suspendidas para notificar');
      return 0;
    }

    let sentCount = 0;
    for (const brand of suspendedBrands) {
      try {
        await notificationService.sendSuspensionNotice(brand as Brand);
        sentCount++;
      } catch (error) {
        console.error(`   ❌ Error al enviar notificación de suspensión a ${brand.email}:`, error);
      }
    }

    console.log(`   ✅ ${sentCount} notificación(es) de suspensión enviada(s)`);
    return sentCount;
  } catch (error) {
    console.error('   ❌ Error al enviar notificaciones de suspensión:', error);
    return 0;
  }
}

export async function runDailySubscriptionCheck() {
  console.log('=================================================');
  console.log('Iniciando verificación diaria de suscripciones...');
  console.log('Fecha y hora:', new Date().toISOString());
  console.log('=================================================\n');

  try {
    // 1. Ejecutar actualización de estados de suscripciones
    console.log('🔄 Actualizando estados de suscripciones...');
    const result = await subscriptionService.updateSubscriptionStatuses();

    // Logging de resultados de actualización
    console.log('\n✅ Actualización de estados completada\n');
    console.log('📊 Resumen de actualizaciones:');
    console.log(`   - Suscripciones marcadas como EXPIRED: ${result.expired}`);
    console.log(`   - Suscripciones marcadas como EXPIRING_SOON: ${result.expiringSoon}`);
    console.log(`   - Marcas SUSPENDIDAS: ${result.suspended}`);

    // 2. Enviar notificaciones según el estado
    console.log('\n📬 Iniciando envío de notificaciones...');
    
    // Enviar recordatorios a marcas que vencen en 7 días
    const notifications7Days = await sendExpirationNotifications(7);
    
    // Enviar recordatorios a marcas que vencen en 3 días
    const notifications3Days = await sendExpirationNotifications(3);
    
    // Enviar notificaciones a marcas que vencen hoy
    const notificationsToday = await sendExpirationNotifications(0);
    
    // Enviar notificaciones de suspensión a marcas suspendidas
    const suspensionNotifications = await sendSuspensionNotifications();

    // Enviar notificaciones de trial por vencer (2-3 días)
    const trialEndingNotifications = await sendTrialEndingNotifications();

    // Enviar nudge de setup a trials sin productos o sin landing
    const trialNudgeSetupNotifications = await sendTrialNudgeSetupNotifications();

    // Resumen final
    console.log('\n=================================================');
    console.log('✅ Verificación completada exitosamente\n');
    console.log('📊 Resumen de acciones realizadas:');
    console.log('\n   Estados actualizados:');
    console.log(`   - Suscripciones marcadas como EXPIRED: ${result.expired}`);
    console.log(`   - Suscripciones marcadas como EXPIRING_SOON: ${result.expiringSoon}`);
    console.log(`   - Marcas SUSPENDIDAS: ${result.suspended}`);
    console.log('\n   Notificaciones enviadas:');
    console.log(`   - Recordatorios 7 días: ${notifications7Days}`);
    console.log(`   - Recordatorios 3 días: ${notifications3Days}`);
    console.log(`   - Notificaciones vencimiento hoy: ${notificationsToday}`);
    console.log(`   - Notificaciones de suspensión: ${suspensionNotifications}`);
    console.log(`   - Notificaciones trial por vencer: ${trialEndingNotifications}`);
    console.log(`   - Nudge setup trials: ${trialNudgeSetupNotifications}`);
    
    const totalNotifications = notifications7Days + notifications3Days + notificationsToday + suspensionNotifications + trialEndingNotifications + trialNudgeSetupNotifications;
    console.log(`\n   📧 Total de notificaciones enviadas: ${totalNotifications}`);

    // Detalles adicionales
    if (result.expired > 0) {
      console.log(`\n⚠️  ${result.expired} suscripción(es) vencieron hoy`);
    }

    if (result.expiringSoon > 0) {
      console.log(`⏰ ${result.expiringSoon} suscripción(es) vencen en menos de 7 días`);
    }

    if (result.suspended > 0) {
      console.log(`🚫 ${result.suspended} marca(s) fueron suspendidas por falta de pago`);
    }

    if (result.expired === 0 && result.expiringSoon === 0 && result.suspended === 0 && totalNotifications === 0) {
      console.log('\n✨ No hay suscripciones que requieran actualización ni notificaciones que enviar');
    }

    console.log('\n=================================================');
    console.log('Verificación finalizada');
    console.log('=================================================');

    return {
      ...result,
      notifications: {
        reminder7Days: notifications7Days,
        reminder3Days: notifications3Days,
        expirationToday: notificationsToday,
        suspension: suspensionNotifications,
        trialEnding: trialEndingNotifications,
        trialNudgeSetup: trialNudgeSetupNotifications,
        total: totalNotifications,
      },
    };
  } catch (error) {
    console.error('\n❌ Error durante la verificación de suscripciones:');
    console.error(error);
    console.error('\n=================================================');
    console.error('Verificación finalizada con errores');
    console.error('=================================================');

    throw error;
  }
}

// Ejecutar el script solo si se ejecuta directamente (no en tests)
if (require.main === module) {
  runDailySubscriptionCheck()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
