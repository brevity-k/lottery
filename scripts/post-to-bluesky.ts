/**
 * Posts the latest blog post to Bluesky using the AT Protocol API.
 *
 * Usage:
 *   BLUESKY_HANDLE=... BLUESKY_APP_PASSWORD=... \
 *   npx tsx scripts/post-to-bluesky.ts
 *
 * Skips gracefully if:
 *   - Required env vars are not set
 *   - No blog posts exist in content/blog/
 *   - Latest blog post was already posted (tracked in .posted-to-bluesky)
 */

import fs from 'fs';
import path from 'path';
import { AtpAgent, RichText } from '@atproto/api';
import { withRetry } from './lib/retry';
import { RETRY_PRESETS } from './lib/constants';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SITE_URL = 'https://mylottostats.com';
const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');
const POSTED_FILE = path.join(process.cwd(), '.posted-to-bluesky');
const MAX_GRAPHEMES = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
}

function extractDateSuffix(filename: string): string {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})\.json$/);
  return match ? match[1] : '';
}

function getLatestBlogPost(): BlogPost | null {
  if (!fs.existsSync(BLOG_DIR)) return null;

  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => extractDateSuffix(b).localeCompare(extractDateSuffix(a)));

  if (files.length === 0) return null;

  const content = fs.readFileSync(path.join(BLOG_DIR, files[0]), 'utf-8');
  return JSON.parse(content) as BlogPost;
}

function graphemeLength(text: string): number {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  return [...segmenter.segment(text)].length;
}

function buildPostText(post: BlogPost): string {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const hashtags = '#Lottery #LotteryStats';
  const prefix = '\u{1F4CA} '; // 📊
  const sep = '\n\n';

  const title = post.title.length <= 70 ? post.title : post.title.slice(0, 67) + '...';
  const headline = `${prefix}${title}`;
  const withoutDesc = `${headline}${sep}${url}${sep}${hashtags}`;
  const descBudget = MAX_GRAPHEMES - graphemeLength(withoutDesc) - graphemeLength(sep);

  if (descBudget > 20 && post.description) {
    const description = post.description.length <= descBudget
      ? post.description
      : post.description.slice(0, descBudget - 3) + '...';
    return `${headline}${sep}${description}${sep}${url}${sep}${hashtags}`;
  }

  return withoutDesc;
}

function getPostedSlugs(): Set<string> {
  if (!fs.existsSync(POSTED_FILE)) return new Set();
  return new Set(
    fs.readFileSync(POSTED_FILE, 'utf-8').split('\n').filter(Boolean)
  );
}

function markAsPosted(slug: string): void {
  fs.appendFileSync(POSTED_FILE, slug + '\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const missing = ['BLUESKY_HANDLE', 'BLUESKY_APP_PASSWORD'].filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.log(`Skipping Bluesky post: missing env vars: ${missing.join(', ')}`);
    return;
  }

  const post = getLatestBlogPost();
  if (!post) {
    console.log('Skipping Bluesky post: no blog posts found');
    return;
  }

  console.log(`Latest blog post: "${post.title}" (${post.date})`);

  const posted = getPostedSlugs();
  if (posted.has(post.slug)) {
    console.log(`Skipping Bluesky post: already posted "${post.slug}"`);
    return;
  }

  const text = buildPostText(post);
  const len = graphemeLength(text);
  console.log(`Post (${len} graphemes):\n${text}\n`);

  if (len > MAX_GRAPHEMES) {
    throw new Error(`Post exceeds ${MAX_GRAPHEMES} graphemes (${len})`);
  }

  const agent = new AtpAgent({ service: 'https://bsky.social' });

  await withRetry(
    () => agent.login({
      identifier: process.env.BLUESKY_HANDLE!,
      password: process.env.BLUESKY_APP_PASSWORD!,
    }),
    { ...RETRY_PRESETS.X_API, label: 'Bluesky login' },
  );

  const rt = new RichText({ text });
  await rt.detectFacets(agent);

  const result = await withRetry(
    () => agent.post({
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString(),
    }),
    { ...RETRY_PRESETS.X_API, label: 'Bluesky post' },
  );

  markAsPosted(post.slug);
  console.log(`Posted to Bluesky: ${result.uri}`);
}

main().catch(err => {
  console.error('Failed to post to Bluesky:', err);
  process.exit(1);
});
