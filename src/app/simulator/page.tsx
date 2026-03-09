import { Metadata } from 'next';
import { getAllLotteries } from '@/lib/lotteries/config';
import { loadLotteryData } from '@/lib/data/fetcher';
import { softwareAppSchema, breadcrumbSchema } from '@/lib/seo/structuredData';
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants';
import { DrawResult } from '@/lib/lotteries/types';
import WhatIfSimulator from '@/components/simulator/WhatIfSimulator';
import JsonLd from '@/components/seo/JsonLd';

export interface SimulatorLotteryConfig {
  slug: string;
  name: string;
  mainNumbers: { count: number; max: number };
  bonusNumber: { count: number; max: number; label: string };
  ticketPrice: number;
  colors: { primary: string; ball: string; bonusBall: string };
}

export const metadata: Metadata = {
  title: `What If You Never Missed a Draw? | ${SITE_NAME}`,
  description: 'Enter your lucky numbers and see what would have happened if you played every single draw. Discover your near-misses, total winnings, and biggest what-if moments.',
  openGraph: {
    title: `What If You Never Missed a Draw? | ${SITE_NAME}`,
    description: 'Enter your lucky numbers and see what would have happened if you played every single draw.',
    url: `${SITE_URL}/simulator`,
  },
  alternates: {
    canonical: `${SITE_URL}/simulator`,
  },
};

export default function SimulatorPage() {
  const lotteries = getAllLotteries();

  // Load ALL draws for each active game — the simulator needs full history
  const drawsByGame: Record<string, DrawResult[]> = {};
  const lotteryConfigs: SimulatorLotteryConfig[] = lotteries
    .filter(l => !l.retiredDate)
    .map(lottery => {
      try {
        const data = loadLotteryData(lottery.slug);
        drawsByGame[lottery.slug] = data.draws;
      } catch {
        drawsByGame[lottery.slug] = [];
      }
      return {
        slug: lottery.slug,
        name: lottery.name,
        mainNumbers: { count: lottery.mainNumbers.count, max: lottery.mainNumbers.max },
        bonusNumber: { count: lottery.bonusNumber.count, max: lottery.bonusNumber.max, label: lottery.bonusNumber.label },
        ticketPrice: lottery.ticketPrice,
        colors: { primary: lottery.colors.primary, ball: lottery.colors.ball, bonusBall: lottery.colors.bonusBall },
      };
    });

  return (
    <>
      <JsonLd data={softwareAppSchema({
        name: 'What-If Lottery Simulator',
        description: 'See what would have happened if you played your lucky numbers in every draw',
        url: `${SITE_URL}/simulator`,
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'What-If Simulator', url: `${SITE_URL}/simulator` },
      ])} />

      <WhatIfSimulator lotteries={lotteryConfigs} drawsByGame={drawsByGame} />
    </>
  );
}
