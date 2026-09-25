# Release and deploy the portfolio to Cloudflare Pages.
# Double-click release.cmd (or run .\release.ps1). It asks for everything it needs.

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

$DataFile = "js/data.js"
$Changelog = "CHANGELOG.md"
$ConfigFile = ".release.json"
$Branch = "main"
# Everything that is part of the public site. Nothing else gets uploaded.
$SiteFiles = @("index.html", "404.html", "resume.html", "_headers", "favicon.svg", "css", "js", "assets")
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# ---------- helpers ----------
function Pause-Exit($code) {
  Write-Host ""
  Read-Host "Press Enter to close" | Out-Null
  exit $code
}
function Step($text) { Write-Host ""; Write-Host "==> $text" -ForegroundColor Cyan }
function Info($text) { Write-Host "    $text" -ForegroundColor Gray }
function Fail($text) { Write-Host ""; Write-Host "ERROR: $text" -ForegroundColor Red; Pause-Exit 1 }

function Ask-YesNo($question, $default = $true) {
  $hint = if ($default) { "[Y/n]" } else { "[y/N]" }
  while ($true) {
    $a = (Read-Host "$question $hint").Trim().ToLower()
    if (-not $a) { return $default }
    if ($a -in @("y", "yes")) { return $true }
    if ($a -in @("n", "no")) { return $false }
  }
}

function Ask-Choice($question, [string[]]$options) {
  Write-Host ""
  Write-Host $question -ForegroundColor White
  for ($i = 0; $i -lt $options.Length; $i++) { Write-Host "  $($i + 1)) $($options[$i])" }
  while ($true) {
    $a = (Read-Host "Choose 1-$($options.Length)").Trim()
    $n = 0
    if ([int]::TryParse($a, [ref]$n) -and $n -ge 1 -and $n -le $options.Length) { return $n }
  }
}

function Ask-Text($question, $default = "") {
  while ($true) {
    $prompt = if ($default) { "$question [$default]" } else { $question }
    $a = (Read-Host $prompt).Trim()
    if (-not $a) { $a = $default }
    if ($a) { return $a }
  }
}

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

$script:UseGlobalWrangler = $false
function Invoke-Wrangler {
  if ($script:UseGlobalWrangler) { & wrangler @args } else { & npx --yes wrangler @args }
}

function Ensure-Wrangler {
  if (Get-Command wrangler -ErrorAction SilentlyContinue) { $script:UseGlobalWrangler = $true; return }
  if (Get-Command npx -ErrorAction SilentlyContinue) {
    Info "wrangler is not installed globally."
    if (Ask-YesNo "Install it now with npm (npm install -g wrangler)?") {
      & npm install -g wrangler
      if ($LASTEXITCODE -ne 0) { Fail "Installing wrangler failed" }
      $script:UseGlobalWrangler = [bool](Get-Command wrangler -ErrorAction SilentlyContinue)
    }
    return
  }
  Fail "wrangler and Node.js were not found. Install Node.js from https://nodejs.org, then run this again."
}

function Ensure-Login {
  Step "Checking your Cloudflare login"
  # Windows PowerShell treats stderr from native tools as errors, so relax that here.
  $ErrorActionPreference = "Continue"
  $who = (Invoke-Wrangler whoami 2>&1 | Out-String)
  $whoCode = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  if ($whoCode -ne 0 -or $who -match "not authenticated") {
    Info "You are not logged in to Cloudflare. A browser window will open."
    Invoke-Wrangler login
    if ($LASTEXITCODE -ne 0) { Fail "Cloudflare login failed" }
  } else {
    Info "Logged in."
  }
}

function Get-ProjectName {
  $path = Join-Path $PSScriptRoot $ConfigFile
  if (Test-Path $path) {
    $cfg = Get-Content $path -Raw | ConvertFrom-Json
    if ($cfg.projectName) {
      Info "Cloudflare Pages project: $($cfg.projectName)"
      return $cfg.projectName
    }
  }
  Write-Host ""
  Info "The Cloudflare Pages project name is the name you see under Workers & Pages."
  Info "If it doesn't exist yet, wrangler will offer to create it."
  $name = Ask-Text "Cloudflare Pages project name" "nazanin-portfolio"
  Write-Text $ConfigFile ((@{ projectName = $name } | ConvertTo-Json) + "`n")
  Info "Saved to $ConfigFile, you won't be asked again."
  return $name
}

