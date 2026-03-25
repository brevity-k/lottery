export interface NotableJackpot {
  amount: string;
  date: string;
  state: string;
  status: string;
}

// Notable jackpot wins for each lottery game.
// Sources: docs/verified-facts.md, src/lib/blog.ts seed post "biggest-lottery-jackpots".
// All entries verified against 3+ independent sources (Feb 2026).
export const NOTABLE_JACKPOTS: Record<string, NotableJackpot[]> = {
  // Powerball top 5 jackpots. Source: verified-facts.md + blog seed post lines 195-201.
  powerball: [
    {
      amount: '$2.04 Billion',
      date: 'November 7, 2022',
      state: 'California',
      status: 'Single winner',
    },
    {
      amount: '$1.817 Billion',
      date: 'December 2025',
      state: 'Arkansas',
      status: 'Single winner',
    },
    {
      amount: '$1.787 Billion',
      date: 'September 2025',
      state: 'Missouri & Texas',
      status: 'Split — 2 winners',
    },
    {
      amount: '$1.765 Billion',
      date: 'October 11, 2023',
      state: 'California',
      status: 'Single winner',
    },
    {
      amount: '$1.586 Billion',
      date: 'January 13, 2016',
      state: 'California, Florida & Tennessee',
      status: 'Split — 3 winners',
    },
  ],

  // Mega Millions top 2 jackpots. Source: verified-facts.md + blog seed post lines 200-202.
  'mega-millions': [
    {
      amount: '$1.602 Billion',
      date: 'August 8, 2023',
      state: 'Florida',
      status: 'Single winner',
    },
    {
      amount: '$1.537 Billion',
      date: 'October 23, 2018',
      state: 'South Carolina',
      status: 'Single winner',
    },
  ],

  // Cash4Life: top prizes are fixed lifetime annuities ($1,000/day or $1,000/week for life),
  // not growing jackpots. No single "notable jackpot" events to list.
  cash4life: [],

  // NY Lotto: jackpots are relatively modest (starting at $2M, pari-mutuel growth).
  // No verified record-breaking wins in the available sources; omitting to avoid inaccuracy.
  'ny-lotto': [],

  // Take 5: pari-mutuel top prize, typically ~$57,500. Not applicable for notable jackpots.
  take5: [],

  // Millionaire for Life: launched Feb 22, 2026 — too new for notable jackpot history.
  'millionaire-for-life': [],
};
