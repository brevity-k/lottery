# My Numbers — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `/my-numbers` page where users save lottery number sets in localStorage and receive rich historical what-if analysis reports, all client-side.

**Architecture:** Pure client-side React page with localStorage persistence. Draw data lazy-loaded via dynamic imports from existing JSON files. Analysis functions are new pure TypeScript modules. Charts use existing Recharts patterns.

**Tech Stack:** Next.js 16 App Router (client component), TypeScript, Tailwind CSS v4, Recharts 3, localStorage, crypto.randomUUID()

**Design doc:** `docs/plans/2026-03-04-my-numbers-design.md`

---

## Task 1: Add Types and Prize Tables

**Files:**
- Modify: `src/lib/lotteries/types.ts`
- Create: `src/lib/lotteries/prizes.ts`

**Step 1: Add NumberSet type to types.ts**

Add at the end of `src/lib/lotteries/types.ts`:

```typescript
export type LotterySlug = 'powerball' | 'mega-millions' | 'cash4life' | 'ny-lotto' | 'take5' | 'millionaire-for-life';

export interface NumberSet {
  id: string;
  name: string;
  game: LotterySlug;
  numbers: number[];
  bonusNumber?: number;
  customNote?: string;
  startDate?: string;
  createdAt: string;
}

export interface WhatIfResult {
  totalWinnings: number;
  totalDrawsChecked: number;
  tiers: PrizeTierResult[];
  bestDraw: { date: string; matched: number; bonusMatch: boolean; prize: number } | null;
  matchTimeline: { date: string; matched: number; bonusMatch: boolean; prize: number }[];
}

export interface PrizeTierResult {
  label: string;
  mainMatches: number;
  bonusMatch: boolean;
  prize: number | string;
  count: number;
  totalWon: number;
}

export interface PatternAnalysis {
  sum: number;
  avgWinningSum: number;
  oddCount: number;
  evenCount: number;
  highCount: number;
  lowCount: number;
  primeCount: number;
  primes: number[];
  hasConsecutive: boolean;
  consecutivePairs: [number, number][];
  spread: number;
  min: number;
  max: number;
  hotColdOverlap: { hot: number[]; cold: number[] };
}

export interface CrossGameResult {
  game: LotterySlug;
  gameName: string;
  totalWinnings: number;
  totalDraws: number;
  compatible: boolean;
  incompatibleReason?: string;
}
```

**Step 2: Create prize tables**

Create `src/lib/lotteries/prizes.ts`:

```typescript
import { LotterySlug } from './types';

export interface PrizeTier {
  label: string;
  mainMatches: number;
  bonusMatch: boolean;
  prize: number;
}

// Prize tables: fixed non-jackpot amounts per game
// For jackpot tiers, use conservative average estimates
export const prizeTables: Record<LotterySlug, PrizeTier[]> = {
  powerball: [
    { label: '5 + Powerball', mainMatches: 5, bonusMatch: true, prize: 20_000_000 },
    { label: '5', mainMatches: 5, bonusMatch: false, prize: 1_000_000 },
    { label: '4 + Powerball', mainMatches: 4, bonusMatch: true, prize: 50_000 },
    { label: '4', mainMatches: 4, bonusMatch: false, prize: 100 },
    { label: '3 + Powerball', mainMatches: 3, bonusMatch: true, prize: 100 },
    { label: '3', mainMatches: 3, bonusMatch: false, prize: 7 },
    { label: '2 + Powerball', mainMatches: 2, bonusMatch: true, prize: 7 },
    { label: '1 + Powerball', mainMatches: 1, bonusMatch: true, prize: 4 },
    { label: '0 + Powerball', mainMatches: 0, bonusMatch: true, prize: 4 },
  ],
  'mega-millions': [
    { label: '5 + Mega Ball', mainMatches: 5, bonusMatch: true, prize: 20_000_000 },
    { label: '5', mainMatches: 5, bonusMatch: false, prize: 1_000_000 },
    { label: '4 + Mega Ball', mainMatches: 4, bonusMatch: true, prize: 10_000 },
    { label: '4', mainMatches: 4, bonusMatch: false, prize: 500 },
    { label: '3 + Mega Ball', mainMatches: 3, bonusMatch: true, prize: 200 },
    { label: '3', mainMatches: 3, bonusMatch: false, prize: 10 },
    { label: '2 + Mega Ball', mainMatches: 2, bonusMatch: true, prize: 10 },
    { label: '1 + Mega Ball', mainMatches: 1, bonusMatch: true, prize: 4 },
    { label: '0 + Mega Ball', mainMatches: 0, bonusMatch: true, prize: 2 },
  ],
  cash4life: [
    { label: '5 + Cash Ball', mainMatches: 5, bonusMatch: true, prize: 7_000_000 },
    { label: '5', mainMatches: 5, bonusMatch: false, prize: 1_000_000 },
    { label: '4 + Cash Ball', mainMatches: 4, bonusMatch: true, prize: 2_500 },
    { label: '4', mainMatches: 4, bonusMatch: false, prize: 500 },
    { label: '3 + Cash Ball', mainMatches: 3, bonusMatch: true, prize: 100 },
    { label: '3', mainMatches: 3, bonusMatch: false, prize: 25 },
    { label: '2 + Cash Ball', mainMatches: 2, bonusMatch: true, prize: 10 },
    { label: '2', mainMatches: 2, bonusMatch: false, prize: 4 },
    { label: '1 + Cash Ball', mainMatches: 1, bonusMatch: true, prize: 2 },
  ],
  'ny-lotto': [
    { label: '6 Numbers', mainMatches: 6, bonusMatch: false, prize: 5_000_000 },
    { label: '5 + Bonus', mainMatches: 5, bonusMatch: true, prize: 50_000 },
    { label: '5', mainMatches: 5, bonusMatch: false, prize: 1_000 },
    { label: '4', mainMatches: 4, bonusMatch: false, prize: 50 },
    { label: '3', mainMatches: 3, bonusMatch: false, prize: 1 },
  ],
  take5: [
    { label: '5 Numbers', mainMatches: 5, bonusMatch: false, prize: 50_000 },
    { label: '4', mainMatches: 4, bonusMatch: false, prize: 500 },
    { label: '3', mainMatches: 3, bonusMatch: false, prize: 25 },
    { label: '2', mainMatches: 2, bonusMatch: false, prize: 1 },
  ],
  'millionaire-for-life': [
    { label: '5 + Millionaire Ball', mainMatches: 5, bonusMatch: true, prize: 20_000_000 },
    { label: '5', mainMatches: 5, bonusMatch: false, prize: 1_000_000 },
    { label: '4 + Millionaire Ball', mainMatches: 4, bonusMatch: true, prize: 5_000 },
    { label: '4', mainMatches: 4, bonusMatch: false, prize: 200 },
    { label: '3 + Millionaire Ball', mainMatches: 3, bonusMatch: true, prize: 50 },
    { label: '3', mainMatches: 3, bonusMatch: false, prize: 10 },
    { label: '2 + Millionaire Ball', mainMatches: 2, bonusMatch: true, prize: 5 },
    { label: '1 + Millionaire Ball', mainMatches: 1, bonusMatch: true, prize: 2 },
    { label: '0 + Millionaire Ball', mainMatches: 0, bonusMatch: true, prize: 2 },
  ],
};
```

