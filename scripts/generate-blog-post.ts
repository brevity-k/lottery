/**
 * Auto-generates a daily blog post using Claude API + lottery data.
 * Uses a multi-pass approach: outline -> draft -> fact-check.
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
import {
  selectTopic,
  buildAllGameAnalysis,
  generateOutline,
  generateDraft,
  factCheck,
  parseBlogJson,
  validatePost,
  getExistingSlugs,
  getExistingTitles,
  BlogPost,
} from './lib/blog-generator';

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
  if (existing.some((f) => f.includes(today))) {
    console.log(`Post for ${today} already exists – skipping.`);
    return;
  }

  // Build analysis sections for all active games
  const gameSections = buildAllGameAnalysis();
  if (!gameSections) {
    console.log('No lottery data available – skipping blog generation.');
    return;
  }

  const existingSlugs = getExistingSlugs();
  const existingTitles = getExistingTitles();
  const { category, topic, targetKeyword } = selectTopic(existingSlugs, existingTitles);

  console.log(`Generating: category="${category.name}", topic="${topic.slice(0, 60)}..."`);

  const client = new Anthropic();
  let post: BlogPost | null = null;
  let retries = 0;
  const maxRetries = 2;

  while (retries <= maxRetries) {
    try {
      // Pass 1: Outline
      console.log('Pass 1: Research & Angle...');
      const outline = await generateOutline(
        client,
        category,
        topic,
        targetKeyword,
        gameSections,
        existingTitles,
      );
      console.log(`  Title: "${outline.title}"`);

      // Pass 2: Draft
      console.log('Pass 2: Drafting...');
      const draftContent = await generateDraft(
        client,
        category,
        outline,
        targetKeyword,
        gameSections,
      );
      const draft = parseBlogJson(draftContent);
      draft.date = today;

      // Validate before fact-check
      validatePost(draft, category);

      // Pass 3: Fact-check
      console.log('Pass 3: Fact-checking...');
      const result = await factCheck(client, draft, gameSections, category);

      if (result.approved) {
        console.log('  -> Approved');
        post = draft;
        if (result.correctedContent) {
          post.content = result.correctedContent;
        }
        break;
      } else {
        console.log(`  -> Rejected (${result.corrections.join('; ')})`);
        retries++;
        if (retries > maxRetries) {
          console.log('Skipped: max retries exceeded after fact-check rejections.');
          return;
        }
        console.log(`  Retrying (attempt ${retries + 1}/${maxRetries + 1})...`);
      }
    } catch (err) {
      console.error('Generation error:', err instanceof Error ? err.message : err);
      retries++;
      if (retries > maxRetries) {
        console.log('Skipped: max retries exceeded after errors.');
        return;
      }
      console.log(`  Retrying (attempt ${retries + 1}/${maxRetries + 1})...`);
    }
  }

  if (!post) return;

  // Ensure slug contains date for uniqueness
  if (!post.slug.includes(today)) {
    post.slug = `${post.slug}-${today}`;
  }

  // Check for slug collisions against existing posts
  const existingFiles = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
  if (existingFiles.includes(post.slug)) {
    console.log(`Slug collision detected: ${post.slug} — appending timestamp`);
    post.slug = `${post.slug}-${Date.now()}`;
  }

  const outputPath = path.join(outputDir, `${post.slug}.json`);
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
