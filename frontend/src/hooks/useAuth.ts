'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, RegisterData, LoginData, AuthResponse } from '@/services/auth.service';

export function useAuth() {
  const router = useRouter();
  const [brand, setBrand] = useState<AuthResponse['brand'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay una sesión activa al montar el componente
    const storedBrand = authService.getBrand();
    if (storedBrand) {
      setBrand(storedBrand);
    }
    setIsLoading(false);
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

  const login = async (data: LoginData) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authService.login(data);
      setBrand(response.brand);
      router.push('/dashboard');
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al iniciar sesión';
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

  return {
    brand,
    isAuthenticated: !!brand,
    isLoading,
    error,
    register,
    login,
    logout,
  };
}
