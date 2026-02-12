/**
 * Auto-close resolved automation-failure GitHub Issues.
 *
 * For each open issue with the `automation-failure` label, checks if the
 * corresponding GitHub Actions workflow has succeeded since the issue was
 * last updated. If so, closes the issue with a resolution comment.
 *
 * Usage: npx tsx scripts/cleanup-stale-issues.ts
 *
 * Requires: GITHUB_TOKEN and GITHUB_REPOSITORY environment variables
 * (auto-provided in GitHub Actions).
 */

const LABEL = 'automation-failure';

// Map issue title patterns to workflow filenames
const WORKFLOW_MAP: Record<string, string> = {
  'update-lottery-data failed': 'update-lottery-data.yml',
  'blog generation failed': 'update-lottery-data.yml',
  'check-new-datasets failed': 'weekly-maintenance.yml',
  'quarterly-tax-update failed': 'weekly-maintenance.yml',
  'npm security vulnerabilities': 'weekly-maintenance.yml',
  'Stale lottery data detected': 'update-lottery-data.yml',
};

interface GitHubIssue {
  number: number;
  title: string;
  updated_at: string;
}

interface WorkflowRun {
  conclusion: string | null;
  created_at: string;
}

async function ghApi(path: string, options?: RequestInit): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) throw new Error('GITHUB_TOKEN or GITHUB_REPOSITORY not set');

  return fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
      ...options?.headers,
    },
  });
}

function matchWorkflow(title: string): string | undefined {
  for (const [pattern, workflow] of Object.entries(WORKFLOW_MAP)) {
    if (title.includes(pattern)) return workflow;
  }
  return undefined;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (!token || !repo) {
    console.log('Not running in GitHub Actions (GITHUB_TOKEN/GITHUB_REPOSITORY not set) — skipping.');
    return;
  }

  console.log('Checking for stale automation-failure issues to auto-close...');

  // Fetch open issues with automation-failure label
  const issuesRes = await ghApi(`/issues?labels=${LABEL}&state=open&per_page=50`);
  if (!issuesRes.ok) {
    console.error(`Failed to fetch issues: ${issuesRes.status}`);
    return;
  }

  const issues: GitHubIssue[] = await issuesRes.json();
  if (issues.length === 0) {
    console.log('No open automation-failure issues found.');
    return;
  }

  console.log(`Found ${issues.length} open automation-failure issue(s).`);

  for (const issue of issues) {
    const workflowFile = matchWorkflow(issue.title);
    if (!workflowFile) {
      console.log(`  #${issue.number}: "${issue.title}" — no matching workflow, skipping.`);
      continue;
    }

    // Get latest workflow run
    const runsRes = await ghApi(
      `/actions/workflows/${workflowFile}/runs?per_page=1&status=completed`
    );
    if (!runsRes.ok) {
      console.log(`  #${issue.number}: Could not fetch workflow runs for ${workflowFile}`);
      continue;
    }

    const runsData = await runsRes.json();
    const runs: WorkflowRun[] = runsData.workflow_runs || [];

    if (runs.length === 0) {
      console.log(`  #${issue.number}: No completed runs for ${workflowFile}`);
      continue;
    }

    const latestRun = runs[0];
    const runDate = new Date(latestRun.created_at);
    const issueDate = new Date(issue.updated_at);

    if (latestRun.conclusion === 'success' && runDate > issueDate) {
      console.log(`  #${issue.number}: "${issue.title}" — workflow succeeded on ${latestRun.created_at}, closing.`);

      // Add comment
      await ghApi(`/issues/${issue.number}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          body: `Resolved automatically — the \`${workflowFile}\` workflow succeeded on ${latestRun.created_at}.`,
        }),
      });

      // Close issue
      await ghApi(`/issues/${issue.number}`, {
        method: 'PATCH',
        body: JSON.stringify({ state: 'closed' }),
      });
    } else {
      console.log(`  #${issue.number}: "${issue.title}" — latest run: ${latestRun.conclusion} (${latestRun.created_at}), keeping open.`);
    }
  }

  console.log('Done.');
}

main().catch(console.error);
