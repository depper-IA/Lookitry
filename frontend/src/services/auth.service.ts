const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

import { Brand } from '@/types';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  slug: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  brand: Brand;
}

/**
 * apiFetch — wrapper de fetch que siempre envía cookies (credentials: 'include').
 * Esto es necesario para que el backend reciba/envíe la cookie HTTP-Only del JWT.
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const normalizedApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const fullUrl = `${normalizedApiUrl}${path}`;
  
  const res = await fetch(fullUrl, {
    credentials: 'include', // ← enviar y recibir cookies cross-origin
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });

  let data: any = {};
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json().catch(() => ({}));
  } else {
    data = { message: await res.text().catch(() => 'Error de respuesta del servidor') };
  }

  if (!res.ok) throw { response: { data, status: res.status }, message: data.message };
  return data as T;
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('brand');
    localStorage.removeItem('brand_plan');
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
    
    try {
      const res = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) {
        console.error('Logout API error:', res.status);
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
    
    window.location.href = '/';
  }

  async refreshSession(): Promise<void> {
    await apiFetch<{ ok: boolean }>('/api/auth/refresh-session', {
      method: 'POST',
    });
  }

  clearSession(): void {
    localStorage.removeItem('brand');
    localStorage.removeItem('brand_plan');
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
  }

  /** @deprecated El token ya viaja como cookie HTTP-Only. Solo se mantiene para retrocompatibilidad con código legacy. */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // fallback por si algún lugar todavía almacena el token antiguo
    return localStorage.getItem('token') || localStorage.getItem('brandToken') || null;
  }

  getBrand(): AuthResponse['brand'] | null {
    if (typeof window === 'undefined') return null;
    const brandStr = localStorage.getItem('brand');
    
    if (!brandStr || brandStr === 'undefined') return null;

    try {
      return JSON.parse(brandStr);
    } catch (error) {
      console.error('Error parseando brand desde localStorage:', error);
      localStorage.removeItem('brand'); // Limpiar datos corruptos
      return null;
    }
  }

  isAuthenticated(): boolean {
    // Con cookies HTTP-Only no podemos verificar en cliente directamente;
    // comprobamos si tenemos datos de marca guardados (indicio de sesión activa).
    return !!this.getBrand();
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    return await apiFetch<{ message: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
}

export const authService = new AuthService();
