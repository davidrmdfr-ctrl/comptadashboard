@echo off
REM Personal Finance Assistant - Start Script
REM Just double-click this file to launch everything

cd /d "%~dp0"

cls
echo.
echo ======================================
echo  Compta Dashboard - Personal Finance
echo ======================================
echo.

REM Kill existing processes
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

REM Activate venv
call venv\Scripts\activate.bat

echo Starting Backend on http://127.0.0.1:8000...
REM Start backend in background
start "Backend Server" python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

timeout /t 3 /nobreak >nul

echo Starting Frontend on http://localhost:5173...
REM Start frontend in background
cd frontend
start "Frontend Dev Server" npm run dev
cd ..

timeout /t 4 /nobreak >nul

REM Open browser
echo.
echo Opening dashboard...
start http://localhost:5173

echo.
echo ======================================
echo. STARTED!
echo ======================================
echo.
echo Frontend running on: http://localhost:5173
echo Backend running on:  http://127.0.0.1:8000
echo.
echo Both servers are running in the background.
echo You can close this window anytime.
echo.
pause
