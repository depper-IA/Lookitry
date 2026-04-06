'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const credential = params.get('credential');

        if (!credential) {
          router.push('/login');
          return;
        }

        const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ credential }),
        });

        const data = await apiRes.json();

        if (!apiRes.ok) {
          router.push(`/login?error=${encodeURIComponent(data.message || 'Error con Google')}`);
          return;
        }

        if (data.redirectTo) {
          // Usuario nuevo con Google → ir al checkout funnel
          router.push(data.redirectTo);
        } else if (data.needsOnboarding) {
          // Fallback: si no hay redirectTo, ir a checkout
          router.push('/checkout');
        } else {
          router.push('/dashboard');
        }
      } catch {
        router.push('/login?error=Error de conexión');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-[#FF5C3A] animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-medium">Procesando inicio de sesión con Google...</p>
      </div>
    </div>
  );
}
