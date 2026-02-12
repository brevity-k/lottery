/**
 * Data update script - fetches latest lottery data from SODA API
 * Run: npx tsx scripts/update-data.ts
 *
 * Supports:
 * - Powerball (bonus in winning_numbers)
 * - Mega Millions (bonus in mega_ball field)
 * - Cash4Life (bonus in cash_ball field)
 * - NY Lotto (bonus in bonus field)
 * - Take 5 (midday/evening fields, no bonus)
 */

import * as fs from 'fs';
import * as path from 'path';

interface LotterySource {
  id: string;
  name: string;
  url: string;
  mainCount: number;
  mainMax: number;
  bonusMax: number;
  bonusField?: string;
  middayField?: string;
  eveningField?: string;
  expectedDrawDays?: number[];  // 0=Sun, 1=Mon, ... 6=Sat
}

const sources: LotterySource[] = [
  {
    id: 'powerball',
    name: 'Powerball',
    url: 'https://data.ny.gov/resource/d6yy-54nr.json',
    mainCount: 5,
    mainMax: 69,
    bonusMax: 26,
    expectedDrawDays: [1, 3, 6],  // Mon, Wed, Sat
  },
  {
    id: 'mega-millions',
    name: 'Mega Millions',
    url: 'https://data.ny.gov/resource/5xaw-6ayf.json',
    mainCount: 5,
    mainMax: 70,
    bonusMax: 25,  // Was 25 pre-April 2025, now 24 — allow both for historical data
    bonusField: 'mega_ball',
    expectedDrawDays: [2, 5],  // Tue, Fri
  },
  {
    id: 'cash4life',
    name: 'Cash4Life',
    url: 'https://data.ny.gov/resource/kwxv-fwze.json',
    mainCount: 5,
    mainMax: 60,
    bonusMax: 4,
    bonusField: 'cash_ball',
    expectedDrawDays: [0, 1, 2, 3, 4, 5, 6],  // Daily
  },
  {
    id: 'ny-lotto',
    name: 'NY Lotto',
    url: 'https://data.ny.gov/resource/6nbc-h7bj.json',
    mainCount: 6,
    mainMax: 59,
    bonusMax: 59,
    bonusField: 'bonus',
    expectedDrawDays: [3, 6],  // Wed, Sat
  },
  {
    id: 'take5',
    name: 'Take 5',
    url: 'https://data.ny.gov/resource/dg63-4siq.json',
    mainCount: 5,
    mainMax: 39,
    bonusMax: 0,
    middayField: 'midday_winning_numbers',
    eveningField: 'evening_winning_numbers',
    expectedDrawDays: [0, 1, 2, 3, 4, 5, 6],  // Daily
  },
];

interface DrawResult {
  date: string;
  numbers: number[];
  bonusNumber: number;
  multiplier?: number;
  drawTime?: 'midday' | 'evening';
}

interface LotteryData {
  lottery: string;
  lastUpdated: string;
  draws: DrawResult[];
}

interface ValidationWarning {
  type: string;
  message: string;
}

function validateDraw(draw: DrawResult, source: LotterySource): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Range validation for main numbers
  for (const num of draw.numbers) {
    if (num < 1 || num > source.mainMax) {
      warnings.push({
        type: 'range',
        message: `${source.name}: Main number ${num} out of range [1-${source.mainMax}] on ${draw.date}`,
      });
    }
  }

  // Range validation for bonus number
  if (source.bonusMax > 0 && draw.bonusNumber > 0) {
    if (draw.bonusNumber < 1 || draw.bonusNumber > source.bonusMax) {
      warnings.push({
        type: 'range',
        message: `${source.name}: Bonus number ${draw.bonusNumber} out of range [1-${source.bonusMax}] on ${draw.date}`,
      });
    }
  }

  // Schedule validation
  if (source.expectedDrawDays) {
    const drawDate = new Date(draw.date + 'T12:00:00Z');
    const dayOfWeek = drawDate.getUTCDay();
    if (!source.expectedDrawDays.includes(dayOfWeek)) {
      warnings.push({
        type: 'schedule',
        message: `${source.name}: Draw on unexpected day (${draw.date}, day=${dayOfWeek})`,
      });
    }
  }

  return warnings;
}

function checkDuplicates(draws: DrawResult[], source: LotterySource): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const seen = new Set<string>();

  for (const draw of draws) {
    const key = draw.drawTime ? `${draw.date}-${draw.drawTime}` : draw.date;
    if (seen.has(key)) {
      warnings.push({
        type: 'duplicate',
        message: `${source.name}: Duplicate draw date ${key}`,
      });
    }
    seen.add(key);
  }

  return warnings;
}

