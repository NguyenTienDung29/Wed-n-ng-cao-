@echo off
cd /d "%~dp0"
echo TECH - Setup MongoDB / Backend / Frontend / Seed
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-demo.ps1"
echo.
pause
