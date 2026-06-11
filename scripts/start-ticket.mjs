#!/usr/bin/env node
/**
 * End-to-end ticket setup: parse a Linear or GitHub issue URL, create a
 * worktree + feature branch, and print next steps for Copilot Chat.
 *
 * Usage:
 *   npm run start-ticket -- <url> [--type <type>] [--title <title>]
 *
 * Examples:
 *   npm run start-ticket -- https://linear.app/openaux/issue/AUX-37/set-up-ci
 *   npm run start-ticket -- https://github.com/ConorMuldowney/openaux/issues/37 --type fix
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import dotenv from "dotenv";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fail(msg) {
  process.stderr.write(`✗ ${msg}\n`);
  process.exit(1);
}

function toSlug(title, maxLen = 45) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .replace(/-+$/, "");
}

const LABEL_TYPE_MAP = {
  bug: "fix",
  "bug fix": "fix",
  feature: "feat",
  enhancement: "feat",
  documentation: "docs",
  docs: "docs",
  refactor: "refactor",
  "tech debt": "refactor",
  test: "test",
  testing: "test",
  chore: "chore",
  maintenance: "chore",
  ci: "ci",
  "ci/cd": "ci",
};

function inferType(labels) {
  for (const label of labels) {
    const mapped = LABEL_TYPE_MAP[label.toLowerCase()];
    if (mapped) return mapped;
  }
  return "feat";
}

// ─── Issue Fetching ──────────────────────────────────────────────────────────

async function fetchLinearIssue(identifier) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: `query($id: String!) { issue(id: $id) { title labels { nodes { name } } } }`,
      variables: { id: identifier },
    }),
  });

  if (!response.ok) return null;
  const json = await response.json();
  return json.data?.issue ?? null;
}

async function fetchGitHubIssue(owner, repo, number) {
  const token = process.env.GITHUB_TOKEN;
  const headers = { Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${number}`,
    { headers }
  );

  if (!response.ok) return null;
  return response.json();
}

// ─── URL Parsing & Resolution ─────────────────────────────────────────────────

const LINEAR_URL_RE = /linear\.app\/[^/]+\/issue\/(AUX-(\d+))/i;
const GITHUB_URL_RE = /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/i;
const AUX_REF_RE = /AUX-(\d+)/i;

async function resolveIssue(url, typeOverride, titleOverride) {
  const linearMatch = url.match(LINEAR_URL_RE);

  if (linearMatch) {
    const identifier = linearMatch[1].toUpperCase();
    const number = linearMatch[2];

    if (titleOverride) {
      return { number, identifier, title: titleOverride, type: typeOverride ?? "feat" };
    }

    console.log(`  Fetching Linear issue ${identifier}...`);
    const issue = await fetchLinearIssue(identifier);

    if (!issue) {
      fail(
        `Could not fetch issue ${identifier} from Linear.\n` +
          `Ensure LINEAR_API_KEY is set in .env.local, or pass --title to skip the API call.`
      );
    }

    const labels = issue.labels?.nodes?.map((l) => l.name) ?? [];
    return {
      number,
      identifier,
      title: issue.title,
      type: typeOverride ?? inferType(labels),
    };
  }

  const githubMatch = url.match(GITHUB_URL_RE);

  if (githubMatch) {
    const [, owner, repo, ghNumber] = githubMatch;

    if (titleOverride) {
      const auxMatch = titleOverride.match(AUX_REF_RE);
      if (!auxMatch) {
        fail("--title must contain an AUX-### reference when using a GitHub URL.");
      }
      return {
        number: auxMatch[1],
        identifier: `AUX-${auxMatch[1]}`,
        title: titleOverride,
        type: typeOverride ?? "feat",
      };
    }

    console.log(`  Fetching GitHub issue #${ghNumber}...`);
    const issue = await fetchGitHubIssue(owner, repo, ghNumber);

    if (!issue) {
      fail(
        `Could not fetch GitHub issue #${ghNumber}.\n` +
          `Ensure GITHUB_TOKEN is set in .env.local.`
      );
    }

    const searchText = `${issue.title ?? ""} ${issue.body ?? ""}`;
    const auxMatch = searchText.match(AUX_REF_RE);

    if (!auxMatch) {
      fail(
        `GitHub issue #${ghNumber} does not contain an AUX-### reference in its title or body.\n` +
          `Use the Linear URL instead, or pass --title "AUX-### My title".`
      );
    }

    const labels = issue.labels?.map((l) => l.name) ?? [];
    return {
      number: auxMatch[1],
      identifier: `AUX-${auxMatch[1]}`,
      title: issue.title,
      type: typeOverride ?? inferType(labels),
    };
  }

  fail(
    `Unrecognised URL format: ${url}\n` +
      `Supported formats:\n` +
      `  https://linear.app/openaux/issue/AUX-37/...\n` +
      `  https://github.com/ConorMuldowney/openaux/issues/37`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    type: { type: "string" },
    title: { type: "string" },
    help: { type: "boolean", default: false },
  },
  allowPositionals: true,
  strict: true,
});

if (values.help || positionals.length === 0) {
  console.log(`
Usage: npm run start-ticket -- <url> [options]

Arguments:
  url                  Linear or GitHub issue URL

Options:
  --type <type>        Override branch type prefix (feat|fix|docs|refactor|test|chore|ci)
                       Inferred from issue labels if not provided; defaults to feat
  --title <title>      Override issue title (skips API fetch)
  --help               Show this help

Examples:
  npm run start-ticket -- https://linear.app/openaux/issue/AUX-37/set-up-ci
  npm run start-ticket -- https://github.com/ConorMuldowney/openaux/issues/37 --type fix
  npm run start-ticket -- https://linear.app/openaux/issue/AUX-99/my-ticket --title "AUX-99: My ticket title"
`);
  process.exit(0);
}

const url = positionals[0];

console.log(`\n  Resolving issue from ${url}...`);
const issue = await resolveIssue(url, values.type, values.title);
const slug = toSlug(issue.title);

console.log(`✓ Issue:  ${issue.identifier} — ${issue.title}`);
console.log(`✓ Type:   ${issue.type}`);
console.log(`✓ Branch: ${issue.type}/AUX-${issue.number}-${slug}\n`);

// Delegate worktree + branch creation
const result = spawnSync(
  "node",
  [
    path.join(ROOT, "scripts/create-worktree.mjs"),
    "--number", issue.number,
    "--type", issue.type,
    "--slug", slug,
  ],
  { stdio: "inherit", cwd: ROOT }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const worktreeRelPath = `.worktrees/AUX-${issue.number}`;

console.log(`
─────────────────────────────────────────────────────
✓ Setup complete!

  Worktree: ${worktreeRelPath}
  Branch:   ${issue.type}/AUX-${issue.number}-${slug}

  Next steps — open ${worktreeRelPath} in VS Code, then
  run these prompts in Copilot Chat (@workspace):

  1. Implement the ticket:
       tackle this ticket with docs: ${url}

  2. Chunk changes into commits:
       chunk and commit

  3. Push branch and open PR against develop:
       push and create pr
─────────────────────────────────────────────────────
`);
