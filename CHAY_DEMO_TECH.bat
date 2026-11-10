@echo off
cd /d "%~dp0"
echo TECH - Start Backend and Frontend
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-demo.ps1"
echo.
pause
