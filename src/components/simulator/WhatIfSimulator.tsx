'use client';

import { useState, useCallback } from 'react';
import { SimulatorLotteryConfig } from '@/app/simulator/page';
import { DrawResult, WhatIfResult, LotterySlug } from '@/lib/lotteries/types';
import { analyzeWhatIf } from '@/lib/analysis/whatIf';

interface WhatIfSimulatorProps {
  lotteries: SimulatorLotteryConfig[];
  drawsByGame: Record<string, DrawResult[]>;
}

export default function WhatIfSimulator({ lotteries, drawsByGame }: WhatIfSimulatorProps) {
  const [selectedGame, setSelectedGame] = useState(lotteries[0]?.slug || '');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedBonus, setSelectedBonus] = useState<number | null>(null);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const lottery = lotteries.find(l => l.slug === selectedGame);
  const hasBonus = lottery ? lottery.bonusNumber.count > 0 : false;
  const mainCount = lottery?.mainNumbers.count ?? 5;
  const mainMax = lottery?.mainNumbers.max ?? 69;
  const bonusMax = lottery?.bonusNumber.max ?? 26;
  const draws = drawsByGame[selectedGame] || [];

  const isReady =
    selectedNumbers.length === mainCount &&
    (!hasBonus || selectedBonus !== null);

  const handleGameChange = useCallback((slug: string) => {
    setSelectedGame(slug);
    setSelectedNumbers([]);
    setSelectedBonus(null);
    setResult(null);
  }, []);

  const toggleNumber = useCallback((num: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      }
      if (prev.length >= mainCount) return prev;
      return [...prev, num].sort((a, b) => a - b);
    });
    setResult(null);
  }, [mainCount]);

  const toggleBonus = useCallback((num: number) => {
    setSelectedBonus(prev => (prev === num ? null : num));
    setResult(null);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!isReady || !lottery) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const whatIfResult = analyzeWhatIf(
        selectedNumbers,
        selectedBonus ?? undefined,
        draws,
        selectedGame as LotterySlug,
      );
      setResult(whatIfResult);
      setIsAnalyzing(false);
    }, 800);
  }, [isReady, lottery, selectedNumbers, selectedBonus, draws, selectedGame]);

  // Results placeholder for Task 3
  if (result) {
    return <div>Results coming in Task 3</div>;
  }

  const mainNumbersFull = selectedNumbers.length >= mainCount;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          What If You Never Missed a Draw?
        </h2>
        <p className="mt-2 text-gray-500">
          Pick your numbers. We&apos;ll replay every draw in history.
        </p>
      </div>

      {/* Game Selector — Horizontal Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {lotteries.map(l => (
          <button
            key={l.slug}
            onClick={() => handleGameChange(l.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedGame === l.slug
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      {lottery && (
        <>
          {/* Number Counter */}
          <p className="text-center text-sm text-gray-500">
            Pick {mainCount} numbers from 1&ndash;{mainMax}{' '}
            <span className="font-semibold text-gray-700">
              ({selectedNumbers.length}/{mainCount})
            </span>
          </p>

          {/* Main Number Grid */}
          <div className="grid grid-cols-7 sm:grid-cols-10 gap-2 max-w-md sm:max-w-xl mx-auto">
            {Array.from({ length: mainMax }, (_, i) => i + 1).map(num => {
              const isSelected = selectedNumbers.includes(num);
              const isDisabled = !isSelected && mainNumbersFull;
              return (
                <button
                  key={num}
                  onClick={() => toggleNumber(num)}
                  disabled={isDisabled}
                  className={`aspect-square rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white scale-110 shadow-md'
                      : isDisabled
                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Bonus Number Grid */}
          {hasBonus && (
            <div>
              <p className="text-center text-sm text-gray-500 mb-3">
                Pick your{' '}
                <span className="font-semibold text-red-600">
                  {lottery.bonusNumber.label}
                </span>{' '}
                from 1&ndash;{bonusMax}{' '}
                <span className="font-semibold text-gray-700">
                  ({selectedBonus !== null ? 1 : 0}/1)
                </span>
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-md sm:max-w-xl mx-auto">
                {Array.from({ length: bonusMax }, (_, i) => i + 1).map(num => {
                  const isSelected = selectedBonus === num;
                  const isDisabled = !isSelected && selectedBonus !== null;
                  return (
                    <button
                      key={num}
                      onClick={() => toggleBonus(num)}
                      disabled={isDisabled}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        isSelected
                          ? 'bg-red-600 text-white scale-110 shadow-md'
                          : isDisabled
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Numbers Display */}
          {selectedNumbers.length > 0 && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {selectedNumbers.map(num => (
                <span
                  key={num}
                  className="w-10 h-10 rounded-full bg-blue-600 text-white inline-flex items-center justify-center font-bold text-sm"
                >
                  {num}
                </span>
              ))}
              {hasBonus && selectedBonus !== null && (
                <>
                  <span className="text-gray-400 font-bold">+</span>
                  <span className="w-10 h-10 rounded-full bg-red-600 text-white inline-flex items-center justify-center font-bold text-sm">
                    {selectedBonus}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Run Button */}
          <button
            onClick={handleAnalyze}
            disabled={!isReady || isAnalyzing}
            className={`w-full py-3.5 rounded-full font-semibold text-lg transition-all ${
              isReady && !isAnalyzing
                ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Replaying {draws.length.toLocaleString()} draws&hellip;
              </span>
            ) : (
              'Run My Numbers'
            )}
          </button>
        </>
      )}
    </div>
  );
}
