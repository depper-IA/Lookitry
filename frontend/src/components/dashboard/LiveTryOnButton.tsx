'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function LiveTryOnButton() {
  const { brand } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!brand?.slug) return null;

  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const hasLandingPage = Boolean(brand.hasLandingPage ?? (brand as any).has_landing_page);
  const customDomain = brand.customDomain?.trim();

  const tryOnUrl = baseOrigin ? `${baseOrigin}/marca/${brand.slug}` : `/marca/${brand.slug}`;
  const landingUrl = customDomain
    ? (customDomain.startsWith('http://') || customDomain.startsWith('https://') ? customDomain : `https://${customDomain}`)
    : (baseOrigin ? `${baseOrigin}/sitio/${brand.slug}` : `/sitio/${brand.slug}`);
  const primaryUrl = hasLandingPage ? landingUrl : tryOnUrl;
  const primaryLabel = hasLandingPage ? 'Ver mini-landing' : 'Ver probador';

  const handleOpenPrimary = () => {
    window.open(primaryUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenTryOn = () => {
    window.open(tryOnUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(primaryUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = primaryUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleOpenPrimary}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-opacity"
        style={{ background: '#FF5C3A' }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        title={`Abrir: ${primaryUrl}`}
      >
        <ExternalLinkIcon className="h-4 w-4 flex-shrink-0" />
        <span className="hidden md:inline">{primaryLabel}</span>
      </button>

      {hasLandingPage && (
        <button
          onClick={handleOpenTryOn}
          className="hidden min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors lg:inline-flex"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
          title={`Abrir probador: ${tryOnUrl}`}
        >
          <SparklesIcon className="h-4 w-4 flex-shrink-0" />
          <span>Ver probador</span>
        </button>
      )}

      <button
        onClick={handleCopy}
        className="hidden min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors xl:inline-flex"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: copied ? '#10b981' : 'var(--text-secondary)',
        }}
        title={copied ? 'Copiado' : `Copiar URL: ${primaryUrl}`}
      >
        {copied ? <CheckIcon className="h-4 w-4 flex-shrink-0" /> : <CopyIcon className="h-4 w-4 flex-shrink-0" />}
        <span className="max-w-[170px] truncate text-xs">
          {copied ? 'Copiado' : primaryUrl.replace(/^https?:\/\//, '')}
        </span>
      </button>
    </div>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3l1.912 5.813a2 2 0 001.265 1.265L21 12l-5.823 1.922a2 2 0 00-1.265 1.265L12 21l-1.922-5.813a2 2 0 00-1.265-1.265L3 12l5.813-1.922a2 2 0 001.265-1.265L12 3z"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
