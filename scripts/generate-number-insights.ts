/**
 * Batch-generates unique analysis paragraphs for all per-number pages (~473).
 * Groups numbers by game, processes 20 numbers per API call.
 *
 * Usage: ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-number-insights.ts
 * Output: src/data/number-insights.json
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { CLAUDE_MODEL, RETRY_PRESETS } from './lib/constants';
import { withRetry } from './lib/retry';

// ---------------------------------------------------------------------------
// Types (inline — standalone script)
// ---------------------------------------------------------------------------

interface DrawResult {
  date: string;
  numbers: number[];
  bonusNumber: number | null;
}

interface LotteryData {
  lottery: string;
  lastUpdated: string;
  draws: DrawResult[];
}

interface GameConfig {
  slug: string;
  name: string;
  maxMain: number;
  hasBonus: boolean;
  maxBonus: number;
  bonusLabel: string;
}

interface NumberStats {
  key: string;
  game: string;
  type: 'main' | 'bonus';
  number: number;
  label: string;
  totalDraws: number;
  frequency: number;
  frequencyPct: string;
  rank: number;
  totalNumbers: number;
  status: 'hot' | 'cold' | 'warm';
  drawsSinceLast: number;
  longestGap: number;
  avgGap: number;
  topPairing: number | null;
  topPairingCount: number;
}

// ---------------------------------------------------------------------------
// Game configs (inline)
// ---------------------------------------------------------------------------

const GAMES: GameConfig[] = [
  { slug: 'powerball', name: 'Powerball', maxMain: 69, hasBonus: true, maxBonus: 26, bonusLabel: 'Powerball' },
  { slug: 'mega-millions', name: 'Mega Millions', maxMain: 70, hasBonus: true, maxBonus: 24, bonusLabel: 'Mega Ball' },
  { slug: 'cash4life', name: 'Cash4Life', maxMain: 60, hasBonus: true, maxBonus: 4, bonusLabel: 'Cash Ball' },
  { slug: 'ny-lotto', name: 'NY Lotto', maxMain: 59, hasBonus: true, maxBonus: 59, bonusLabel: 'Bonus' },
  { slug: 'take5', name: 'Take 5', maxMain: 39, hasBonus: false, maxBonus: 0, bonusLabel: '' },
  { slug: 'millionaire-for-life', name: 'Millionaire for Life', maxMain: 58, hasBonus: true, maxBonus: 5, bonusLabel: 'Millionaire Ball' },
];

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

function computeStats(
  game: GameConfig,
  type: 'main' | 'bonus',
  number: number,
  draws: DrawResult[]
): NumberStats {
  const key = `${game.slug}-${type}-${number}`;
  const label = type === 'bonus' ? game.bonusLabel : 'Number';
  const maxNum = type === 'main' ? game.maxMain : game.maxBonus;
  const totalDraws = draws.length;

  // Collect all appearances sorted by date descending (draws already sorted desc)
  const appearances: number[] = []; // draw indices where this number appeared
  for (let i = 0; i < draws.length; i++) {
    const d = draws[i];
    const pool = type === 'main' ? d.numbers : (d.bonusNumber !== null ? [d.bonusNumber] : []);
    if (pool.includes(number)) {
      appearances.push(i);
    }
  }

  const frequency = appearances.length;
  const frequencyPct = totalDraws > 0 ? ((frequency / totalDraws) * 100).toFixed(1) : '0.0';

  // Draws since last appearance
  const drawsSinceLast = appearances.length > 0 ? appearances[0] : totalDraws;

  // Gap analysis (gaps between consecutive appearances, indices are draw positions)
  let longestGap = 0;
  let avgGap = 0;
  if (appearances.length > 1) {
    const gaps: number[] = [];
    for (let i = 0; i < appearances.length - 1; i++) {
      gaps.push(appearances[i + 1] - appearances[i]);
    }
    longestGap = Math.max(...gaps);
    avgGap = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  } else if (appearances.length === 1) {
    longestGap = appearances[0];
    avgGap = appearances[0];
  }

  // Hot/cold: compare recent 100 draws vs overall rate
  const recentWindow = Math.min(100, totalDraws);
  const recentDraws = draws.slice(0, recentWindow);
  const recentCount = recentDraws.filter(d => {
    const pool = type === 'main' ? d.numbers : (d.bonusNumber !== null ? [d.bonusNumber] : []);
    return pool.includes(number);
  }).length;
  const expectedInWindow = recentWindow / maxNum;
  let status: 'hot' | 'cold' | 'warm' = 'warm';
  if (recentCount > expectedInWindow * 1.3) status = 'hot';
  else if (recentCount < expectedInWindow * 0.7) status = 'cold';

  // Frequency rank among all numbers of same type
  // Build frequency map for all numbers
  const freqMap: Record<number, number> = {};
  for (let n = 1; n <= maxNum; n++) freqMap[n] = 0;
  for (const d of draws) {
    const pool = type === 'main' ? d.numbers : (d.bonusNumber !== null ? [d.bonusNumber] : []);
    for (const n of pool) {
      if (n >= 1 && n <= maxNum) freqMap[n] = (freqMap[n] || 0) + 1;
    }
  }
  const sortedFreqs = Object.values(freqMap).sort((a, b) => b - a);
  const rank = sortedFreqs.findIndex(f => f <= frequency) + 1;
  const totalNumbers = maxNum;

  // Top pairing (main numbers only)
  let topPairing: number | null = null;
  let topPairingCount = 0;
  if (type === 'main') {
    const pairCounts: Record<number, number> = {};
    for (const d of draws) {
      if (d.numbers.includes(number)) {
        for (const n of d.numbers) {
          if (n !== number) {
            pairCounts[n] = (pairCounts[n] || 0) + 1;
          }
        }
      }
    }
    const entries = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) {
      topPairing = parseInt(entries[0][0]);
      topPairingCount = entries[0][1];
    }
  }

  return {
    key,
    game: game.name,
    type,
    number,
    label,
    totalDraws,
    frequency,
    frequencyPct,
    rank,
    totalNumbers,
    status,
    drawsSinceLast,
    longestGap,
    avgGap,
    topPairing,
    topPairingCount,
  };
}

// ---------------------------------------------------------------------------
// Claude prompt
// ---------------------------------------------------------------------------

function buildPrompt(batch: NumberStats[]): string {
  const items = batch
    .map((s, i) => {
      const pairingLine = s.topPairing
        ? `Top pairing: #${s.topPairing} (appeared together ${s.topPairingCount} times).`
        : 'No pairing data (bonus ball).';
      return `[${i + 1}] KEY: "${s.key}"
Game: ${s.game} | Type: ${s.type} (${s.label}) | Number: ${s.number}
Total draws in dataset: ${s.totalDraws}
Frequency: ${s.frequency} times (${s.frequencyPct}%) | Rank: #${s.rank} of ${s.totalNumbers}
Hot/Cold status: ${s.status}
Draws since last appearance: ${s.drawsSinceLast}
Longest gap between appearances: ${s.longestGap} draws | Average gap: ${s.avgGap} draws
${pairingLine}`;
    })
    .join('\n\n');

  return `You are a lottery statistics writer for mylottostats.com. Write a unique 80-120 word analysis paragraph for each of the following lottery numbers. Each paragraph must:
- Describe that specific number's behavioral pattern using the provided stats
- Be factual, informative, and written in a neutral editorial voice
- Vary in structure so paragraphs don't sound like templates
- Avoid any prediction claims or language like "likely to appear," "due to hit," "guaranteed"
- Include appropriate qualifiers like "historically," "in past draws," "based on available data"
- NOT say "as an AI" or reference this being AI-generated

Respond with a JSON object where each key matches the KEY field exactly, and the value is the paragraph string. No markdown, no code fences — raw JSON only.

${items}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set — exiting.');
    process.exit(1);
  }

  const client = new Anthropic();
  const outputPath = path.join(process.cwd(), 'src', 'data', 'number-insights.json');

  // Load existing insights so we can resume without re-generating
  let existing: Record<string, string> = {};
  if (fs.existsSync(outputPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      console.log(`Loaded ${Object.keys(existing).length} existing insights.`);
    } catch {
      console.warn('Could not parse existing number-insights.json — starting fresh.');
    }
  }

  const allInsights: Record<string, string> = { ...existing };
  const BATCH_SIZE = 20;

  for (const game of GAMES) {
    console.log(`\nProcessing ${game.name}...`);

    // Load game data
    const dataPath = path.join(process.cwd(), 'src', 'data', `${game.slug}.json`);
    if (!fs.existsSync(dataPath)) {
      console.warn(`  Data file not found: ${dataPath} — skipping.`);
      continue;
    }

    let lotteryData: LotteryData;
    try {
      lotteryData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    } catch {
      console.warn(`  Failed to parse ${dataPath} — skipping.`);
      continue;
    }

    // Normalize legacy bonusNumber: 0 → null
    for (const d of lotteryData.draws) {
      if ((d as DrawResult & { bonusNumber: number | null }).bonusNumber === 0) {
        d.bonusNumber = null;
      }
    }

    // Build list of numbers to process
    const types: Array<{ type: 'main' | 'bonus'; max: number }> = [
      { type: 'main', max: game.maxMain },
    ];
    if (game.hasBonus) {
      types.push({ type: 'bonus', max: game.maxBonus });
    }

    const allStats: NumberStats[] = [];
    for (const { type, max } of types) {
      for (let n = 1; n <= max; n++) {
        const key = `${game.slug}-${type}-${n}`;
        if (allInsights[key]) {
          // Already generated — skip
          continue;
        }
        allStats.push(computeStats(game, type, n, lotteryData.draws));
      }
    }

    if (allStats.length === 0) {
      console.log(`  All insights already generated — skipping.`);
      continue;
    }

    console.log(`  Generating insights for ${allStats.length} numbers in batches of ${BATCH_SIZE}...`);

    // Process in batches
    for (let i = 0; i < allStats.length; i += BATCH_SIZE) {
      const batch = allStats.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allStats.length / BATCH_SIZE);
      console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} numbers)...`);

      const prompt = buildPrompt(batch);

      let parsed: Record<string, string> = {};
      try {
        parsed = await withRetry(
          async () => {
            const response = await client.messages.create({
              model: CLAUDE_MODEL,
              max_tokens: 4096,
              messages: [{ role: 'user', content: prompt }],
            });

            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            // Strip any accidental markdown fences
            const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
            return JSON.parse(cleaned);
          },
          { ...RETRY_PRESETS.CLAUDE_API, label: `${game.name} batch ${batchNum}` }
        );
      } catch (err) {
        console.error(`  Failed batch ${batchNum}: ${err}`);
        // Continue — we'll write what we have so far
      }

      // Merge results
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string' && value.trim()) {
          allInsights[key] = value.trim();
        }
      }

      // Persist after every batch so progress isn't lost on interruption
      fs.writeFileSync(outputPath, JSON.stringify(allInsights, null, 2));

      // Rate limit between batches
      if (i + BATCH_SIZE < allStats.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`  Done with ${game.name}.`);
  }

  const total = Object.keys(allInsights).length;
  console.log(`\nComplete. ${total} insights saved to src/data/number-insights.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
