import { Request, Response } from 'express';

import axios from 'axios';

import os from 'os';

import { supabaseAdmin } from '../config/supabase';

import { emailService } from '../services/email.service';

import { N8nClient } from '../services/n8n.client';

import { createAdminNotification } from '../utils/adminNotifications';

import { redis } from '../config/redis';



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

  // Usar siempre el health endpoint público de n8n, NO el webhook de producción

  // El webhook de tryon es: https://n8n.wilkiedevs.com/webhook/tryon

  // El health endpoint es: https://n8n.wilkiedevs.com/healthz

  const n8nHealthUrl = 'https://n8n.wilkiedevs.com/healthz';



  try {

    await withTimeout(

      axios.get(n8nHealthUrl, {

        timeout: 5000,

        validateStatus: (status) => status >= 200 && status < 300,

      }),

      5000

    );

    return { status: 'ok', latency: Date.now() - start };

  } catch (err: any) {

    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {

      console.error(`[HealthCheck] n8n network error:`, err.message);

      return { status: 'down', latency: Date.now() - start };

    }

    console.error(`[HealthCheck] n8n health check failed:`, err.message);

    return { status: 'degraded', latency: Date.now() - start };

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



async function checkRedis(): Promise<ServiceResult> {

  const start = Date.now();

  try {

    const result = await redis.ping();

    const latency = Date.now() - start;

    if (result === 'PONG') {

      return { status: 'ok', latency };

    }

    return { status: 'degraded', latency };

  } catch (err: any) {

    console.error(`[HealthCheck] Redis error:`, err.message);

    return { status: 'down', latency: Date.now() - start };

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

  redis: 'Redis',

};



const SERVICE_NOTIF_TYPE: Record<string, { down: string; recovered: string }> = {

  supabase: { down: 'service_down', recovered: 'service_recovered' },

  n8n:      { down: 'service_down', recovered: 'service_recovered' },

  email:    { down: 'smtp_down',    recovered: 'smtp_recovered' },

  minio:    { down: 'service_down', recovered: 'service_recovered' },

  redis:    { down: 'service_down', recovered: 'service_recovered' },

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

  const [supabaseResult, n8nResult, emailResult, minioResult, redisResult] = await Promise.allSettled([

    checkSupabase(),

    checkN8n(),

    checkEmail(),

    checkMinio(),

    checkRedis(),

  ]);



  const servicesMap = {

    supabase: supabaseResult.status === 'fulfilled' ? supabaseResult.value : { status: 'down' as ServiceStatus, latency: 0 },

    n8n: n8nResult.status === 'fulfilled' ? n8nResult.value : { status: 'down' as ServiceStatus, latency: 0 },

    email: emailResult.status === 'fulfilled' ? emailResult.value : { status: 'down' as ServiceStatus, latency: 0 },

    minio: minioResult.status === 'fulfilled' ? minioResult.value : { status: 'down' as ServiceStatus, latency: 0 },

    redis: redisResult.status === 'fulfilled' ? redisResult.value : { status: 'down' as ServiceStatus, latency: 0 },

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



  // CPU usage (1 minute average)

  const cpus = os.cpus();

  let totalIdle = 0, totalTick = 0;

  for (const cpu of cpus) {

    for (const type in cpu.times) {

      totalTick += cpu.times[type as keyof typeof cpu.times];

    }

    totalIdle += cpu.times.idle;

  }

  const cpuPercent = ((totalTick - totalIdle) / totalTick) * 100;



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

    cpu: {

      percent: cpuPercent,

      cores: cpus.length,

    },

    redis: {

      status: servicesMap.redis.status === 'ok' ? 'connected' : 'disconnected',

    }

  };



  res.status(status === 'down' ? 503 : 200).json(body);

}

