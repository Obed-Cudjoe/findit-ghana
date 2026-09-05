@echo off
REM ============================================================
REM  FindIt Ghana — Daily Price Refresh (double-click me!)
REM  Fetches fresh prices from Jumia + partner shops, then
REM  commits and pushes so Vercel redeploys the site.
REM ============================================================
cd /d "%~dp0"

echo.
echo [1/3] Refreshing prices from Jumia Ghana + partner shops...
call npm run refresh
if errorlevel 1 (
  echo.
  echo ^^! Refresh FAILED. Copy this window's text and send it to Obed's assistant.
  echo   Common causes: no internet, or Jumia blocked this network (use your
  echo   home/personal internet, not an office or VPN connection).
  pause
  exit /b 1
)

echo.
echo [2/3] Saving the new data...
git add data/
git commit -m "Daily catalogue refresh %DATE% %TIME%" >nul 2>&1
if errorlevel 1 (
  echo   (nothing changed since the last refresh - that's fine, skipping commit)
)

echo.
echo [3/3] Pushing to GitHub so the live site updates...
git push
if errorlevel 1 (
  echo.
  echo ^^! Push FAILED. Copy this window's text and send it to Obed's assistant.
  echo   Common causes: token expired, or git not logged in. Run once:
  echo   git config --global user.email "cudjoe.obed.gh@gmail.com"
  echo   git config --global user.name "Obed Cudjoe"
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  DONE. Prices are fresh. Vercel will redeploy in ~4 minutes.
echo ============================================================
pause
