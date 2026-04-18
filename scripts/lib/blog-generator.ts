/**
 * Shared blog generation module used by generate-blog-post.ts and backfill-blog.ts.
 *
 * Provides:
 * - Category loading from content/categories/*.md (YAML frontmatter via gray-matter)
 * - Topic selection (queue-first, category rotation fallback)
 * - Multi-pass generation (outline -> draft -> fact-check)
 * - Blog JSON parsing / validation
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { withRetry } from './retry';
import {
  CLAUDE_MODEL,
  BLOG_QUEUE,
  BLOG_MIN_WORDS,
  BLOG_FORBIDDEN_TERMS,
  KNOWN_DATASETS,
  isGameRetired,
  RETRY_PRESETS,
} from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryConfig {
  name: string;
  slug: string;
  minWords: number;
  maxWords: number;
  voice: string;
  requiredSections: string[];
  forbiddenTerms: string[];
  systemPrompt: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  content: string;
}

interface Outline {
  title: string;
  angle: string;
  outline: string;
  keyDataPoints: string[];
}

// ---------------------------------------------------------------------------
// Self-contained types (no @/ imports so tsx can run standalone)
// ---------------------------------------------------------------------------

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

interface NumberStat {
  number: number;
  count: number;
}

interface OverdueStat {
  number: number;
  drawsSince: number;
}

// ---------------------------------------------------------------------------
// Game configs
// ---------------------------------------------------------------------------

const GAMES = [
  { slug: 'powerball', name: 'Powerball', maxMain: 69, hasBonus: true, bonusLabel: 'PB' },
  { slug: 'mega-millions', name: 'Mega Millions', maxMain: 70, hasBonus: true, bonusLabel: 'MB' },
  { slug: 'cash4life', name: 'Cash4Life', maxMain: 60, hasBonus: true, bonusLabel: 'CB' },
  { slug: 'ny-lotto', name: 'NY Lotto', maxMain: 59, hasBonus: true, bonusLabel: 'Bonus' },
  { slug: 'take5', name: 'Take 5', maxMain: 39, hasBonus: false, bonusLabel: '' },
  { slug: 'millionaire-for-life', name: 'Millionaire for Life', maxMain: 58, hasBonus: true, bonusLabel: 'ML' },
];

// ---------------------------------------------------------------------------
// Valid internal link routes (used in fact-check pass)
// ---------------------------------------------------------------------------

const VALID_ROUTES = [
  '/powerball', '/mega-millions', '/cash4life', '/ny-lotto', '/take5', '/millionaire-for-life',
  '/powerball/statistics', '/mega-millions/statistics', '/cash4life/statistics',
  '/ny-lotto/statistics', '/take5/statistics', '/millionaire-for-life/statistics',
  '/powerball/numbers', '/mega-millions/numbers', '/cash4life/numbers',
  '/ny-lotto/numbers', '/take5/numbers', '/millionaire-for-life/numbers',
  '/powerball/results', '/mega-millions/results', '/cash4life/results',
  '/ny-lotto/results', '/take5/results', '/millionaire-for-life/results',
  '/tools/tax-calculator', '/tools/odds-calculator', '/tools/number-generator', '/tools/ticket-checker',
  '/simulator', '/states', '/methodology', '/about', '/responsible-gaming',
];

// State routes are valid as /states/*
const VALID_ROUTE_PREFIXES = ['/states/', '/blog/'];

// ---------------------------------------------------------------------------
// Category Loading
// ---------------------------------------------------------------------------

export function loadCategory(slug: string): CategoryConfig {
  const filePath = path.join(process.cwd(), 'content', 'categories', `${slug}.md`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    name: data.name,
    slug: data.slug,
    minWords: data.minWords ?? BLOG_MIN_WORDS,
    maxWords: data.maxWords ?? 1200,
    voice: data.voice ?? '',
    requiredSections: data.requiredSections ?? [],
    forbiddenTerms: data.forbiddenTerms ?? BLOG_FORBIDDEN_TERMS,
    systemPrompt: content.trim(),
  };
}

export function loadAllCategories(): CategoryConfig[] {
  const dir = path.join(process.cwd(), 'content', 'categories');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => loadCategory(f.replace('.md', '')));
}

// ---------------------------------------------------------------------------
// Data Loading & Analysis Helpers
// ---------------------------------------------------------------------------

function loadLotteryData(slug: string): LotteryData | null {
  const filePath = path.join(process.cwd(), 'src', 'data', `${slug}.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

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

function buildGameAnalysis(
  slug: string,
  name: string,
  maxMain: number,
  hasBonus: boolean,
  bonusLabel: string,
): string | null {
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

/**
 * Build analysis sections for all active games (skips retired games).
 * Returns a combined string, or empty string if no data is available.
 */
