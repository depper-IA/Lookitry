'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, RegisterData, LoginData, AuthResponse } from '@/services/auth.service';
import { brandsService } from '@/services/brands.service';

export function useAuth() {
  const router = useRouter();
  const [brand, setBrand] = useState<AuthResponse['brand'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      const storedBrand = authService.getBrand();
      if (storedBrand && !cancelled) {
        setBrand(storedBrand);
      }

      try {
        const currentBrand = await brandsService.getCurrentBrand();
        if (!cancelled) {
          setBrand(currentBrand);
          localStorage.setItem('brand', JSON.stringify(currentBrand));
        }
      } catch {
        if (!cancelled && !storedBrand) {
          setBrand(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authService.register(data);
      setBrand(response.brand);
      router.push('/dashboard');
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al registrar la marca';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginData, redirectTo?: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authService.login(data);
      setBrand(response.brand);
      router.push(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard');
      return response;
    } catch (err: any) {
      console.error('[useAuth] Login error:', err);
      let errorMessage = err.response?.data?.message || err.message || 'Error al iniciar sesión';
      
      // Manejar específicamente errores de red (CORS o desconexión)
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión o intenta de nuevo más tarde.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setBrand(null);
    router.push('/login');
  };

  const refreshBrand = async () => {
    try {
      setIsLoading(true);
      const data = await brandsService.getCurrentBrand();
      setBrand(data);
      localStorage.setItem('brand', JSON.stringify(data));
    } catch (err) {
      console.error('Error refreshing brand:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    brand,
    isAuthenticated: !!brand,
    isLoading,
    error,
    refreshBrand,
    register,
    login,
    logout,
  };
}
