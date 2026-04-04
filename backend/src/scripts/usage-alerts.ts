/**
 * Script de verificación de alertas de uso de generaciones
 * 
 * Se ejecuta cada 6 horas para verificar marcas que han alcanzado
 * el 80% o 100% de su límite mensual de generaciones.
 */

import { supabaseAdmin } from '../config/supabase';
import { notificationService } from '../services/notification.service';
import { Brand } from '../types';

const ALERT_THRESHOLDS = [80, 100];

export async function checkAndSendUsageAlerts() {
  console.log('[UsageAlerts] Iniciando verificación de alertas de uso...');

  try {
    // Obtener todas las marcas con plan activo (no trial, no suspended)
    const { data: brands, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .in('subscription_status', ['active', 'trial']);

    if (error) {
      console.error('[UsageAlerts] Error obteniendo marcas:', error.message);
      return;
    }

    if (!brands || brands.length === 0) {
      console.log('[UsageAlerts] No hay marcas activas para verificar');
      return;
    }

    let alertsSent = 0;

    for (const brand of brands) {
      try {
        // Obtener estadísticas de uso
        const usageStats = await getUsageStats(brand.id);
        if (!usageStats) continue;

        const { used, limit } = usageStats;
        if (limit === 0) continue;

        const percentage = Math.round((used / limit) * 100);

        // Verificar si ya se envió alerta para este umbral este mes
        for (const threshold of ALERT_THRESHOLDS) {
          if (percentage >= threshold) {
            const alreadySent = await hasAlertSentThisMonth(brand.id, threshold);
            if (!alreadySent) {
              await notificationService.sendUsageAlert(
                brand as Brand,
                threshold,
                used,
                limit
              );
              await markAlertAsSent(brand.id, threshold);
              alertsSent++;
              console.log(`[UsageAlerts] Alerta ${threshold}% enviada a ${brand.email} (${used}/${limit})`);
            }
          }
        }
      } catch (error) {
        console.error(`[UsageAlerts] Error procesando marca ${brand.email}:`, error);
      }
    }

    console.log(`[UsageAlerts] Verificación completada. ${alertsSent} alerta(s) enviada(s)`);
  } catch (error) {
    console.error('[UsageAlerts] Error general:', error);
  }
}

async function getUsageStats(brandId: string): Promise<{ used: number; limit: number } | null> {
  try {
    // Obtener límite del plan
    const { data: pricingData } = await supabaseAdmin
      .from('pricing_config')
      .select('data')
      .eq('id', 'basic')
      .single();

    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('plan')
      .eq('id', brandId)
      .single();

    if (!brand) return null;

    const planKey = brand.plan?.toLowerCase() || 'basic';
    let limit = 400; // default BASIC

    if (planKey === 'pro') {
      limit = 1200;
    } else if (planKey === 'trial') {
      limit = 15;
    } else if (pricingData?.data?.generaciones_mensuales || pricingData?.data?.generaciones_mes) {
      limit = pricingData.data.generaciones_mensuales || pricingData.data.generaciones_mes;
    }

    // Contar generaciones este mes
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .gte('created_at', startOfMonth.toISOString());

    return { used: count || 0, limit };
  } catch (error) {
    console.error(`[UsageAlerts] Error obteniendo stats para ${brandId}:`, error);
    return null;
  }
}

async function hasAlertSentThisMonth(brandId: string, threshold: number): Promise<boolean> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count } = await supabaseAdmin
      .from('usage_alerts_log')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('threshold', threshold)
      .gte('created_at', startOfMonth.toISOString());

    return (count || 0) > 0;
  } catch {
    return false;
  }
}

async function markAlertAsSent(brandId: string, threshold: number): Promise<void> {
  try {
    await supabaseAdmin
      .from('usage_alerts_log')
      .insert({ brand_id: brandId, threshold });
  } catch (error) {
    console.error(`[UsageAlerts] Error registrando alerta para ${brandId}:`, error);
  }
}
