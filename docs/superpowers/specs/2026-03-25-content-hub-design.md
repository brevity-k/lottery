# Content Hub: Blog Pipeline Upgrade + Page Enrichment + E-E-A-T

**Date:** 2026-03-25
**Status:** Draft
**Goal:** Transform mylottostats.com from a thin data tool into an editorial-grade lottery statistics platform to (1) pass AdSense "low value content" review and (2) drive organic traffic growth.

## Context

### Problem

The site has ~645 pages but ~540 (84%) are thin templates with under 80 words of original prose. AdSense rejected with "low value content." Competitive research shows approved lottery sites (LotteryUSA, LotteryPost, LottoStrategies) have similar volumes of templated pages but anchor them with strong editorial content layers.

### Key Research Findings

- Lottery statistics content is explicitly allowed under US AdSense publisher policies (informational, not transactional).
- Templated pages do NOT need to be removed — LotteryPost has 375K indexed pages with full ad stacks.
- The rejection trigger is the editorial-to-template ratio, not the template count.
- YMYL classification means stricter E-E-A-T scrutiny (credentials, methodology, editorial standards).
- Site needs 20-30 well-written editorial pages before reapplying.

### Current Blog Pipeline

Single-pass Claude Sonnet generation with 8 rotating topics, 600-900 word target, no fact-checking, 400-word minimum. Only 4 auto-generated posts exist alongside 8 hand-written seed posts. Auto-generated posts contain factual errors (Mega Millions 71-75 "discontinued" claim) and dead links (`/tools/number-tracker`).

## Design

### 1. Blog Category Engine

Replace the single-template blog generator with a category-based content system. Each category has its own prompt template, voice, structure, word targets, and quality criteria.

#### 6 Categories

| Category | Voice | Word Target | Internal Link Targets |
|---|---|---|---|
| Deep Dive Guide | Authoritative, educational | 1500-2000 | /methodology, game pages, /tools/* |
| Data Story | Narrative, surprising | 800-1200 | /simulator, /*/statistics |
| What-If Scenario | Conversational, relatable | 800-1200 | /simulator, /*/numbers |
| Tax & Money | Practical, specific | 1000-1500 | /tools/tax-calculator, /states/* |
| Myth Buster | Debunking, sharp | 800-1200 | /methodology, /*/statistics |
| Game Comparison | Analytical, head-to-head | 1000-1500 | /*/statistics, /*/numbers |

#### Category Prompt Templates

Stored in `content/categories/<category-slug>.md`. Each file contains:

```markdown
---
name: Deep Dive Guide
slug: deep-dive-guide
minWords: 1500
maxWords: 2000
voice: "Authoritative and educational. Write like a well-researched magazine article."
requiredSections:
  - h2 introduction with hook
  - at least 3 h2 body sections
  - HTML table comparing data
  - blockquote with surprising stat
  - 2-3 internal links
  - 1-2 sentence disclaimer ending
forbiddenTerms: [prediction, guaranteed, winning strategy, sure win, proven method]
---

{system prompt for this category}
```

#### Pre-Seeded Topic Queue

A `BLOG_QUEUE` array in `scripts/lib/constants.ts` lists specific topic+category combos. The generator picks from the queue first, falls back to category rotation when empty.

```typescript
export const BLOG_QUEUE: { category: string; topic: string; targetKeyword: string }[] = [
  // Deep Dive Guides (AdSense-approval anchors)
  { category: 'deep-dive-guide', topic: 'Complete guide to claiming lottery prizes...', targetKeyword: 'how to claim lottery prizes' },
  { category: 'deep-dive-guide', topic: 'Lump sum vs annuity: the real math...', targetKeyword: 'lump sum vs annuity lottery' },
  // Data Stories (traffic drivers)
  { category: 'data-story', topic: 'I simulated 10,000 lottery tickets...', targetKeyword: 'lottery simulation results' },
  // Myth Busters (engagement)
  { category: 'myth-buster', topic: '5 things lottery experts say that are wrong...', targetKeyword: 'lottery myths debunked' },
  // Tax & Money (high-value queries)
  { category: 'tax-and-money', topic: 'You won $100M in California vs Texas...', targetKeyword: 'best states for lottery winners' },
  // ... 15-20 total pre-seeded topics
];
```

