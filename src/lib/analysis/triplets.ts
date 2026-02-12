import { DrawResult, TripletFrequency } from '@/lib/lotteries/types';

export function calculateTriplets(
  draws: DrawResult[],
  topCount: number = 15
): TripletFrequency[] {
  const tripletCounts = new Map<string, number>();
  const totalDraws = draws.length;

  for (const draw of draws) {
    const nums = [...draw.numbers].sort((a, b) => a - b);

    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        for (let k = j + 1; k < nums.length; k++) {
          const key = `${nums[i]}-${nums[j]}-${nums[k]}`;
          tripletCounts.set(key, (tripletCounts.get(key) || 0) + 1);
        }
      }
    }
  }

  const results: TripletFrequency[] = Array.from(tripletCounts.entries())
    .map(([key, count]) => {
      const [a, b, c] = key.split('-').map(Number);
      return {
        triplet: [a, b, c] as [number, number, number],
        count,
        percentage: totalDraws > 0 ? (count / totalDraws) * 100 : 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  return results.slice(0, topCount);
}
