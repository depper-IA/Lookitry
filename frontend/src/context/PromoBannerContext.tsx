'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface PromoBannerContextValue {
  bannerVisible: boolean;
  setBannerVisible: (visible: boolean) => void;
  bannerHeight: number;
}

const PromoBannerContext = createContext<PromoBannerContextValue>({
  bannerVisible: false,
  setBannerVisible: () => {},
  bannerHeight: 0,
});

export function usePromoBanner() {
  return useContext(PromoBannerContext);
}

export function PromoBannerProvider({ children }: { children: ReactNode }) {
  const [bannerVisible, setBannerVisible] = useState(false);
  const bannerHeight = bannerVisible ? 36 : 0;

  const setBannerVisibleCallback = useCallback((visible: boolean) => {
    setBannerVisible(visible);
  }, []);

  return (
    <PromoBannerContext.Provider
      value={{ bannerVisible, setBannerVisible: setBannerVisibleCallback, bannerHeight }}
    >
      {children}
    </PromoBannerContext.Provider>
  );
}
