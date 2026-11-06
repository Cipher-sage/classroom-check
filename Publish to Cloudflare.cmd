@echo off
setlocal
cd /d "%~dp0"
echo Publishing CAT 500 Level Test to your Cloudflare account...
echo Saved tests and results stay in the existing database.
call npm run deploy
if errorlevel 1 (
  echo.
  echo Publishing did not finish. Read the error above, fix it, and try again.
  pause
  exit /b 1
)
echo.
echo Published. Refresh https://classroom-check.nextkind.workers.dev
echo Save your source changes to GitHub too; see PC-PUBLISHING.md.
pause
