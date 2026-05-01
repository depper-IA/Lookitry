'use client';

import { useState, useCallback } from 'react';
import { Shirt } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable image component with branded SVG fallback on error.
 * Displays a hanger icon (Lucide Shirt) on accent color background
 * when the image fails to load, preventing browser error icons.
 */
export function ImageWithFallback({
  src,
  alt,
  className = '',
  aspectRatio,
  style,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          background: '#eeebe7',
          borderRadius: '12px',
          aspectRatio: aspectRatio || undefined,
          ...style,
        }}
      >
        <Shirt
          size={32}
          strokeWidth={1.5}
          style={{ color: '#FF5C3A' }}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ aspectRatio: aspectRatio || undefined, ...style }}
      onError={handleError}
    />
  );
}