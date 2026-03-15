const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
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
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('brand', JSON.stringify(response.brand));
    }
    return response;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('brand', JSON.stringify(response.brand));
    }
    return response;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('brand');
    localStorage.removeItem('brandToken');
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || localStorage.getItem('brandToken');
  }

  getBrand(): AuthResponse['brand'] | null {
    if (typeof window === 'undefined') return null;
    const brandStr = localStorage.getItem('brand');
    return brandStr ? JSON.parse(brandStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
