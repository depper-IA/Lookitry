'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TemplateClassic } from '@/components/mini-landing/TemplateClassic';
import { TemplateEditorial } from '@/components/mini-landing/TemplateEditorial';
import { TemplateModerno } from '@/components/mini-landing/TemplateModerno';

interface LandingPreviewProps {
  brandSlug: string;
  brand: any;
  products: any[];
  isPreview?: boolean;
}

const PREVIEW_CANVAS_WIDTHS: Record<string, number> = {
  classic: 860,
  editorial: 920,
  moderno: 860,
};

export function LandingPreview({ brandSlug, brand, products, isPreview = false }: LandingPreviewProps) {
  const template = brand.landing_template || 'classic';
  const previewCanvasWidth = PREVIEW_CANVAS_WIDTHS[template] || 860;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!isPreview || !containerRef.current) return;

    const element = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    setContainerWidth(element.clientWidth);

    return () => observer.disconnect();
  }, [isPreview]);

  const previewScale = !isPreview || !containerWidth
    ? 1
    : Math.min(1, (containerWidth - 24) / previewCanvasWidth);

  const previewStyle = isPreview
    ? {
        width: `${previewCanvasWidth}px`,
        zoom: previewScale,
      }
    : undefined;

  return (
    <div ref={containerRef} className="w-full min-h-full bg-white overflow-x-hidden">
      <div className={`flex min-h-full ${isPreview ? 'items-start justify-center px-3 py-4' : ''}`}>
        <div className="origin-top transition-all duration-500" style={previewStyle}>
          {template === 'classic' && (
            <TemplateClassic
              brandSlug={brandSlug}
              brand={brand}
              products={products}
              isPreview={isPreview}
            />
          )}
          {template === 'editorial' && (
            <TemplateEditorial
              brandSlug={brandSlug}
              brand={brand}
              products={products}
              isPreview={isPreview}
            />
          )}
          {template === 'moderno' && (
            <TemplateModerno
              brandSlug={brandSlug}
              brand={brand}
              products={products}
              isPreview={isPreview}
            />
          )}
        </div>
      </div>
    </div>
  );
}
