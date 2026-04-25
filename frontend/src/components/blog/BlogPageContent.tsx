'use client';

import React from 'react';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { BlogList } from '@/components/blog/BlogList';
import { BlogHero } from '@/components/blog/BlogHero';
import { useTheme } from '@/components/blog/BlogThemeWrapper';
import { cn } from '@/utils/cn';

export function BlogPageContent() {
  const { isDark } = useTheme();
  
  return (
    <div className="overflow-x-clip">
      <LandingNav />
      <main className={cn(
        "min-h-screen transition-colors duration-300 selection:bg-[#FF5C3A]/30",
        isDark ? "bg-[#0a0a0a]" : "bg-gray-50"
      )}>
        <BlogHero />
        <BlogList />
      </main>
      <LandingFooter />
    </div>
  );
}
