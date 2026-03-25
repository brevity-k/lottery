/**
 * Shared constants for automation scripts.
 * Centralizes values that change together (e.g., model rotation, dataset IDs).
 *
 * IMPORTANT: When adding a new lottery game, update KNOWN_DATASETS, MIN_DRAWS,
 * and LOTTERY_DATA_FILES together. check-new-datasets.ts and update-data.ts
 * both reference KNOWN_DATASETS to stay in sync.
 */

import { RetryOptions } from './retry';

/** Claude model used for blog generation and tax rate updates. */
export const CLAUDE_MODEL = 'claude-sonnet-4-6';

// ---------------------------------------------------------------------------
// Dataset registry — single source of truth for all lottery SODA dataset IDs
// ---------------------------------------------------------------------------

/** SODA dataset IDs and metadata. Used by update-data.ts and check-new-datasets.ts. */
export const KNOWN_DATASETS: Record<string, { name: string; slug: string; datasetId: string; retiredDate?: string }> = {
  powerball:        { name: 'Powerball',      slug: 'powerball',      datasetId: 'd6yy-54nr' },
  'mega-millions':  { name: 'Mega Millions',  slug: 'mega-millions',  datasetId: '5xaw-6ayf' },
  'cash4life':      { name: 'Cash4Life',      slug: 'cash4life',      datasetId: 'kwxv-fwze', retiredDate: '2026-02-21' },
  'ny-lotto':       { name: 'NY Lotto',       slug: 'ny-lotto',       datasetId: '6nbc-h7bj' },
  'take5':          { name: 'Take 5',         slug: 'take5',          datasetId: 'dg63-4siq' },
  'millionaire-for-life': { name: 'Millionaire for Life', slug: 'millionaire-for-life', datasetId: 'a4w9-a3tp' },
};

/** Lookup from dataset ID → game slug (for check-new-datasets.ts deduplication). */
export const DATASET_ID_TO_GAME: Record<string, string> = Object.fromEntries(
  Object.values(KNOWN_DATASETS).map(d => [d.datasetId, d.name])
);

/**
 * Dataset IDs reviewed and confirmed NOT to be lottery draw games.
 * These are permanently ignored by check-new-datasets.ts to prevent false positives.
 *
 * When the scanner flags a new dataset that turns out to be non-game data (retailers,
 * sales reports, education funding, etc.), add its ID here to suppress future alerts.
 */
export const IGNORED_DATASET_IDS = new Set([
  '2vvn-pdyi', // NYS Lottery Retailers
  't8pe-c66p', // NYS Lottery Retailers Map
  'xyvi-fbb9', // Lottery Daily Retailer Sales
  'wyec-3ji4', // Lottery Annual Retailer Sales
  '9ypc-vjiq', // Lottery Aid to Education
  'g6gf-cj67', // Lottery Aid to Education Total
  '4yih-vkdm', // Lottery Aid to Education by County
  'xbdb-nzds', // OTDA LIM Lottery Intercept Match
  'xjtd-9p3n', // Sweet Million (Retired 2014)
  'rbnu-dzp6', // Lottery Raffle (one-time Oct 2025)
  '6j6c-aqy9', // NYSDOT Highway Record Plans
  '6bx3-2s36', // Compact NYSDOT Highway Record Plans
  '73iw-kuxv', // Personal Income Tax Filers 1
  'f3t7-zvbx', // Personal Income Tax Filers 2
  'rt8x-r6c8', // Personal Income Tax Filers 3
  'qjqv-zrwt', // Personal Income Tax Filers 4
  'tw9e-7nms', // NYS Thruway Origin and Destination
  '94fv-bak7', // MTA Subway Elevator and Escalator
  '84qh-f5nv', // NYS Corporate Tax Credits
  'hsys-3def', // Lottery Daily Numbers/Win-4 (pick-3/pick-4, not yet supported)
  '7sqk-ycpk', // Lottery Quick Draw (keno-style, not yet supported)
  'bycu-cw7c', // Lottery Pick 10 (pick-10, not yet supported)
]);

/** Check if a game is retired as of the given date. */
export function isGameRetired(gameKey: string, asOf: Date = new Date()): boolean {
  const game = KNOWN_DATASETS[gameKey];
  if (!game?.retiredDate) return false;
  return asOf >= new Date(game.retiredDate);
}

// ---------------------------------------------------------------------------
// Retry presets — documented rationale for each API type
// ---------------------------------------------------------------------------

