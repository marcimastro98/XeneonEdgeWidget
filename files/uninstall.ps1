$ErrorActionPreference = 'SilentlyContinue'

$appName = 'Xenon Edge Widget'
$root = Split-Path -Parent $PSScriptRoot
$serverPath = Join-Path (Join-Path $root 'files') 'server.js'
$startup = [Environment]::GetFolderPath([Environment+SpecialFolder]::Startup)
$shortcutPath = Join-Path $startup "$appName.lnk"

if (Test-Path $shortcutPath) {
  Remove-Item $shortcutPath -Force
  Write-Host "Removed startup shortcut: $shortcutPath" -ForegroundColor Green
} else {
  Write-Host 'No startup shortcut found.' -ForegroundColor Yellow
}

$resolvedServerPath = (Resolve-Path $serverPath).Path
$processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -and $_.CommandLine -like "*$resolvedServerPath*" }

foreach ($process in $processes) {
  Stop-Process -Id $process.ProcessId -Force
  Write-Host "Stopped running widget server (PID $($process.ProcessId))." -ForegroundColor Green
}

Write-Host 'Uninstall complete. Your local notes/events files were not deleted.' -ForegroundColor Green
