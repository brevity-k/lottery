/**
 * Auto-update state tax rates using Claude API
 *
 * Run: ANTHROPIC_API_KEY=sk-... npx tsx scripts/update-tax-rates.ts
 *
 * Uses Claude to research current state tax rates and compare against
 * the existing state-tax-rates.ts file. If changes are detected,
 * updates the file.
 *
 * Designed to run quarterly via GitHub Actions.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

interface TaxRateUpdate {
  abbreviation: string;
  name: string;
  currentRate: number;
  suggestedRate: number;
  reason: string;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('ANTHROPIC_API_KEY not set – skipping tax rate update.');
    return;
  }

  const taxFilePath = path.join(process.cwd(), 'src', 'data', 'state-tax-rates.ts');
  const currentContent = fs.readFileSync(taxFilePath, 'utf-8');

  // Extract current rates from the file
  const rateRegex = /name:\s*'([^']+)'[^}]*abbreviation:\s*'([^']+)'[^}]*taxRate:\s*([\d.]+)/g;
  const currentRates: { name: string; abbreviation: string; rate: number }[] = [];
  let match;
  while ((match = rateRegex.exec(currentContent)) !== null) {
    currentRates.push({
      name: match[1],
      abbreviation: match[2],
      rate: parseFloat(match[3]),
    });
  }

  console.log(`Found ${currentRates.length} states in current file`);

  const prompt = `You are a tax research assistant. I need you to verify the current state tax rates on lottery winnings for all US states.

Here are the current rates in our database:
${currentRates.map(s => `${s.name} (${s.abbreviation}): ${(s.rate * 100).toFixed(4)}%`).join('\n')}

Please check if any of these rates are incorrect or outdated for the current year (2026).

IMPORTANT RULES:
- Only report CONFIRMED changes. Do not guess.
- Focus on state income tax rates that apply to lottery winnings
- Some states have no income tax (AK, FL, NH, SD, TN, TX, WA, WY) - their rate should be 0
- California does not tax lottery winnings - rate should be 0
- Report rates as decimal fractions (e.g., 0.05 for 5%)

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "updates": [
    {
      "abbreviation": "XX",
      "name": "State Name",
      "currentRate": 0.05,
      "suggestedRate": 0.055,
      "reason": "Brief explanation of why the rate changed"
    }
  ],
  "noChanges": true/false,
  "notes": "Any general observations"
}

If no changes are needed, return {"updates": [], "noChanges": true, "notes": "All rates are current"}`;

  console.log('Querying Claude for tax rate verification...');

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  let result: { updates: TaxRateUpdate[]; noChanges: boolean; notes: string };
  try {
    result = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      console.error('Failed to parse response:', text.slice(0, 200));
      return;
    }
  }

  console.log(`Notes: ${result.notes}`);

  if (result.noChanges || result.updates.length === 0) {
    console.log('No tax rate changes detected. All rates are current.');
    return;
  }

  console.log(`\nSuggested updates (${result.updates.length}):`);
  let updatedContent = currentContent;
  let changesApplied = 0;

  for (const update of result.updates) {
    console.log(`  ${update.name} (${update.abbreviation}): ${update.currentRate} -> ${update.suggestedRate} (${update.reason})`);

    // Apply the change in the file content
    const currentRateStr = `taxRate: ${update.currentRate}`;
    const newRateStr = `taxRate: ${update.suggestedRate}`;

    // Find the state block and update its rate
    const stateBlockRegex = new RegExp(
      `(abbreviation:\\s*'${update.abbreviation}'[^}]*?)taxRate:\\s*${update.currentRate.toString().replace('.', '\\.')}`,
    );

    if (stateBlockRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(
        stateBlockRegex,
        `$1taxRate: ${update.suggestedRate}`,
      );
      changesApplied++;
    } else {
      console.log(`    WARNING: Could not find matching pattern for ${update.abbreviation}`);
    }
  }

  if (changesApplied > 0) {
    fs.writeFileSync(taxFilePath, updatedContent);
    console.log(`\nApplied ${changesApplied} tax rate update(s) to state-tax-rates.ts`);
  } else {
    console.log('\nNo changes could be applied (patterns not matched).');
  }
}

main().catch(console.error);
