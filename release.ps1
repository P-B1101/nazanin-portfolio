<#
.SYNOPSIS
  Update, version and deploy the portfolio to Cloudflare Pages.

.DESCRIPTION
  1. Pulls the latest main.
  2. Bumps SITE_VERSION in js/data.js (patch, minor or major).
  3. Adds a CHANGELOG.md entry.
  4. Commits your changes, tags vX.Y.Z and pushes main and the tag.
  5. Deploys the site files to Cloudflare Pages with wrangler.

.EXAMPLE
  .\release.ps1 -Message "Add photo and domain"
  Patch release (1.0.0 -> 1.0.1) with your current edits, then deploy.

.EXAMPLE
  .\release.ps1 -Bump minor -Message "New projects section"
  Minor release (1.0.1 -> 1.1.0).

.EXAMPLE
  .\release.ps1 -DeployOnly
  Deploy what is on main right now, without changing the version.

.EXAMPLE
  .\release.ps1 -Message "Fix typo" -SkipDeploy
  Version, commit, tag and push, but do not deploy.
#>
[CmdletBinding()]
param(
  [ValidateSet("patch", "minor", "major")]
  [string]$Bump = "patch",

  # One line describing the release. Goes into the commit, tag and changelog.
  [string]$Message,

  # Cloudflare Pages project name.
  [string]$ProjectName = "nazanin-portfolio",

  [switch]$DeployOnly,
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

$DataFile = "js/data.js"
$Changelog = "CHANGELOG.md"
$Branch = "main"
# Everything that is part of the public site. Nothing else gets uploaded.
$SiteFiles = @("index.html", "404.html", "_headers", "favicon.svg", "css", "js", "assets")
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Step($text) { Write-Host "==> $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "ERROR: $text" -ForegroundColor Red; exit 1 }

function Invoke-Git {
  & git @args
  if ($LASTEXITCODE -ne 0) { Fail "git $($args -join ' ') failed" }
}

function Read-Text($path) { [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot $path)) }
function Write-Text($path, $text) { [System.IO.File]::WriteAllText((Join-Path $PSScriptRoot $path), $text, $Utf8NoBom) }

function Get-SiteVersion {
  $m = [regex]::Match((Read-Text $DataFile), 'SITE_VERSION\s*=\s*"(\d+)\.(\d+)\.(\d+)"')
  if (-not $m.Success) { Fail "Could not find SITE_VERSION in $DataFile" }
  return @([int]$m.Groups[1].Value, [int]$m.Groups[2].Value, [int]$m.Groups[3].Value)
}

function Deploy-Site($version) {
  $useGlobal = [bool](Get-Command wrangler -ErrorAction SilentlyContinue)
  if (-not $useGlobal -and -not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Fail "wrangler not found. Install it with: npm install -g wrangler"
  }
  $dist = Join-Path $PSScriptRoot "dist"
  if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
  New-Item -ItemType Directory -Path $dist | Out-Null

  foreach ($f in $SiteFiles) {
    if (-not (Test-Path $f)) { Fail "Missing site file: $f" }
    Copy-Item -Path $f -Destination $dist -Recurse -Force
  }

  $hash = (& git rev-parse HEAD).Trim()
  Step "Deploying v$version to Cloudflare Pages project '$ProjectName'"
  $deployArgs = @("pages", "deploy", $dist, "--project-name", $ProjectName, "--branch", $Branch,
    "--commit-hash", $hash, "--commit-message", "v$version", "--commit-dirty=true")
  if ($useGlobal) { & wrangler @deployArgs } else { & npx --yes wrangler @deployArgs }
  $code = $LASTEXITCODE
  Remove-Item $dist -Recurse -Force
  if ($code -ne 0) { Fail "wrangler deploy failed" }
}

# ---------- checks ----------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail "git is not installed" }
$current = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($current -ne $Branch) { Fail "You are on '$current'. Switch to '$Branch' first: git checkout $Branch" }

if ($DeployOnly) {
  $v = Get-SiteVersion
  Deploy-Site ($v -join ".")
  Write-Host "Done." -ForegroundColor Green
  exit 0
}

if (-not $Message) { $Message = Read-Host "What changed in this release? (one line)" }
if (-not $Message.Trim()) { Fail "A release message is required" }
$Message = $Message.Trim()

# ---------- sync ----------
Step "Pulling latest $Branch"
$stashed = $false
if (& git status --porcelain) {
  Invoke-Git stash push --include-untracked -m "release-script"
  $stashed = $true
}
Invoke-Git pull --ff-only origin $Branch
if ($stashed) {
  & git stash pop
  if ($LASTEXITCODE -ne 0) { Fail "Your changes conflict with main. Resolve the conflict, then run the script again." }
}

# ---------- version ----------
$old = Get-SiteVersion
$new = @($old[0], $old[1], $old[2])
switch ($Bump) {
  "major" { $new = @(($old[0] + 1), 0, 0) }
  "minor" { $new = @($old[0], ($old[1] + 1), 0) }
  "patch" { $new = @($old[0], $old[1], ($old[2] + 1)) }
}
$oldV = $old -join "."
$newV = $new -join "."
$tag = "v$newV"

if (& git tag --list $tag) { Fail "Tag $tag already exists" }
Step "Version $oldV -> $newV"

$data = Read-Text $DataFile
$data = [regex]::Replace($data, 'SITE_VERSION\s*=\s*"\d+\.\d+\.\d+"', "SITE_VERSION = `"$newV`"")
Write-Text $DataFile $data

# ---------- changelog ----------
$date = Get-Date -Format "yyyy-MM-dd"
$entry = "## [$newV] - $date`n`n- $Message`n`n"
$log = Read-Text $Changelog
$idx = $log.IndexOf("## [")
if ($idx -ge 0) { $log = $log.Insert($idx, $entry) } else { $log = $log.TrimEnd() + "`n`n" + $entry }
Write-Text $Changelog $log

# ---------- commit, tag, push ----------
Step "Committing and tagging $tag"
Invoke-Git add -A
Invoke-Git commit -m "Release $tag" -m $Message
Invoke-Git tag -a $tag -m "$tag - $Message"

Step "Pushing $Branch and $tag"
Invoke-Git push origin $Branch
Invoke-Git push origin $tag

# ---------- deploy ----------
if ($SkipDeploy) {
  Write-Host "Skipped deploy. Released $tag." -ForegroundColor Yellow
} else {
  Deploy-Site $newV
  Write-Host "Released and deployed $tag." -ForegroundColor Green
}
