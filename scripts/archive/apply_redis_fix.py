# Apply Redis health check fix to VPS

import os

def replace_in_file(filepath, old, new):
    with open(filepath, 'r') as f:
        content = f.read()

    if old not in content:
        print(f"WARNING: Pattern not found in {filepath}")
        return False

    content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated: {filepath}")
    return True

# 1. Add Redis import
filepath = '/root/virtual-tryon/backend/src/controllers/health.controller.ts'
old_import = "import { createAdminNotification } from '../utils/adminNotifications';"
new_import = """import { createAdminNotification } from '../utils/adminNotifications';
import { redis } from '../config/redis';"""
replace_in_file(filepath, old_import, new_import)

# 2. Add checkRedis function after checkMinio
old_minio = """async function checkMinio(): Promise<ServiceResult> {
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

const previousStatus"""

new_minio = """async function checkMinio(): Promise<ServiceResult> {
  const start = Date.now();
  // Use internal Docker hostname for MinIO health check
  // The public endpoint (minio.wilkiedvs.com) is not reachable from within containers
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

const previousStatus"""

replace_in_file(filepath, old_minio, new_minio)

# 3. Add redis to SERVICE_LABELS
old_labels = """const SERVICE_LABELS: Record<string, string> = {
  supabase: 'Base de datos (Supabase)',
  n8n: 'Automatizaciones (n8n)',
  email: 'Servicio de email (SMTP)',
  minio: 'Almacenamiento (MinIO)',
};"""

new_labels = """const SERVICE_LABELS: Record<string, string> = {
  supabase: 'Base de datos (Supabase)',
  n8n: 'Automatizaciones (n8n)',
  email: 'Servicio de email (SMTP)',
  minio: 'Almacenamiento (MinIO)',
  redis: 'Redis',
};"""

replace_in_file(filepath, old_labels, new_labels)

# 4. Add redis to SERVICE_NOTIF_TYPE
old_notif = """const SERVICE_NOTIF_TYPE: Record<string, { down: string; recovered: string }> = {
  supabase: { down: 'service_down', recovered: 'service_recovered' },
  n8n:      { down: 'service_down', recovered: 'service_recovered' },
  email:    { down: 'smtp_down',    recovered: 'smtp_recovered' },
  minio:    { down: 'service_down', recovered: 'service_recovered' },
};"""

new_notif = """const SERVICE_NOTIF_TYPE: Record<string, { down: string; recovered: string }> = {
  supabase: { down: 'service_down', recovered: 'service_recovered' },
  n8n:      { down: 'service_down', recovered: 'service_recovered' },
  email:    { down: 'smtp_down',    recovered: 'smtp_recovered' },
  minio:    { down: 'service_down', recovered: 'service_recovered' },
  redis:    { down: 'service_down', recovered: 'service_recovered' },
};"""

replace_in_file(filepath, old_notif, new_notif)

# 5. Update getHealthStatus to include Redis
old_health = """  const [supabaseResult, n8nResult, emailResult, minioResult] = await Promise.allSettled([
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
  };"""

new_health = """  const [supabaseResult, n8nResult, emailResult, minioResult, redisResult] = await Promise.allSettled([
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
  };"""

replace_in_file(filepath, old_health, new_health)

# 6. Update the redis status in body
old_body_redis = """    redis: {
      status: 'disconnected', // Redis not currently used in compose
    }"""

new_body_redis = """    redis: {
      status: servicesMap.redis.status === 'ok' ? 'connected' : 'disconnected',
    }"""

replace_in_file(filepath, old_body_redis, new_body_redis)

print("\nDone! All replacements complete.")