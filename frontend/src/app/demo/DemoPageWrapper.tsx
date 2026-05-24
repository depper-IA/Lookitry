'use client';

import dynamic from 'next/dynamic';

const DemoPageClient = dynamic(() => import('./DemoPageClient'), { ssr: false });

export default function DemoPageWrapper() {
  return <DemoPageClient />;
}