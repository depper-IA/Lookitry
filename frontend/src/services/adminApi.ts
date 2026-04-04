/**
 * Cliente HTTP centralizado para el panel de administración.
 * Maneja automáticamente el token de admin y redirige a /admin/login en caso de 401.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminUser');
  window.location.href = '/admin/login';
}

function getFullUrl(path: string): string {
  // Asegurar que API_BASE no termina en /api si el path ya lo maneja, 
  // o viceversa. Aquí normalizamos para que siempre se use la base correcta.
  const base = API_BASE.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/api') ? path : `/api${path}`;
  return `${base}${cleanPath}`;
}

export async function adminFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = typeof window !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };

  const url = getFullUrl(path);

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesión inválida o expirada. Redirigiendo al login...');
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
    adminFetch<T>(path, { 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),

  put: <T = any>(path: string, body?: unknown) =>
    adminFetch<T>(path, { 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),

  patch: <T = any>(path: string, body?: unknown) =>
    adminFetch<T>(path, { 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),

  delete: <T = any>(path: string, body?: unknown) =>
    adminFetch<T>(path, { 
      method: 'DELETE', 
      ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) 
    }),
};