**Step 3: Commit**

```bash
git add src/lib/lotteries/types.ts src/lib/lotteries/prizes.ts
git commit -m "feat(my-numbers): add NumberSet types and prize tables"
```

---

## Task 2: Core Analysis — What-If Engine

**Files:**
- Create: `src/lib/analysis/whatIf.ts`

**Step 1: Create the what-if analysis module**

Create `src/lib/analysis/whatIf.ts`:

```typescript
import { DrawResult, WhatIfResult, PrizeTierResult, LotterySlug } from '@/lib/lotteries/types';
import { prizeTables, PrizeTier } from '@/lib/lotteries/prizes';

export function analyzeWhatIf(
  userNumbers: number[],
  userBonus: number | undefined,
  draws: DrawResult[],
  game: LotterySlug,
  startDate?: string
): WhatIfResult {
  const tiers = prizeTables[game];
  if (!tiers) {
    return { totalWinnings: 0, totalDrawsChecked: 0, tiers: [], bestDraw: null, matchTimeline: [] };
  }

  const hasBonus = tiers.some(t => t.bonusMatch);
  const filteredDraws = startDate
    ? draws.filter(d => d.date >= startDate)
    : draws;

  const tierResults: Map<string, PrizeTierResult> = new Map();
  for (const tier of tiers) {
    tierResults.set(tier.label, {
      label: tier.label,
      mainMatches: tier.mainMatches,
      bonusMatch: tier.bonusMatch,
      prize: tier.prize,
      count: 0,
      totalWon: 0,
    });
  }

  let totalWinnings = 0;
  let bestDraw: WhatIfResult['bestDraw'] = null;
  const matchTimeline: WhatIfResult['matchTimeline'] = [];

  for (const draw of filteredDraws) {
    const mainMatches = userNumbers.filter(n => draw.numbers.includes(n)).length;
    const bonusMatch = hasBonus && userBonus != null && draw.bonusNumber === userBonus;

    // Find the best matching prize tier (highest prize first)
    const matchedTier = findMatchingTier(tiers, mainMatches, bonusMatch);
    const prize = matchedTier?.prize ?? 0;

    if (prize > 0 && matchedTier) {
      const tierResult = tierResults.get(matchedTier.label)!;
      tierResult.count += 1;
      tierResult.totalWon += prize;
      totalWinnings += prize;
    }

    if (mainMatches > 0 || bonusMatch) {
      const entry = { date: draw.date, matched: mainMatches, bonusMatch, prize };
      matchTimeline.push(entry);

      if (!bestDraw || prize > bestDraw.prize) {
        bestDraw = entry;
      }
    }
  }

  return {
    totalWinnings,
    totalDrawsChecked: filteredDraws.length,
    tiers: Array.from(tierResults.values()),
    bestDraw,
    matchTimeline: matchTimeline.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function findMatchingTier(
  tiers: PrizeTier[],
  mainMatches: number,
  bonusMatch: boolean
): PrizeTier | null {
  // Tiers are ordered highest to lowest prize. Find the first match.
  for (const tier of tiers) {
    if (tier.mainMatches === mainMatches) {
      if (tier.bonusMatch && bonusMatch) return tier;
      if (!tier.bonusMatch && !bonusMatch) return tier;
      // For bonus-only tiers (0+Bonus, 1+Bonus), bonusMatch must be true
      if (tier.bonusMatch && !bonusMatch) continue;
      if (!tier.bonusMatch) return tier;
    }
  }
  return null;
}
```