export const RETRY_PRESETS = {
  /** SODA data fetches: critical path, use 3 attempts with moderate delay. */
  SODA_DATA: { maxAttempts: 3, baseDelayMs: 2000 } satisfies RetryOptions,
  /** SODA catalog searches: exploratory, 2 attempts with short delay. */
  SODA_CATALOG: { maxAttempts: 2, baseDelayMs: 1000 } satisfies RetryOptions,
  /** Claude API calls: expensive, 2 attempts with longer delay for rate limits. */
  CLAUDE_API: { maxAttempts: 2, baseDelayMs: 3000 } satisfies RetryOptions,
  /** GitHub API calls: 2 attempts with moderate delay. */
  GITHUB_API: { maxAttempts: 2, baseDelayMs: 2000 } satisfies RetryOptions,
  /** X API calls: 2 attempts with moderate delay for rate limits. */
  X_API: { maxAttempts: 2, baseDelayMs: 2000 } satisfies RetryOptions,
} as const;

// ---------------------------------------------------------------------------
// Blog generation constants
// ---------------------------------------------------------------------------

/**
 * Seasonal topic overrides — keyed by month number (1-12).
 * These are injected into the topic rotation (every 3rd day) instead of
 * replacing the entire month, to prevent near-duplicate daily posts.
 */
export const SEASONAL_OVERRIDES: Record<number, string> = {
  1: 'New Year, new numbers — did last year\'s hot numbers stay hot? A look back at what changed.',
  3: 'Tax season is here. If you won anything last year, here\'s exactly what you owe (and how to keep more).',
  4: 'Spring cleaning your lottery strategy — what the first quarter data tells us about the rest of the year.',
  11: 'The Thanksgiving jackpot rush is real — why November draws are historically the biggest of the year.',
  12: 'Year in review: the wildest lottery moments, biggest near-misses, and what the data says about next year.',
};

/**
 * One-time special topics — keyed by YYYY-MM date prefix.
 * Same as seasonal overrides: injected every 3rd day, not every day.
 */
export const SPECIAL_TOPICS: Record<string, string> = {};

/**
 * Blog topic rotation — 8 topics cycling weekly, paired 1:1 with TARGET_KEYWORDS.
 * Each topic is a reader question or curiosity hook, not a data dump.
 */
export const TOPICS: string[] = [
  'What would happen if you played the same numbers every draw for 10 years? Use our What-If Simulator data to tell a story about one hypothetical player.',
  'The luckiest and unluckiest numbers this month — which numbers are on a hot streak and which have gone cold? Tell it as a narrative with personality.',
  'You just won $500M — now what? Walk through the first 48 hours after winning, including taxes, lawyers, and the lump sum vs annuity decision.',
  'The weirdest statistical coincidences in recent lottery draws — surprising patterns, rare repeats, or near-misses that actually happened in the data.',
  'Powerball vs Mega Millions in 2026: which game gives you more bang for your buck after the Mega Millions price change? An honest comparison.',
  'How much does your state really take from lottery winners? Rank the best and worst states with specific dollar examples on a $100M jackpot.',
  'The most overdue numbers right now and what "overdue" actually means statistically — debunk the gambler\'s fallacy while making it interesting.',
  'Near-miss stories from the What-If Simulator — what does it feel like to be one number away from millions? Use real data to paint the picture.',
];

/** SEO target keywords to weave into blog posts, rotated alongside TOPICS. */
export const TARGET_KEYWORDS: string[] = [
  'what if i played the same lottery numbers',
  'hot and cold lottery numbers this week',
  'what to do if you win the lottery',
  'lottery number patterns and coincidences',
  'powerball vs mega millions which is better',
  'best states for lottery winners taxes',
  'overdue lottery numbers meaning',
  'closest lottery near miss stories',
];

export interface BlogQueueItem {
  category: string;  // matches slug in content/categories/*.md
  topic: string;
  targetKeyword: string;
}

/**
 * Pre-seeded blog topic queue. Generator picks from this first,
 * falls back to category rotation when all topics are consumed.
 */
