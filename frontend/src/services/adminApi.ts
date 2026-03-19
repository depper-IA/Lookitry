/**
 * Cliente HTTP centralizado para el panel de administración.
 * Maneja automáticamente el token de admin y redirige a /admin/login en caso de 401.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('adminToken') ?? '';
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = '/admin/login';
}

export async function adminFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Token inválido o expirado. Redirigiendo al login...');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: any = new Error(data?.message || `Error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const adminApi = {
  get: <T = any>(path: string) =>
    adminFetch<T>(path, { method: 'GET' }),

  post: <T = any>(path: string, body?: unknown) =>
    adminFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T = any>(path: string, body?: unknown) =>
    adminFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T = any>(path: string, body?: unknown) =>
    adminFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T = any>(path: string, body?: unknown) =>
    adminFetch<T>(path, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }),
};
