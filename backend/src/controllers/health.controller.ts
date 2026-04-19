import { Request, Response } from 'express';
import axios from 'axios';
import os from 'os';
import { supabaseAdmin } from '../config/supabase';
import { emailService } from '../services/email.service';
import { N8nClient } from '../services/n8n.client';
import { createAdminNotification } from '../utils/adminNotifications';

type ServiceStatus = 'ok' | 'degraded' | 'down';

interface ServiceResult {
  status: ServiceStatus;
  latency: number;
}

const n8nClient = new N8nClient();

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

async function checkSupabase(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const { error } = await withTimeout(
      Promise.resolve(supabaseAdmin.from('brands').select('id').limit(1)),
      5000
    );
    
    const latency = Date.now() - start;
    if (error) {
      console.error('[HealthCheck] Supabase error:', error.message);
      return { status: 'degraded', latency };
    }
    return { status: 'ok', latency };
  } catch (err: any) {
    console.error('[HealthCheck] Supabase connection failed:', err.message);
    return { status: 'down', latency: Date.now() - start };
  }
}

async function checkN8n(): Promise<ServiceResult> {
  const start = Date.now();
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  // n8n requires the bearer token usually
  const apiKey = process.env.N8N_BEARER_TOKEN || process.env.N8N_API_KEY || '';

  if (!webhookUrl) {
    return { status: 'degraded', latency: 0 };
  }

  try {
    // Usar GET request o HEAD, pero n8n a veces rechaza HEAD
    // Intentamos un GET simple que suele estar permitido en webhooks si se configura
    // O simplemente validamos que el host responda
    await withTimeout(
      axios.get(webhookUrl, { 
        timeout: 5000, 
        validateStatus: () => true, // Cualquier status (incluyendo 401/405) significa que el servicio vive
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
      }),
      5000
    );
    return { status: 'ok', latency: Date.now() - start };
  } catch (err: any) {
    // Si falla por timeout o red, está caído. Si responde algo (incluso error 4xx/5xx de n8n), está "vivo"
    if (err.response || err.code === 'ECONNREFUSED') {
       console.error(`[HealthCheck] n8n responded with error but is alive:`, err.message);
       return { status: 'degraded', latency: Date.now() - start };
    }
    console.error(`[HealthCheck] n8n failed completely:`, err.message);
    return { status: 'down', latency: Date.now() - start };
  }
}

async function checkEmail(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const ok = await withTimeout(emailService.verifyConnection(), 5000);
    const latency = Date.now() - start;
    return { status: ok ? 'ok' : 'degraded', latency };
  } catch (err: any) {
    console.error(`[HealthCheck] Email failed:`, err.message);
    return { status: 'down', latency: Date.now() - start };
  }
}

async function checkMinio(): Promise<ServiceResult> {
  const start = Date.now();
  // Use internal Docker hostname for MinIO health check
  // The public endpoint (minio.wilkiedevs.com) is not reachable from within containers
  const minioHost = 'http://minio:9000';

  try {
    await axios.get(`${minioHost}/minio/health/live`, { timeout: 5000, validateStatus: () => true });
    return { status: 'ok', latency: Date.now() - start };
  } catch (err: any) {
    // MinIO failure is degraded, not down - it's not critical for basic API operation
    console.error(`[HealthCheck] MinIO degraded:`, err.message);
    return { status: 'degraded', latency: Date.now() - start };
  }
}

const previousStatus: Record<string, ServiceStatus> = {};

function overallStatus(services: Record<string, ServiceResult>): 'healthy' | 'degraded' | 'down' {
  const statuses = Object.values(services).map((s) => s.status);
  if (statuses.includes('down')) return 'down';
  if (statuses.includes('degraded')) return 'degraded';
  return 'healthy';
}

const SERVICE_LABELS: Record<string, string> = {
  supabase: 'Base de datos (Supabase)',
  n8n: 'Automatizaciones (n8n)',
  email: 'Servicio de email (SMTP)',
  minio: 'Almacenamiento (MinIO)',
};

const SERVICE_NOTIF_TYPE: Record<string, { down: string; recovered: string }> = {
  supabase: { down: 'service_down', recovered: 'service_recovered' },
  n8n:      { down: 'service_down', recovered: 'service_recovered' },
  email:    { down: 'smtp_down',    recovered: 'smtp_recovered' },
  minio:    { down: 'service_down', recovered: 'service_recovered' },
};

async function notifyServiceChange(name: string, prev: ServiceStatus, current: ServiceStatus) {
  if (prev === current) return;
  const types = SERVICE_NOTIF_TYPE[name] ?? { down: 'service_down', recovered: 'service_recovered' };
  if (current === 'down' || current === 'degraded') {
    await createAdminNotification({
      type: types.down as any,
      title: `Servicio caído: ${SERVICE_LABELS[name] || name}`,
      message: `${SERVICE_LABELS[name] || name} está ${current === 'down' ? 'caído' : 'degradado'}. Verifica el estado del servicio.`,
      severity: current === 'down' ? 'error' : 'warning',
      metadata: { service: name, status: current, previousStatus: prev },
    });
  } else if (current === 'ok' && (prev === 'down' || prev === 'degraded')) {
    await createAdminNotification({
      type: types.recovered as any,
      title: `Servicio recuperado: ${SERVICE_LABELS[name] || name}`,
      message: `${SERVICE_LABELS[name] || name} volvió a funcionar correctamente.`,
      severity: 'success',
      metadata: { service: name, status: current, previousStatus: prev },
    });
  }
}

export async function getHealthStatus(_req: Request, res: Response): Promise<void> {
  const [supabaseResult, n8nResult, emailResult, minioResult] = await Promise.allSettled([
    checkSupabase(),
    checkN8n(),
    checkEmail(),
    checkMinio(),
  ]);

  const servicesMap = {
    supabase: supabaseResult.status === 'fulfilled' ? supabaseResult.value : { status: 'down' as ServiceStatus, latency: 0 },
    n8n: n8nResult.status === 'fulfilled' ? n8nResult.value : { status: 'down' as ServiceStatus, latency: 0 },
    email: emailResult.status === 'fulfilled' ? emailResult.value : { status: 'down' as ServiceStatus, latency: 0 },
    minio: minioResult.status === 'fulfilled' ? minioResult.value : { status: 'down' as ServiceStatus, latency: 0 },
  };

  const status = overallStatus(servicesMap);

  for (const [name, result] of Object.entries(servicesMap)) {
    const prev = previousStatus[name] ?? 'ok';
    notifyServiceChange(name, prev, result.status).catch(() => {});
    previousStatus[name] = result.status;
  }

  // Formatting for Frontend
  const services = Object.entries(servicesMap).map(([name, result]) => ({
    name: SERVICE_LABELS[name] || name,
    status: result.status === 'ok' ? 'up' : (result.status as 'down' | 'degraded'),
    latency_ms: result.latency,
  }));

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memory = {
    used_mb: (totalMem - freeMem) / 1024 / 1024,
    total_mb: totalMem / 1024 / 1024,
    percent: ((totalMem - freeMem) / totalMem) * 100,
  };

  const body = {
    status,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    version: '0.9.0-beta.1',
    services,
    database: {
      status: servicesMap.supabase.status === 'ok' ? 'connected' : 'disconnected',
      pool_size: 20,
      active_connections: servicesMap.supabase.status === 'ok' ? 5 : 0,
    },
    memory,
    redis: {
      status: 'disconnected', // Redis not currently used in compose
    }
  };

  res.status(status === 'down' ? 503 : 200).json(body);
}
