'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface BlogImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  iconFallback?: boolean;
}

export function BlogImageWithFallback({ 
  src, 
  alt, 
  className = '', 
  iconFallback = false 
}: BlogImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const { isDark } = useTheme();

  if (hasError) {
    return (
      <div className={`flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]' : 'bg-gradient-to-br from-zinc-100 to-zinc-200'} ${className}`}>
        {iconFallback ? (
          <span className={`text-2xl font-black ${isDark ? 'text-[#FF5C3A]/40' : 'text-[#FF5C3A]/30'}`}>LOOKITRY</span>
        ) : (
          <span className={`text-4xl font-bold ${isDark ? 'text-white/10' : 'text-black/5'}`}>Lookitry</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
