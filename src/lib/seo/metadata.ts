import { Metadata } from 'next';
import { LotteryConfig } from '@/lib/lotteries/types';
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants';

const year = new Date().getFullYear();

export function generateLotteryMetadata(
  lottery: LotteryConfig,
  page: 'overview' | 'numbers' | 'results' | 'statistics',
  extra?: { year?: string }
): Metadata {
  const titles: Record<string, string> = {
    overview: `${lottery.name} — Latest Results, Hot Numbers & AI Analysis`,
    numbers: `Pick Smarter ${lottery.name} Numbers — 3 Data-Driven Strategies`,
    results: extra?.year
      ? `${lottery.name} Results ${extra.year} — Every Winning Number`
      : `Every ${lottery.name} Result Since ${lottery.startYear} — Full History`,
    statistics: `Which ${lottery.name} Numbers Hit Most? ${year} Frequency Data`,
  };

  const descriptions: Record<string, string> = {
    overview: `Today's ${lottery.name} winning numbers plus frequency trends, hot & cold analysis, and a What-If simulator. See which numbers hit most often. Updated daily.`,
    numbers: `${lottery.name} number picks based on frequency trends, overdue patterns, and hot/cold analysis. Three strategies to choose from — or generate random picks. Free tool.`,
    results: extra?.year
      ? `All ${lottery.name} winning numbers drawn in ${extra.year}. Complete draw-by-draw results searchable by date.`
      : `Searchable ${lottery.name} winning numbers from ${lottery.startYear} to today. Every draw, every number. Updated after each drawing.`,
    statistics: `See which ${lottery.name} numbers are drawn most, which are overdue, and the most common pairs and triplets. Historical frequency charts updated after every draw.`,
  };

  const url = page === 'overview'
    ? `${SITE_URL}/${lottery.slug}`
    : `${SITE_URL}/${lottery.slug}/${page}${extra?.year ? `/${extra.year}` : ''}`;

  return {
    title: { absolute: titles[page] },
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
  const title = `Latest Lottery Results & Statistics | ${SITE_NAME}`;
  const description = 'Today\'s winning numbers for Powerball, Mega Millions, NY Lotto & more. Hot/cold analysis, frequency stats, number picks, and a What-If simulator. Updated daily.';
  return {
    title: { absolute: title },
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