async function fetchData(source: LotterySource): Promise<{ draws: DrawResult[]; warnings: ValidationWarning[] }> {
  const url = `${source.url}?$limit=50000&$order=draw_date DESC`;
  console.log(`Fetching ${source.name} data from SODA API...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.name}: ${response.status} ${response.statusText}`);
  }

  const rawData: Record<string, string>[] = await response.json();
  console.log(`  Received ${rawData.length} records`);

  const draws: DrawResult[] = [];
  const allWarnings: ValidationWarning[] = [];

  for (const record of rawData) {
    try {
      if (!record.draw_date) continue;
      const date = record.draw_date.split('T')[0];

      // Take 5 style: midday/evening fields
      if (source.middayField && source.eveningField) {
        const middayStr = record[source.middayField];
        if (middayStr) {
          const nums = middayStr.trim().split(/\s+/).map(Number);
          if (nums.length >= source.mainCount && !nums.some(isNaN)) {
            const draw: DrawResult = {
              date,
              numbers: nums.slice(0, source.mainCount),
              bonusNumber: 0,
              drawTime: 'midday',
            };
            allWarnings.push(...validateDraw(draw, source));
            draws.push(draw);
          }
        }

        const eveningStr = record[source.eveningField];
        if (eveningStr) {
          const nums = eveningStr.trim().split(/\s+/).map(Number);
          if (nums.length >= source.mainCount && !nums.some(isNaN)) {
            const draw: DrawResult = {
              date,
              numbers: nums.slice(0, source.mainCount),
              bonusNumber: 0,
              drawTime: 'evening',
            };
            allWarnings.push(...validateDraw(draw, source));
            draws.push(draw);
          }
        }
        continue;
      }

      // Standard: winning_numbers field
      if (!record.winning_numbers) continue;
      const allNumbers = record.winning_numbers.trim().split(/\s+/).map(Number);
      if (allNumbers.some(isNaN)) continue;

      let mainNumbers: number[];
      let bonusNumber: number;

      if (source.bonusField && record[source.bonusField]) {
        if (allNumbers.length < source.mainCount) continue;
        mainNumbers = allNumbers.slice(0, source.mainCount);
        bonusNumber = parseInt(record[source.bonusField]);
        if (isNaN(bonusNumber)) continue;
      } else if (source.bonusMax === 0) {
        if (allNumbers.length < source.mainCount) continue;
        mainNumbers = allNumbers.slice(0, source.mainCount);
        bonusNumber = 0;
      } else {
        if (allNumbers.length < source.mainCount + 1) continue;
        mainNumbers = allNumbers.slice(0, source.mainCount);
        bonusNumber = allNumbers[source.mainCount];
      }

      const draw: DrawResult = { date, numbers: mainNumbers, bonusNumber };

      if (record.multiplier) {
        const mult = parseInt(record.multiplier);
        if (!isNaN(mult)) draw.multiplier = mult;
      }

      allWarnings.push(...validateDraw(draw, source));
      draws.push(draw);
    } catch {
      // Skip invalid records
    }
  }

  // Sort by date descending
  draws.sort((a, b) => b.date.localeCompare(a.date));

  // Check for duplicates
  allWarnings.push(...checkDuplicates(draws, source));

  return { draws, warnings: allWarnings };
}

async function main() {
  const dataDir = path.join(process.cwd(), 'src', 'data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let hasChanges = false;
  const allWarnings: ValidationWarning[] = [];

  for (const source of sources) {
    try {
      const { draws, warnings } = await fetchData(source);
      allWarnings.push(...warnings);

      if (draws.length === 0) {
        console.log(`  Warning: No valid draws found for ${source.name}`);
        continue;
      }

      const data: LotteryData = {
        lottery: source.id,
        lastUpdated: new Date().toISOString(),
        draws,
      };

      const filePath = path.join(dataDir, `${source.id}.json`);

      // Record count guard: never overwrite if new data has fewer records
      let existingData = '';
      try {
        existingData = fs.readFileSync(filePath, 'utf-8');
        const existing: LotteryData = JSON.parse(existingData);
        if (existing.draws.length > draws.length) {
          console.log(`  WARNING: New data has fewer records (${draws.length}) than existing (${existing.draws.length}) for ${source.name}. Skipping.`);
          allWarnings.push({
            type: 'count_decrease',
            message: `${source.name}: New data (${draws.length}) < existing (${existing.draws.length}). Skipped.`,
          });
          continue;
        }
      } catch {
        // File doesn't exist yet
      }

      const newData = JSON.stringify(data, null, 2);

      if (existingData !== newData) {
        fs.writeFileSync(filePath, newData);
        console.log(`  Saved ${draws.length} draws to ${source.id}.json`);
        hasChanges = true;
      } else {
        console.log(`  No changes for ${source.name}`);
      }
    } catch (error) {
      console.error(`  Error fetching ${source.name}:`, error);
    }
  }

  // Print validation warnings
  if (allWarnings.length > 0) {
    console.log(`\n--- Validation Warnings (${allWarnings.length}) ---`);
    for (const w of allWarnings.slice(0, 20)) {
      console.log(`  [${w.type}] ${w.message}`);
    }
    if (allWarnings.length > 20) {
      console.log(`  ... and ${allWarnings.length - 20} more warnings`);
    }
  }

  if (hasChanges) {
    console.log('\nData updated successfully!');
  } else {
    console.log('\nNo data changes detected.');
  }
}

main().catch(console.error);