export function buildAllGameAnalysis(): string {
  const activeGames = GAMES.filter((g) => {
    if (isGameRetired(g.slug)) {
      console.log(`Skipping ${g.name} (retired ${KNOWN_DATASETS[g.slug]?.retiredDate})`);
      return false;
    }
    return true;
  });

  return activeGames
    .map((g) => buildGameAnalysis(g.slug, g.name, g.maxMain, g.hasBonus, g.bonusLabel))
    .filter(Boolean)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Topic Selection
// ---------------------------------------------------------------------------

function getWeekOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000) + 1;
  return Math.ceil(dayOfYear / 7);
}

/**
 * Normalize a target keyword into slug form so we can match against post slugs.
 * "How to Claim Lottery Prizes" → "how-to-claim-lottery-prizes"
 */
function keywordToSlugPrefix(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Select the next blog topic. Priority:
 * 1. First unconsumed item from BLOG_QUEUE (dedup by targetKeyword slug prefix)
 * 2. Category rotation fallback using week-of-year mod
 *
 * A queue item is considered consumed when an existing slug contains the
 * normalized targetKeyword — this prevents repeatedly picking the same
 * topic just because Claude generated different phrasing each time.
 */
export function selectTopic(
  existingSlugs: string[],
): { category: CategoryConfig; topic: string; targetKeyword: string } {
  const slugsLower = existingSlugs.map((s) => s.toLowerCase());

  // 1. Check BLOG_QUEUE for unconsumed topics
  for (const item of BLOG_QUEUE) {
    const keywordSlug = keywordToSlugPrefix(item.targetKeyword);
    const isConsumed = keywordSlug.length > 0 && slugsLower.some((s) => s.includes(keywordSlug));

    if (!isConsumed) {
      try {
        const category = loadCategory(item.category);
        return { category, topic: item.topic, targetKeyword: item.targetKeyword };
      } catch (err) {
        console.warn(`Failed to load category "${item.category}" for queue item, skipping:`, err);
        continue;
      }
    }
  }

  // 2. Fallback: category rotation using week-of-year mod
  console.log('BLOG_QUEUE exhausted — falling back to category rotation.');
  const allCategories = loadAllCategories();
  if (allCategories.length === 0) {
    throw new Error('No category templates found in content/categories/');
  }

  const weekOfYear = getWeekOfYear(new Date());
  const category = allCategories[weekOfYear % allCategories.length];

  // Generate a generic topic for the selected category
  const fallbackTopics: Record<string, string> = {
    'deep-dive-guide': 'A deep dive into the latest lottery statistics and what they reveal about number distribution patterns',
    'data-story': 'The most surprising patterns in this week\'s lottery draws — what the data shows that most people miss',
    'myth-buster': 'Common lottery misconceptions that the actual draw data disproves — the math behind the myths',
    'tax-and-money': 'Updated state-by-state lottery tax comparison — what winners actually take home right now',
    'game-comparison': 'How do all the lottery games we track compare right now in terms of odds, cost, and expected value?',
    'what-if-scenario': 'What if you had played the same numbers in every draw this year? A data-driven thought experiment',
    'winner-stories': 'Lessons from the biggest lottery winners in American history — what happened after they won',
    'lottery-news': 'This week in lottery news — notable draws, jackpot updates, and statistical milestones',
  };

  const fallbackKeywords: Record<string, string> = {
    'deep-dive-guide': 'lottery statistics analysis',
    'data-story': 'lottery number patterns',
    'myth-buster': 'lottery myths debunked',
    'tax-and-money': 'lottery tax by state',
    'game-comparison': 'best lottery game odds',
    'what-if-scenario': 'what if lottery numbers',
    'winner-stories': 'biggest lottery winners',
    'lottery-news': 'lottery news today',
  };

  return {
    category,
    topic: fallbackTopics[category.slug] || `Analysis of current ${category.name.toLowerCase()} trends in lottery data`,
    targetKeyword: fallbackKeywords[category.slug] || `lottery ${category.name.toLowerCase()}`,
  };
}

// ---------------------------------------------------------------------------
// Multi-Pass Generation
// ---------------------------------------------------------------------------

/**
 * Pass 1: Research & Angle — produces a structured outline.
 */
export async function generateOutline(
  client: Anthropic,
  category: CategoryConfig,
  topic: string,
  targetKeyword: string,
  gameSections: string,
  existingTitles: string[],
): Promise<Outline> {
  const prompt = `You are planning a blog post for MyLottoStats.com in the "${category.name}" category.

Given the topic, target keyword, and lottery data below, create a detailed outline for the post.

TOPIC: ${topic}
TARGET KEYWORD: ${targetKeyword}
CATEGORY VOICE: ${category.voice}
REQUIRED SECTIONS: ${category.requiredSections.join('; ')}
WORD RANGE: ${category.minWords}-${category.maxWords} words

=== LOTTERY DATA ===
${gameSections}

=== EXISTING TITLES (avoid duplicating) ===
${existingTitles.slice(-30).map((t) => `- ${t}`).join('\n') || '(none yet)'}

Respond with ONLY valid JSON (no markdown fences, no extra text). Keep the outline concise — section titles only, no bullets:
{"title": "SEO title under 60 chars", "angle": "Unique hook in 1 sentence", "outline": "Section 1: topic | Section 2: topic | Section 3: topic", "keyDataPoints": ["data point 1", "data point 2", "data point 3"]}`;

  const result = await withRetry(
    async () => {
      const message = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = message.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('Claude response contains no text block');
      }

      // Check for truncation (stop_reason !== 'end_turn' means content was cut off)
      if (message.stop_reason !== 'end_turn') {
        throw new Error(`Outline response truncated (stop_reason: ${message.stop_reason})`);
      }

      return parseJsonResponse<Outline>(textBlock.text);
    },
    { ...RETRY_PRESETS.CLAUDE_API, label: 'Pass 1: Outline' },
  );

  return result;
}

