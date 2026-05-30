@echo off
REM Stop all running servers

echo Stopping Personal Finance Assistant servers...

taskkill /F /IM python.exe /FI "WINDOWTITLE eq Personal Finance*" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

echo ✓ Servers stopped
