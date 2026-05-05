'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ExitIntentPopup } from './ExitIntentPopup';

const EXIT_INTENT_STORAGE_KEY = 'exit_intent_captured';

// Rutas donde el exit intent NO debe activarse
const EXCLUDED_PREFIXES = ['/dashboard', '/admin', '/checkout', '/onboarding'];

export function ExitIntentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showPopup, setShowPopup] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const isExcluded = EXCLUDED_PREFIXES.some(prefix => pathname?.startsWith(prefix));

  useEffect(() => {
    // No activar en dashboards, admin ni checkout
    if (isExcluded) return;

    // Check if already captured in this session
    const alreadyCaptured = localStorage.getItem(EXIT_INTENT_STORAGE_KEY);
    if (alreadyCaptured) {
      setHasTriggered(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Mouse is leaving toward the top of the page (browser chrome)
      if (e.clientY <= 0 && !hasTriggered) {
        setShowPopup(true);
        setHasTriggered(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasTriggered, isExcluded]);

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleLeadCaptured = () => {
    localStorage.setItem(EXIT_INTENT_STORAGE_KEY, 'true');
    setShowPopup(false);
    setHasTriggered(true);
  };

  // No renderizar el popup en rutas excluidas
  if (isExcluded) return <>{children}</>;

  return (
    <>
      {children}
      <ExitIntentPopup
        isOpen={showPopup}
        onClose={handleClose}
        onLeadCaptured={handleLeadCaptured}
      />
    </>
  );
}

export default ExitIntentProvider;