**Step 2: Commit**

```bash
git add src/lib/analysis/whatIf.ts
git commit -m "feat(my-numbers): add what-if analysis engine"
```

---

## Task 3: Pattern Detection Module

**Files:**
- Create: `src/lib/analysis/patterns.ts`

**Step 1: Create pattern analysis module**

Create `src/lib/analysis/patterns.ts`:

```typescript
import { DrawResult, PatternAnalysis, HotColdNumber } from '@/lib/lotteries/types';
import { calculateHotCold } from './hotCold';

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

export function analyzePatterns(
  numbers: number[],
  maxNumber: number,
  draws: DrawResult[]
): PatternAnalysis {
  const sorted = [...numbers].sort((a, b) => a - b);
  const midpoint = Math.ceil(maxNumber / 2);

  // Sum
  const sum = sorted.reduce((a, b) => a + b, 0);

  // Average winning sum
  const avgWinningSum = draws.length > 0
    ? Math.round(draws.reduce((acc, d) => acc + d.numbers.reduce((a, b) => a + b, 0), 0) / draws.length)
    : 0;

  // Odd/Even
  const oddCount = sorted.filter(n => n % 2 !== 0).length;
  const evenCount = sorted.length - oddCount;

  // High/Low
  const lowCount = sorted.filter(n => n <= midpoint).length;
  const highCount = sorted.length - lowCount;

  // Primes
  const primes = sorted.filter(isPrime);

  // Consecutive pairs
  const consecutivePairs: [number, number][] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) {
      consecutivePairs.push([sorted[i], sorted[i + 1]]);
    }
  }

  // Hot/cold overlap
  const hotCold = calculateHotCold(draws, maxNumber, 'main');
  const hotNumbers = hotCold.filter(h => h.classification === 'hot').map(h => h.number);
  const coldNumbers = hotCold.filter(h => h.classification === 'cold').map(h => h.number);

  return {
    sum,
    avgWinningSum,
    oddCount,
    evenCount,
    highCount,
    lowCount,
    primeCount: primes.length,
    primes,
    hasConsecutive: consecutivePairs.length > 0,
    consecutivePairs,
    spread: sorted[sorted.length - 1] - sorted[0],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    hotColdOverlap: {
      hot: sorted.filter(n => hotNumbers.includes(n)),
      cold: sorted.filter(n => coldNumbers.includes(n)),
    },
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/analysis/patterns.ts
git commit -m "feat(my-numbers): add number pattern detection"
```

---

## Task 4: Cross-Game Comparison Module

**Files:**
- Create: `src/lib/analysis/crossGame.ts`

**Step 1: Create cross-game analysis**

Create `src/lib/analysis/crossGame.ts`:

```typescript
import { DrawResult, CrossGameResult, LotterySlug } from '@/lib/lotteries/types';
import { getAllLotteries } from '@/lib/lotteries/config';
import { analyzeWhatIf } from './whatIf';

export function analyzeCrossGame(
  userNumbers: number[],
  userBonus: number | undefined,
  drawsByGame: Record<string, DrawResult[]>,
  currentGame: LotterySlug
): CrossGameResult[] {
  const lotteries = getAllLotteries();
  const results: CrossGameResult[] = [];

  for (const lottery of lotteries) {
    const slug = lottery.slug as LotterySlug;
    const draws = drawsByGame[slug];
    if (!draws || draws.length === 0) continue;

    // Check compatibility: all user numbers must be within game's range
    const maxMain = lottery.mainNumbers.max;
    const outOfRange = userNumbers.filter(n => n > maxMain);

    if (outOfRange.length > 0) {
      results.push({
        game: slug,
        gameName: lottery.name,
        totalWinnings: 0,
        totalDraws: draws.length,
        compatible: false,
        incompatibleReason: `Numbers ${outOfRange.join(', ')} exceed max (${maxMain})`,
      });
      continue;
    }

    // For games with different main number counts, only compare if user has enough numbers
    if (userNumbers.length < lottery.mainNumbers.count && slug !== currentGame) {
      results.push({
        game: slug,
        gameName: lottery.name,
        totalWinnings: 0,
        totalDraws: draws.length,
        compatible: false,
        incompatibleReason: `Requires ${lottery.mainNumbers.count} numbers, you have ${userNumbers.length}`,
      });
      continue;
    }

    // Use only the first N numbers for games with fewer picks
    const numbersForGame = userNumbers.slice(0, lottery.mainNumbers.count);

    // Bonus compatibility: check range
    const bonusForGame = lottery.bonusNumber.count > 0 && userBonus != null && userBonus <= lottery.bonusNumber.max
      ? userBonus
      : undefined;

    const whatIf = analyzeWhatIf(numbersForGame, bonusForGame, draws, slug);

    results.push({
      game: slug,
      gameName: lottery.name,
      totalWinnings: whatIf.totalWinnings,
      totalDraws: whatIf.totalDrawsChecked,
      compatible: true,
    });
  }

  return results.sort((a, b) => b.totalWinnings - a.totalWinnings);
}
```

**Step 2: Commit**

```bash
git add src/lib/analysis/crossGame.ts
git commit -m "feat(my-numbers): add cross-game comparison analysis"
```

---

## Task 5: localStorage Hook

