'use client';

import { useEffect, useRef } from 'react';
import { useAdsEnabled } from './AdSenseContext';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

export default function AdUnit({ slot, format = 'auto', className = '' }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const adsEnabled = useAdsEnabled();

  useEffect(() => {
    if (!adsEnabled || !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) return;
    if (!pushed.current && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        // AdSense not loaded
      }
    }
  }, [adsEnabled]);

  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || !adsEnabled) {
    return null;
  }

  return (
    <div className={`ad-unit ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
