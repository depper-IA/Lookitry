import { authService } from './auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function isAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/registro-pro') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/register/google-setup') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/trial-checkout')
  );
}

function getFullUrl(path: string): string {
  const base = (API_URL || '').replace(/\/api$/, '');
  const cleanPath = path.startsWith('/api/') ? path : `/api${path}`;
  return `${base}${cleanPath}`;
}

// Wrapper que imita la interfaz de axios ({ data, status })
// Las credenciales se envian exclusivamente via cookies HTTP-Only.
async function apiFetch<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<{ data: T; status: number }> {
  const isFormData = typeof window !== 'undefined' && body instanceof FormData;
  const storedToken = typeof window !== 'undefined' ? authService.getToken() : null;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(storedToken && !(extraHeaders || {})['Authorization'] ? { Authorization: `Bearer ${storedToken}` } : {}),
    ...(extraHeaders || {}),
  };

  const url = getFullUrl(path);

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: isFormData ? (body as any) : (body !== undefined ? JSON.stringify(body) : undefined),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const hasLocalSession = !!authService.getBrand() || !!authService.getToken();
    const isBrandNotFound = data?.message?.includes('Marca no encontrada');

    if (!isAuthRoute(currentPath) && typeof window !== 'undefined') {
      if (hasLocalSession || isBrandNotFound) {
        authService.clearSession();
        authService.logout().catch(() => {});
        window.location.href = '/';
      }
    }
  }

  if (!res.ok) {
    const err: any = new Error(data?.message || 'Request failed');
    err.response = { data, status: res.status };
    throw err;
  }

  return { data: data as T, status: res.status };
}

export const api = {
  get: <T>(path: string) => apiFetch<T>('GET', path),
  post: <T>(path: string, body?: unknown) => apiFetch<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => apiFetch<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>('PATCH', path, body),
  delete: <T>(path: string, body?: unknown) => apiFetch<T>('DELETE', path, body),
};