**Files:**
- Create: `src/lib/hooks/useNumberSets.ts`

**Step 1: Create the custom hook for localStorage persistence**

Create `src/lib/hooks/useNumberSets.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { NumberSet } from '@/lib/lotteries/types';

const STORAGE_KEY = 'myLottoStats:numberSets';

function loadSets(): NumberSet[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSets(sets: NumberSet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export function useNumberSets() {
  const [sets, setSets] = useState<NumberSet[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSets(loadSets());
    setHydrated(true);
  }, []);

  const addSet = useCallback((set: Omit<NumberSet, 'id' | 'createdAt'>) => {
    setSets(prev => {
      const newSet: NumberSet = {
        ...set,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...prev, newSet];
      saveSets(updated);
      return updated;
    });
  }, []);

  const updateSet = useCallback((id: string, updates: Partial<Omit<NumberSet, 'id' | 'createdAt'>>) => {
    setSets(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      saveSets(updated);
      return updated;
    });
  }, []);

  const deleteSet = useCallback((id: string) => {
    setSets(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveSets(updated);
      return updated;
    });
  }, []);

  return { sets, hydrated, addSet, updateSet, deleteSet };
}
```

**Step 2: Commit**

```bash
git add src/lib/hooks/useNumberSets.ts
git commit -m "feat(my-numbers): add localStorage hook for number sets"
```

---

## Task 6: NumberSetForm Component

**Files:**
- Create: `src/components/my-numbers/NumberSetForm.tsx`

**Step 1: Create the add/edit form component**

Create `src/components/my-numbers/NumberSetForm.tsx`:

```typescript
'use client';

import { useState, useMemo } from 'react';
import { LotteryConfig } from '@/lib/lotteries/types';
import type { NumberSet, LotterySlug } from '@/lib/lotteries/types';
import Button from '@/components/ui/Button';

interface Props {
  lotteries: LotteryConfig[];
  onSave: (set: Omit<NumberSet, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  editingSet?: NumberSet;
}

export default function NumberSetForm({ lotteries, onSave, onCancel, editingSet }: Props) {
  const activeLotteries = lotteries.filter(l => !l.retiredDate);
  const [game, setGame] = useState<LotterySlug>(editingSet?.game || activeLotteries[0]?.slug as LotterySlug);
  const [name, setName] = useState(editingSet?.name || '');
  const [numbers, setNumbers] = useState<string[]>(
    editingSet?.numbers.map(String) || Array(activeLotteries[0]?.mainNumbers.count || 5).fill('')
  );
  const [bonus, setBonus] = useState(editingSet?.bonusNumber?.toString() || '');
  const [customNote, setCustomNote] = useState(editingSet?.customNote || '');
  const [startDate, setStartDate] = useState(editingSet?.startDate || '');

  const lottery = lotteries.find(l => l.slug === game);
  const hasBonus = lottery ? lottery.bonusNumber.count > 0 : false;

  const handleGameChange = (slug: string) => {
    const newLottery = lotteries.find(l => l.slug === slug);
    if (!newLottery) return;
    setGame(slug as LotterySlug);
    setNumbers(Array(newLottery.mainNumbers.count).fill(''));
    setBonus('');
  };

  const handleNumberChange = (index: number, value: string) => {
    setNumbers(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const isValid = useMemo(() => {
    if (!lottery || !name.trim()) return false;
    const parsed = numbers.map(n => parseInt(n, 10));
    if (parsed.some(n => isNaN(n) || n < 1 || n > lottery.mainNumbers.max)) return false;
    if (new Set(parsed).size !== parsed.length) return false; // duplicates
    if (hasBonus) {
      const b = parseInt(bonus, 10);
      if (isNaN(b) || b < 1 || b > lottery.bonusNumber.max) return false;
    }
    return true;
  }, [lottery, name, numbers, bonus, hasBonus]);

  const handleSubmit = () => {
    if (!isValid || !lottery) return;
    onSave({
      name: name.trim(),
      game,
      numbers: numbers.map(n => parseInt(n, 10)).sort((a, b) => a - b),
      bonusNumber: hasBonus ? parseInt(bonus, 10) : undefined,
      customNote: customNote.trim() || undefined,
      startDate: startDate || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Set Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My Lucky Numbers"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={50}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Game</label>
        <select
          value={game}
          onChange={e => handleGameChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {activeLotteries.map(l => (
            <option key={l.slug} value={l.slug}>{l.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numbers ({lottery?.mainNumbers.count} from 1-{lottery?.mainNumbers.max})
        </label>
        <div className="flex flex-wrap gap-2">
          {numbers.map((val, i) => (
            <input
              key={i}
              type="number"
              min="1"
              max={lottery?.mainNumbers.max}
              value={val}
              onChange={e => handleNumberChange(i, e.target.value)}
              placeholder={`#${i + 1}`}
              className="w-16 rounded-lg border border-gray-300 px-2 py-2.5 text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ))}
        </div>
      </div>

      {hasBonus && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {lottery?.bonusNumber.label} (1-{lottery?.bonusNumber.max})
          </label>
          <input
            type="number"
            min="1"
            max={lottery?.bonusNumber.max}
            value={bonus}
            onChange={e => setBonus(e.target.value)}
            className="w-16 rounded-lg border border-red-300 px-2 py-2.5 text-center text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Started Playing (optional)</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Rationale (optional)</label>
        <textarea
          value={customNote}
          onChange={e => setCustomNote(e.target.value)}
          placeholder="Why did you pick these numbers?"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={200}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSubmit} disabled={!isValid}>
          {editingSet ? 'Update' : 'Save'}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/my-numbers/NumberSetForm.tsx