#### Multi-Pass Generation Flow

```
Pass 1 — Research & Angle (~500 tokens output)
  Input: category template + lottery data + existing slugs/titles
  Output: { title, angle, outline, keyDataPoints }
  Model: Claude Sonnet
  Purpose: Pick a non-duplicate angle, plan structure

Pass 2 — Draft (~2000-4000 tokens output)
  Input: Pass 1 outline + full game data + category voice/structure guidelines
  Output: complete HTML blog post
  Model: Claude Sonnet
  Purpose: Full draft with narrative voice, data integration, internal links

Pass 3 — Fact-Check & Edit (~500 tokens output)
  Input: Pass 2 draft + raw data for verification
  Output: { approved: boolean, corrections: string[], correctedContent?: string }
  Model: Claude Sonnet
  Checks:
    - Numbers cited in post match actual data values
    - No claims about numbers outside their valid pool range
    - All internal links point to real pages (validated against known routes)
    - No forbidden terms
    - Word count meets category minimum
    - Has required structural elements (table, blockquote, etc.)
  On failure: retry Pass 2 with correction notes (max 2 retries, then skip day)

Skip behavior: when all retries are exhausted, `generate-blog-post.ts` exits with
code 0 and logs "Skipped: max retries exceeded" but writes NO output file. The
`post-to-x.ts` script already handles "no new post" gracefully — it finds the most
recent post by date in content/blog/ and checks if it was already posted (via slug
matching against the X post history file). If no new post exists, it exits cleanly
with "No new post to share." This chain-skip behavior must be verified during
implementation by testing the full workflow with a deliberate skip.
```

#### Backfill Script

`scripts/backfill-blog.ts` — runs the category engine in batch mode, iterating through `BLOG_QUEUE`. Generates 15-20 posts at once. Run manually once, commit results.

```
Usage: ANTHROPIC_API_KEY=sk-... npx tsx scripts/backfill-blog.ts [--count 20] [--dry-run]
```

Rate-limited to 1 post per 10 seconds to avoid API throttling. Skips topics where a post with similar title already exists.

### 2. Guide Pages

5-8 deep evergreen guide pages generated once via script and committed as static content.

#### Topics

1. "How Lottery Odds Actually Work" — visual combinatorics explanation
2. "Lump Sum vs Annuity: The Complete Math" — with calculator examples
3. "State-by-State Lottery Tax Guide" — links to all state hubs
4. "Common Lottery Scams and How to Avoid Them" — consumer protection
5. "The Gambler's Fallacy Explained" — why past draws don't predict future
6. "How to Claim Lottery Prizes" — process by prize tier and state
7. "History of Powerball: Every Format Change" — historical reference
8. "The Mega Millions $5 Overhaul: What Changed" — April 2025 changes

#### Architecture

```
content/guides/*.json          — generated guide content
src/app/guides/page.tsx        — guide index page
src/app/guides/[slug]/page.tsx — guide detail page (reads from content/guides/)
```

#### Guide JSON Schema

Guides use a distinct schema from blog posts (no rotating `category`, adds `lastReviewed`):

```typescript
interface GuidePost {
  slug: string;          // URL slug, e.g. "how-lottery-odds-work"
  title: string;         // Page title
  description: string;   // Meta description
  content: string;       // HTML content body
  lastReviewed: string;  // ISO date of last editorial review, e.g. "2026-03-25"
}
```

The `guides/[slug]/page.tsx` component reads all `content/guides/*.json` files via `fs.readdirSync` + `fs.readFileSync` (same pattern as blog post loading in `src/lib/blog.ts`). The guide index page lists all guides sorted by `lastReviewed` descending.

