'use client';

import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
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

// Memoized template components to prevent unnecessary re-renders
const MemoizedTemplateClassic = memo(TemplateClassic);
const MemoizedTemplateEditorial = memo(TemplateEditorial);
const MemoizedTemplateModerno = memo(TemplateModerno);

export function LandingPreview({ brandSlug, brand, products, isPreview = false }: LandingPreviewProps) {
  // Defensive: ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];
  const template = brand?.landing_template || 'classic';
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

  // Memoize scale calculation to prevent recalc on every render
  const previewScale = useMemo(() => {
    if (!isPreview || !containerWidth) return 1;
    return Math.min(1, (containerWidth - 24) / previewCanvasWidth);
  }, [isPreview, containerWidth, previewCanvasWidth]);

  const previewStyle = useMemo(() => {
    if (!isPreview) return undefined;
    return {
      width: `${previewCanvasWidth}px`,
      zoom: previewScale,
    };
  }, [isPreview, previewCanvasWidth, previewScale]);

  return (
    <div ref={containerRef} className="w-full min-h-full bg-white overflow-x-hidden">
      <div className={`flex min-h-full ${isPreview ? 'items-start justify-center px-3 py-4' : ''}`}>
        <div className="origin-top transition-all duration-500" style={previewStyle}>
          {template === 'classic' && (
            <MemoizedTemplateClassic
              brandSlug={brandSlug}
              brand={brand}
              products={safeProducts}
              isPreview={isPreview}
            />
          )}
          {template === 'editorial' && (
            <MemoizedTemplateEditorial
              brandSlug={brandSlug}
              brand={brand}
              products={safeProducts}
              isPreview={isPreview}
            />
          )}
          {template === 'moderno' && (
            <MemoizedTemplateModerno
              brandSlug={brandSlug}
              brand={brand}
              products={safeProducts}
              isPreview={isPreview}
            />
          )}
        </div>
      </div>
    </div>
  );
}
