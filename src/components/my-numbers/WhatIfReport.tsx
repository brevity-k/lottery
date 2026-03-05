'use client';

import { useState, useEffect, useMemo } from 'react';
import { NumberSet, DrawResult, LotteryConfig } from '@/lib/lotteries/types';
import { analyzeWhatIf } from '@/lib/analysis/whatIf';
import { analyzePatterns } from '@/lib/analysis/patterns';
import { analyzeCrossGame } from '@/lib/analysis/crossGame';
import WhatIfSummary from './WhatIfSummary';
import PrizeTierBreakdown from './PrizeTierBreakdown';
import PatternAnalysisCard from './PatternAnalysisCard';
import CrossGameComparison from './CrossGameComparison';
import MatchTimeline from './MatchTimeline';

interface Props {
  numberSet: NumberSet;
  lotteries: LotteryConfig[];
}

export default function WhatIfReport({ numberSet, lotteries }: Props) {
  const [drawsByGame, setDrawsByGame] = useState<Record<string, DrawResult[]>>({});
  const [loading, setLoading] = useState(true);

  const lottery = lotteries.find(l => l.slug === numberSet.game);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadDraws() {
      const slugs = lotteries.map(l => l.slug);
      const loaded: Record<string, DrawResult[]> = {};

      await Promise.all(
        slugs.map(async (slug) => {
          try {
            const module = await import(`@/data/${slug}.json`);
            const data = module.default || module;
            loaded[slug] = data.draws || [];
          } catch {
            loaded[slug] = [];
          }
        })
      );

      if (!cancelled) {
        setDrawsByGame(loaded);
        setLoading(false);
      }
    }

    loadDraws();
    return () => { cancelled = true; };
  }, [numberSet.game, lotteries]);

  const draws = drawsByGame[numberSet.game] || [];

  const whatIfResult = useMemo(() => {
    if (draws.length === 0) return null;
    return analyzeWhatIf(numberSet.numbers, numberSet.bonusNumber, draws, numberSet.game, numberSet.startDate);
  }, [draws, numberSet]);

  const patternResult = useMemo(() => {
    if (draws.length === 0 || !lottery) return null;
    return analyzePatterns(numberSet.numbers, lottery.mainNumbers.max, draws);
  }, [draws, numberSet.numbers, lottery]);

  const crossGameResult = useMemo(() => {
    if (Object.keys(drawsByGame).length === 0) return null;
    return analyzeCrossGame(numberSet.numbers, numberSet.bonusNumber, drawsByGame, numberSet.game);
  }, [drawsByGame, numberSet]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Analyzing {lottery?.name || 'draws'}...</p>
        </div>
      </div>
    );
  }

  if (!whatIfResult || !lottery) {
    return <p className="text-sm text-gray-500 py-8 text-center">No draw data available for analysis.</p>;
  }

  return (
    <div className="space-y-6">
      <WhatIfSummary
        result={whatIfResult}
        setName={numberSet.name}
        gameName={lottery.name}
        startDate={numberSet.startDate}
      />
      <PrizeTierBreakdown tiers={whatIfResult.tiers} />
      {crossGameResult && (
        <CrossGameComparison results={crossGameResult} currentGame={numberSet.game} />
      )}
      {patternResult && (
        <PatternAnalysisCard
          analysis={patternResult}
          customNote={numberSet.customNote}
        />
      )}
      <MatchTimeline timeline={whatIfResult.matchTimeline} />
    </div>
  );
}
