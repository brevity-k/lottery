export interface PrizeTier {
  match: string;
  prize: string;
  odds: string;
}

// Prize tier data for all supported lottery games.
// Sources: Official lottery websites, verified-facts.md (last checked Feb 2026).
export const PRIZE_TIERS: Record<string, PrizeTier[]> = {
  // Powerball: 9 tiers. Format: 5/69 + 1/26. Ticket: $2.
  // Odds verified: docs/verified-facts.md + src/lib/blog.ts seed post.
  powerball: [
    { match: '5 + Powerball', prize: 'Jackpot',      odds: '1 in 292,201,338' },
    { match: '5',             prize: '$1,000,000',   odds: '1 in 11,688,053'  },
    { match: '4 + Powerball', prize: '$50,000',      odds: '1 in 913,129'     },
    { match: '4',             prize: '$100',         odds: '1 in 36,525'      },
    { match: '3 + Powerball', prize: '$100',         odds: '1 in 14,494'      },
    { match: '3',             prize: '$7',           odds: '1 in 579'         },
    { match: '2 + Powerball', prize: '$7',           odds: '1 in 701'         },
    { match: '1 + Powerball', prize: '$4',           odds: '1 in 91'          },
    { match: 'Powerball only', prize: '$4',          odds: '1 in 38'          },
  ],

  // Mega Millions: 9 tiers. Post-April 2025 format: 5/70 + 1/24. Ticket: $5.
  // Jackpot odds improved from 1 in 302,575,350 to 1 in 290,472,336 (Mega Ball pool reduced 1-25 → 1-24).
  // Megaplier retired; automatic 2x-10x multiplier now included on every ticket.
  'mega-millions': [
    { match: '5 + Mega Ball', prize: 'Jackpot',     odds: '1 in 290,472,336' },
    { match: '5',             prize: '$1,000,000',  odds: '1 in 12,103,014'  },
    { match: '4 + Mega Ball', prize: '$10,000',     odds: '1 in 931,001'     },
    { match: '4',             prize: '$500',        odds: '1 in 38,792'      },
    { match: '3 + Mega Ball', prize: '$200',        odds: '1 in 14,547'      },
    { match: '3',             prize: '$10',         odds: '1 in 606'         },
    { match: '2 + Mega Ball', prize: '$10',         odds: '1 in 693'         },
    { match: '1 + Mega Ball', prize: '$4',          odds: '1 in 89'          },
    { match: 'Mega Ball only', prize: '$2',         odds: '1 in 37'          },
  ],

  // Cash4Life: retired Feb 21, 2026. Historical data only.
  // Format: 5/60 + 1/4. Ticket: $2. Odds source: docs/verified-facts.md.
  cash4life: [
    { match: '5 + Cash Ball', prize: '$1,000/day for life', odds: '1 in 21,846,048' },
    { match: '5',             prize: '$1,000/week for life', odds: '1 in 7,282,016' },
    { match: '4 + Cash Ball', prize: '$2,500',              odds: '1 in 79,440'     },
    { match: '4',             prize: '$500',                odds: '1 in 26,480'     },
    { match: '3 + Cash Ball', prize: '$100',                odds: '1 in 1,471'      },
  ],

  // NY Lotto: 5 main tiers. Format: 6/59 + 1/59 bonus. Ticket: $1.
  // Jackpot odds: 1 in 45,057,474 (verified-facts.md).
  // Note: 5+Bonus and 5 tiers use approximated odds based on combinatorics.
  'ny-lotto': [
    { match: '6',          prize: 'Jackpot',    odds: '1 in 45,057,474' },
    { match: '5 + Bonus',  prize: '$100,000',   odds: '1 in 7,509,579'  },
    { match: '5',          prize: '$1,000',     odds: '1 in 144,415'    },
    { match: '4',          prize: '$25',        odds: '1 in 1,028'      },
    { match: '3',          prize: 'Free Play',  odds: '1 in 29'         },
  ],

  // Take 5: 4 tiers, no bonus number. Format: 5/39. Ticket: $1.
  // Top prize odds: 1 in 575,757 (verified-facts.md). Prizes are pari-mutuel.
  take5: [
    { match: '5', prize: 'Jackpot (pari-mutuel)', odds: '1 in 575,757' },
    { match: '4', prize: '~$500 (pari-mutuel)',   odds: '1 in 3,387'   },
    { match: '3', prize: '~$25 (pari-mutuel)',    odds: '1 in 102'     },
    { match: '2', prize: 'Free Play',             odds: '1 in 10'      },
  ],

  // Millionaire for Life: launched Feb 22, 2026 (replaced Cash4Life).
  // Format: 5/58 + 1/5. Ticket: $5. Jackpot odds from config: 1 in 22,910,580.
  // Top prize: $1 million per year for life ($1,000,000/year annuity).
  // Lower-tier odds are estimated from 5/58 combinatorics; mark approximate.
  'millionaire-for-life': [
    { match: '5 + Millionaire Ball', prize: '$1,000,000/year for life', odds: '1 in 22,910,580' },
    { match: '5',                    prize: '$25,000/year for life',    odds: '1 in 5,727,645'  },
    { match: '4 + Millionaire Ball', prize: '$500',                    odds: '1 in 45,821'      },
    { match: '4',                    prize: '$50',                     odds: '1 in 11,455'      },
    { match: '3 + Millionaire Ball', prize: '$25',                     odds: '1 in 1,017'       },
  ],
};
