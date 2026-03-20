const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

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
  brand: {
    id: string;
    email: string;
    name: string;
    slug: string;
    plan: string;
  };
}

/**
 * apiFetch — wrapper de fetch que siempre envía cookies (credentials: 'include').
 * Esto es necesario para que el backend reciba/envíe la cookie HTTP-Only del JWT.
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include', // ← enviar y recibir cookies cross-origin
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw { response: { data, status: res.status } };
  return data as T;
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // El token llega como cookie HTTP-Only → no se guarda en localStorage.
    // Solo guardamos los datos públicos de la marca para mostrar en la UI.
    if (response.brand) {
      localStorage.setItem('brand', JSON.stringify(response.brand));
    }
    return response;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // El token llega como cookie HTTP-Only → no se guarda en localStorage.
    if (response.brand) {
      localStorage.setItem('brand', JSON.stringify(response.brand));
    }
    return response;
  }

  logout(): void {
    localStorage.removeItem('brand');
    localStorage.removeItem('brand_plan');
    // Llamar al backend para limpiar la cookie HTTP-Only
    fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
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
    return brandStr ? JSON.parse(brandStr) : null;
  }

  isAuthenticated(): boolean {
    // Con cookies HTTP-Only no podemos verificar en cliente directamente;
    // comprobamos si tenemos datos de marca guardados (indicio de sesión activa).
    return !!this.getBrand();
  }
}

export const authService = new AuthService();
