@echo off
setlocal
title Xenon Edge Widget - Uninstall Startup Entry
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\uninstall.ps1"
echo.
pause
