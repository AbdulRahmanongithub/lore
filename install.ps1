# lore installer - Windows PowerShell
#
#   irm https://raw.githubusercontent.com/AbdulRahmanongithub/lore/main/install.ps1 | iex
#
# For a project install, download and run it with the flag instead of piping:
#   irm https://raw.githubusercontent.com/AbdulRahmanongithub/lore/main/install.ps1 -OutFile lore.ps1
#   .\lore.ps1 -Project
#
# Writes one directory and nothing else. No profile edits, no services.
# Read the script before piping it to iex - you should do that with any
# install script, including this one.

[CmdletBinding()]
param(
    [switch]$Project,
    [string]$Repo = $(if ($env:LORE_REPO) { $env:LORE_REPO } else { 'AbdulRahmanongithub/lore' }),
    [string]$Ref  = $(if ($env:LORE_REF)  { $env:LORE_REF  } else { 'main' })
)

$ErrorActionPreference = 'Stop'

$target = if ($Project) {
    Join-Path (Get-Location) '.claude\skills\lore'
} else {
    Join-Path $HOME '.claude\skills\lore'
}

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("lore-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

try {
    Write-Host "  fetching lore from $Repo@$Ref"
    $zip = Join-Path $tmp 'lore.zip'

    try {
        Invoke-WebRequest -Uri "https://codeload.github.com/$Repo/zip/$Ref" -OutFile $zip -UseBasicParsing
    } catch {
        throw "download failed - check the repo name and that '$Ref' exists. $($_.Exception.Message)"
    }

    Expand-Archive -Path $zip -DestinationPath $tmp -Force

    $extracted = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1
    if (-not $extracted) { throw "archive did not contain a directory" }

    $src = Join-Path $extracted.FullName 'plugins\lore\skills\lore'
    if (-not (Test-Path (Join-Path $src 'SKILL.md'))) {
        throw "archive has no SKILL.md at $src"
    }

    if (Test-Path $target) {
        Write-Host "  replacing existing install at $target"
        Remove-Item -Path $target -Recurse -Force
    }

    $parent = Split-Path $target -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Copy-Item -Path $src -Destination $target -Recurse -Force

    Write-Host ""
    Write-Host "  lore installed" -ForegroundColor Green
    Write-Host "    $target"
    Write-Host ""
    Write-Host "  Start a new Claude Code session and just talk to it -"
    Write-Host "  no command needed. /lore also works."
    if ($Project) {
        Write-Host ""
        Write-Host "  Commit .claude\skills\lore so everyone who clones this repo gets it."
    }
    Write-Host ""
}
finally {
    if (Test-Path $tmp) { Remove-Item -Path $tmp -Recurse -Force -ErrorAction SilentlyContinue }
}
