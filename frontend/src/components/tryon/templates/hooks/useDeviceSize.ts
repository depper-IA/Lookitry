'use client';

import { useState, useEffect } from 'react';

export function useDeviceSize(forcedLayout?: 'mobile' | 'desktop') {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    if (forcedLayout) {
      setIsSmall(forcedLayout === 'mobile');
      return;
    }

    const updateSize = () => {
      setIsSmall(window.innerWidth < 768);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [forcedLayout]);

  return isSmall;
}