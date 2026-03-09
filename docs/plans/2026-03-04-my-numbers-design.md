# My Numbers — Personal Lottery Number Analysis

**Date:** 2026-03-04
**Status:** Approved
**Approach:** Pure Client-Side (localStorage + lazy-loaded draw data)

## Problem

The site is called "My Lotto Stats" but offers zero personalization. Users who play regularly (weekly ticket buyers) have no way to:
- Track their number sets over time
- See how their numbers would have performed historically
- Understand mathematical properties of their picks
- Compare which lottery game best suits their numbers

## Solution

A dedicated `/my-numbers` page where users save number sets and receive rich "what-if" analysis reports — all client-side, zero backend.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| User accounts | None — localStorage only | Zero friction, zero cost, privacy-friendly |
| History range | Full (all draws ever) | Most compelling what-if stories |
| Number sets | Multiple per user, named | Real players rotate numbers |
| Page location | Dedicated `/my-numbers` hub | Clean separation, SEO-friendly |
| Architecture | Pure client-side (Approach A) | Consistent with existing SSG architecture, upgradeable later |
| Pattern detection | Auto-detect + user custom notes | Surfaces mathematical properties, lets users add personal rationale |

## Data Model

```typescript
interface NumberSet {
  id: string;              // crypto.randomUUID()
  name: string;            // "My Lucky Set", "Birthday Numbers"
  game: LotterySlug;       // "powerball" | "mega-millions" | ...
  numbers: number[];       // [7, 14, 21, 35, 42]
  bonusNumber?: number;    // 10 (null for Take 5)
  customNote?: string;     // "Based on family birthdays"
  startDate?: string;      // ISO date — when user started playing these
  createdAt: string;       // ISO date
}

// Storage key: 'myLottoStats:numberSets'
// Stored as JSON array in localStorage
```

## Page Layout

### Desktop: Sidebar + Report Panel

```
┌─────────────────────────────────────────────────────┐
│  My Numbers                                          │
│  "Your personal lottery number analysis"             │
├──────────────────┬──────────────────────────────────┤
│  NUMBER SETS     │  REPORT AREA                      │
│  + Add New Set   │                                    │
│                  │  What-If Summary                   │
│  Lucky Set       │  Prize Tier Breakdown (table+chart)│
│    PB: 7-14-21.. │  Cross-Game Comparison             │
│                  │  Pattern Analysis                  │
│  Birthdays       │  Match Timeline (line chart)       │
│    MM: 3-12-25.. │  Custom Note                       │
│                  │                                    │
├──────────────────┴──────────────────────────────────┤
│  Disclaimer: Historical patterns don't predict...    │
└─────────────────────────────────────────────────────┘
```

### Mobile: Stacked
Number sets as horizontal scrollable cards on top, report below.

## Report Sections

### 1. What-If Summary
- Total hypothetical winnings ($)
- Match count per prize tier
- Best single draw (date + amount)
- Win rate (% of draws with any match)
- If `startDate` is set: show "Since you started" vs "Full history" side by side

### 2. Prize Tier Breakdown
Table showing each tier (5+Bonus, 5, 4+Bonus, ...) with count and total won. Recharts bar chart visualization.

Prize tables per game (fixed non-jackpot amounts):
- **Powerball:** 5+PB=Jackpot($20M avg), 5=$1M, 4+PB=$50K, 4=$100, 3+PB=$100, 3=$7, 2+PB=$7, 1+PB=$4, 0+PB=$4
- **Mega Millions:** 5+MB=Jackpot($20M avg), 5=$1M, 4+MB=$10K, 4=$500, 3+MB=$200, 3=$10, 2+MB=$10, 1+MB=$4, 0+MB=$2
- **NY Lotto:** 6=$Jackpot, 5+B=$TBD, 5=$TBD, 4=$TBD, 3=$TBD (pari-mutuel — use historical averages)
- **Take 5:** 5=$Jackpot, 4=$500avg, 3=$25avg, 2=$1avg (pari-mutuel)
- **Cash4Life:** 5+CB=$1K/day for life, 5=$1K/week, 4+CB=$2.5K, 4=$500, 3+CB=$100, 3=$25, 2+CB=$10, 2=$4, 1+CB=$2
- **Millionaire for Life:** 5+MB=$1M/yr, 5=$TBD, 4+MB=$TBD (new game, prize structure TBD)

### 3. Cross-Game Comparison
"Your numbers would have won more in Mega Millions ($X) than Powerball ($Y)."
Only compare games where all user numbers fall within valid ranges.

### 4. Pattern Analysis (Auto-Detected)
- Sum total (vs average winning sum for that game)
- Odd/even split
- High/low split (based on game's number range midpoint)
- Consecutive number detection
- Prime number count
- Range spread (min, max, gap)
- Number cluster analysis
- Hot/cold overlap (how many of user's numbers are currently hot/cold)

### 5. Match Timeline
Recharts line chart — X: draw dates, Y: number of matches per draw. Highlights draws with 3+ matches.

### 6. Custom Note
Styled card showing user's rationale for choosing these numbers. Editable inline.

## File Structure

```
src/app/my-numbers/
  page.tsx                        # Client page ('use client'), localStorage hydration
src/components/my-numbers/
  NumberSetManager.tsx             # Sidebar: list, add, edit, delete sets
  NumberSetForm.tsx                # Add/edit form with game-aware validation
  WhatIfReport.tsx                 # Main report container
  WhatIfSummary.tsx                # Total winnings, best draw, win rate
  PrizeTierBreakdown.tsx           # Table + Recharts bar chart
  CrossGameComparison.tsx          # Multi-game comparison
  PatternAnalysis.tsx              # Auto-detected number properties
  MatchTimeline.tsx                # Recharts line chart of matches over time
src/lib/analysis/
  whatIf.ts                        # Check numbers against all draws, compute prizes
  patterns.ts                      # Detect mathematical properties of number sets
  crossGame.ts                     # Compare numbers across compatible games
src/lib/lotteries/
  prizes.ts                        # Prize tables per game (new file)
```

## Data Loading Strategy

- `/my-numbers` is **client-rendered** (not SSG) — depends on localStorage
- Draw data loaded lazily via dynamic imports when user selects a set for analysis
- Cross-game comparison loads multiple game JSONs in parallel
- Analysis functions are pure math — fast even for 12K+ draws (Take 5)

```
User selects "Lucky Set" (Powerball)
  → dynamic import of powerball draw data
  → whatIf.ts computes matches against all 1,909 draws
  → Prize tier breakdown, timeline, patterns computed
  → Report renders
```

## SEO & Navigation

- Page is client-rendered, not indexed by crawlers (no content without localStorage)
- Add "My Numbers" to site header navigation
- Internal links from game pages: "See how your numbers would have performed → My Numbers"
- Meta description: "Track your lottery numbers and see historical what-if analysis"

## Privacy Policy Update

Add to privacy page:
> "When you use My Numbers, your number sets are stored locally in your browser's localStorage. This data never leaves your device and is not collected, transmitted, or accessible to us."

## Required Disclaimers

The report page must include:
1. "Historical patterns do not predict future lottery outcomes"
2. "Prize amounts shown are estimates based on fixed prize tiers; actual payouts may vary"
3. "For entertainment and informational purposes only"
4. Standard NCPG helpline reference

## Future Enhancements (Not in MVP)

- AI-generated narrative about user's numbers (Claude API)
- Shareable report URLs (would require server-side storage)
- Cloud sync via Firebase (optional account)
- Email alerts when user's numbers match a recent draw
- Near-miss highlights ("You were 1 number away from $50K!")
- Export report as PDF/image
