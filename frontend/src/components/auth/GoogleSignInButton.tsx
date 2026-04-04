'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface GoogleSignInButtonProps {
  onSuccess?: (data?: any) => void;
  onError?: (error: string) => void;
  mode?: 'login' | 'register';
  redirectTo?: string;
  variant?: 'user' | 'admin';
  loginHint?: string;
  flow?: 'auth' | 'checkout';
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  mode = 'login',
  redirectTo,
  variant = 'user',
  loginHint,
  flow = 'auth',
}: GoogleSignInButtonProps) {
  const [googleReady, setGoogleReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tokenClientRef = useRef<any>(null);

  useEffect(() => {
    const checkGoogle = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        return true;
      }
      return false;
    };

    if (checkGoogle()) {
      setGoogleReady(true);
      return;
    }

    const interval = setInterval(() => {
      if (checkGoogle()) {
        clearInterval(interval);
        setGoogleReady(true);
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!checkGoogle()) {
        console.warn('[GoogleSignIn] Google Identity Services no cargó en 6s');
        setError('El inicio de sesión de Google no está disponible. Si usas bloqueador de anuncios, páusalo para este sitio.');
      }
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const sendToBackend = useCallback(async (accessToken: string) => {
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userInfoRes.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await userInfoRes.json();

      const apiEndpoint = variant === 'admin' ? '/api/admin/auth/google' : '/api/auth/google';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const baseApiUrl = apiUrl.replace(/\/api$/, '');

      if (flow === 'checkout' && variant === 'user') {
        const checkRes = await fetch(
          `${baseApiUrl}/api/auth/check-email?email=${encodeURIComponent(userInfo.email || '')}`,
          { credentials: 'include' }
        );

        if (checkRes.ok) {
          const checkData = await checkRes.json();

          if (!checkData.exists) {
            setError('');
            onSuccess?.({
              checkoutPrefill: true,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              googleId: userInfo.sub,
            });
            return;
          }
        }
      }

      const fullUrl = `${baseApiUrl}${apiEndpoint}`;

      const apiRes = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          googleId: userInfo.sub,
        }),
      });

      const data = await apiRes.json();

      if (!apiRes.ok) {
        const msg = data.message || 'Error al iniciar sesión con Google';
        setError(msg);
        onError?.(msg);
        return;
      }

      setError('');

      // IMPORTANTE: Almacenar la sesión en localStorage ANTES de redirigir
      // Esto asegura que la cookie HTTP-Only se haya establecido correctamente
      if (data.brand) {
        localStorage.setItem('brand', JSON.stringify(data.brand));
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
      }

      if (variant === 'admin' && data.admin) {
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
      }

      if (onSuccess) {
        onSuccess(data);
      } else if (data.needsOnboarding) {
        // Pequeña pausa para asegurar que la cookie se ha propagado
        setTimeout(() => {
          window.location.href = '/register/google-setup';
        }, 100);
      } else if (variant === 'admin') {
        setTimeout(() => {
          window.location.href = redirectTo || '/admin/dashboard';
        }, 100);
      } else {
        setTimeout(() => {
          window.location.href = redirectTo || '/dashboard';
        }, 100);
      }
    } catch (err: any) {
      console.error('[GoogleSignIn] Error en sendToBackend:', err);
      const msg = 'Error de conexión al iniciar sesión con Google';
      setError(msg);
      onError?.(msg);
    }
  }, [variant, redirectTo, onSuccess, onError, flow]);

  const initTokenClient = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return null;

    if (tokenClientRef.current) return tokenClientRef.current;

    tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      login_hint: loginHint || undefined,
      callback: (response: any) => {
        setLoading(false);

        if (response.error) {
          const msg = response.error_description || 'Error al autenticar con Google';
          setError(msg);
          onError?.(msg);
          return;
        }

        if (response.access_token) {
          sendToBackend(response.access_token);
        } else {
          const msg = 'No se recibió token de Google';
          setError(msg);
          onError?.(msg);
        }
      },
    });

    return tokenClientRef.current;
  }, [loginHint, sendToBackend, onError]);

  const handleClick = useCallback(() => {
    setError('');
    setLoading(true);

    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    if (!(window as any).google?.accounts?.oauth2) {
      const msg = 'Google Sign-In no está disponible. Recarga la página e intenta de nuevo.';
      setError(msg);
      onError?.(msg);
      setLoading(false);
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      const msg = 'Google Sign-In no está configurado. Contacta a soporte.';
      setError(msg);
      onError?.(msg);
      setLoading(false);
      return;
    }

    try {
      const client = initTokenClient();
      if (!client) {
        const msg = 'Error al inicializar Google Sign-In';
        setError(msg);
        onError?.(msg);
        setLoading(false);
        return;
      }

      client.requestAccessToken();
    } catch (e: any) {
      console.error('[GoogleSignIn] Error:', e);
      const msg = 'Error al iniciar Google Sign-In. Intenta de nuevo.';
      setError(msg);
      onError?.(msg);
      setLoading(false);
    }
  }, [initTokenClient, onError]);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || !googleReady}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {mode === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
      )}

      {!googleReady && (
        <p className="mt-2 text-xs text-[#666] text-center">Cargando Google Sign-In...</p>
      )}
    </div>
  );
}
