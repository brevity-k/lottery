import { DrawResult, QuadrupletFrequency } from '@/lib/lotteries/types';

export function calculateQuadruplets(
  draws: DrawResult[],
  topCount: number = 10
): QuadrupletFrequency[] {
  const quadCounts = new Map<string, number>();
  const totalDraws = draws.length;

  for (const draw of draws) {
    const nums = [...draw.numbers].sort((a, b) => a - b);

    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        for (let k = j + 1; k < nums.length; k++) {
          for (let l = k + 1; l < nums.length; l++) {
            const key = `${nums[i]}-${nums[j]}-${nums[k]}-${nums[l]}`;
            quadCounts.set(key, (quadCounts.get(key) || 0) + 1);
          }
        }
      }
    }
  }

  const results: QuadrupletFrequency[] = Array.from(quadCounts.entries())
    .map(([key, count]) => {
      const [a, b, c, d] = key.split('-').map(Number);
      return {
        quadruplet: [a, b, c, d] as [number, number, number, number],
        count,
        percentage: totalDraws > 0 ? (count / totalDraws) * 100 : 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  return results.slice(0, topCount);
}
