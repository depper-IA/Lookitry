'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getProxiedUrl } from '@/utils/imageProxy';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  onLoad?: () => void;
}

// Premium branded SVG placeholder — no emoji, no broken-icon aesthetic
function BrandedPlaceholder({ alt }: { alt: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="100" height="100" fill="#1a1a1a" />
      
      {/* Subtle grid pattern */}
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#2a2a2a" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#grid)" />
      
      {/* Center icon - clothing/image representation */}
      <g transform="translate(50, 45)">
        {/* Image frame */}
        <rect x="-18" y="-18" width="36" height="28" rx="3" fill="none" stroke="#3a3a3a" strokeWidth="1.5"/>
        
        {/* Mountain/landscape suggestion inside */}
        <path d="M-14 8 L-6 0 L0 6 L6 -2 L14 8 Z" fill="#2a2a2a" stroke="#3a3a3a" strokeWidth="0.5"/>
        
        {/* Sun circle */}
        <circle cx="-8" cy="-6" r="3" fill="#2a2a2a" stroke="#3a3a3a" strokeWidth="0.5"/>
      </g>
      
      {/* Brand accent line */}
      <rect x="35" y="90" width="30" height="2" rx="1" fill="#FF5C3A" opacity="0.6"/>
    </svg>
  );
}

export function ImageWithFallback({ src, alt, className = '', onLoad }: ImageWithFallbackProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
  };

  const proxySrc = src ? getProxiedUrl(src) : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton — premium shimmer */}
      {!loaded && !error && (
        <motion.div
          className="absolute inset-0"
          style={{ background: 'var(--skeleton-bg, #1a1a1a)' }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Branded placeholder on error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <BrandedPlaceholder alt={alt} />
        </div>
      )}

      {/* Image — only render src if it exists (optional chaining pattern) */}
      {proxySrc && !error && (
        <img
          src={proxySrc}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
