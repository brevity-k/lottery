export const SITE_NAME = 'My Lotto Stats';

export const SITE_DESCRIPTION = 'Free lottery analysis tools — replay draws with your numbers, see hot/cold trends, and get data-driven number picks.';

export const SITE_URL = 'https://mylottostats.com';

export const DISCLAIMER_TEXT =
  'For entertainment purposes only. Lottery outcomes are random and past results do not influence future drawings. This website is not affiliated with or endorsed by any state lottery commission. In the event of a discrepancy, official winning numbers shall control. Results sourced from NY Open Data (data.ny.gov). Always verify with your official state lottery.';

export const AD_FREE_PATHS = [
  '/privacy',
  '/terms',
  '/disclaimer',
  '/contact',
  '/about',
  '/methodology',
  '/responsible-gaming',
];

export const ANALYTICS_ID = 'G-5TW1TM399X';

// AdSense publisher id. Accept either env var spelling so the build inlines a
// value whichever name the Vercel project has set (historically both
// NEXT_PUBLIC_ADSENSE_CLIENT_ID and NEXT_PUBLIC_ADSENSE_CLIENT were used).
export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const BYLINE_NAME = 'The MyLottoStats Team';
