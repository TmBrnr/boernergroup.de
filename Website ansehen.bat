@echo off
REM Double click this file to view the site.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js ist nicht installiert.
  echo Alternative ohne Node, falls Python vorhanden ist:
  echo   cd out ^&^& python -m http.server 4321
  echo   danach http://localhost:4321 im Browser oeffnen
  pause
  exit /b 1
)
node scripts/serve.mjs
pause
