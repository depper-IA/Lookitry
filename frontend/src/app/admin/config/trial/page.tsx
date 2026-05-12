'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfigTrialPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to trial-campaigns which has the full Trial Campaigns implementation
    // This page exists to serve the /admin/config/trial route referenced by the config sidebar
    router.replace('/admin/trial-campaigns');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-sm" style={{ color: 'var(--text-muted)' }}>
        Cargando...
      </div>
    </div>
  );
}