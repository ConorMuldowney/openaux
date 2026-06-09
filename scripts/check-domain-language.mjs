import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const CODE_SURFACE_DIRECTORIES = ["app", "src", "scripts"];
const LEGACY_TERMS = [
  "battle",
  "contest",
  "challenge",
  "event",
  "admin",
  "organizer",
  "competitor",
];

const REQUIRED_MODULES = [
  "lifecycle",
  "policy",
  "submissions",
  "ballots",
  "scoring",
  "visibility",
];

const LEGACY_TERM_ALLOWLIST = new Set([
  "src/domain/language/canonical-terms.ts",
  "scripts/check-domain-language.mjs",
]);

const TEXT_FILE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".css",
]);

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

function checkFilePathForLegacyTerms(filePath, violations) {
  const normalizedPath = filePath.toLowerCase().replaceAll("\\", "/");

  for (const term of LEGACY_TERMS) {
    const pathPattern = new RegExp(`(^|[^a-z])${term}([^a-z]|$)`, "i");
    if (pathPattern.test(normalizedPath)) {
      violations.push(`Legacy term '${term}' in file path: ${normalizedPath}`);
    }
  }
}

function checkFileContentForLegacyTerms(filePath, fileContent, violations) {
  const relativePath = path.relative(process.cwd(), filePath).replaceAll("\\", "/");
  if (LEGACY_TERM_ALLOWLIST.has(relativePath)) {
    return;
  }

  for (const term of LEGACY_TERMS) {
    const contentPattern = new RegExp(`\\b${term}\\b`, "i");
    if (contentPattern.test(fileContent)) {
      violations.push(`Legacy term '${term}' in file content: ${relativePath}`);
    }
  }
}

async function assertRequiredModulesExist() {
  const modulesPath = path.resolve(process.cwd(), "src/modules");
  const moduleDirectories = await readdir(modulesPath, { withFileTypes: true });
  const existingModules = new Set(
    moduleDirectories.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
  );

  const missingModules = REQUIRED_MODULES.filter((moduleName) => !existingModules.has(moduleName));

  if (missingModules.length > 0) {
    throw new Error(`Missing required domain modules: ${missingModules.join(", ")}`);
  }
}

async function main() {
  const violations = [];

  await assertRequiredModulesExist();
  const files = await collectCodeSurfaceFiles();

  for (const filePath of files) {
    checkFilePathForLegacyTerms(filePath, violations);

    const fileContent = await readFile(filePath, "utf-8");
    checkFileContentForLegacyTerms(filePath, fileContent, violations);
  }

  if (violations.length > 0) {
    console.error("Domain language policy violations found:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Domain language policy checks passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
