import { authService } from './auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function isAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/registro-pro')
  );
}

// Wrapper que imita la interfaz de axios ({ data, status })
async function apiFetch<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<{ data: T; status: number }> {
  const token = authService.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders || {}),
  };

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    authService.clearSession();
    if (typeof window !== 'undefined') {
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (!isAuthRoute(window.location.pathname)) {
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
