'use client';

import { useState, useEffect } from 'react';
import { ExitIntentPopup } from './ExitIntentPopup';

const EXIT_INTENT_STORAGE_KEY = 'exit_intent_captured';

export function ExitIntentProvider({ children }: { children: React.ReactNode }) {
  const [showPopup, setShowPopup] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
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
  }, [hasTriggered]);

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleLeadCaptured = () => {
    localStorage.setItem(EXIT_INTENT_STORAGE_KEY, 'true');
    setShowPopup(false);
    setHasTriggered(true);
  };

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