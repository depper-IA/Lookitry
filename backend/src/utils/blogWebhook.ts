import axios from 'axios';

type BlogWebhookAttempt = {
  label: string;
  headers: Record<string, string>;
};

type BlogTriggerResult = {
  attempt: string;
  status: number;
  data: unknown;
};

function normalizeSecret(rawSecret?: string | null): string {
  return (rawSecret || '').trim();
}

function buildAttemptHeaders(secret: string): BlogWebhookAttempt[] {
  if (!secret) {
    return [{ label: 'none', headers: {} }];
  }

  if (secret.startsWith('basic:')) {
    const credentials = secret.slice('basic:'.length).trim();
    return [{
      label: 'basic-prefixed',
      headers: {
        Authorization: `Basic ${Buffer.from(credentials).toString('base64')}`,
      },
    }];
  }

  if (secret.startsWith('bearer:')) {
    const token = secret.slice('bearer:'.length).trim();
    return [{
      label: 'bearer-prefixed',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }];
  }

  if (secret.includes(':')) {
    return [{
      label: 'basic-colon-secret',
      headers: {
        Authorization: `Basic ${Buffer.from(secret).toString('base64')}`,
      },
    }];
  }

  return [
    {
      label: 'x-n8n-secret',
      headers: { 'x-n8n-secret': secret },
    },
    {
      label: 'x-blog-secret',
      headers: { 'x-blog-secret': secret },
    },
    {
      label: 'authorization-raw',
      headers: { Authorization: secret },
    },
    {
      label: 'bearer-raw',
      headers: { Authorization: `Bearer ${secret}` },
    },
  ];
}

function buildErrorMessage(statuses: Array<{ label: string; status: number; data: unknown }>): string {
  if (statuses.length === 0) {
    return 'No se pudo autenticar el webhook de n8n.';
  }

  const joined = statuses
    .map((entry) => `${entry.label}: ${entry.status}`)
    .join(' | ');

  const authFailures = statuses.every((entry) => entry.status === 401 || entry.status === 403);
  if (authFailures) {
    return `n8n rechazó la autenticación del webhook. Intentos: ${joined}`;
  }

  const notFound = statuses.every((entry) => entry.status === 404);
  if (notFound) {
    return `El webhook de n8n no existe o no está activo. Intentos: ${joined}`;
  }

  return `n8n devolvió una respuesta inválida. Intentos: ${joined}`;
}

export function inferBlogWebhookAuthMode(secret?: string | null): 'none' | 'header' | 'basic' | 'bearer' {
  const normalized = normalizeSecret(secret);

  if (!normalized) return 'none';
  if (normalized.startsWith('basic:') || normalized.includes(':')) return 'basic';
  if (normalized.startsWith('bearer:')) return 'bearer';
  return 'header';
}

export async function triggerBlogWebhook(url: string, secret?: string | null, triggeredBy: string = 'unknown'): Promise<BlogTriggerResult> {
  const normalizedSecret = normalizeSecret(secret);
  const attempts = buildAttemptHeaders(normalizedSecret);
  const failures: Array<{ label: string; status: number; data: unknown }> = [];

  for (const attempt of attempts) {
    const response = await axios.post(
      url,
      { triggered_by: triggeredBy },
      {
        headers: {
          'Content-Type': 'application/json',
          ...attempt.headers,
        },
        timeout: 15000,
        validateStatus: () => true,
      }
    );

    if (response.status >= 200 && response.status < 300) {
      return {
        attempt: attempt.label,
        status: response.status,
        data: response.data,
      };
    }

    failures.push({
      label: attempt.label,
      status: response.status,
      data: response.data,
    });
  }

  throw new Error(buildErrorMessage(failures));
}
