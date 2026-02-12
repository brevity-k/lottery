export interface StateConfig {
  name: string;
  abbreviation: string;
  slug: string;
  availableGames: string[];
  taxRate: number;
  taxNotes?: string;
  lotteryWebsite: string;
  claimInfo: string;
  purchaseAge: number;
  facts: string[];
}

export const stateConfigs: Record<string, StateConfig> = {
  california: {
    name: 'California',
    abbreviation: 'CA',
    slug: 'california',
    availableGames: ['powerball', 'mega-millions'],
    taxRate: 0,
    taxNotes: 'California does not tax lottery winnings — one of the best states to win!',
    lotteryWebsite: 'https://www.calottery.com',
    claimInfo: 'Prizes up to $599 can be claimed at any retailer. Prizes $600-$5,000 at CA Lottery District Offices. Over $5,000 at CA Lottery headquarters in Sacramento.',
    purchaseAge: 18,
    facts: [
      'California Lottery was established in 1984',
      'No state tax on lottery winnings',
      'One of the largest lottery markets in the US',
      'Funds go to public education',
    ],
  },
  texas: {
    name: 'Texas',
    abbreviation: 'TX',
    slug: 'texas',
    availableGames: ['powerball', 'mega-millions'],
    taxRate: 0,
    taxNotes: 'Texas has no state income tax, so no state tax on lottery winnings.',
    lotteryWebsite: 'https://www.txlottery.org',
    claimInfo: 'Prizes up to $599 at any retailer. $600-$2,499,999 at Texas Lottery claim centers. Over $2.5M at Austin headquarters.',
    purchaseAge: 18,
    facts: [
      'Texas Lottery launched in 1992',
      'No state income tax on winnings',
      'Proceeds support public education and veterans',
      'One of the highest jackpot-producing states',
    ],
  },
  florida: {
    name: 'Florida',
    abbreviation: 'FL',
    slug: 'florida',
    availableGames: ['powerball', 'mega-millions', 'cash4life'],
    taxRate: 0,
    taxNotes: 'Florida has no state income tax. Only federal taxes apply to lottery winnings.',
    lotteryWebsite: 'https://www.flalottery.com',
    claimInfo: 'Prizes up to $599 at retailers. $600-$249,999 at FL Lottery district offices. Over $250,000 at Tallahassee headquarters.',
    purchaseAge: 18,
    facts: [
      'Florida Lottery began in 1988',
      'No state income tax on winnings',
      'Proceeds support education (Bright Futures scholarships)',
      'Home to multiple major jackpot winners',
    ],
  },
  'new-york': {
    name: 'New York',
    abbreviation: 'NY',
    slug: 'new-york',
    availableGames: ['powerball', 'mega-millions', 'cash4life', 'ny-lotto', 'take5'],
    taxRate: 0.109,
    taxNotes: 'New York has the highest combined lottery tax rate. NYC residents pay an additional 3.876%, and Yonkers residents 1.959%.',
    lotteryWebsite: 'https://nylottery.ny.gov',
    claimInfo: 'Prizes up to $600 at retailers. Over $600 at NY Lottery Customer Service Centers or by mail. Over $5,000 requires a visit to a Customer Service Center.',
    purchaseAge: 18,
    facts: [
      'NY Lottery is one of the oldest in the US (1967)',
      'Highest state lottery tax rate at 10.9%',
      'NYC adds additional 3.876% local tax',
      'All proceeds go to education — over $3.5B annually',
    ],
  },
  pennsylvania: {
    name: 'Pennsylvania',
    abbreviation: 'PA',
    slug: 'pennsylvania',
    availableGames: ['powerball', 'mega-millions', 'cash4life'],
    taxRate: 0.0307,
    taxNotes: 'Pennsylvania has a flat 3.07% state tax on lottery winnings — one of the lowest rates.',
    lotteryWebsite: 'https://www.palottery.state.pa.us',
    claimInfo: 'Prizes up to $2,500 at retailers. Over $2,500 at PA Lottery Area Offices. Over $250,000 at Middletown headquarters.',
    purchaseAge: 18,
    facts: [
      'Pennsylvania Lottery started in 1972',
      'Low 3.07% flat state tax rate',
      'Proceeds fund programs for older Pennsylvanians',
      'One of the most popular lottery states',
    ],
  },
  ohio: {
    name: 'Ohio',
    abbreviation: 'OH',
    slug: 'ohio',
    availableGames: ['powerball', 'mega-millions'],
    taxRate: 0.04,
    taxNotes: 'Ohio taxes lottery winnings at 4.0%.',
    lotteryWebsite: 'https://www.ohiolottery.com',
    claimInfo: 'Prizes up to $599 at retailers. Over $600 at OH Lottery regional offices or Cleveland headquarters.',
    purchaseAge: 18,
    facts: [
      'Ohio Lottery began in 1974',
      '4.0% state tax on winnings',
      'Profits fund education in Ohio',
      'Offers a wide variety of games',
    ],
  },
  illinois: {
    name: 'Illinois',
    abbreviation: 'IL',
    slug: 'illinois',
    availableGames: ['powerball', 'mega-millions'],
    taxRate: 0.0495,
    taxNotes: 'Illinois has a flat 4.95% state tax on lottery winnings.',
    lotteryWebsite: 'https://www.illinoislottery.com',
    claimInfo: 'Prizes up to $600 at retailers. Over $600 at IL Lottery claim centers in Chicago, Springfield, Fairview Heights, or Rockford.',
    purchaseAge: 18,
    facts: [
      'Illinois Lottery started in 1974',
      'Flat 4.95% state tax rate',
      'First state to sell lottery tickets online',
      'Proceeds support Illinois education',
    ],
  },
  michigan: {
    name: 'Michigan',
    abbreviation: 'MI',
    slug: 'michigan',
    availableGames: ['powerball', 'mega-millions', 'cash4life'],
    taxRate: 0.0425,
    taxNotes: 'Michigan taxes lottery winnings at 4.25%.',
    lotteryWebsite: 'https://www.michiganlottery.com',
    claimInfo: 'Prizes up to $600 at retailers. Over $600 at MI Lottery headquarters in Lansing or by mail.',
    purchaseAge: 18,
    facts: [
      'Michigan Lottery launched in 1972',
      '4.25% state tax on winnings',
      'Proceeds fund Michigan public schools',
      'Over $1 billion annually for education',
    ],
  },
  georgia: {
    name: 'Georgia',
    abbreviation: 'GA',
    slug: 'georgia',
    availableGames: ['powerball', 'mega-millions', 'cash4life'],
    taxRate: 0.0549,
    taxNotes: 'Georgia taxes lottery winnings at 5.49%.',
    lotteryWebsite: 'https://www.galottery.com',
    claimInfo: 'Prizes up to $600 at retailers. Over $600 at GA Lottery claim centers in Atlanta, Savannah, or Macon.',
    purchaseAge: 18,
    facts: [
      'Georgia Lottery began in 1993',
      '5.49% state tax on winnings',
      'Funds the HOPE Scholarship program',
      'Also funds Pre-K education',
    ],
  },
  'north-carolina': {
    name: 'North Carolina',
    abbreviation: 'NC',
    slug: 'north-carolina',
    availableGames: ['powerball', 'mega-millions'],
    taxRate: 0.045,
    taxNotes: 'North Carolina taxes lottery winnings at 4.5%.',
    lotteryWebsite: 'https://www.nclottery.com',
    claimInfo: 'Prizes up to $599 at retailers. $600-$99,999 at NC Education Lottery regional offices. Over $100,000 at Raleigh headquarters.',
    purchaseAge: 18,
    facts: [
      'NC Education Lottery started in 2006',
      '4.5% state tax on winnings',
      'One of the newer state lotteries',
      'Proceeds fund education, school construction, and college scholarships',
    ],
  },
};

export function getState(slug: string): StateConfig | undefined {
  return stateConfigs[slug];
}

export function getAllStates(): StateConfig[] {
  return Object.values(stateConfigs);
}

export function getAllStateSlugs(): string[] {
  return Object.keys(stateConfigs);
}
