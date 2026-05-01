@echo off
setlocal
title Xenon Edge Widget - One Click Install
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\install.ps1"
if errorlevel 1 (
  echo.
  echo Installation did not finish. Read the message above, then press any key to close.
  pause >nul
  exit /b 1
)

echo.
echo Done. You can close this window.
timeout /t 5 >nul
