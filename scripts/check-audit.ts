/**
 * Fail on high/critical npm audit advisories, minus reviewed exceptions.
 *
 * Run: npx tsx scripts/check-audit.ts
 *
 * Wraps `npm audit --json` and filters out advisories listed in
 * IGNORED_AUDIT_ADVISORIES. Exits 1 if any remaining high/critical
 * advisory is found (used by weekly-maintenance.yml).
 */

import { execSync } from 'child_process';
import { IGNORED_AUDIT_ADVISORIES } from './lib/constants';

interface Advisory {
  source: number;
  name: string;
  title: string;
  url: string;
  severity: string;
}

interface AuditReport {
  vulnerabilities?: Record<string, { via: (string | Advisory)[] }>;
}

const FAILING_SEVERITIES = new Set(['high', 'critical']);

function runAudit(): AuditReport {
  try {
    return JSON.parse(execSync('npm audit --json', { encoding: 'utf-8' }));
  } catch (err) {
    // npm audit exits non-zero when vulnerabilities exist; the JSON is still on stdout
    const stdout = (err as { stdout?: string }).stdout;
    if (!stdout) throw err;
    return JSON.parse(stdout);
  }
}

function ghsaId(url: string): string {
  return url.split('/').pop() ?? url;
}

function main(): void {
  const report = runAudit();
  const advisories = new Map<number, Advisory>();

  for (const vuln of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vuln.via) {
      if (typeof via === 'object') advisories.set(via.source, via);
    }
  }

  const failing: Advisory[] = [];
  for (const adv of advisories.values()) {
    if (!FAILING_SEVERITIES.has(adv.severity)) continue;
    if (IGNORED_AUDIT_ADVISORIES.has(ghsaId(adv.url))) {
      console.log(`  IGNORED: ${adv.name} — ${adv.title} (${ghsaId(adv.url)})`);
      continue;
    }
    failing.push(adv);
  }

  if (failing.length === 0) {
    console.log('npm audit: no unreviewed high/critical advisories.');
    return;
  }

  console.error(`npm audit: ${failing.length} high/critical advisories:`);
  for (const adv of failing) {
    console.error(`  [${adv.severity}] ${adv.name} — ${adv.title} (${adv.url})`);
  }
  process.exit(1);
}

main();
