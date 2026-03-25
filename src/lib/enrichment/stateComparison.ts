import { getState, getAllStateSlugs } from '@/lib/states/config';

/**
 * Generates a tax comparison paragraph for a state.
 * Compares against national average and highest/lowest tax states.
 * Pure computation — no AI API calls.
 */
export function getStateComparison(stateSlug: string): string | null {
  const state = getState(stateSlug);
  if (!state) return null;

  const allSlugs = getAllStateSlugs();
  const allStates = allSlugs.map(s => getState(s)).filter(Boolean);

  const rates = allStates.map(s => s!.taxRate);
  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  const highest = allStates.reduce((a, b) => a!.taxRate > b!.taxRate ? a : b);
  const jackpot = 100_000_000; // $100M reference

  const stateRate = state.taxRate;
  const statePct = (stateRate * 100).toFixed(1);
  const avgPct = (avgRate * 100).toFixed(1);

  if (stateRate === 0) {
    const savingsVsHighest = Math.round(highest!.taxRate * jackpot);
    return `${state.name} does not tax lottery winnings at the state level, making it one of the most favorable states for winners. On a $100M jackpot, you would save approximately $${(savingsVsHighest / 1_000_000).toFixed(1)}M compared to winning in ${highest!.name} (${(highest!.taxRate * 100).toFixed(1)}% state tax). The national average state lottery tax rate is ${avgPct}%.`;
  }

  const diffVsAvg = stateRate - avgRate;
  const comparison = diffVsAvg > 0.005 ? 'above' : diffVsAvg < -0.005 ? 'below' : 'near';
  const diffAmount = Math.abs(Math.round(diffVsAvg * jackpot));

  return `${state.name} taxes lottery winnings at ${statePct}%, which is ${comparison} the national average of ${avgPct}%. On a $100M jackpot, that's a state tax bill of approximately $${(Math.round(stateRate * jackpot) / 1_000_000).toFixed(1)}M — $${(diffAmount / 1_000_000).toFixed(1)}M ${diffVsAvg > 0 ? 'more' : 'less'} than the average state.`;
}
