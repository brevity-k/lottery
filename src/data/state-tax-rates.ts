export interface StateTaxInfo {
  name: string;
  abbreviation: string;
  slug: string;
  hasLottery: boolean;
  taxRate: number;
  notes?: string;
  localTaxes?: { city: string; rate: number }[];
}

export const FEDERAL_WITHHOLDING_RATE = 0.24;
export const FEDERAL_TOP_MARGINAL_RATE = 0.37;
export const LUMP_SUM_FACTOR = 0.50;

export const stateTaxData: StateTaxInfo[] = [
  { name: 'Alabama', abbreviation: 'AL', slug: 'alabama', hasLottery: false, taxRate: 0, notes: 'No state lottery' },
  { name: 'Alaska', abbreviation: 'AK', slug: 'alaska', hasLottery: false, taxRate: 0, notes: 'No state lottery, no state income tax' },
  { name: 'Arizona', abbreviation: 'AZ', slug: 'arizona', hasLottery: true, taxRate: 0.025 },
  { name: 'Arkansas', abbreviation: 'AR', slug: 'arkansas', hasLottery: true, taxRate: 0.044 },
  { name: 'California', abbreviation: 'CA', slug: 'california', hasLottery: true, taxRate: 0, notes: 'No state tax on lottery winnings' },
  { name: 'Colorado', abbreviation: 'CO', slug: 'colorado', hasLottery: true, taxRate: 0.044 },
  { name: 'Connecticut', abbreviation: 'CT', slug: 'connecticut', hasLottery: true, taxRate: 0.0699 },
  { name: 'Delaware', abbreviation: 'DE', slug: 'delaware', hasLottery: true, taxRate: 0.066 },
  { name: 'Florida', abbreviation: 'FL', slug: 'florida', hasLottery: true, taxRate: 0, notes: 'No state income tax' },
  { name: 'Georgia', abbreviation: 'GA', slug: 'georgia', hasLottery: true, taxRate: 0.0549 },
  { name: 'Hawaii', abbreviation: 'HI', slug: 'hawaii', hasLottery: false, taxRate: 0, notes: 'No state lottery' },
  { name: 'Idaho', abbreviation: 'ID', slug: 'idaho', hasLottery: true, taxRate: 0.058 },
  { name: 'Illinois', abbreviation: 'IL', slug: 'illinois', hasLottery: true, taxRate: 0.0495 },
  { name: 'Indiana', abbreviation: 'IN', slug: 'indiana', hasLottery: true, taxRate: 0.0305 },
  { name: 'Iowa', abbreviation: 'IA', slug: 'iowa', hasLottery: true, taxRate: 0.057 },
  { name: 'Kansas', abbreviation: 'KS', slug: 'kansas', hasLottery: true, taxRate: 0.057 },
  { name: 'Kentucky', abbreviation: 'KY', slug: 'kentucky', hasLottery: true, taxRate: 0.044 },
  { name: 'Louisiana', abbreviation: 'LA', slug: 'louisiana', hasLottery: true, taxRate: 0.0425 },
  { name: 'Maine', abbreviation: 'ME', slug: 'maine', hasLottery: true, taxRate: 0.0715 },
  { name: 'Maryland', abbreviation: 'MD', slug: 'maryland', hasLottery: true, taxRate: 0.0875, localTaxes: [{ city: 'Baltimore', rate: 0.032 }] },
  { name: 'Massachusetts', abbreviation: 'MA', slug: 'massachusetts', hasLottery: true, taxRate: 0.05 },
  { name: 'Michigan', abbreviation: 'MI', slug: 'michigan', hasLottery: true, taxRate: 0.0425 },
  { name: 'Minnesota', abbreviation: 'MN', slug: 'minnesota', hasLottery: true, taxRate: 0.0985 },
  { name: 'Mississippi', abbreviation: 'MS', slug: 'mississippi', hasLottery: true, taxRate: 0.05 },
  { name: 'Missouri', abbreviation: 'MO', slug: 'missouri', hasLottery: true, taxRate: 0.048 },
  { name: 'Montana', abbreviation: 'MT', slug: 'montana', hasLottery: true, taxRate: 0.059 },
  { name: 'Nebraska', abbreviation: 'NE', slug: 'nebraska', hasLottery: true, taxRate: 0.0584 },
  { name: 'Nevada', abbreviation: 'NV', slug: 'nevada', hasLottery: false, taxRate: 0, notes: 'No state lottery, no state income tax' },
  { name: 'New Hampshire', abbreviation: 'NH', slug: 'new-hampshire', hasLottery: true, taxRate: 0, notes: 'No state tax on lottery winnings' },
  { name: 'New Jersey', abbreviation: 'NJ', slug: 'new-jersey', hasLottery: true, taxRate: 0.08 },
  { name: 'New Mexico', abbreviation: 'NM', slug: 'new-mexico', hasLottery: true, taxRate: 0.059 },
  { name: 'New York', abbreviation: 'NY', slug: 'new-york', hasLottery: true, taxRate: 0.109, localTaxes: [{ city: 'New York City', rate: 0.03876 }, { city: 'Yonkers', rate: 0.01959 }] },
  { name: 'North Carolina', abbreviation: 'NC', slug: 'north-carolina', hasLottery: true, taxRate: 0.045 },
  { name: 'North Dakota', abbreviation: 'ND', slug: 'north-dakota', hasLottery: true, taxRate: 0.0195 },
  { name: 'Ohio', abbreviation: 'OH', slug: 'ohio', hasLottery: true, taxRate: 0.04 },
  { name: 'Oklahoma', abbreviation: 'OK', slug: 'oklahoma', hasLottery: true, taxRate: 0.0475 },
  { name: 'Oregon', abbreviation: 'OR', slug: 'oregon', hasLottery: true, taxRate: 0.099 },
  { name: 'Pennsylvania', abbreviation: 'PA', slug: 'pennsylvania', hasLottery: true, taxRate: 0.0307 },
  { name: 'Rhode Island', abbreviation: 'RI', slug: 'rhode-island', hasLottery: true, taxRate: 0.0599 },
  { name: 'South Carolina', abbreviation: 'SC', slug: 'south-carolina', hasLottery: true, taxRate: 0.064 },
  { name: 'South Dakota', abbreviation: 'SD', slug: 'south-dakota', hasLottery: true, taxRate: 0, notes: 'No state income tax' },
  { name: 'Tennessee', abbreviation: 'TN', slug: 'tennessee', hasLottery: true, taxRate: 0, notes: 'No state income tax' },
  { name: 'Texas', abbreviation: 'TX', slug: 'texas', hasLottery: true, taxRate: 0, notes: 'No state income tax' },
  { name: 'Utah', abbreviation: 'UT', slug: 'utah', hasLottery: false, taxRate: 0, notes: 'No state lottery' },
  { name: 'Vermont', abbreviation: 'VT', slug: 'vermont', hasLottery: true, taxRate: 0.0875 },
  { name: 'Virginia', abbreviation: 'VA', slug: 'virginia', hasLottery: true, taxRate: 0.0575 },
  { name: 'Washington', abbreviation: 'WA', slug: 'washington', hasLottery: true, taxRate: 0, notes: 'No state income tax' },
  { name: 'West Virginia', abbreviation: 'WV', slug: 'west-virginia', hasLottery: true, taxRate: 0.065 },
  { name: 'Wisconsin', abbreviation: 'WI', slug: 'wisconsin', hasLottery: true, taxRate: 0.0765 },
  { name: 'Wyoming', abbreviation: 'WY', slug: 'wyoming', hasLottery: true, taxRate: 0, notes: 'No state income tax' },
  { name: 'District of Columbia', abbreviation: 'DC', slug: 'district-of-columbia', hasLottery: true, taxRate: 0.1075 },
];

export function getStateBySlug(slug: string): StateTaxInfo | undefined {
  return stateTaxData.find(s => s.slug === slug);
}

export function getStateByAbbreviation(abbr: string): StateTaxInfo | undefined {
  return stateTaxData.find(s => s.abbreviation === abbr);
}

export function getStatesWithLottery(): StateTaxInfo[] {
  return stateTaxData.filter(s => s.hasLottery);
}
