@echo off
REM Reset database to clean state

echo WARNING: This will delete all data in the database!
echo.
pause /M "Press any key to continue, or Ctrl+C to cancel..."
echo.

cd /d "%~dp0"

REM Stop servers
echo Stopping servers...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Personal Finance*" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

REM Delete database files
echo Deleting database files...
if exist "Data\portfolio.db" del /F /Q "Data\portfolio.db"
if exist "Data\portfolio.db-shm" del /F /Q "Data\portfolio.db-shm"
if exist "Data\portfolio.db-wal" del /F /Q "Data\portfolio.db-wal"

echo.
echo ✓ Database reset
echo.
echo The database will be recreated on next startup.
echo.
