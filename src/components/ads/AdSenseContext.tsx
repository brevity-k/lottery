'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AdsContext = createContext({ adsEnabled: true, disableCountRef: { current: 0 }, setCount: (n: number) => { void n; } });

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const disableCountRef = useRef(0);

  return (
    <AdsContext value={{ adsEnabled: count === 0, disableCountRef, setCount }}>
      {children}
    </AdsContext>
  );
}

export function useAdsEnabled() {
  return useContext(AdsContext).adsEnabled;
}

export function useDisableAds() {
  const { disableCountRef, setCount } = useContext(AdsContext);
  useEffect(() => {
    disableCountRef.current += 1;
    setCount(disableCountRef.current);
    return () => {
      disableCountRef.current -= 1;
      setCount(disableCountRef.current);
    };
  }, [disableCountRef, setCount]);
}
