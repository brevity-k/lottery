/**
 * Generates deep evergreen guide pages using Claude API.
 * One-time script — run manually, review output, commit.
 *
 * Usage: ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-guides.ts
 * Output: content/guides/*.json
 *
 * Rate-limited to 10s between generations.
 * Skips guides where an output file already exists.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import {
  buildAllGameAnalysis,
  generateOutline,
  generateDraft,
  factCheck,
  parseBlogJson,
  loadCategory,
  BlogPost,
} from './lib/blog-generator';

// ---------------------------------------------------------------------------
// Guide topics
// ---------------------------------------------------------------------------

interface GuideTopic {
  slug: string;
  topic: string;
  targetKeyword: string;
}

const GUIDE_TOPICS: GuideTopic[] = [
  {
    slug: 'how-lottery-odds-work',
    topic: 'How lottery odds actually work — visual combinatorics, expected value per ticket, why order matters for bonus balls, and what the numbers really mean for players',
    targetKeyword: 'how lottery odds work',
  },
  {
    slug: 'lump-sum-vs-annuity',
    topic: 'Lump sum vs annuity: complete math walkthrough with specific dollar examples at $100M, $500M, and $1B jackpot levels across different tax brackets',
    targetKeyword: 'lump sum vs annuity lottery',
  },
  {
    slug: 'state-lottery-tax-guide',
    topic: 'Every US state lottery tax rate explained — exact withholding rates, dollar impact on real jackpot amounts, and which states have no tax at all',
    targetKeyword: 'state lottery tax rates',
  },
  {
    slug: 'common-lottery-scams',
    topic: 'Common lottery scams — how to identify advance-fee fraud, fake winner notifications, and phishing attempts targeting lottery players, plus how to report them',
    targetKeyword: 'lottery scams how to identify',
  },
  {
    slug: 'gamblers-fallacy-explained',
    topic: "The gambler's fallacy in lottery games — why past draws have zero influence on future outcomes, with mathematical proof and real examples from draw history",
    targetKeyword: "gamblers fallacy lottery explained",
  },
  {
    slug: 'how-to-claim-lottery-prizes',
    topic: 'How to claim lottery prizes — step-by-step process by prize tier and state, time limits, anonymity options, and what to do in the first 24 hours after winning',
    targetKeyword: 'how to claim lottery prizes',
  },
  {
    slug: 'history-of-powerball',
    topic: 'The complete history of Powerball — every format change since 1992, how each change affected jackpot odds and prize sizes, and where the game stands today',
    targetKeyword: 'history of powerball lottery',
  },
  {
    slug: 'mega-millions-2025-changes',
    topic: 'Mega Millions April 2025 overhaul — what changed when the ticket price went from $2 to $5, the Megaplier retirement, new odds structure, and early jackpot data',
    targetKeyword: 'mega millions 2025 changes',
  },
];

// ---------------------------------------------------------------------------
// GuidePost type (matches src/app/guides/[slug]/page.tsx interface)
// ---------------------------------------------------------------------------

interface GuidePost {
  slug: string;
  title: string;
  description: string;
  content: string;
  lastReviewed: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function blogPostToGuidePost(post: BlogPost, slug: string, today: string): GuidePost {
  return {
    slug,
    title: post.title,
    description: post.description,
    content: post.content,
    lastReviewed: today,
  };
}

// ---------------------------------------------------------------------------
// Generate a single guide
// ---------------------------------------------------------------------------

async function generateGuide(
  client: Anthropic,
  topic: GuideTopic,
  gameSections: string,
  today: string,
): Promise<GuidePost | null> {
  // Load the deep-dive-guide category template
  const category = loadCategory('deep-dive-guide');

  const existingTitles: string[] = [];
  let retries = 0;
  const maxRetries = 2;

  while (retries <= maxRetries) {
    try {
      // Pass 1: Outline
      console.log('  Pass 1: Research & Angle...');
      const outline = await generateOutline(
        client,
        category,
        topic.topic,
        topic.targetKeyword,
        gameSections,
        existingTitles,
      );
      console.log(`  Title: "${outline.title}"`);

      // Pass 2: Draft
      console.log('  Pass 2: Drafting...');
      const draftContent = await generateDraft(
        client,
        category,
        outline,
        topic.targetKeyword,
        gameSections,
      );
      const draft = parseBlogJson(draftContent);
      draft.date = today;

      // Pass 3: Fact-check
      console.log('  Pass 3: Fact-checking...');
      const result = await factCheck(client, draft, gameSections, category);

      if (result.approved) {
        console.log('  -> Approved');
        if (result.correctedContent) {
          draft.content = result.correctedContent;
        }
        return blogPostToGuidePost(draft, topic.slug, today);
      } else {
        console.log(`  -> Rejected (${result.corrections.join('; ')})`);
        retries++;
        if (retries > maxRetries) {
          console.log('  Skipped: max retries exceeded after fact-check rejections.');
          return null;
        }
        console.log(`  Retrying (attempt ${retries + 1}/${maxRetries + 1})...`);
      }
    } catch (err) {
      console.error('  Generation error:', err instanceof Error ? err.message : err);
      retries++;
      if (retries > maxRetries) {
        console.log('  Skipped: max retries exceeded after errors.');
        return null;
      }
      console.log(`  Retrying (attempt ${retries + 1}/${maxRetries + 1})...`);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    console.error('Usage: ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-guides.ts');
    process.exit(1);
  }

  const today = new Date().toISOString().split('T')[0];
  const outputDir = path.join(process.cwd(), 'content', 'guides');
  fs.mkdirSync(outputDir, { recursive: true });

  // Build analysis sections for all active games
  const gameSections = buildAllGameAnalysis();
  if (!gameSections) {
    console.log('No lottery data available. Continuing with empty game context.');
  }

  const client = new Anthropic();
  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < GUIDE_TOPICS.length; i++) {
    const topic = GUIDE_TOPICS[i];
    const outputPath = path.join(outputDir, `${topic.slug}.json`);

    // Skip if already generated
    if (fs.existsSync(outputPath)) {
      console.log(`[${i + 1}/${GUIDE_TOPICS.length}] Skipping "${topic.slug}" — file already exists.`);
      skipped++;
      continue;
    }

    console.log(`\n[${i + 1}/${GUIDE_TOPICS.length}] Generating: "${topic.slug}"`);
    console.log(`  Topic: ${topic.topic.slice(0, 80)}...`);

    const guide = await generateGuide(client, topic, gameSections, today);

    if (guide) {
      fs.writeFileSync(outputPath, JSON.stringify(guide, null, 2));
      console.log(`  Saved: ${outputPath}`);
      generated++;
    } else {
      console.log(`  Failed: "${topic.slug}" — skipping.`);
      skipped++;
    }

    // Rate limit: 10s between generations (skip delay after last item)
    if (i < GUIDE_TOPICS.length - 1) {
      console.log('  Waiting 10s before next generation...');
      await sleep(10000);
    }
  }

  console.log(`\nDone. Generated: ${generated}, Skipped/Failed: ${skipped}.`);
  console.log('Review the output in content/guides/, then commit the files.');
}

main().catch((err) => {
  console.error('Guide generation failed:', err);
  process.exit(1);
});