/**
 * Pass 2: Drafting — uses category system prompt + outline to produce full blog post.
 */
export async function generateDraft(
  client: Anthropic,
  category: CategoryConfig,
  outline: Outline,
  targetKeyword: string,
  gameSections: string,
): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  // Build the system prompt from the category template, substituting placeholders
  const systemPrompt = category.systemPrompt
    .replace(/\{\{topic\}\}/g, outline.outline)
    .replace(/\{\{targetKeyword\}\}/g, targetKeyword)
    .replace(/\{\{date\}\}/g, today)
    .replace(/\{\{lotteryData\}\}/g, gameSections)
    .replace(/\{\{existingTitles\}\}/g, '(handled in outline pass)');

  const userPrompt = `Write the complete blog post based on this approved outline.

APPROVED TITLE: ${outline.title}
ANGLE: ${outline.angle}
OUTLINE:
${outline.outline}

KEY DATA POINTS TO CITE:
${outline.keyDataPoints.map((dp) => `- ${dp}`).join('\n')}

TARGET KEYWORD (include naturally 1-2 times): ${targetKeyword}
TODAY'S DATE: ${today}

=== LOTTERY DATA (use these exact numbers) ===
${gameSections}

IMPORTANT:
- Follow the category voice: ${category.voice}
- Hit the word range: ${category.minWords}-${category.maxWords} words
- Use the approved title exactly as given
- Use the key data points from the outline — cite specific numbers from the lottery data
- Output ONLY valid JSON with: slug, title, description, category, content`;

  // Estimate max_tokens from maxWords (roughly 4x words = tokens, plus overhead for JSON)
  const maxTokens = Math.min(category.maxWords * 5 + 500, 8192);

  const result = await withRetry(
    async () => {
      const message = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = message.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('Claude response contains no text block');
      }

      return textBlock.text;
    },
    { ...RETRY_PRESETS.CLAUDE_API, label: 'Pass 2: Draft' },
  );

  return result;
}