export const BLOG_QUEUE: BlogQueueItem[] = [
  // Deep Dive Guides (AdSense-approval anchors)
  { category: 'deep-dive-guide', topic: 'Complete guide to how lottery prizes are claimed — process by prize tier, time limits, and state-specific rules', targetKeyword: 'how to claim lottery prizes' },
  { category: 'deep-dive-guide', topic: 'Lump sum vs annuity: walk through the real math with specific dollar examples at different jackpot levels and tax brackets', targetKeyword: 'lump sum vs annuity lottery' },
  { category: 'deep-dive-guide', topic: 'How lottery odds actually work — explain combinatorics visually, why order matters for bonus balls, expected value per ticket', targetKeyword: 'how lottery odds work' },
  { category: 'deep-dive-guide', topic: 'The complete history of Powerball format changes and how each one affected jackpot sizes and odds', targetKeyword: 'powerball format changes history' },
  { category: 'deep-dive-guide', topic: 'The Mega Millions $5 overhaul: what changed in April 2025, why, and how it compares to the old format', targetKeyword: 'mega millions 2025 changes' },
  // Data Stories (traffic drivers)
  { category: 'data-story', topic: 'Simulate buying 10,000 lottery tickets using our data — how many winners, total spent vs won, best and worst outcomes', targetKeyword: 'lottery simulation results' },
  { category: 'data-story', topic: 'Find the number that went cold the longest then came back — tell the story of its disappearance and return with actual dates', targetKeyword: 'lottery number cold streak' },
  { category: 'data-story', topic: 'The 5 most common number pairs across all games — do they keep showing up or is it just noise?', targetKeyword: 'most common lottery number pairs' },
  { category: 'data-story', topic: 'What if you had played every Wednesday Powerball since 2020 with the same numbers? Run the What-If Simulator scenario.', targetKeyword: 'what if same lottery numbers every draw' },
  // Myth Busters (engagement)
  { category: 'myth-buster', topic: '5 things lottery experts and YouTube channels say that are mathematically wrong — debunk each with actual data', targetKeyword: 'lottery myths debunked' },
  { category: 'myth-buster', topic: 'Does Quick Pick really win more often? Pull the actual stats and do the math vs self-selected numbers', targetKeyword: 'does quick pick win more often' },
  { category: 'myth-buster', topic: 'The birthday number trap — why most players pick from 1-31 and why that costs them money if they win', targetKeyword: 'birthday numbers lottery strategy' },
  { category: 'myth-buster', topic: 'Hot numbers dont exist — explain why with actual statistical tests, but show what patterns DO appear in the data', targetKeyword: 'do hot lottery numbers work' },
  // Tax & Money (high-value queries)
  { category: 'tax-and-money', topic: 'Compare take-home on a $100M jackpot across California, Texas, Florida, New York, and New Jersey with exact dollar breakdowns', targetKeyword: 'best states for lottery winners taxes' },
  { category: 'tax-and-money', topic: 'The hidden tax bracket jump nobody warns lottery winners about — how a single win pushes you into the 37% bracket', targetKeyword: 'lottery winner tax bracket' },
  { category: 'tax-and-money', topic: 'Every states lottery tax rate ranked from best to worst with dollar examples on a $10M prize', targetKeyword: 'state lottery tax rates ranked' },
  // Game Comparisons
  { category: 'game-comparison', topic: 'Dollar-for-dollar value comparison of all 6 games we track — cost per chance, odds tiers, expected payout', targetKeyword: 'best lottery game to play' },
  { category: 'game-comparison', topic: 'Powerball vs Mega Millions 2026 update — odds, cost, jackpot growth rate, and which gives more bang for your buck', targetKeyword: 'powerball vs mega millions 2026' },
  // What-If Scenarios
  { category: 'what-if-scenario', topic: 'What happens in the first 48 hours after you win a $500M jackpot — taxes, lawyers, anonymity, and the lump sum decision', targetKeyword: 'what to do if you win the lottery' },
  { category: 'what-if-scenario', topic: 'Near-miss stories from the What-If Simulator — find cases where someone was one number away and show the data', targetKeyword: 'lottery near miss stories' },
  // Winner Stories
  { category: 'winner-stories', topic: 'The biggest lottery winners who went broke — what went wrong and what every winner should know', targetKeyword: 'lottery winners who went broke' },
  { category: 'winner-stories', topic: 'Biggest Powerball winners by state — the luckiest states in America based on jackpot history', targetKeyword: 'biggest lottery winners by state' },
  // Lottery News
  { category: 'lottery-news', topic: 'Millionaire for Life launches as Cash4Life replacement — everything players need to know about the new game', targetKeyword: 'millionaire for life lottery new game' },
  { category: 'lottery-news', topic: 'How the April 2025 Mega Millions changes affected jackpot growth — early data from the first year', targetKeyword: 'mega millions format change results' },
];

// ---------------------------------------------------------------------------
// Build validation constants (shared between validate-build.ts & seo-health-check.ts)
// ---------------------------------------------------------------------------

/** Minimum draw counts per game — safety floor that should never be crossed. */
export const MIN_DRAWS: Record<string, number> = {
  'powerball.json': 1800,
  'mega-millions.json': 2400,
  'cash4life.json': 2900,
  'ny-lotto.json': 2500,
  'take5.json': 12000,
  'millionaire-for-life.json': 5,
};

/** Minimum page count for build output. Derived from game pages + number pages + states + tools + blog + static. */
export const MIN_PAGES = 550;

/** All lottery data files that must exist. */
export const LOTTERY_DATA_FILES = ['powerball.json', 'mega-millions.json', 'cash4life.json', 'ny-lotto.json', 'take5.json', 'millionaire-for-life.json'];

/** Maximum days before data is considered stale in SEO health check. */
export const DATA_STALENESS_DAYS = 7;

/** Forbidden terms in blog posts — never claim prediction or guaranteed outcomes. */
export const BLOG_FORBIDDEN_TERMS = ['prediction', 'guaranteed', 'winning strategy', 'sure win', 'proven method'];

/** Minimum word count for auto-generated blog posts. */
export const BLOG_MIN_WORDS = 600;
