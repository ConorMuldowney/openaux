import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const CODE_SURFACE_DIRECTORIES = ["app", "components", "src"];
const TEXT_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const RAW_TAILWIND_COLOR_PATTERN =
  /\b(?:bg|text|border|ring|stroke|fill|divide)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-[0-9]{2,3})?(?:\/[0-9]{1,3})?\b/g;

const INLINE_COLOR_STYLE_PATTERN =
  /style\s*=\s*\{\{[^}]*\b(?:color|background|backgroundColor|borderColor|fill|stroke)\b[^}]*\}\}/gs;

const FORBIDDEN_OPACITY_PATTERN = /\btext-foreground\/(?!75\b|50\b)[0-9]{1,3}\b/g;

const ALLOWLIST_PATHS = new Set([
  "scripts/check-ui-conventions.mjs",
]);

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

async function walkFiles(directoryPath) {
  const directoryEntries = await readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of directoryEntries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await walkFiles(entryPath);
      files.push(...nestedFiles);
      continue;
    }

    files.push(entryPath);
  }

  return files;
}

async function collectCodeSurfaceFiles() {
  const files = [];

  for (const directoryName of CODE_SURFACE_DIRECTORIES) {
    const absoluteDirectoryPath = path.resolve(process.cwd(), directoryName);
    const directoryFiles = await walkFiles(absoluteDirectoryPath);
    files.push(...directoryFiles);
  }

  return files.filter((filePath) => TEXT_FILE_EXTENSIONS.has(path.extname(filePath)));
}

function fileIsAllowlisted(relativePath) {
  if (ALLOWLIST_PATHS.has(relativePath)) {
    return true;
  }

  if (relativePath.startsWith("components/ui/")) {
    return true;
  }

  return false;
}

function pushViolationsForMatches(filePath, content, pattern, violationLabel, violations) {
  const matches = [...content.matchAll(pattern)];

  for (const match of matches) {
    const found = match[0];
    violations.push(`${violationLabel} in ${filePath}: '${found}'`);
  }
}

async function main() {
  const files = await collectCodeSurfaceFiles();
  const violations = [];

  for (const filePath of files) {
    const relativePath = normalizePath(path.relative(process.cwd(), filePath));
    const content = await readFile(filePath, "utf-8");

    if (!fileIsAllowlisted(relativePath)) {
      pushViolationsForMatches(
        relativePath,
        content,
        RAW_TAILWIND_COLOR_PATTERN,
        "Raw Tailwind color class is disallowed; use semantic tokens",
        violations,
      );

      pushViolationsForMatches(
        relativePath,
        content,
        INLINE_COLOR_STYLE_PATTERN,
        "Inline color style is disallowed; use semantic tokens",
        violations,
      );
    }

    pushViolationsForMatches(
      relativePath,
      content,
      FORBIDDEN_OPACITY_PATTERN,
      "Non-standard foreground opacity is disallowed; use text-foreground, text-foreground/75, or text-foreground/50",
      violations,
    );
  }

  if (violations.length > 0) {
    console.error("UI conventions violations found:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("UI conventions checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
