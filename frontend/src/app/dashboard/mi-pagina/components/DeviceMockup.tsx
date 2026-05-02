'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone } from 'lucide-react';
import { LandingPreview } from './LandingPreview';

type Device = 'mobile' | 'desktop';

// iPhone 14 Pro dimensions
const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;
const DESKTOP_WIDTH = 860;
const DESKTOP_HEIGHT = 560;

export function DeviceMockup({
  brandSlug,
  brand,
  products,
}: {
  brandSlug: string;
  brand: Record<string, unknown>;
  products: unknown[];
}) {
  const [device, setDevice] = useState<Device>('mobile');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const previewConfig = useMemo(() => {
    if (device === 'mobile') {
      return { width: MOBILE_WIDTH, height: MOBILE_HEIGHT, scale: 1 };
    }
    return { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, scale: 1 };
  }, [device]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    setContainerWidth(containerRef.current.clientWidth);
    return () => observer.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (!containerWidth) return 1;
    const padding = 48; // px padding around frame
    const availableWidth = containerWidth - padding;
    return Math.min(1, availableWidth / previewConfig.width);
  }, [containerWidth, previewConfig.width]);

  const frameHeight = previewConfig.height * scale;

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col">
      {/* Device Toggle */}
      <div className="flex justify-center mb-4 shrink-0">
        <div className="inline-flex items-center rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] p-1 shadow-inner">
          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              device === 'mobile'
                ? 'bg-[#FF5C3A] text-white shadow-lg'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Smartphone size={14} />
            Mobile
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
              device === 'desktop'
                ? 'bg-[#FF5C3A] text-white shadow-lg'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Monitor size={14} />
            Desktop
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <AnimatePresence mode="wait">
          {device === 'mobile' ? (
            <MobileFrame key="mobile" scale={scale} frameHeight={frameHeight}>
              <LandingPreview
                brandSlug={brandSlug}
                brand={brand}
                products={products}
                isPreview={true}
              />
            </MobileFrame>
          ) : (
            <DesktopFrame key="desktop" scale={scale} frameHeight={frameHeight} brandSlug={brandSlug}>
              <LandingPreview
                brandSlug={brandSlug}
                brand={brand}
                products={products}
                isPreview={true}
              />
            </DesktopFrame>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Mobile Frame (iPhone) ───────────────────────────────────────────────────

function MobileFrame({
  scale,
  frameHeight,
  children,
}: {
  scale: number;
  frameHeight: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="relative"
      style={{ height: frameHeight }}
    >
      {/* Outer shadow */}
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] shadow-2xl shadow-black/60" />

      {/* Frame bezel */}
      <div className="absolute inset-[3px] rounded-[2.75rem] bg-[#1a1a1a] overflow-hidden flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
          <div className="w-36 h-7 bg-[#0a0a0a] rounded-b-2xl shadow-[inset_0_-1px_2px_rgba(255,255,255,0.05)]" />
        </div>

        {/* Screen */}
        <div
          className="flex-1 overflow-hidden rounded-[2.5rem] bg-white"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            height: MOBILE_HEIGHT,
          }}
        >
          <div className="h-full overflow-y-auto">{children}</div>
        </div>

        {/* Home indicator */}
        <div className="h-8 flex items-end justify-center pb-2">
          <div className="w-32 h-1 rounded-full bg-white/20" />
        </div>
      </div>

      {/* Side buttons */}
      <div className="absolute -left-[3px] top-28 w-1 h-12 rounded-l-sm bg-[#2a2a2a]" />
      <div className="absolute -left-[3px] top-44 w-1 h-20 rounded-l-sm bg-[#2a2a2a]" />
      <div className="absolute -left-[3px] top-[140px] w-1 h-14 rounded-l-sm bg-[#2a2a2a]" />
      <div className="absolute -right-[3px] top-36 w-1 h-14 rounded-r-sm bg-[#2a2a2a]" />
    </motion.div>
  );
}

// ─── Desktop Frame ────────────────────────────────────────────────────────────

function DesktopFrame({
  scale,
  frameHeight,
  children,
  brandSlug,
}: {
  scale: number;
  frameHeight: number;
  children: React.ReactNode;
  brandSlug: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="relative w-full"
      style={{ height: frameHeight }}
    >
      {/* Outer shadow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] shadow-2xl shadow-black/50" />

      {/* Frame */}
      <div className="absolute inset-[2px] rounded-lg bg-[#1a1a1a] overflow-hidden flex flex-col">
        {/* Browser bar */}
        <div className="h-10 bg-[#2a2a2a] flex items-center px-4 gap-3 shrink-0">
          {/* Traffic lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>

          {/* URL bar */}
          <div className="flex-1 h-7 bg-[#1a1a1a] rounded-md flex items-center px-4 overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-[#4a4a4a] mr-3 shrink-0" />
            <span className="text-[10px] text-[#666] truncate font-mono">
              {brandSlug || 'your-brand'}.lookitry.com
            </span>
          </div>
        </div>

        {/* Screen */}
        <div
          className="flex-1 overflow-hidden bg-white relative"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            height: DESKTOP_HEIGHT,
          }}
        >
          <div className="h-full overflow-y-auto">{children}</div>
        </div>
      </div>
    </motion.div>
  );
}