/**
 * Pass 3: Fact-check — verifies the draft against the raw data and category rules.
 */
export async function factCheck(
  client: Anthropic,
  draft: BlogPost,
  gameSections: string,
  category: CategoryConfig,
): Promise<{ approved: boolean; corrections: string[]; correctedContent?: string }> {
  const prompt = `You are a fact-checker for MyLottoStats.com. Review the blog post below against the raw lottery data and category rules.

=== BLOG POST TO CHECK ===
Title: ${draft.title}
Category: ${draft.category}
Content:
${draft.content}

=== RAW LOTTERY DATA (source of truth) ===
${gameSections}

=== CATEGORY RULES ===
Voice: ${category.voice}
Min words: ${category.minWords}
Forbidden terms: ${category.forbiddenTerms.join(', ')}
Required sections: ${category.requiredSections.join('; ')}

=== VALID INTERNAL LINK ROUTES ===
${VALID_ROUTES.join(', ')}
Plus any route starting with: ${VALID_ROUTE_PREFIXES.join(', ')}

CHECK ONLY THESE — reject ONLY for serious errors:
1. Are any specific numbers WRONG? (e.g., says "#28 appeared 200 times" but data shows 173). Minor rounding or omitting tied numbers is OK.
2. Does the content contain forbidden terms: ${category.forbiddenTerms.join(', ')}?
3. Does it claim patterns can PREDICT future outcomes?

APPROVE if the post is factually reasonable, even with minor imprecisions. Do NOT reject for: rounding differences, incomplete lists, missing links, stylistic issues, or missing source citations.

Respond with ONLY valid JSON (no markdown fences, no explanation):
{"approved": true, "corrections": []}
or
{"approved": false, "corrections": ["one serious error"]}`;

  const result = await withRetry(
    async () => {
      const message = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = message.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('Claude response contains no text block');
      }

      return parseJsonResponse<{ approved: boolean; corrections: string[]; correctedContent?: string | null }>(textBlock.text);
    },
    { ...RETRY_PRESETS.CLAUDE_API, label: 'Pass 3: Fact-check' },
  );

  return {
    approved: result.approved,
    corrections: result.corrections || [],
    correctedContent: result.correctedContent || undefined,
  };
}

// ---------------------------------------------------------------------------
// JSON Parsing Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a JSON response from Claude, handling markdown fences and malformed output.
 */
