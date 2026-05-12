'use client';

import { Lock } from 'lucide-react';
import type { WidgetTemplate } from '@/types';

interface TemplatePreviewCardProps {
  id: WidgetTemplate;
  label: string;
  description: string;
  isSelected: boolean;
  isLocked: boolean;
  isPro: boolean;
  primaryColor: string;
  secondaryColor: string;
  onSelect: (id: WidgetTemplate) => void;
}

const TEMPLATE_PREVIEWS: Record<WidgetTemplate, React.FC<{ primaryColor: string; secondaryColor: string; isSelected: boolean }>> = {
  bare: ({ primaryColor, secondaryColor, isSelected }) => (
    <svg viewBox="0 0 200 100" className="w-full h-full">
      {/* Background */}
      <rect width="200" height="100" fill={secondaryColor} rx="8" />
      
      {/* Device frame */}
      <rect x="60" y="15" width="80" height="70" rx="6" fill="#1a1a1a" opacity="0.8" />
      
      {/* Screen content */}
      <rect x="65" y="20" width="70" height="60" rx="4" fill={secondaryColor} />
      
      {/* Center content - icon */}
      <rect x="85" y="35" width="30" height="30" rx="2" fill={primaryColor} opacity="0.3" />
      <rect x="92" y="42" width="16" height="16" rx="1" fill={primaryColor} opacity="0.6" />
      
      {/* Bottom indicator */}
      <rect x="90" y="78" width="20" height="3" rx="1.5" fill={primaryColor} opacity={isSelected ? 0.8 : 0.4} />
    </svg>
  ),

  // minimal comparte preview con showcase
  minimal: ({ primaryColor, secondaryColor, isSelected }) => (
    <svg viewBox="0 0 200 100" className="w-full h-full">
      <rect width="200" height="100" fill={secondaryColor} rx="8" />
      <rect x="10" y="10" width="180" height="18" rx="4" fill="#1a1a1a" opacity="0.7" />
      <rect x="15" y="14" width="30" height="10" rx="2" fill={primaryColor} opacity="0.5" />
      <rect x="10" y="35" width="180" height="40" rx="6" fill="#1a1a1a" opacity="0.5" />
      <rect x="18" y="40" width="45" height="30" rx="4" fill={primaryColor} opacity={isSelected ? 0.3 : 0.15} />
      <rect x="68" y="40" width="45" height="30" rx="4" fill={primaryColor} opacity="0.2" />
      <rect x="118" y="40" width="45" height="30" rx="4" fill={primaryColor} opacity="0.2" />
      <rect x="168" y="40" width="18" height="30" rx="4" fill="#1a1a1a" opacity="0.3" />
      <rect x="26" y="47" width="28" height="16" rx="2" fill={primaryColor} opacity="0.4" />
      <rect x="76" y="47" width="28" height="16" rx="2" fill={primaryColor} opacity="0.35" />
      <rect x="126" y="47" width="28" height="16" rx="2" fill={primaryColor} opacity="0.35" />
      <rect x="10" y="82" width="180" height="14" rx="4" fill={primaryColor} opacity={isSelected ? 0.9 : 0.5} />
    </svg>
  ),

  modern: ({ primaryColor, secondaryColor, isSelected }) => (
    <svg viewBox="0 0 200 100" className="w-full h-full">
      {/* Background */}
      <rect width="200" height="100" fill={secondaryColor} rx="8" />
      
      {/* Sidebar */}
      <rect x="10" y="10" width="45" height="80" rx="6" fill="#1a1a1a" opacity="0.8" />
      
      {/* Sidebar items (3 progress steps) */}
      <rect x="17" y="20" width="31" height="6" rx="3" fill={primaryColor} opacity={isSelected ? 0.9 : 0.3} />
      <rect x="17" y="32" width="31" height="6" rx="3" fill="#1a1a1a" opacity="0.5" />
      <rect x="17" y="44" width="31" height="6" rx="3" fill="#1a1a1a" opacity="0.3" />
      
      {/* Sidebar footer */}
      <rect x="17" y="75" width="31" height="6" rx="3" fill="#1a1a1a" opacity="0.3" />
      
      {/* Main content area */}
      <rect x="65" y="15" width="125" height="70" rx="6" fill="#1a1a1a" opacity="0.6" />
      <rect x="70" y="20" width="115" height="60" rx="4" fill={secondaryColor} />
      
      {/* Content blocks */}
      <rect x="75" y="28" width="50" height="8" rx="2" fill={primaryColor} opacity="0.5" />
      <rect x="75" y="42" width="105" height="4" rx="2" fill="#1a1a1a" opacity="0.2" />
      <rect x="75" y="50" width="90" height="4" rx="2" fill="#1a1a1a" opacity="0.15" />
      <rect x="75" y="58" width="70" height="4" rx="2" fill="#1a1a1a" opacity="0.1" />
      
      {/* CTA button */}
      <rect x="140" y="65" width="40" height="10" rx="3" fill={primaryColor} opacity={isSelected ? 1 : 0.6} />
    </svg>
  ),
  
  bold: ({ primaryColor, secondaryColor, isSelected }) => (
    <svg viewBox="0 0 200 100" className="w-full h-full">
      {/* Dark gradient background */}
      <defs>
        <linearGradient id="boldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <rect width="200" height="100" fill="url(#boldGrad)" rx="8" />
      
      {/* Side panel */}
      <rect x="10" y="10" width="50" height="80" rx="6" fill={primaryColor} opacity="0.15" />
      
      {/* Sidebar lines */}
      <rect x="17" y="22" width="36" height="3" rx="1.5" fill={primaryColor} opacity="0.6" />
      <rect x="17" y="30" width="28" height="2" rx="1" fill={primaryColor} opacity="0.3" />
      
      {/* Grid items */}
      <rect x="70" y="15" width="55" height="35" rx="4" fill="#252525" />
      <rect x="130" y="15" width="55" height="35" rx="4" fill="#252525" />
      <rect x="70" y="55" width="55" height="35" rx="4" fill="#252525" />
      <rect x="130" y="55" width="55" height="35" rx="4" fill={primaryColor} opacity={isSelected ? 0.4 : 0.15} />
      
      {/* Icons in grid */}
      <rect x="82" y="25" width="30" height="15" rx="2" fill={primaryColor} opacity="0.3" />
      <rect x="142" y="25" width="30" height="15" rx="2" fill={primaryColor} opacity="0.3" />
      <rect x="82" y="65" width="30" height="15" rx="2" fill={primaryColor} opacity="0.3" />
      
      {/* Tip indicator */}
      <rect x="17" y="50" width="36" height="3" rx="1.5" fill={primaryColor} opacity="0.5" />
      <rect x="17" y="58" width="25" height="2" rx="1" fill={primaryColor} opacity="0.25" />
      
      {/* Bottom CTA */}
      <rect x="17" y="75" width="36" height="8" rx="4" fill={primaryColor} opacity={isSelected ? 0.9 : 0.4} />
    </svg>
  ),
  
  showcase: ({ primaryColor, secondaryColor, isSelected }) => (
    <svg viewBox="0 0 200 100" className="w-full h-full">
      {/* Background */}
      <rect width="200" height="100" fill={secondaryColor} rx="8" />
      
      {/* Compact header */}
      <rect x="10" y="10" width="180" height="18" rx="4" fill="#1a1a1a" opacity="0.7" />
      <rect x="15" y="14" width="30" height="10" rx="2" fill={primaryColor} opacity="0.5" />
      
      {/* Horizontal scroll area */}
      <rect x="10" y="35" width="180" height="40" rx="6" fill="#1a1a1a" opacity="0.5" />
      
      {/* Product cards in scroll */}
      <rect x="18" y="40" width="45" height="30" rx="4" fill={primaryColor} opacity={isSelected ? 0.3 : 0.15} />
      <rect x="68" y="40" width="45" height="30" rx="4" fill={primaryColor} opacity="0.2" />
      <rect x="118" y="40" width="45" height="30" rx="4" fill={primaryColor} opacity="0.2" />
      <rect x="168" y="40" width="18" height="30" rx="4" fill="#1a1a1a" opacity="0.3" />
      
      {/* Product icons */}
      <rect x="26" y="47" width="28" height="16" rx="2" fill={primaryColor} opacity="0.4" />
      <rect x="76" y="47" width="28" height="16" rx="2" fill={primaryColor} opacity="0.35" />
      <rect x="126" y="47" width="28" height="16" rx="2" fill={primaryColor} opacity="0.35" />
      
      {/* Scroll indicators */}
      <rect x="90" y="78" width="20" height="2" rx="1" fill={primaryColor} opacity="0.4" />
      <rect x="95" y="81" width="10" height="2" rx="1" fill={primaryColor} opacity="0.6" />
      
      {/* Fixed bottom CTA */}
      <rect x="10" y="82" width="180" height="14" rx="4" fill={primaryColor} opacity={isSelected ? 0.9 : 0.5} />
    </svg>
  ),
};

export function TemplatePreviewCard({
  id,
  label,
  description,
  isSelected,
  isLocked,
  isPro,
  primaryColor,
  secondaryColor,
  onSelect,
}: TemplatePreviewCardProps) {
  const PreviewComponent = TEMPLATE_PREVIEWS[id];

  const handleClick = () => {
    // Click always opens preview/selection - lock only affects the "Use" action in the modal
    onSelect(id);
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300 ease-out
        ${isSelected 
          ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-xl shadow-[#FF5C3A]/20' 
          : 'border-[var(--border-color)] bg-[var(--bg-base)] hover:border-[#FF5C3A]/50 hover:shadow-lg hover:shadow-[#FF5C3A]/10'
        }
        ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${!isLocked && !isSelected ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}
      `}
    >
      {/* Preview thumbnail */}
      <div className="relative h-20 overflow-hidden bg-[var(--bg-card)]">
        <div className="absolute inset-0 p-2 transition-opacity duration-300 group-hover:opacity-90">
          {PreviewComponent && (
            <PreviewComponent 
              primaryColor={primaryColor} 
              secondaryColor={secondaryColor} 
              isSelected={isSelected}
            />
          )}
        </div>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5C3A]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        
        {/* Premium lock badge */}
        {isLocked && (
          <div className="absolute top-2 right-2 z-10 flex items-center justify-center w-7 h-7 rounded-full" style={{background: '#FF5C3A', color: 'white'}}>
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="flex flex-col gap-1 p-4 text-left">
        <h4 className={`text-sm font-bold transition-colors ${isSelected ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'}`}>
          {label}
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-tight line-clamp-2">
          {description}
        </p>
      </div>

      {/* Hover overlay for locked templates - minimal, badge already shows Premium */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="text-center p-4">
            <p className="text-xs font-bold text-[var(--text-primary)]">Mejora a Pro</p>
            <p className="text-[10px] text-[var(--text-muted)]">para usar esta plantilla</p>
          </div>
        </div>
      )}
    </button>
  );
}