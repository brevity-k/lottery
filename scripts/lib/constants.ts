/**
 * Shared constants for automation scripts.
 * Centralizes values that change together (e.g., model rotation).
 */

/** Claude model used for blog generation and tax rate updates. */
export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

/** Seasonal topic overrides — keyed by month number (1-12). */
export const SEASONAL_OVERRIDES: Record<number, string> = {
  1: 'New Year lottery number trends and fresh start strategies for the new year',
  3: 'Tax season guide for lottery winners — what to know before filing',
  4: 'Tax season guide for lottery winners — maximizing your after-tax payout',
  11: 'Holiday jackpot fever — Thanksgiving and year-end draw analysis',
  12: 'Holiday jackpot fever — Christmas lottery traditions and year-end jackpot recap',
};

/** One-time special topics — keyed by YYYY-MM date prefix. */
export const SPECIAL_TOPICS: Record<string, string> = {
  '2026-02': 'Cash4Life retirement on February 21 — what it means for players and what comes next',
};

/** SEO target keywords to weave into blog posts, rotated alongside topics. */
export const TARGET_KEYWORDS: string[] = [
  'most common powerball numbers',
  'mega millions winning numbers analysis',
  'hot and cold lottery numbers',
  'lottery tax calculator by state',
  'powerball number frequency',
  'overdue powerball numbers',
  'lump sum vs annuity lottery',
  'best states for lottery winners',
  'powerball vs mega millions odds',
  'cash4life winning numbers',
  'ny lotto results today',
  'take 5 winning numbers',
  'lottery number pairs patterns',
  'how to pick lottery numbers statistically',
];
