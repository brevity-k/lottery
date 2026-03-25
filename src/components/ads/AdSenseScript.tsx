'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useAdsEnabled } from './AdSenseContext';
import { AD_FREE_PATHS } from '@/lib/utils/constants';

export default function AdSenseScript() {
  const pathname = usePathname();
  const adsEnabled = useAdsEnabled();

  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) {
    return null;
  }

  if (!adsEnabled) {
    return null;
  }

  if (AD_FREE_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null;
  }

  return (
    <Script
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
