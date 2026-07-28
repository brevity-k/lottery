import { LotteryData } from '@/lib/lotteries/types';
import fs from 'fs';
import path from 'path';

/**
 * Loads lottery data from a local JSON file at build time.
 * Reads from src/data/{lotterySlug}.json.
 */
export function loadLotteryData(lotterySlug: string): LotteryData {
  const filePath = path.join(process.cwd(), 'src', 'data', `${lotterySlug}.json`);

  const fileContents = fs.readFileSync(filePath, 'utf-8');
  const data: LotteryData = JSON.parse(fileContents);

  // Normalize legacy bonusNumber: 0 → null (no valid lottery uses 0 as a bonus number)
  for (const draw of data.draws) {
    if (draw.bonusNumber === 0) {
      draw.bonusNumber = null;
    }
  }

  return data;
}

/**
 * Returns the total number of draws across all lottery data files.
 */
export function getTotalDrawCount(): number {
  const dataDir = path.join(process.cwd(), 'src', 'data');
  let total = 0;
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const data: LotteryData = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
      total += data.draws.length;
    } catch { /* skip non-lottery JSON */ }
  }
  return total;
}

let _numberInsightsCache: Record<string, string> | null = null;

/**
 * Loads a per-number AI-generated insight paragraph.
 * Uses fs.readFileSync with in-memory cache — NOT static import.
 */
export function loadNumberInsight(game: string, type: 'main' | 'bonus', number: number): string | null {
  if (!_numberInsightsCache) {
    const filePath = path.join(process.cwd(), 'src', 'data', 'number-insights.json');
    try {
      _numberInsightsCache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      _numberInsightsCache = {};
    }
  }
  return _numberInsightsCache![`${game}-${type}-${number}`] || null;
}
