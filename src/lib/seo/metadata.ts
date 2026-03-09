import { Metadata } from 'next';
import { LotteryConfig } from '@/lib/lotteries/types';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/utils/constants';

export function generateLotteryMetadata(
  lottery: LotteryConfig,
  page: 'overview' | 'numbers' | 'results' | 'statistics',
  extra?: { year?: string }
): Metadata {
  const titles: Record<string, string> = {
    overview: `${lottery.name} Results & Statistics | ${SITE_NAME}`,
    numbers: `${lottery.name} Number Insights | ${SITE_NAME}`,
    results: extra?.year
      ? `${lottery.name} Results ${extra.year} | ${SITE_NAME}`
      : `${lottery.name} Past Results | ${SITE_NAME}`,
    statistics: `${lottery.name} Statistics & Analysis | ${SITE_NAME}`,
  };

  const descriptions: Record<string, string> = {
    overview: `Free ${lottery.name} results updated daily. Latest winning numbers, AI-powered number insights, and statistical analysis for every draw.`,
    numbers: `Free ${lottery.name} number recommendations based on frequency trends, hot/cold patterns, and overdue analysis. Updated after every draw.`,
    results: extra?.year
      ? `All ${lottery.name} winning numbers from ${extra.year}. Complete draw-by-draw results with full number breakdowns.`
      : `Complete ${lottery.name} winning numbers history. Every draw result from the full archive, updated daily.`,
    statistics: `${lottery.name} number frequency, hot/cold trends, overdue analysis, and pair data. Free tools updated after every draw.`,
  };

  const url = page === 'overview'
    ? `${SITE_URL}/${lottery.slug}`
    : `${SITE_URL}/${lottery.slug}/${page}${extra?.year ? `/${extra.year}` : ''}`;

  return {
    title: titles[page],
    description: descriptions[page],
    openGraph: {
      title: titles[page],
      description: descriptions[page],
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateHomeMetadata(): Metadata {
  const title = `${SITE_NAME} | Free Lottery Stats & Insights`;
  const description = 'Free lottery statistics and number insights for Powerball, Mega Millions, and more. Results, analysis, and tools updated daily.';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: SITE_URL,
    },
    alternates: {
      canonical: SITE_URL,
    },
  };
}