Generated by `scripts/generate-guides.ts` using the Deep Dive Guide category prompt with enhanced depth instructions. Run once manually, review output, commit.

### 3. Page Enrichment

Add editorial prose to existing thin pages. No AI API calls for most enrichments — pure data computation.

#### Year Archive Pages (~70 pages)

Auto-computed summary paragraph from draw data:

```
"2024 saw 156 Powerball draws with 3 jackpot winners, including the $842M
prize on Jan 1. Number 32 appeared 28 times (most frequent), while 61
appeared just 6 times (least frequent). The most common pair was 7-32,
drawn together 5 times."
```

Implementation:
- New script `scripts/generate-year-summaries.ts` runs during `fetch-lottery-data.yml` after data update
- Computes from existing analysis functions: frequency, hot/cold, pairs
- Outputs `src/data/year-summaries.json` keyed by `{game}-{year}`
- Year archive page reads and renders the summary paragraph

#### Game Overview Pages (6 pages)

Three new content blocks:

1. **Prize tier table** — new `src/data/prize-tiers.ts` with all tier data per game (odds, prize, multiplied amount). Rendered as an HTML table in the page component.

2. **"How to Play" section** — new `src/data/game-guides.ts` with static HTML strings, one per game (~200-300 words each). Covers: how to play, ticket cost, draw schedule details, Quick Pick stats, purchase locations.

3. **Notable jackpots** — new `src/data/notable-jackpots.ts` with 3-5 biggest wins per game (date, amount, state, winner status). Rendered as a highlight section.

#### Per-Number Pages (~473 pages)

Replace useless FAQ ("check the grid above") with AI-generated unique paragraphs.

Batch-generate via `scripts/generate-number-insights.ts`:
- Groups numbers by game (6 games × ~80 numbers avg)
- Each API call processes 20 numbers at once
- ~24 total API calls, ~$1.20 total cost
- Output: `src/data/number-insights.json` keyed by `{game}-{type}-{number}`
- Each insight is 80-120 words describing that specific number's behavioral pattern
- Refresh monthly via scheduled workflow

**Loading strategy:** The `[numberSlug]/page.tsx` component reads insights using `fs.readFileSync` at render time (same pattern as `loadLotteryData()` in `src/lib/data/fetcher.ts`). Do NOT statically import the JSON — that would bundle all ~473 entries into every page's server module. Use a `loadNumberInsight(game, type, number)` function in `src/lib/data/fetcher.ts` that reads and caches the JSON file once per build, then returns the matching entry.

Example output:
```
"Number 32 has appeared in 247 of 1,917 Powerball draws (12.9%), ranking
#3 among all main numbers. It's currently on a hot streak — drawn 4 times
in the last 20 draws, well above the expected 1.4. Its longest absence was
67 draws (Feb-Jul 2019). It pairs most frequently with 16 (31 times together)."
```

#### State Hub Pages (~47 pages)

Auto-computed tax comparison paragraph using existing `state-tax-rates.ts`:

```typescript
// Pure computation — no AI needed
function getStateComparison(state: StateConfig, allStates: StateConfig[]): string {
  const avgRate = average(allStates.map(s => s.taxRate));
  // Compare against national average and highest/lowest tax states (not neighbors —
  // geographic adjacency data is not available and not worth maintaining).
  const highestTaxState = allStates.reduce((a, b) => a.taxRate > b.taxRate ? a : b);
  const savingsVsHighest = (highestTaxState.taxRate - state.taxRate) * 100_000_000 / 100;
  // Returns comparison paragraph like:
  // "California charges no state tax on lottery prizes, saving you $8.8M
  //  compared to winning in New York (8.82%). The national average state
  //  lottery tax rate is 5.1%."
}
```

New file: `src/lib/enrichment/stateComparison.ts`