function Deploy-Site($version, $projectName) {
  Ensure-Login
  $dist = Join-Path $PSScriptRoot "dist"
  if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
  New-Item -ItemType Directory -Path $dist | Out-Null
  foreach ($f in $SiteFiles) {
    if (-not (Test-Path $f)) { Fail "Missing site file: $f" }
    Copy-Item -Path $f -Destination $dist -Recurse -Force
  }

  $hash = (& git rev-parse HEAD).Trim()
  Step "Deploying v$version to '$projectName'"
  Invoke-Wrangler pages deploy $dist --project-name $projectName --branch $Branch --commit-hash $hash --commit-message "v$version" --commit-dirty=true
  $code = $LASTEXITCODE
  Remove-Item $dist -Recurse -Force
  if ($code -ne 0) { Fail "Deploy failed (see the wrangler message above)" }
}

function Sync-Main {
  Step "Getting the latest version from GitHub"
  $stashed = $false
  if (& git status --porcelain) {
    Invoke-Git stash push --include-untracked -m "release-script"
    $stashed = $true
  }
  Invoke-Git pull --ff-only origin $Branch
  if ($stashed) {
    & git stash pop
    if ($LASTEXITCODE -ne 0) { Fail "Your changes conflict with GitHub's version. Resolve the conflict, then run this again." }
  }
}

# ---------- start ----------
Clear-Host
Write-Host "  nazanin-portfolio release" -ForegroundColor Green
Write-Host "  -------------------------" -ForegroundColor Green

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail "git is not installed. Get it from https://git-scm.com" }

$current = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($current -ne $Branch) {
  Info "You are on branch '$current'. Releases are made from '$Branch'."
  if (-not (Ask-YesNo "Switch to '$Branch' now?")) { Pause-Exit 0 }
  Invoke-Git checkout $Branch
}

$v = Get-SiteVersion
Info "Current version: $($v -join '.')"

$action = Ask-Choice "What do you want to do?" @(
  "Release a new version and deploy it (most common)",
  "Deploy the current version again (no changes)",
  "Release a new version without deploying",
  "Exit"
)
if ($action -eq 4) { Pause-Exit 0 }

$deploy = $action -ne 3
if ($deploy) { Ensure-Wrangler }
$projectName = if ($deploy) { Get-ProjectName } else { "" }

if ($action -eq 2) {
  Sync-Main
  Deploy-Site ((Get-SiteVersion) -join ".") $projectName
  Write-Host ""
  Write-Host "Done. The site is deployed." -ForegroundColor Green
  Pause-Exit 0
}

# ---------- new release ----------
Sync-Main

$changes = & git status --short
if ($changes) {
  Step "Files you changed"
  $changes | ForEach-Object { Info $_ }
} else {
  Write-Host ""
  Info "You have no local changes."
  if (-not (Ask-YesNo "Release a new version anyway?" $false)) { Pause-Exit 0 }
}

$old = Get-SiteVersion
$patch = "$($old[0]).$($old[1]).$($old[2] + 1)"
$minor = "$($old[0]).$($old[1] + 1).0"
$major = "$($old[0] + 1).0.0"
$kind = Ask-Choice "What kind of change is this?" @(
  "Small fix or text change  ($($old -join '.') -> $patch)",
  "New section or feature    ($($old -join '.') -> $minor)",
  "Big redesign              ($($old -join '.') -> $major)"
)
$newV = @($patch, $minor, $major)[$kind - 1]
$tag = "v$newV"
if (& git tag --list $tag) { Fail "Version $tag already exists" }

Write-Host ""
$message = Ask-Text "Describe the change in one line (e.g. Added photo)"

Write-Host ""
Write-Host "Ready to release:" -ForegroundColor White
Info "Version:  $($old -join '.') -> $newV"
Info "Change:   $message"
Info "Deploy:   $(if ($deploy) { "yes, to $projectName" } else { 'no' })"
if (-not (Ask-YesNo "Go ahead?")) { Pause-Exit 0 }

Step "Updating version and changelog"
$data = Read-Text $DataFile
$data = [regex]::Replace($data, 'SITE_VERSION\s*=\s*"\d+\.\d+\.\d+"', "SITE_VERSION = `"$newV`"")
Write-Text $DataFile $data

$date = Get-Date -Format "yyyy-MM-dd"
$entry = "## [$newV] - $date`n`n- $message`n`n"
$log = Read-Text $Changelog
$idx = $log.IndexOf("## [")
if ($idx -ge 0) { $log = $log.Insert($idx, $entry) } else { $log = $log.TrimEnd() + "`n`n" + $entry }
Write-Text $Changelog $log

Step "Saving to GitHub"
Invoke-Git add -A
Invoke-Git commit -m "Release $tag" -m $message
Invoke-Git tag -a $tag -m "$tag - $message"
Invoke-Git push origin $Branch
Invoke-Git push origin $tag

if ($deploy) {
  Deploy-Site $newV $projectName
  Write-Host ""
  Write-Host "Done. $tag is released and deployed." -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "Done. $tag is released (not deployed)." -ForegroundColor Green
}
Pause-Exit 0
