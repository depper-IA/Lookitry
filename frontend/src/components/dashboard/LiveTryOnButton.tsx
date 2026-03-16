'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function LiveTryOnButton() {
  const { brand } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!brand?.slug) return null;

  // Construir URL completa del probador
  const tryOnUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/marca/${brand.slug}`
      : `/marca/${brand.slug}`;

  const handleOpen = () => {
    window.open(tryOnUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tryOnUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores sin soporte de clipboard API
      const input = document.createElement('input');
      input.value = tryOnUrl;
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
      {/* Botón principal: solo icono en móvil, texto completo en desktop */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-white text-sm font-medium rounded-lg transition-opacity min-h-[34px]"
        style={{ background: '#FF5C3A' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        title={`Abrir probador: ${tryOnUrl}`}
      >
        <ExternalLinkIcon className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:inline">Ver probador</span>
      </button>

      {/* Botón copiar URL: solo en desktop */}
      <button
        onClick={handleCopy}
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg border transition-colors min-h-[34px]"
        style={{
          background: 'var(--bg-hover)',
          borderColor: 'var(--border-color)',
          color: copied ? '#10b981' : 'var(--text-secondary)',
        }}
        title={copied ? 'Copiado' : `Copiar URL: ${tryOnUrl}`}
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 flex-shrink-0" />
        ) : (
          <CopyIcon className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="hidden lg:inline text-xs truncate max-w-[140px]">
          {copied ? 'Copiado' : tryOnUrl.replace(/^https?:\/\//, '')}
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
