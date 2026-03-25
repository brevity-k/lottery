'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AdsContext = createContext({ adsEnabled: true, disableCount: { current: 0 }, setCount: (_n: number) => {} });

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const disableCount = useRef(0);

  return (
    <AdsContext value={{ adsEnabled: count === 0, disableCount, setCount }}>
      {children}
    </AdsContext>
  );
}

export function useAdsEnabled() {
  return useContext(AdsContext).adsEnabled;
}

export function useDisableAds() {
  const { disableCount, setCount } = useContext(AdsContext);
  useEffect(() => {
    disableCount.current += 1;
    setCount(disableCount.current);
    return () => {
      disableCount.current -= 1;
      setCount(disableCount.current);
    };
  }, [disableCount, setCount]);
}
