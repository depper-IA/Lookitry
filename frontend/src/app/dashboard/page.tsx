'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';

/**
 * DashboardPage (Home)
 * Redirige instantáneamente a la pestaña de productos.
 * Las notificaciones de suscripción se manejan globalmente en el Layout.
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/products');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}
