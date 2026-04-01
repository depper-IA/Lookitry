import { supabaseAdmin } from '../config/supabase';

export interface HealthAuditResult {
  summary: string;
  sections: string[];
}

export async function auditHealth(): Promise<HealthAuditResult> {
  const sections: string[] = [];

  try {
    const { data: brands, error: brandsError } = await supabaseAdmin
      .from('brands')
      .select('id')
      .limit(1);

    if (brandsError) {
      sections.push(`Supabase: ERROR - ${brandsError.message}`);
    } else {
      sections.push(`Supabase: OK`);
    }
  } catch (e) {
    sections.push(`Supabase: ERROR - ${(e as Error).message}`);
  }

  try {
    const minioEndpoint = process.env.MINIO_ENDPOINT || 'https://minio.wilkiedevs.com';
    const response = await fetch(minioEndpoint, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    sections.push(`MinIO: OK (${response.status})`);
  } catch (e) {
    sections.push(`MinIO: ERROR - ${(e as Error).message}`);
  }

  try {
    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.wilkiedevs.com';
    const baseUrl = n8nUrl.replace(/\/webhook.*/, '');
    const response = await fetch(baseUrl, { method: 'GET', signal: AbortSignal.timeout(5000) });
    sections.push(`n8n: OK (${response.status})`);
  } catch (e) {
    sections.push(`n8n: ERROR - ${(e as Error).message}`);
  }

  try {
    const wompiEnabled = process.env.WOMPI_ENABLED === 'true';
    if (wompiEnabled) {
      sections.push(`Wompi: Configurado`);
    } else {
      sections.push(`Wompi: Deshabilitado`);
    }
  } catch (e) {
    sections.push(`Wompi: ERROR - ${(e as Error).message}`);
  }

  try {
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    if (paypalClientId) {
      sections.push(`PayPal: Configurado`);
    } else {
      sections.push(`PayPal: No configurado`);
    }
  } catch (e) {
    sections.push(`PayPal: ERROR - ${(e as Error).message}`);
  }

  const uptime = process.uptime();
  const uptimeDays = Math.floor(uptime / 86400);
  const uptimeHours = Math.floor((uptime % 86400) / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  sections.push(`\nBackend uptime: ${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`);
  sections.push(`Node.js: ${process.version}`);
  sections.push(`Memoria: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB / ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)}MB`);

  const env = process.env.NODE_ENV || 'development';
  sections.push(`\nEntorno: ${env}`);

  const summary = `Health check del sistema`;

  return { summary, sections };
}
