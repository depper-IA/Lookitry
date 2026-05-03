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

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function executeRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = fetch(getFullUrl('/auth/refresh'), {
    method: 'POST',
    credentials: 'include'
  }).then(res => {
    isRefreshing = false;
    refreshPromise = null;
    return res.ok;
  }).catch(() => {
    isRefreshing = false;
    refreshPromise = null;
    return false;
  });
  return refreshPromise;
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

  let res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: isFormData ? (body as any) : (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (res.status === 401 && !url.includes('/auth/refresh') && !url.includes('/auth/login') && !url.includes('/auth/logout')) {
    const refreshSuccess = await executeRefresh();
    if (refreshSuccess) {
      const storedTokenAfterRefresh = typeof window !== 'undefined' ? authService.getToken() : null;
      if (storedTokenAfterRefresh && !(extraHeaders || {})['Authorization']) {
        headers['Authorization'] = `Bearer ${storedTokenAfterRefresh}`;
      }
      res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: isFormData ? (body as any) : (body !== undefined ? JSON.stringify(body) : undefined),
      });
    } else {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (!isAuthRoute(currentPath) && typeof window !== 'undefined') {
        authService.clearSession();
        window.location.href = '/login';
      }
    }
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && url.includes('/auth/refresh')) {
     // Ya lo maneja arriba, pero si llega aca por peticiones asincronas:
     const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
     if (!isAuthRoute(currentPath) && typeof window !== 'undefined') {
        authService.clearSession();
        window.location.href = '/login';
     }
  } else if (res.status === 401) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isBrandNotFound = data?.message?.includes('Marca no encontrada');
    if (!isAuthRoute(currentPath) && typeof window !== 'undefined') {
      if (isBrandNotFound) {
        authService.clearSession();
        window.location.href = '/login';
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
