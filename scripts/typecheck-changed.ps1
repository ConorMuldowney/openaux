# Check types only on files changed in current branch
# Usage: .\scripts\typecheck-changed.ps1 [-BaseBranch develop]

param(
  [string]$BaseBranch = "develop"
)

$ErrorActionPreference = "Stop"

# Get list of TypeScript/TSX files changed compared to base branch
$changedFiles = & git diff --name-only "origin/${BaseBranch}...HEAD" | `
  Where-Object { $_ -match '\.(ts|tsx)$' } | `
  Join-String -Separator ' '

if ([string]::IsNullOrWhiteSpace($changedFiles)) {
  Write-Output "No TypeScript files changed compared to origin/$BaseBranch"
  exit 0
}

Write-Output "TypeScript files changed compared to origin/$BaseBranch:"
$changedFiles.Split(' ') | ForEach-Object { Write-Output $_ }
Write-Output ""
Write-Output "Running typecheck on changed files..."

& npx tsc --noEmit ($changedFiles.Split(' ') | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