### 4. About Page E-E-A-T Expansion

Replace the current ~250-word generic About page with a structured E-E-A-T page:

```
1. Mission statement (tightened from existing)
2. "Our Approach" — link to /methodology, brief analysis engine description
3. "Data & Transparency"
   - Cite NY Open Data SODA API explicitly with link
   - "Updated daily via automated pipeline"
   - Dynamic counter: "{totalDraws} draws analyzed across {gameCount} games"
4. "What Makes Us Different"
   - Pairs/triplets/quadruplets analysis
   - What-If Simulator
   - Tax calculator with all 50 states
   - State-by-state coverage
5. "Built by lottery data enthusiasts"
   - No real names (identity policy)
   - Frame as: "a team of data analysts and software engineers"
   - "Statistical methodology reviewed against academic standards"
6. "Editorial Standards" (NEW — key for YMYL)
   - "We never predict outcomes or claim winning strategies"
   - "We cite all data sources and disclose methodology"
   - "We update data daily and verify accuracy"
   - "We include responsible gambling resources on every page"
7. Disclaimer (keep existing)
```

Dynamic stats counter computed at build time from data files.

### 5. Byline Component

New `src/components/blog/Byline.tsx` displayed on all blog and guide pages:

```
By {PEN_NAME}, Data Analyst · {formattedDate} · Data verified {lastUpdated}
```

- Pen name stored in `src/lib/utils/constants.ts` as `BYLINE_NAME` (e.g., "The MyLottoStats Team"). This is a frontend display constant used by the React component, so it belongs in the frontend constants file alongside `SITE_NAME` and `DISCLAIMER_TEXT` — not in `scripts/lib/constants.ts` which is for automation scripts.
- Uses team attribution rather than individual to avoid identity policy issues
- `lastUpdated` comes from the most recent data file timestamp

### 6. "Last Updated" Timestamps

Add `lastUpdated` display to all data-driven pages that don't already have it:

- `[lottery]/statistics/page.tsx` — add below h1
- `[lottery]/results/page.tsx` — add below h1
- `[lottery]/results/[year]/page.tsx` — add below description
- `[lottery]/numbers/[numberSlug]/page.tsx` — add below h1
- `states/[state]/page.tsx` — add below h1

Format: "Last updated {date} · Verify with {officialSource} ↗" (same pattern as game overview page line 69-71).

### 7. Bug Fixes

| Issue | Fix |
|---|---|
| Dead link `/tools/number-tracker` in cash4life blog post | Edit JSON file, remove broken link |
| Mega Millions 71-75 "possibly discontinued" in overdue blog post | Edit JSON file, remove incorrect claim |
| Contact page exposes `rottery0.kr@gmail.com` | Remove the hardcoded fallback email entirely. The contact form uses Resend via the API route — the `mailto:` link with the raw email is unnecessary and violates the identity policy. If `CONTACT_EMAIL` is unset, hide the email display line (the form still works via the API route). |
| FAQ answers "check the grid above" in number pages | Replaced by AI-generated insights (Section 3) |
| `BLOG_MIN_WORDS` too low at 400 | Keep `BLOG_MIN_WORDS` as a global floor (raise to 600). Add per-category `minWords` in category template frontmatter. `generate-blog-post.ts` reads the category's `minWords` and uses `Math.max(BLOG_MIN_WORDS, categoryMin)`. Scripts that import `BLOG_MIN_WORDS` (`validate-build.ts`, `seo-health-check.ts`) continue working unchanged against the global floor. |

## File Changes

### New Files

