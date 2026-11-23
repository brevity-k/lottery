/**
 * Verify the live site is serving pages.
 *
 * Run: npx tsx scripts/check-site-up.ts
 *
 * Requests a few representative production URLs and exits 1 if any of them
 * does not return HTTP 200. Used by site-uptime.yml (6-hourly alert) and by
 * post-to-bluesky.yml (skip social posting while the site is down).
 */

import { withRetry } from './lib/retry';
import { RETRY_PRESETS, SITE_UPTIME_URLS } from './lib/constants';

const TIMEOUT_MS = 15_000;

async function checkUrl(url: string): Promise<string | null> {
  try {
    await withRetry(async () => {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'mylottostats-uptime-check' },
      });
      if (res.status !== 200) {
        const body = (await res.text()).slice(0, 120).replace(/\s+/g, ' ').trim();
        throw new Error(`HTTP ${res.status}${body ? ` — ${body}` : ''}`);
      }
    }, { ...RETRY_PRESETS.SITE_UPTIME, label: url });
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

async function main(): Promise<void> {
  const results = await Promise.all(
    SITE_UPTIME_URLS.map(async url => ({ url, error: await checkUrl(url) })),
  );

  for (const { url, error } of results) {
    console.log(`${error ? '✗' : '✓'} ${url}${error ? ` — ${error}` : ''}`);
  }

  if (results.some(r => r.error)) {
    console.error('\nSite is down or returning errors.');
    process.exit(1);
  }
  console.log('\nSite is up.');
}

main();
