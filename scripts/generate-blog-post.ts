/**
 * Auto-generates a daily blog post using Claude API + lottery data.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-blog-post.ts
 *
 * Skips gracefully if:
 *   - ANTHROPIC_API_KEY is not set
 *   - A post for today already exists
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types (self-contained – no @/ imports so tsx can run standalone)
// ---------------------------------------------------------------------------

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

interface NumberStat {
  number: number;
  count: number;
}

interface OverdueStat {
  number: number;
  drawsSince: number;
}

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  content: string;
}

interface GameAnalysis {
  name: string;
  slug: string;
  maxMain: number;
  hasBonus: boolean;
  latest: DrawResult;
  last5: DrawResult[];
  hot: NumberStat[];
  cold: NumberStat[];
  overdue: OverdueStat[];
  pairs: { pair: string; count: number }[];
  totalDraws: number;
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function loadLotteryData(slug: string): LotteryData | null {
  const filePath = path.join(process.cwd(), 'src', 'data', `${slug}.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Lightweight analysis helpers (no external deps)
// ---------------------------------------------------------------------------

function getHotNumbers(draws: DrawResult[], max: number, count: number): NumberStat[] {
  const freq = new Map<number, number>();
  for (let i = 1; i <= max; i++) freq.set(i, 0);
  const recent = draws.slice(0, 100);
  for (const d of recent) {
    for (const n of d.numbers) freq.set(n, (freq.get(n) || 0) + 1);
  }
  return Array.from(freq.entries())
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, count);
}

function getColdNumbers(draws: DrawResult[], max: number, count: number): NumberStat[] {
  const freq = new Map<number, number>();
  for (let i = 1; i <= max; i++) freq.set(i, 0);
  const recent = draws.slice(0, 100);
  for (const d of recent) {
    for (const n of d.numbers) freq.set(n, (freq.get(n) || 0) + 1);
  }
  return Array.from(freq.entries())
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => a.count - b.count)
    .slice(0, count);
}

function getOverdueNumbers(draws: DrawResult[], max: number, count: number): OverdueStat[] {
  const lastSeen = new Map<number, number>();
  for (let i = 1; i <= max; i++) lastSeen.set(i, draws.length);
  for (let i = 0; i < draws.length; i++) {
    for (const n of draws[i].numbers) {
      if (!lastSeen.has(n) || lastSeen.get(n) === draws.length) {
        lastSeen.set(n, i);
      }
    }
  }
  return Array.from(lastSeen.entries())
    .map(([number, idx]) => ({ number, drawsSince: idx }))
    .sort((a, b) => b.drawsSince - a.drawsSince)
    .slice(0, count);
}

function getTopPairs(draws: DrawResult[], count: number): { pair: string; count: number }[] {
  const pairMap = new Map<string, number>();
  const recent = draws.slice(0, 200);
  for (const d of recent) {
    const nums = [...d.numbers].sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        pairMap.set(key, (pairMap.get(key) || 0) + 1);
      }
    }
  }
  return Array.from(pairMap.entries())
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, count);
}

// ---------------------------------------------------------------------------
// Game configs (standalone, no imports)
// ---------------------------------------------------------------------------

const GAMES = [
  { slug: 'powerball', name: 'Powerball', maxMain: 69, hasBonus: true, bonusLabel: 'PB' },
  { slug: 'mega-millions', name: 'Mega Millions', maxMain: 70, hasBonus: true, bonusLabel: 'MB' },
  { slug: 'cash4life', name: 'Cash4Life', maxMain: 60, hasBonus: true, bonusLabel: 'CB' },
  { slug: 'ny-lotto', name: 'NY Lotto', maxMain: 59, hasBonus: true, bonusLabel: 'Bonus' },
  { slug: 'take5', name: 'Take 5', maxMain: 39, hasBonus: false, bonusLabel: '' },
];

// ---------------------------------------------------------------------------
// Existing post titles (to avoid duplicates)
// ---------------------------------------------------------------------------

function getExistingTitles(): string[] {
  const blogDir = path.join(process.cwd(), 'content', 'blog');
  try {
    return fs
      .readdirSync(blogDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const raw = fs.readFileSync(path.join(blogDir, f), 'utf-8');
        return (JSON.parse(raw) as BlogPost).title;
      });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Topic rotation (14 topics, cycling through all games)
// ---------------------------------------------------------------------------

const TOPICS = [
  'Recap and analysis of the latest Powerball draw results',
  'Weekly hot and cold number trends across all five lottery games',
  'Mega Millions draw analysis and statistical trends',
  'Cash4Life daily game spotlight: patterns and strategies',
  'Deep dive into overdue numbers across all games that are statistically due',
  'Number pair spotlight: which combinations appear together most often',
  'Mega Millions draw recap and weekend lottery outlook',
  'NY Lotto analysis: frequency trends and number insights',
  'Take 5 midday vs evening draw comparison and patterns',
  'Lottery tax analysis: which states give you the best net payout',
  'Multi-game comparison: Powerball vs Mega Millions vs Cash4Life odds',
  'Statistical anomalies and interesting patterns in recent draws',
  'State lottery spotlight: best states for lottery winners in terms of taxes',
  'Lump sum vs annuity: what the numbers actually show for current jackpots',
] as const;

function getTopicForToday(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TOPICS[dayOfYear % TOPICS.length];
}

// ---------------------------------------------------------------------------
// Build analysis for a game
// ---------------------------------------------------------------------------

function buildGameAnalysis(slug: string, name: string, maxMain: number, hasBonus: boolean, bonusLabel: string): string | null {
  const data = loadLotteryData(slug);
  if (!data || data.draws.length === 0) return null;

  const latest = data.draws[0];
  const last5 = data.draws.slice(0, 5);
  const hot = getHotNumbers(data.draws, maxMain, 10);
  const cold = getColdNumbers(data.draws, maxMain, 10);
  const overdue = getOverdueNumbers(data.draws, maxMain, 10);
  const pairs = getTopPairs(data.draws, 5);

  const bonusSuffix = hasBonus ? ` + ${bonusLabel} ${latest.bonusNumber}` : '';

  return `=== ${name.toUpperCase()} DATA ===
Latest draw (${latest.date}): ${latest.numbers.join(', ')}${bonusSuffix}
Last 5 draws:
${last5.map((d) => `  ${d.date}: ${d.numbers.join(', ')}${hasBonus ? ` + ${bonusLabel} ${d.bonusNumber}` : ''}`).join('\n')}
Hot numbers (last 100 draws): ${hot.map((n) => `#${n.number}(${n.count}x)`).join(', ')}
Cold numbers (last 100 draws): ${cold.map((n) => `#${n.number}(${n.count}x)`).join(', ')}
Most overdue: ${overdue.map((n) => `#${n.number}(${n.drawsSince} draws)`).join(', ')}
Top pairs (last 200 draws): ${pairs.map((p) => `[${p.pair}](${p.count}x)`).join(', ')}
Total draws in database: ${data.draws.length}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Guard: API key required
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('ANTHROPIC_API_KEY not set – skipping blog generation.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const outputDir = path.join(process.cwd(), 'content', 'blog');
  fs.mkdirSync(outputDir, { recursive: true });

  // Guard: skip if we already generated a post today
  const existing = fs.readdirSync(outputDir).filter((f) => f.endsWith('.json'));
  for (const f of existing) {
    if (f.includes(today)) {
      console.log(`Post for ${today} already exists – skipping.`);
      return;
    }
  }

  // Build analysis sections for all games
  const gameSections = GAMES
    .map(g => buildGameAnalysis(g.slug, g.name, g.maxMain, g.hasBonus, g.bonusLabel))
    .filter(Boolean)
    .join('\n\n');

  if (!gameSections) {
    console.log('No lottery data available – skipping blog generation.');
    return;
  }

  const topic = getTopicForToday();
  const existingTitles = getExistingTitles().slice(-30);

  // Build prompt
  const prompt = `You are a lottery statistics blogger for MyLottoStats.com, an SEO-optimized lottery information website.

Generate a unique, data-driven blog post based on the data and topic below.

RULES:
- Write 500-700 words of engaging, SEO-friendly content
- Use data-driven language: "analysis", "trends", "patterns", "insights", "frequency data"
- NEVER use: "prediction", "guaranteed", "winning strategy", "will win", "sure to hit"
- Reference SPECIFIC numbers and statistics from the data provided
- Always end with a brief disclaimer paragraph that lottery outcomes are random and analysis is for entertainment purposes only
- Make the title unique — do NOT reuse any title from the existing titles list
- Use proper HTML tags: h2, h3, p, ul, li, ol, strong, em
- Make it informative and interesting for lottery enthusiasts
- Cover multiple games when relevant, not just Powerball and Mega Millions

TODAY'S DATE: ${today}
TOPIC FOCUS: ${topic}

${gameSections}

=== EXISTING POST TITLES (do NOT reuse these) ===
${existingTitles.map((t) => `- ${t}`).join('\n') || '(none yet)'}

Respond with ONLY valid JSON (no markdown fences, no explanation) in this exact format:
{
  "slug": "lowercase-hyphenated-slug-including-date-${today}",
  "title": "Unique SEO Title Under 70 Characters",
  "description": "Meta description under 160 characters",
  "category": "Draw Recap | Weekly Analysis | Statistics | Number Trends | Deep Dive | Tax Analysis | Game Comparison",
  "content": "<h2>First Section</h2><p>Content...</p>"
}`;

  console.log(`Generating blog post for ${today} (topic: ${topic})...`);

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  let post: BlogPost;
  try {
    post = JSON.parse(text);
  } catch (e) {
    // Try extracting JSON from possible markdown fences
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      post = JSON.parse(match[0]);
    } else {
      console.error('Failed to parse response as JSON:', text.slice(0, 200));
      process.exit(1);
    }
  }

  // Enforce today's date
  post.date = today;

  // Ensure slug contains date for uniqueness
  if (!post.slug.includes(today)) {
    post.slug = `${post.slug}-${today}`;
  }

  const outputPath = path.join(outputDir, `${post.slug}.json`);
  if (fs.existsSync(outputPath)) {
    console.log(`File already exists: ${outputPath} – skipping.`);
    return;
  }

  fs.writeFileSync(outputPath, JSON.stringify(post, null, 2));
  console.log(`Generated: "${post.title}"`);
  console.log(`  Slug: ${post.slug}`);
  console.log(`  Category: ${post.category}`);
  console.log(`  Saved to: ${outputPath}`);
}

main().catch((err) => {
  console.error('Blog generation failed:', err);
  process.exit(1);
});
