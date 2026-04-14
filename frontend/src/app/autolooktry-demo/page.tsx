'use client';

import { TryOnWidget } from '@/components/tryon/TryOnWidget';

export default function AutoLooktryDemoPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <TryOnWidget 
        brandSlug="demo"
        isEmbed={false}
      />
    </div>
  );
}