git commit -m "feat(my-numbers): add NumberSetForm component"
```

---

## Task 7: NumberSetManager (Sidebar) Component

**Files:**
- Create: `src/components/my-numbers/NumberSetManager.tsx`

**Step 1: Create the sidebar component**

Create `src/components/my-numbers/NumberSetManager.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { NumberSet, LotteryConfig } from '@/lib/lotteries/types';
import NumberSetForm from './NumberSetForm';
import LotteryBall from '@/components/lottery/LotteryBall';
import Button from '@/components/ui/Button';

interface Props {
  sets: NumberSet[];
  selectedId: string | null;
  lotteries: LotteryConfig[];
  onSelect: (id: string) => void;
  onAdd: (set: Omit<NumberSet, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<NumberSet, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
}

export default function NumberSetManager({
  sets, selectedId, lotteries, onSelect, onAdd, onUpdate, onDelete,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = (data: Omit<NumberSet, 'id' | 'createdAt'>) => {
    if (editingId) {
      onUpdate(editingId, data);
      setEditingId(null);
    } else {
      onAdd(data);
    }
    setShowForm(false);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this number set?')) {
      onDelete(id);
      if (editingId === id) {
        setEditingId(null);
        setShowForm(false);
      }
    }
  };

  const editingSet = editingId ? sets.find(s => s.id === editingId) : undefined;

  if (showForm) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingId ? 'Edit Number Set' : 'Add Number Set'}
        </h3>
        <NumberSetForm
          lotteries={lotteries}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingId(null); }}
          editingSet={editingSet}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">My Number Sets</h3>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          + Add New
        </Button>
      </div>

      {sets.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">
          No number sets yet. Add your first set to see how your numbers would have performed!
        </p>
      ) : (
        <div className="space-y-3">
          {sets.map(set => {
            const lottery = lotteries.find(l => l.slug === set.game);
            return (
              <button
                key={set.id}
                onClick={() => onSelect(set.id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  selectedId === set.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm">{set.name}</span>
                  <span className="text-xs text-gray-500">{lottery?.name}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {set.numbers.map((n, i) => (
                    <LotteryBall key={i} number={n} size="sm" />
                  ))}
                  {set.bonusNumber != null && (
                    <LotteryBall
                      number={set.bonusNumber}
                      type="bonus"
                      size="sm"
                      color={lottery?.colors.bonusBall}
                    />
                  )}
                </div>
                {selectedId === set.id && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={e => { e.stopPropagation(); handleEdit(set.id); }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(set.id); }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/my-numbers/NumberSetManager.tsx
git commit -m "feat(my-numbers): add NumberSetManager sidebar component"
```

---

## Task 8: Report Components

**Files:**
- Create: `src/components/my-numbers/WhatIfSummary.tsx`
- Create: `src/components/my-numbers/PrizeTierBreakdown.tsx`
- Create: `src/components/my-numbers/PatternAnalysis.tsx`
- Create: `src/components/my-numbers/CrossGameComparison.tsx`
- Create: `src/components/my-numbers/MatchTimeline.tsx`

**Step 1: Create WhatIfSummary**

Create `src/components/my-numbers/WhatIfSummary.tsx`:

```typescript
'use client';

import { WhatIfResult } from '@/lib/lotteries/types';
import { Card } from '@/components/ui/Card';

interface Props {
  result: WhatIfResult;
  setName: string;
  gameName: string;
  startDate?: string;
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

export default function WhatIfSummary({ result, setName, gameName, startDate }: Props) {
  const winDraws = result.matchTimeline.length;
  const winRate = result.totalDrawsChecked > 0
    ? ((winDraws / result.totalDrawsChecked) * 100).toFixed(1)
    : '0';

  return (
    <Card padding>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">What-If Summary</h3>
      <p className="text-sm text-gray-600 mb-4">
        If you had played <span className="font-semibold">&ldquo;{setName}&rdquo;</span> in every {gameName} draw
        {startDate ? ` since ${startDate}` : ''} ({result.totalDrawsChecked.toLocaleString()} draws):
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-700">{formatMoney(result.totalWinnings)}</p>
          <p className="text-xs text-green-600">Total Winnings</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-700">{winDraws}</p>
          <p className="text-xs text-blue-600">Winning Draws</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-700">{winRate}%</p>
          <p className="text-xs text-purple-600">Win Rate</p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <p className="text-2xl font-bold text-amber-700">
            {result.bestDraw ? formatMoney(result.bestDraw.prize) : '-'}
          </p>
          <p className="text-xs text-amber-600">
            Best Draw{result.bestDraw ? ` (${result.bestDraw.date})` : ''}
          </p>
        </div>
      </div>
    </Card>
  );
}
```

**Step 2: Create PrizeTierBreakdown**

Create `src/components/my-numbers/PrizeTierBreakdown.tsx`:

```typescript
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PrizeTierResult } from '@/lib/lotteries/types';
import { Card } from '@/components/ui/Card';

interface Props {
  tiers: PrizeTierResult[];
}

export default function PrizeTierBreakdown({ tiers }: Props) {
  const activeTiers = tiers.filter(t => t.count > 0);
  const chartData = activeTiers.map(t => ({
    tier: t.label,
    count: t.count,
    total: t.totalWon,
  }));

  return (
    <Card padding>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Prize Tier Breakdown</h3>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 text-gray-600 font-medium">Tier</th>
              <th className="text-right py-2 px-4 text-gray-600 font-medium">Times Won</th>
              <th className="text-right py-2 pl-4 text-gray-600 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map(tier => (
              <tr key={tier.label} className="border-b border-gray-100">
                <td className="py-2 pr-4 text-gray-900">{tier.label}</td>
                <td className="text-right py-2 px-4 text-gray-700">{tier.count.toLocaleString()}</td>
                <td className="text-right py-2 pl-4 font-medium text-gray-900">
                  ${tier.totalWon.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chartData.length > 0 && (
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="tier" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Won']}
              />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
```

**Step 3: Create PatternAnalysis component**

Create `src/components/my-numbers/PatternAnalysisCard.tsx`:

```typescript
'use client';

import { PatternAnalysis } from '@/lib/lotteries/types';
import { Card } from '@/components/ui/Card';

interface Props {
  analysis: PatternAnalysis;
  customNote?: string;
  onEditNote?: (note: string) => void;
}

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`px-3 py-2 rounded-lg ${color}`}>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function PatternAnalysisCard({ analysis, customNote, onEditNote }: Props) {
  return (
    <Card padding>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Number Patterns</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <Badge label="Sum" value={`${analysis.sum} (avg: ${analysis.avgWinningSum})`} color="bg-gray-50" />
        <Badge label="Odd / Even" value={`${analysis.oddCount} / ${analysis.evenCount}`} color="bg-gray-50" />
        <Badge label="High / Low" value={`${analysis.highCount} / ${analysis.lowCount}`} color="bg-gray-50" />
        <Badge label="Prime Numbers" value={analysis.primes.length > 0 ? analysis.primes.join(', ') : 'None'} color="bg-gray-50" />
        <Badge label="Range" value={`${analysis.min} — ${analysis.max} (spread: ${analysis.spread})`} color="bg-gray-50" />
        <Badge label="Consecutive" value={analysis.hasConsecutive ? analysis.consecutivePairs.map(p => p.join('-')).join(', ') : 'None'} color="bg-gray-50" />
      </div>

      {(analysis.hotColdOverlap.hot.length > 0 || analysis.hotColdOverlap.cold.length > 0) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            {analysis.hotColdOverlap.hot.length > 0 && (
              <><span className="text-red-600 font-medium">Hot:</span> {analysis.hotColdOverlap.hot.join(', ')} &nbsp;</>
            )}
            {analysis.hotColdOverlap.cold.length > 0 && (
              <><span className="text-blue-600 font-medium">Cold:</span> {analysis.hotColdOverlap.cold.join(', ')}</>
            )}
          </p>
        </div>
      )}

      {customNote && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-600 font-medium mb-1">Your Rationale</p>
          <p className="text-sm text-gray-800">{customNote}</p>
        </div>
      )}
    </Card>
  );
}
```

**Step 4: Create CrossGameComparison component**

Create `src/components/my-numbers/CrossGameComparison.tsx`:

```typescript
'use client';

import { CrossGameResult, LotterySlug } from '@/lib/lotteries/types';
import { Card } from '@/components/ui/Card';

interface Props {
  results: CrossGameResult[];
  currentGame: LotterySlug;
}

export default function CrossGameComparison({ results, currentGame }: Props) {
  const compatible = results.filter(r => r.compatible);
  const incompatible = results.filter(r => !r.compatible);

  if (compatible.length <= 1) return null;

  return (
    <Card padding>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cross-Game Comparison</h3>
      <p className="text-sm text-gray-600 mb-4">
        How would your numbers perform in other lottery games?
      </p>

      <div className="space-y-2">
        {compatible.map((r, i) => (
          <div
            key={r.game}
            className={`flex items-center justify-between p-3 rounded-lg ${
              r.game === currentGame ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`}
          >
            <div>
              <span className="font-medium text-gray-900">{r.gameName}</span>
              {r.game === currentGame && (
                <span className="ml-2 text-xs text-blue-600">(your game)</span>
              )}
              <p className="text-xs text-gray-500">{r.totalDraws.toLocaleString()} draws</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">${r.totalWinnings.toLocaleString()}</p>
              {i === 0 && r.game !== currentGame && (
                <p className="text-xs text-green-600">Best fit</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {incompatible.length > 0 && (
        <div className="mt-3 text-xs text-gray-500">
          <p>Not compatible: {incompatible.map(r => `${r.gameName} (${r.incompatibleReason})`).join(', ')}</p>
        </div>
      )}
    </Card>
  );
}
```

**Step 5: Create MatchTimeline chart**

Create `src/components/my-numbers/MatchTimeline.tsx`:

```typescript
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WhatIfResult } from '@/lib/lotteries/types';
import { Card } from '@/components/ui/Card';

interface Props {
  timeline: WhatIfResult['matchTimeline'];
}

export default function MatchTimeline({ timeline }: Props) {
  if (timeline.length === 0) return null;

  const chartData = timeline.map(entry => ({
    date: entry.date,
    matches: entry.matched + (entry.bonusMatch ? 0.5 : 0),
    prize: entry.prize,
    label: `${entry.matched}${entry.bonusMatch ? '+B' : ''}`,
  }));

  return (
    <Card padding>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Timeline</h3>
      <p className="text-sm text-gray-600 mb-4">
        Every draw where your numbers matched at least one winning number.
      </p>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              interval={Math.max(0, Math.floor(chartData.length / 8))}
            />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              formatter={(value: number, name: string, props: { payload: { label: string; prize: number } }) => {
                const { label, prize } = props.payload;
                return [`${label} matched ($${prize.toLocaleString()})`, 'Result'];
              }}
            />
            <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="5 5" label={{ value: '3+', fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="matches"
              stroke="#3b82f6"
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#3b82f6' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

**Step 6: Commit**

```bash
git add src/components/my-numbers/WhatIfSummary.tsx src/components/my-numbers/PrizeTierBreakdown.tsx src/components/my-numbers/PatternAnalysisCard.tsx src/components/my-numbers/CrossGameComparison.tsx src/components/my-numbers/MatchTimeline.tsx
git commit -m "feat(my-numbers): add all report display components"
```

---

## Task 9: Main Report Container

**Files:**
- Create: `src/components/my-numbers/WhatIfReport.tsx`

**Step 1: Create the report container that orchestrates analysis and renders sub-components**

Create `src/components/my-numbers/WhatIfReport.tsx`:

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { NumberSet, DrawResult, LotteryConfig, LotterySlug } from '@/lib/lotteries/types';
import { analyzeWhatIf } from '@/lib/analysis/whatIf';
import { analyzePatterns } from '@/lib/analysis/patterns';
import { analyzeCrossGame } from '@/lib/analysis/crossGame';
import WhatIfSummary from './WhatIfSummary';
import PrizeTierBreakdown from './PrizeTierBreakdown';
import PatternAnalysisCard from './PatternAnalysisCard';
import CrossGameComparison from './CrossGameComparison';
import MatchTimeline from './MatchTimeline';

interface Props {
  numberSet: NumberSet;
  lotteries: LotteryConfig[];
}

export default function WhatIfReport({ numberSet, lotteries }: Props) {
  const [drawsByGame, setDrawsByGame] = useState<Record<string, DrawResult[]>>({});
  const [loading, setLoading] = useState(true);

  const lottery = lotteries.find(l => l.slug === numberSet.game);

  // Lazy-load draw data for the selected game + compatible games
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadDraws() {
      const slugs = lotteries.map(l => l.slug);
      const loaded: Record<string, DrawResult[]> = {};

      // Load all games in parallel for cross-game comparison
      await Promise.all(
        slugs.map(async (slug) => {
          try {
            const module = await import(`@/data/${slug}.json`);
            const data = module.default || module;
            loaded[slug] = data.draws || [];
          } catch {
            loaded[slug] = [];
          }
        })
      );

      if (!cancelled) {
        setDrawsByGame(loaded);
        setLoading(false);
      }
    }

    loadDraws();
    return () => { cancelled = true; };
  }, [numberSet.game, lotteries]);

  const draws = drawsByGame[numberSet.game] || [];

  const whatIfResult = useMemo(() => {
    if (draws.length === 0) return null;
    return analyzeWhatIf(numberSet.numbers, numberSet.bonusNumber, draws, numberSet.game, numberSet.startDate);
  }, [draws, numberSet]);

  const patternResult = useMemo(() => {
    if (draws.length === 0 || !lottery) return null;
    return analyzePatterns(numberSet.numbers, lottery.mainNumbers.max, draws);
  }, [draws, numberSet.numbers, lottery]);

  const crossGameResult = useMemo(() => {
    if (Object.keys(drawsByGame).length === 0) return null;
    return analyzeCrossGame(numberSet.numbers, numberSet.bonusNumber, drawsByGame, numberSet.game);
  }, [drawsByGame, numberSet]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Analyzing {lottery?.name || 'draws'}...</p>
        </div>
      </div>
    );
  }

  if (!whatIfResult || !lottery) {
    return <p className="text-sm text-gray-500 py-8 text-center">No draw data available for analysis.</p>;
  }

  return (
    <div className="space-y-6">
      <WhatIfSummary
        result={whatIfResult}
        setName={numberSet.name}
        gameName={lottery.name}
        startDate={numberSet.startDate}
      />
      <PrizeTierBreakdown tiers={whatIfResult.tiers} />
      {crossGameResult && (
        <CrossGameComparison results={crossGameResult} currentGame={numberSet.game} />
      )}
      {patternResult && (
        <PatternAnalysisCard
          analysis={patternResult}
          customNote={numberSet.customNote}
        />
      )}
      <MatchTimeline timeline={whatIfResult.matchTimeline} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/my-numbers/WhatIfReport.tsx
git commit -m "feat(my-numbers): add WhatIfReport orchestrator component"
```

---

## Task 10: My Numbers Page

**Files:**
- Create: `src/app/my-numbers/page.tsx`

**Step 1: Create the page**

Create `src/app/my-numbers/page.tsx`:

```typescript
import { Metadata } from 'next';
import { getAllLotteries } from '@/lib/lotteries/config';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MyNumbersClient from './MyNumbersClient';

export const metadata: Metadata = {
  title: 'My Numbers — Personal Lottery Number Analysis | My Lotto Stats',
  description: 'Save your lottery numbers and see how they would have performed historically. Get what-if analysis, pattern detection, and cross-game comparisons.',
  alternates: {
    canonical: 'https://mylottostats.com/my-numbers',
  },
};

export default function MyNumbersPage() {
  const lotteries = getAllLotteries();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'My Numbers' },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Numbers</h1>
        <p className="text-gray-600">
          Save your lottery numbers and discover how they would have performed historically.
          All data stays in your browser — nothing is sent to any server.
        </p>
      </div>

      <MyNumbersClient lotteries={lotteries} />

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <p className="font-medium mb-1">Disclaimer</p>
        <p>
          Historical patterns do not predict future lottery outcomes. Prize amounts shown are estimates
          based on fixed prize tiers; actual payouts may vary. For entertainment and informational purposes only.
          If you or someone you know has a gambling problem, call 1-800-522-4700.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Create the client wrapper**

Create `src/app/my-numbers/MyNumbersClient.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { LotteryConfig } from '@/lib/lotteries/types';
import { useNumberSets } from '@/lib/hooks/useNumberSets';
import NumberSetManager from '@/components/my-numbers/NumberSetManager';
import WhatIfReport from '@/components/my-numbers/WhatIfReport';

interface Props {
  lotteries: LotteryConfig[];
}

export default function MyNumbersClient({ lotteries }: Props) {
  const { sets, hydrated, addSet, updateSet, deleteSet } = useNumberSets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedSet = sets.find(s => s.id === selectedId) || null;

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
      {/* Sidebar */}
      <div className="md:sticky md:top-20 md:self-start">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <NumberSetManager
            sets={sets}
            selectedId={selectedId}
            lotteries={lotteries}
            onSelect={setSelectedId}
            onAdd={(data) => {
              addSet(data);
              // Auto-select the newly added set
              setTimeout(() => {
                const latest = JSON.parse(localStorage.getItem('myLottoStats:numberSets') || '[]');
                if (latest.length > 0) setSelectedId(latest[latest.length - 1].id);
              }, 0);
            }}
            onUpdate={updateSet}
            onDelete={(id) => {
              deleteSet(id);
              if (selectedId === id) setSelectedId(null);
            }}
          />
        </div>
      </div>

      {/* Report Area */}
      <div>
        {selectedSet ? (
          <WhatIfReport numberSet={selectedSet} lotteries={lotteries} />
        ) : (
          <div className="flex items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-center max-w-md">
              <p className="text-5xl mb-4">🎱</p>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Number Set</h2>
              <p className="text-sm text-gray-500">
                {sets.length === 0
                  ? 'Add your first number set to see a detailed historical analysis of how your numbers would have performed.'
                  : 'Click on a number set from the sidebar to see its detailed what-if report.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/my-numbers/page.tsx src/app/my-numbers/MyNumbersClient.tsx
git commit -m "feat(my-numbers): add /my-numbers page with client wrapper"
```

---

## Task 11: Add Navigation Link

**Files:**
- Modify: `src/components/layout/Header.tsx`

**Step 1: Add "My Numbers" link to the header navigation**

Find the Tools dropdown section in Header.tsx and add a "My Numbers" link in the main nav (not inside a dropdown — it deserves top-level visibility). Add it between the existing nav items. Look for the pattern of `<Link>` elements in the desktop nav and add:

```typescript
<Link href="/my-numbers" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
  My Numbers
</Link>
```

Also add it to the mobile nav menu in the same pattern as existing mobile links.

**Step 2: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat(my-numbers): add My Numbers to site navigation"
```

---

## Task 12: Update Privacy Policy

**Files:**
- Modify: `src/app/privacy/page.tsx`

**Step 1: Add localStorage disclosure section**

Add a new section to the privacy page after the "Data Storage" section:

```html
<h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">My Numbers Feature</h2>
<p className="text-gray-700 mb-4">
  When you use the My Numbers feature, your number sets are stored locally in your
  browser&apos;s localStorage. This data:
</p>
<ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
  <li>Never leaves your device</li>
  <li>Is not collected, transmitted, or accessible to us</li>
  <li>Is not included in any analytics</li>
  <li>Can be cleared at any time through your browser settings</li>
</ul>
```

**Step 2: Commit**

```bash
git add src/app/privacy/page.tsx
git commit -m "feat(my-numbers): add localStorage disclosure to privacy policy"
```

---

## Task 13: Build Verification and Lint

**Step 1: Run lint**

```bash
npm run lint
```

Expected: No errors. Fix any issues found.

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds with /my-numbers as a static route. Verify it appears in the route list.

**Step 3: Manual test**

```bash
npm run dev
```

Open http://localhost:3000/my-numbers and verify:
- Page loads with empty state
- Can add a number set (select game, enter numbers, name it)
- Set appears in sidebar
- Clicking set triggers analysis (loading spinner → report)
- What-if summary shows dollar amounts
- Prize tier table renders
- Cross-game comparison shows (if numbers are compatible)
- Pattern analysis displays
- Match timeline chart renders
- Data persists after page refresh (localStorage)
- Mobile layout stacks correctly

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(my-numbers): resolve lint and build issues"
```

---

## Task 14: Final Commit — Complete Feature

**Step 1: Verify everything is committed**

```bash
git status
git log --oneline -15
```

**Step 2: Verify the build one final time**

```bash
npm run build
```

Expected: Clean build, /my-numbers in route list, 706+ static pages.
