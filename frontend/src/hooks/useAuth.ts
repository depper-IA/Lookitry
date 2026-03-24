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

      // Si la marca tiene trial pendiente de verificación de tarjeta → redirigir
      const brandData = response.brand as any;
      if (
        brandData.trialEndDate &&
        brandData.trialPaymentStatus === 'pending_payment'
      ) {
        router.push('/trial-payment');
        return response;
      }

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
