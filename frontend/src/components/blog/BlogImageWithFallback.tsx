'use client';

import React, { useState } from 'react';

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

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] ${className}`}>
        {iconFallback ? (
          <span className="text-2xl font-black text-[#FF5C3A]/40">LOOKITRY</span>
        ) : (
          <span className="text-4xl font-bold text-white/10">Lookitry</span>
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
