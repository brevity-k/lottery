'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdsEnabledContext = createContext(true);
const SetAdsEnabledContext = createContext<(v: boolean) => void>(() => {});

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [adsEnabled, setAdsEnabled] = useState(true);
  const set = useCallback((v: boolean) => setAdsEnabled(v), []);

  return (
    <SetAdsEnabledContext value={set}>
      <AdsEnabledContext value={adsEnabled}>
        {children}
      </AdsEnabledContext>
    </SetAdsEnabledContext>
  );
}

export function useAdsEnabled() {
  return useContext(AdsEnabledContext);
}

export function useDisableAds() {
  const setAdsEnabled = useContext(SetAdsEnabledContext);
  useEffect(() => {
    setAdsEnabled(false);
    return () => setAdsEnabled(true);
  }, [setAdsEnabled]);
}
