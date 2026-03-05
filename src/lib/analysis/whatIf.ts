import { DrawResult, WhatIfResult, PrizeTierResult, LotterySlug } from '@/lib/lotteries/types';
import { prizeTables, PrizeTier } from '@/lib/lotteries/prizes';

export function analyzeWhatIf(
  userNumbers: number[],
  userBonus: number | undefined,
  draws: DrawResult[],
  game: LotterySlug,
  startDate?: string
): WhatIfResult {
  const tiers = prizeTables[game];
  if (!tiers) {
    return { totalWinnings: 0, totalDrawsChecked: 0, tiers: [], bestDraw: null, matchTimeline: [] };
  }

  const hasBonus = tiers.some(t => t.bonusMatch);
  const filteredDraws = startDate
    ? draws.filter(d => d.date >= startDate)
    : draws;

  const tierResults: Map<string, PrizeTierResult> = new Map();
  for (const tier of tiers) {
    tierResults.set(tier.label, {
      label: tier.label,
      mainMatches: tier.mainMatches,
      bonusMatch: tier.bonusMatch,
      prize: tier.prize,
      count: 0,
      totalWon: 0,
    });
  }

  let totalWinnings = 0;
  let bestDraw: WhatIfResult['bestDraw'] = null;
  const matchTimeline: WhatIfResult['matchTimeline'] = [];

  for (const draw of filteredDraws) {
    const mainMatches = userNumbers.filter(n => draw.numbers.includes(n)).length;
    const bonusMatch = hasBonus && userBonus != null && draw.bonusNumber === userBonus;

    const matchedTier = findMatchingTier(tiers, mainMatches, bonusMatch);
    const prize = matchedTier?.prize ?? 0;

    if (prize > 0 && matchedTier) {
      const tierResult = tierResults.get(matchedTier.label)!;
      tierResult.count += 1;
      tierResult.totalWon += prize;
      totalWinnings += prize;
    }

    if (mainMatches > 0 || bonusMatch) {
      const entry = { date: draw.date, matched: mainMatches, bonusMatch, prize };
      matchTimeline.push(entry);

      if (!bestDraw || prize > bestDraw.prize) {
        bestDraw = entry;
      }
    }
  }

  return {
    totalWinnings,
    totalDrawsChecked: filteredDraws.length,
    tiers: Array.from(tierResults.values()),
    bestDraw,
    matchTimeline: matchTimeline.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function findMatchingTier(
  tiers: PrizeTier[],
  mainMatches: number,
  bonusMatch: boolean
): PrizeTier | null {
  for (const tier of tiers) {
    if (tier.mainMatches === mainMatches) {
      if (tier.bonusMatch && bonusMatch) return tier;
      if (!tier.bonusMatch && !bonusMatch) return tier;
      if (tier.bonusMatch && !bonusMatch) continue;
      if (!tier.bonusMatch) return tier;
    }
  }
  return null;
}
