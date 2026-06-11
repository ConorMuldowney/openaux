#!/usr/bin/env node
/**
 * Creates a Git worktree and feature branch for a Linear ticket.
 *
 * Usage:
 *   node scripts/create-worktree.mjs --number <n> --type <type> --slug <slug>
 *
 * Example:
 *   node scripts/create-worktree.mjs --number 37 --type feat --slug ci-preview-deploy
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKTREE_BASE_PATH = process.env.WORKTREE_BASE_PATH ?? ".worktrees";

const VALID_TYPES = ["feat", "fix", "docs", "refactor", "test", "chore", "ci"];
const BRANCH_PATTERN = /^(feat|fix|docs|refactor|test|chore|ci)\/AUX-[0-9]+-[a-z0-9-]+$/;

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", cwd: ROOT }).trim();
}

function fail(msg) {
  process.stderr.write(`✗ ${msg}\n`);
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    number: { type: "string" },
    type: { type: "string" },
    slug: { type: "string" },
  },
  strict: true,
});

const { number, type, slug } = values;

if (!number || !type || !slug) {
  fail(
    "Missing required arguments.\n" +
      "Usage: node scripts/create-worktree.mjs --number <n> --type <type> --slug <slug>"
  );
}

if (!VALID_TYPES.includes(type)) {
  fail(`Invalid type "${type}". Must be one of: ${VALID_TYPES.join(", ")}`);
}

const branchName = `${type}/AUX-${number}-${slug}`;

if (!BRANCH_PATTERN.test(branchName)) {
  fail(
    `Generated branch name "${branchName}" does not match required pattern.\n` +
      `Pattern: ${BRANCH_PATTERN.source}\n` +
      `Check that --slug contains only lowercase letters, numbers, and hyphens.`
  );
}

const worktreeRelPath = path.posix.join(WORKTREE_BASE_PATH, `AUX-${number}`);
const worktreePath = path.join(ROOT, worktreeRelPath);

if (existsSync(worktreePath)) {
  fail(
    `Worktree already exists at ${worktreeRelPath}\n` +
      `To start fresh, remove it:\n` +
      `  Remove-Item -Recurse -Force ${worktreeRelPath}\n` +
      `  git worktree prune`
  );
}

console.log("  Fetching latest develop...");
run("git fetch origin develop");

console.log(`  Creating worktree at ${worktreeRelPath}...`);
run(`git worktree add "${worktreePath}" -b "${branchName}" origin/develop`);

console.log(`✓ Worktree created at ${worktreeRelPath}`);
console.log(`✓ Branch: ${branchName}`);
