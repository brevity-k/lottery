/**
 * Export lottery draw data to Google Sheets via mise's gsheet-upload tool.
 *
 * Usage:
 *   npx tsx scripts/export-to-sheets.ts                    # Export all games
 *   npx tsx scripts/export-to-sheets.ts --game powerball   # Export one game
 *   npx tsx scripts/export-to-sheets.ts --tsv              # Output TSV to stdout (no upload)
 *   npx tsx scripts/export-to-sheets.ts --share user@x.com # Share the sheet
 *   npx tsx scripts/export-to-sheets.ts --last 100         # Export only last 100 draws
 *
 * Requires: mise's gsheet-upload tool on PATH (or set GSHEET_UPLOAD env var)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import type { LotteryData, DrawResult } from '../src/lib/lotteries/types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

const GAMES = [
  'powerball',
  'mega-millions',
  'ny-lotto',
  'take5',
  'cash4life',
  'millionaire-for-life',
];

function loadGameData(game: string): LotteryData | null {
  const filePath = path.join(DATA_DIR, `${game}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function drawToRow(game: string, draw: DrawResult): string[] {
  return [
    game,
    draw.date,
    draw.numbers.join(', '),
    draw.bonusNumber?.toString() ?? '',
    draw.multiplier?.toString() ?? '',
    draw.jackpot ?? '',
    draw.drawTime ?? '',
  ];
}

function buildTsv(games: string[], lastN?: number): string {
  const headers = ['Game', 'Date', 'Numbers', 'Bonus', 'Multiplier', 'Jackpot', 'Draw Time'];
  const rows: string[][] = [headers];

  for (const game of games) {
    const data = loadGameData(game);
    if (!data) {
      console.error(`Skipping ${game}: no data file`);
      continue;
    }

    let draws = data.draws;
    if (lastN && lastN > 0) {
      draws = draws.slice(0, lastN);
    }

    console.error(`${game}: ${draws.length} draws`);
    for (const draw of draws) {
      rows.push(drawToRow(game, draw));
    }
  }

  return rows.map(row => row.join('\t')).join('\n');
}

function findGsheetUpload(): string {
  if (process.env.GSHEET_UPLOAD) return process.env.GSHEET_UPLOAD;

  const candidates = [
    path.join(os.homedir(), 'project/brevity1swos/mise/py/gsheet-upload'),
    path.join(os.homedir(), 'mise/py/gsheet-upload'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(
    'gsheet-upload not found. Set GSHEET_UPLOAD env var or add mise/py to PATH.'
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const tsvOnly = args.includes('--tsv');
  const gameIndex = args.indexOf('--game');
  const gameFilter = gameIndex !== -1 ? args[gameIndex + 1] : undefined;
  const lastIndex = args.indexOf('--last');
  const lastN = lastIndex !== -1 ? parseInt(args[lastIndex + 1], 10) : undefined;
  const shareIndex = args.indexOf('--share');
  const shareEmail = shareIndex !== -1 ? args[shareIndex + 1] : undefined;

  const games = gameFilter ? [gameFilter] : GAMES;

  for (const game of games) {
    if (!GAMES.includes(game)) {
      console.error(`Unknown game: ${game}. Valid: ${GAMES.join(', ')}`);
      process.exit(1);
    }
  }

  const tsv = buildTsv(games, lastN);
  const totalRows = tsv.split('\n').length - 1;

  if (tsvOnly) {
    process.stdout.write(tsv);
    return;
  }

  // Write TSV to temp file for safe subprocess invocation
  const tmpFile = path.join(os.tmpdir(), `rottery-export-${Date.now()}.tsv`);
  fs.writeFileSync(tmpFile, tsv);

  try {
    const uploadTool = findGsheetUpload();
    const title = gameFilter
      ? `Lottery Stats - ${gameFilter} (${new Date().toISOString().split('T')[0]})`
      : `US Lottery Stats - All Games (${new Date().toISOString().split('T')[0]})`;

    console.error(`Uploading ${totalRows} rows to Google Sheets...`);

    const uploadArgs = [uploadTool, tmpFile, '--title', title];
    if (shareEmail) {
      uploadArgs.push('--share', shareEmail);
    }

    const result = execFileSync('python3', uploadArgs, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });

    const url = result.trim();
    console.log(`Sheet created: ${url}`);
  } finally {
    // Clean up temp file
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
