import { DrawResult, PatternAnalysis } from '@/lib/lotteries/types';
import { calculateHotCold } from './hotCold';

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

export function analyzePatterns(
  numbers: number[],
  maxNumber: number,
  draws: DrawResult[]
): PatternAnalysis {
  const sorted = [...numbers].sort((a, b) => a - b);
  const midpoint = Math.ceil(maxNumber / 2);

  const sum = sorted.reduce((a, b) => a + b, 0);

  const avgWinningSum = draws.length > 0
    ? Math.round(draws.reduce((acc, d) => acc + d.numbers.reduce((a, b) => a + b, 0), 0) / draws.length)
    : 0;

  const oddCount = sorted.filter(n => n % 2 !== 0).length;
  const evenCount = sorted.length - oddCount;

  const lowCount = sorted.filter(n => n <= midpoint).length;
  const highCount = sorted.length - lowCount;

  const primes = sorted.filter(isPrime);

  const consecutivePairs: [number, number][] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) {
      consecutivePairs.push([sorted[i], sorted[i + 1]]);
    }
  }

  const hotCold = calculateHotCold(draws, maxNumber, 'main');
  const hotNumbers = hotCold.filter(h => h.classification === 'hot').map(h => h.number);
  const coldNumbers = hotCold.filter(h => h.classification === 'cold').map(h => h.number);

  return {
    sum,
    avgWinningSum,
    oddCount,
    evenCount,
    highCount,
    lowCount,
    primeCount: primes.length,
    primes,
    hasConsecutive: consecutivePairs.length > 0,
    consecutivePairs,
    spread: sorted[sorted.length - 1] - sorted[0],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    hotColdOverlap: {
      hot: sorted.filter(n => hotNumbers.includes(n)),
      cold: sorted.filter(n => coldNumbers.includes(n)),
    },
  };
}