```
scripts/
├── backfill-blog.ts                # Batch generate 15-20 posts from queue
├── generate-guides.ts              # One-time deep guide generation
├── generate-number-insights.ts     # Batch per-number AI analysis
├── generate-year-summaries.ts      # Compute year summaries from data

src/
├── components/blog/Byline.tsx      # Author + date + verification badge
├── data/
│   ├── game-guides.ts              # Static "how to play" per game
│   ├── notable-jackpots.ts         # Notable wins per game
│   ├── number-insights.json        # AI-generated per-number paragraphs
│   ├── prize-tiers.ts              # Prize tier tables per game
│   └── year-summaries.json         # Auto-generated year summaries
├── lib/
│   ├── analysis/numberBehavior.ts  # Compute behavioral template for numbers
│   └── enrichment/stateComparison.ts  # State tax comparison paragraph
├── app/guides/
│   ├── page.tsx                    # Guides index
│   └── [slug]/page.tsx             # Guide detail page

content/
├── categories/
│   ├── deep-dive-guide.md
│   ├── data-story.md
│   ├── what-if-scenario.md
│   ├── tax-and-money.md
│   ├── myth-buster.md
│   └── game-comparison.md
└── guides/                         # 5-8 generated guide JSONs
```

### Modified Files

```
scripts/
├── generate-blog-post.ts           # Multi-pass, category system
├── lib/constants.ts                # BLOG_QUEUE, category config, pen name, raised minimums

src/app/
├── [lottery]/page.tsx              # Prize tiers, how-to-play, notable jackpots
├── [lottery]/statistics/page.tsx   # Add lastUpdated
├── [lottery]/results/page.tsx      # Add lastUpdated
├── [lottery]/results/[year]/page.tsx  # Year summary + lastUpdated
├── [lottery]/numbers/[numberSlug]/page.tsx  # AI insight + lastUpdated
├── states/[state]/page.tsx         # Tax comparison + lastUpdated
├── about/page.tsx                  # E-E-A-T expansion
├── blog/[slug]/page.tsx            # Add Byline component
├── contact/page.tsx                # Remove hardcoded fallback email
├── sitemap.ts                      # Add /guides/* URLs

content/blog/
├── cash4life-retirement-*.json     # Fix dead link
├── powerball-mega-millions-overdue-*.json  # Fix factual error

.github/workflows/
├── fetch-lottery-data.yml          # Add year-summaries generation step
```

## GitHub Actions Changes

```yaml
# fetch-lottery-data.yml — add after data fetch step:
- name: Generate year summaries
  run: npx tsx scripts/generate-year-summaries.ts

# generate-blog.yml — modified flow:
- name: Generate blog post
  run: npx tsx scripts/generate-blog-post.ts
  # Now uses multi-pass with category selection
```

## API Cost

| Item | Frequency | Calls | Cost |
|---|---|---|---|
| Daily blog (3-pass) | Daily | 3 | ~$0.10/day |
| Blog backfill | One-time | ~60 | ~$3.00 |
| Guide generation | One-time | ~24 | ~$1.50 |
| Number insights | Monthly | ~24 | ~$1.20 |
| Year summaries | Daily | 0 (data computation) | $0 |
| State comparisons | Build-time | 0 (data computation) | $0 |
| **Monthly ongoing** | | | **~$3-4/month** |
| **One-time setup** | | | **~$5.70** |

## Execution Order

1. Bug fixes (dead links, factual errors, contact email)
2. About page E-E-A-T expansion
3. "Last updated" timestamps on all data pages
4. Byline component
5. Static data files (prize-tiers, game-guides, notable-jackpots)
6. Page enrichment: year summaries, state comparisons, number behavior templates
7. Blog category engine + multi-pass pipeline
8. Blog backfill (15-20 posts)
9. Guide pages generation + route
10. Number insights batch generation
11. Update GitHub Actions workflows

## Success Criteria

- All ~645 pages have >100 words of editorial prose
- 25+ blog posts exist (8 seed + 4 fixed AI + 15-20 backfill)
- 5-8 deep guide pages at 1500-2000 words each
- About page has Editorial Standards section
- All bylines show team attribution + data verification date
- Zero factual errors in AI-generated content (multi-pass catches them)
- Zero dead internal links
- AdSense reapplication ready
