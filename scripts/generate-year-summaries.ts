/**
 * Generates year-by-year summary paragraphs from lottery draw data.
 * Pure computation — no external API calls.
 *
 * Usage: npx tsx scripts/generate-year-summaries.ts
 * Output: src/data/year-summaries.json
 */

import fs from 'fs';
import path from 'path';

interface DrawResult {
  date: string;
  numbers: number[];
  bonusNumber: number | null;
  multiplier?: number;
  drawTime?: 'midday' | 'evening';
}

interface LotteryData {
  lottery: string;
  lastUpdated: string;
  draws: DrawResult[];
}

const DATA_DIR = path.join(__dirname, '../src/data');
const OUTPUT_FILE = path.join(DATA_DIR, 'year-summaries.json');

const GAMES: Array<{ slug: string; displayName: string }> = [
  { slug: 'powerball',            displayName: 'Powerball' },
  { slug: 'mega-millions',        displayName: 'Mega Millions' },
  { slug: 'cash4life',            displayName: 'Cash4Life' },
  { slug: 'ny-lotto',             displayName: 'NY Lotto' },
  { slug: 'take5',                displayName: 'Take 5' },
  { slug: 'millionaire-for-life', displayName: 'Millionaire for Life' },
];

function groupByYear(draws: DrawResult[]): Record<number, DrawResult[]> {
  const groups: Record<number, DrawResult[]> = {};
  for (const draw of draws) {
    const year = new Date(draw.date).getFullYear();
    if (!groups[year]) groups[year] = [];
    groups[year].push(draw);
  }
  return groups;
}

function countFrequencies(draws: DrawResult[]): Map<number, number> {
  const freq = new Map<number, number>();
  for (const draw of draws) {
    for (const n of draw.numbers) {
      freq.set(n, (freq.get(n) ?? 0) + 1);
    }
  }
  return freq;
}

function topPair(draws: DrawResult[]): [number, number, number] | null {
  // Returns [numA, numB, count] for the most co-occurring pair, or null if < 2 draws.
  if (draws.length < 2) return null;
  const pairCount = new Map<string, number>();
  for (const draw of draws) {
    const nums = [...draw.numbers].sort((a, b) => a - b);
    for (let i = 0; i < nums.length - 1; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]},${nums[j]}`;
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
      }
    }
  }
  if (pairCount.size === 0) return null;
  let bestKey = '';
  let bestCount = 0;
  for (const [key, count] of pairCount) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }
  const [a, b] = bestKey.split(',').map(Number);
  return [a, b, bestCount];
}

function buildSummary(
  displayName: string,
  year: number,
  draws: DrawResult[],
): string {
  const total = draws.length;

  const freq = countFrequencies(draws);
  if (freq.size === 0) return '';

  // Most / least frequent
  let mostNum = 0, mostCount = 0;
  let leastNum = 0, leastCount = Infinity;
  for (const [num, count] of freq) {
    if (count > mostCount) { mostCount = count; mostNum = num; }
    if (count < leastCount) { leastCount = count; leastNum = num; }
  }

  // Top pair
  const pair = topPair(draws);

  // Sentence assembly
  const drawWord = total === 1 ? 'draw' : 'draws';
  const appWord = (n: number) => n === 1 ? 'appearance' : 'appearances';

  let summary = `In ${year}, ${displayName} held ${total} ${drawWord}. `;
  summary += `Number ${mostNum} was the most frequently drawn main number (${mostCount} ${appWord(mostCount)}), `;
  summary += `while number ${leastNum} appeared the least (${leastCount} ${appWord(leastCount)}). `;

  if (pair && pair[2] >= 2) {
    const [a, b, cnt] = pair;
    const timeWord = cnt === 1 ? 'time' : 'times';
    summary += `The most common pair was ${a} and ${b}, co-occurring ${cnt} ${timeWord}.`;
  } else if (pair) {
    summary += `No pair appeared more than once during the year.`;
  }

  return summary.trim();
}

function main(): void {
  const summaries: Record<string, string> = {};

  for (const game of GAMES) {
    const filePath = path.join(DATA_DIR, `${game.slug}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${game.slug}: data file not found`);
      continue;
    }

    let data: LotteryData;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as LotteryData;
    } catch (err) {
      console.warn(`Skipping ${game.slug}: failed to parse JSON — ${err}`);
      continue;
    }

    const byYear = groupByYear(data.draws);
    const years = Object.keys(byYear).map(Number).sort();

    let gameTotal = 0;
    for (const year of years) {
      const draws = byYear[year];
      if (!draws || draws.length === 0) continue;

      const summary = buildSummary(game.displayName, year, draws);
      if (summary) {
        summaries[`${game.slug}-${year}`] = summary;
        gameTotal++;
      }
    }
    console.log(`  ${game.displayName}: ${gameTotal} year summaries`);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(summaries, null, 2), 'utf-8');
  const total = Object.keys(summaries).length;
  console.log(`\nWrote ${total} year summaries to ${OUTPUT_FILE}`);
}

main();
