import { Request, Response } from 'express';
import axios from 'axios';
import { supabase } from '../config/supabase';
import { emailService } from '../services/email.service';
import { N8nClient } from '../services/n8n.client';
import { UploadService } from '../services/upload.service';
import { createAdminNotification } from '../utils/adminNotifications';

type ServiceStatus = 'ok' | 'degraded' | 'down';

interface ServiceResult {
  status: ServiceStatus;
  latency: number;
}

const n8nClient = new N8nClient();
const uploadService = new UploadService();

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

async function checkSupabase(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const queryPromise = supabase.from('brands').select('id').limit(1);
    const result = await withTimeout(
      Promise.resolve(queryPromise) as Promise<{ error: unknown }>,
      5000
    );
    const latency = Date.now() - start;
    return { status: result.error ? 'degraded' : 'ok', latency };
  } catch {
    return { status: 'down', latency: Date.now() - start };
  }
}

async function checkN8n(): Promise<ServiceResult> {
  const start = Date.now();
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!n8nClient.isConfigured() || !webhookUrl) {
    return { status: 'degraded', latency: 0 };
  }

  try {
    await withTimeout(
      axios.head(webhookUrl, { timeout: 5000, validateStatus: () => true }),
      5000
    );
    // Cualquier respuesta HTTP significa que n8n está activo
    return { status: 'ok', latency: Date.now() - start };
  } catch {
    // Solo es 'down' si no hay respuesta (timeout, ECONNREFUSED, etc.)
    return { status: 'down', latency: Date.now() - start };
  }
}

async function checkEmail(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const ok = await withTimeout(emailService.verifyConnection(), 5000);
    const latency = Date.now() - start;
    return { status: ok ? 'ok' : 'degraded', latency };
  } catch {
    return { status: 'down', latency: Date.now() - start };
  }
}

async function checkMinio(): Promise<ServiceResult> {
  const start = Date.now();
  const endpoint = process.env.MINIO_ENDPOINT;

  if (!endpoint) return { status: 'degraded', latency: 0 };

  try {
    // Intentar un HEAD request al endpoint público o revisar accesibilidad
    // Una opción más robusta sería intentar listar un objeto o simplemente un ping HTTP
    await axios.get(`${endpoint}/minio/health/live`, { timeout: 3000, validateStatus: () => true });
    return { status: 'ok', latency: Date.now() - start };
  } catch {
    return { status: 'down', latency: Date.now() - start };
  }
}

// Estado previo de servicios para detectar cambios (en memoria, se resetea al reiniciar)
const previousStatus: Record<string, ServiceStatus> = {};

function overallStatus(services: Record<string, ServiceResult>): ServiceStatus {
  const statuses = Object.values(services).map((s) => s.status);
  if (statuses.includes('down')) return 'down';
  if (statuses.includes('degraded')) return 'degraded';
  return 'ok';
}

const SERVICE_LABELS: Record<string, string> = {
  supabase: 'Base de datos (Supabase)',
  n8n: 'Automatizaciones (n8n)',
  email: 'Servicio de email (SMTP)',
  minio: 'Almacenamiento (MinIO)',
};

// Mapeo de servicio → tipo de notificación (down/recovered)
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

  const services = {
    supabase: supabaseResult.status === 'fulfilled'
      ? supabaseResult.value
      : { status: 'down' as ServiceStatus, latency: 0 },
    n8n: n8nResult.status === 'fulfilled'
      ? n8nResult.value
      : { status: 'down' as ServiceStatus, latency: 0 },
    email: emailResult.status === 'fulfilled'
      ? emailResult.value
      : { status: 'down' as ServiceStatus, latency: 0 },
    minio: minioResult.status === 'fulfilled'
      ? minioResult.value
      : { status: 'down' as ServiceStatus, latency: 0 },
  };

  const status = overallStatus(services);

  // Detectar cambios de estado y notificar
  for (const [name, result] of Object.entries(services)) {
    const prev = previousStatus[name] ?? 'ok';
    notifyServiceChange(name, prev, result.status).catch(() => {});
    previousStatus[name] = result.status;
  }

  const body = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services,
  };

  res.status(status === 'down' ? 503 : 200).json(body);
}
