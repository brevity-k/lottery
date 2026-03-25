/**
 * Batch-generates blog posts from the BLOG_QUEUE.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/backfill-blog.ts [--count 20] [--dry-run]
 *
 * Rate-limited to 1 post per 10 seconds to avoid API throttling.
 * Skips topics where a post with similar title already exists.
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
  validatePost,
  getExistingSlugs,
  getExistingTitles,
  loadCategory,
  BlogPost,
} from './lib/blog-generator';
import { BLOG_QUEUE } from './lib/constants';

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(): { count: number; dryRun: boolean } {
  const args = process.argv.slice(2);
  let count = 20;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      const parsed = parseInt(args[i + 1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        count = parsed;
      } else {
        console.error(`Invalid --count value: ${args[i + 1]}`);
        process.exit(1);
      }
      i++; // skip the value token
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { count, dryRun };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine whether a queue topic has already been consumed.
 * Mirrors the logic in selectTopic() from blog-generator.ts.
 */
function isTopicConsumed(topic: string, existingSlugs: string[], existingTitles: string[]): boolean {
  const topicPrefix = topic.slice(0, 30).toLowerCase();
  const slugsLower = existingSlugs.map((s) => s.toLowerCase());
  const titlesLower = existingTitles.map((t) => t.toLowerCase());

  return (
    slugsLower.some((s) => s.includes(topicPrefix.slice(0, 20).replace(/[^a-z0-9]/g, '-'))) ||
    titlesLower.some((t) => t.includes(topicPrefix))
  );
}

// ---------------------------------------------------------------------------
// Single-post generation (with retry)
// ---------------------------------------------------------------------------

async function generatePost(
  client: Anthropic,
  category: ReturnType<typeof loadCategory>,
  topic: string,
  targetKeyword: string,
  gameSections: string,
  existingTitles: string[],
  maxRetries: number,
): Promise<BlogPost | null> {
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      // Pass 1: Outline
      const outline = await generateOutline(
        client,
        category,
        topic,
        targetKeyword,
        gameSections,
        existingTitles,
      );
      console.log(`    Title: "${outline.title}"`);

      // Pass 2: Draft
      const draftContent = await generateDraft(
        client,
        category,
        outline,
        targetKeyword,
        gameSections,
      );
      const draft = parseBlogJson(draftContent);
      draft.date = new Date().toISOString().split('T')[0];

      // Validate structure + content rules before fact-check
      validatePost(draft, category);

      // Pass 3: Fact-check
      const result = await factCheck(client, draft, gameSections, category);

      if (result.approved) {
        if (result.correctedContent) {
          draft.content = result.correctedContent;
        }
        return draft;
      }

      console.log(`    Fact-check rejected: ${result.corrections.join('; ')}`);
      retries++;
      if (retries <= maxRetries) {
        console.log(`    Retrying (attempt ${retries + 1}/${maxRetries + 1})...`);
      }
    } catch (err) {
      console.error(`    Error: ${err instanceof Error ? err.message : String(err)}`);
      retries++;
      if (retries <= maxRetries) {
        console.log(`    Retrying (attempt ${retries + 1}/${maxRetries + 1})...`);
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Guard: API key required
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set.');
    console.error('Usage: ANTHROPIC_API_KEY=sk-... npx tsx scripts/backfill-blog.ts [--count 20] [--dry-run]');
    process.exit(1);
  }

  const { count, dryRun } = parseArgs();

  console.log(`Backfill blog: count=${count}, dry-run=${dryRun}`);

  // Build game analysis data once (expensive — reused across all posts)
  const gameSections = buildAllGameAnalysis();
  if (!gameSections) {
    console.error('No lottery data available. Run update-data.ts first.');
    process.exit(1);
  }

  // Snapshot existing state at start (updated in-memory as posts are saved)
  const existingSlugs = getExistingSlugs();
  const existingTitles = getExistingTitles();

  // Filter BLOG_QUEUE to unconsumed topics
  const unconsumedTopics = BLOG_QUEUE.filter(
    (item) => !isTopicConsumed(item.topic, existingSlugs, existingTitles),
  );

  if (unconsumedTopics.length === 0) {
    console.log('All BLOG_QUEUE topics already consumed. Nothing to generate.');
    return;
  }

  // Limit to requested count
  const toGenerate = unconsumedTopics.slice(0, count);

  console.log(`Found ${unconsumedTopics.length} unconsumed topics; will generate up to ${toGenerate.length}.\n`);

  // Dry-run: just list topics and exit
  if (dryRun) {
    console.log('--- DRY RUN: topics that would be generated ---');
    toGenerate.forEach((item, idx) => {
      console.log(`  ${idx + 1}. [${item.category}] ${item.topic.slice(0, 80)}...`);
    });
    console.log('--- End dry run ---');
    return;
  }

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'content', 'blog');
  fs.mkdirSync(outputDir, { recursive: true });

  const client = new Anthropic();
  const maxRetries = 2;
  const rateLimitMs = 10_000; // 10 seconds between posts

  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < toGenerate.length; i++) {
    const item = toGenerate[i];
    console.log(`[${i + 1}/${toGenerate.length}] Generating: [${item.category}] "${item.topic.slice(0, 70)}..."`);

    // Load category template
    let category: ReturnType<typeof loadCategory>;
    try {
      category = loadCategory(item.category);
    } catch (err) {
      console.error(`  Failed to load category "${item.category}": ${err instanceof Error ? err.message : String(err)}`);
      console.log('  Skipping.');
      skipped++;
      continue;
    }

    // Generate with retries
    const post = await generatePost(
      client,
      category,
      item.topic,
      item.targetKeyword,
      gameSections,
      existingTitles,
      maxRetries,
    );

    if (!post) {
      console.log('  Failed after max retries — skipping.');
      skipped++;
    } else {
      // Ensure slug contains a date suffix for uniqueness
      const today = new Date().toISOString().split('T')[0];
      if (!post.slug.includes(today)) {
        post.slug = `${post.slug}-${today}`;
      }

      // Resolve slug collisions against files already on disk
      const existingFiles = fs
        .readdirSync(outputDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace('.json', ''));
      if (existingFiles.includes(post.slug)) {
        post.slug = `${post.slug}-${Date.now()}`;
      }

      const outputPath = path.join(outputDir, `${post.slug}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(post, null, 2));

      // Keep in-memory title list fresh so future topics in this batch
      // aren't mistakenly flagged as duplicates of each other
      existingTitles.push(post.title);
      existingSlugs.push(post.slug);

      generated++;
      console.log(`  Generated ${generated}/${toGenerate.length}: "${post.title}"`);
      console.log(`  Saved: ${outputPath}`);
    }

    // Rate limit: pause before next post (skip after last one)
    if (i < toGenerate.length - 1) {
      console.log(`  Waiting ${rateLimitMs / 1000}s before next post...`);
      await sleep(rateLimitMs);
    }
  }

  // Summary
  const total = toGenerate.length;
  console.log(`\nDone. Generated ${generated} of ${total} posts, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