function parseJsonResponse<T>(text: string): T {
  // Helper: fix literal newlines inside JSON string values
  function fixNewlinesInStrings(json: string): string {
    // Replace literal newlines inside quoted strings with \\n
    let result = '';
    let inString = false;
    let escape = false;
    for (let i = 0; i < json.length; i++) {
      const ch = json[i];
      if (escape) { result += ch; escape = false; continue; }
      if (ch === '\\') { result += ch; escape = true; continue; }
      if (ch === '"') { result += ch; inString = !inString; continue; }
      if (inString && ch === '\n') { result += '\\n'; continue; }
      if (inString && ch === '\r') { result += '\\r'; continue; }
      if (inString && ch === '\t') { result += '\\t'; continue; }
      result += ch;
    }
    return result;
  }

  function tryParse(raw: string): T | null {
    // Try as-is first
    try { return JSON.parse(raw); } catch { /* fall through */ }
    // Try with newline fix
    try { return JSON.parse(fixNewlinesInStrings(raw)); } catch { /* fall through */ }
    return null;
  }

  // 1. Try direct parse
  const direct = tryParse(text);
  if (direct) return direct;

  // 2. Strip markdown fences and try again
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    const result = tryParse(fenced[1].trim());
    if (result) return result;
  }

  // 3. Extract the outermost JSON object
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (!braceMatch) {
    throw new Error(`No JSON object found in response: ${text.slice(0, 200)}`);
  }

  const result = tryParse(braceMatch[0]);
  if (result) return result;

  throw new Error(`Failed to parse JSON from response: ${braceMatch[0].slice(0, 300)}`);
}

/**
 * Parse a blog post JSON from Claude output, with robust repair for unescaped HTML content.
 */
export function parseBlogJson(text: string): BlogPost {
  // 1. Try the generic parser first
  try {
    const result = parseJsonResponse<BlogPost>(text);
    if (result.slug && result.title && result.content) return result;
  } catch { /* fall through to repair */ }

  // 2. Extract the outermost JSON object for field-level repair
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (!braceMatch) {
    throw new Error(`No JSON object found in response: ${text.slice(0, 200)}`);
  }
  const raw = braceMatch[0];

  // 3. Attempt to repair: extract fields individually
  // Claude commonly produces unescaped quotes inside the HTML content field
  const extractField = (name: string): string => {
    const re = new RegExp(`"${name}"\\s*:\\s*"`, 'g');
    const m = re.exec(raw);
    if (!m) return '';
    const start = re.lastIndex;
    let i = start;
    while (i < raw.length) {
      if (raw[i] === '\\') { i += 2; continue; }
      if (raw[i] === '"') {
        const rest = raw.slice(i + 1).trimStart();
        if (rest.startsWith(',') || rest.startsWith('}')) {
          return raw.slice(start, i);
        }
      }
      i++;
    }
    return raw.slice(start);
  };

  const slug = extractField('slug');
  const title = extractField('title');
  const description = extractField('description');
  const category = extractField('category');
  const content = extractField('content');

  if (!slug || !title || !content) {
    throw new Error(`Failed to parse blog JSON after all attempts: ${raw.slice(0, 300)}`);
  }

  return { slug, title, description, category, content, date: '' };
}

// ---------------------------------------------------------------------------
// Existing Post Helpers
// ---------------------------------------------------------------------------

export function getExistingSlugs(): string[] {
  const blogDir = path.join(process.cwd(), 'content', 'blog');
  try {
    return fs
      .readdirSync(blogDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  } catch {
    return [];
  }
}

export function getExistingTitles(): string[] {
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

/**
 * Validate a blog post against content quality rules.
 * Throws on violations so the caller can retry.
 */
export function validatePost(post: BlogPost, category: CategoryConfig): void {
  // Required fields
  const requiredFields = ['slug', 'title', 'description', 'category', 'content'] as const;
  for (const field of requiredFields) {
    if (!post[field] || typeof post[field] !== 'string' || post[field].trim() === '') {
      throw new Error(`Blog post missing or empty required field: ${field}`);
    }
  }

  // Word count
  const wordCount = post.content.split(/\s+/).filter(Boolean).length;
  if (wordCount < category.minWords) {
    throw new Error(`Blog post too short: ${wordCount} words (minimum: ${category.minWords})`);
  }

  // Forbidden terms
  const contentLower = post.content.toLowerCase();
  for (const term of category.forbiddenTerms) {
    if (contentLower.includes(term)) {
      throw new Error(`Blog post contains forbidden term: "${term}"`);
    }
  }

  // Title length
  if (post.title.length > 60) {
    throw new Error(`Blog post title too long: ${post.title.length} chars (max 60)`);
  }
}
