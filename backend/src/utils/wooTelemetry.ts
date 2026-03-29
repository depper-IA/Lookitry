import { supabaseAdmin } from '../config/supabase';

export interface WooTelemetrySummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  totalRetries: number;
  lastSyncAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  storeDomain: string | null;
}

export interface WooProductSummary {
  totalMappedProducts: number;
  activeMappedProducts: number;
}

export async function getWooProductSummary(brandId: string): Promise<WooProductSummary> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('external_id, is_active')
    .eq('brand_id', brandId)
    .not('external_id', 'is', null);

  if (error) {
    throw new Error(`Error al obtener productos WooCommerce: ${error.message}`);
  }

  const rows = data || [];

  return {
    totalMappedProducts: rows.length,
    activeMappedProducts: rows.filter((row) => row.is_active).length,
  };
}

export async function getWooTelemetrySummary(
  brandId: string,
  days = 30
): Promise<WooTelemetrySummary> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('plugin_telemetry_events')
    .select('success, duration_ms, retry_count, error_message, endpoint, created_at, store_domain')
    .eq('brand_id', brandId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Error al obtener telemetria WooCommerce: ${error.message}`);
  }

  const rows = data || [];
  const totalRequests = rows.length;
  const successfulRequests = rows.filter((row) => row.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const avgLatencyMs = totalRequests
    ? Math.round(rows.reduce((sum, row) => sum + Math.max(0, row.duration_ms || 0), 0) / totalRequests)
    : 0;
  const totalRetries = rows.reduce((sum, row) => sum + Math.max(0, row.retry_count || 0), 0);

  const lastSync = rows.find((row) => row.endpoint === '/api/pruebalo/sync-woocommerce' && row.success);
  const lastError = rows.find((row) => !row.success);
  const firstWithDomain = rows.find((row) => !!row.store_domain);

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    avgLatencyMs,
    totalRetries,
    lastSyncAt: lastSync?.created_at || null,
    lastErrorAt: lastError?.created_at || null,
    lastErrorMessage: lastError?.error_message || null,
    storeDomain: firstWithDomain?.store_domain || null,
  };
}
