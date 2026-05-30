@echo off
REM Personal Finance Assistant - Launcher Script
REM This script starts both backend and frontend servers

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ========================================
echo Personal Finance Assistant
echo ========================================
echo.

REM Stop existing processes
echo [1/3] Stopping existing servers...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Personal Finance*" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM Check and install dependencies if needed
echo [2/3] Checking dependencies...
if not exist "venv\" (
    echo Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Start backend
echo [3/3] Starting servers...
echo.
echo Starting backend server...
start "Personal Finance Backend" cmd /k "call venv\Scripts\activate.bat && python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo Starting frontend server...
start "Personal Finance Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo ✓ Servers started successfully!
echo ========================================
echo.
echo Frontend:  http://localhost:5173
echo Backend:   http://127.0.0.1:8000
echo API Docs:  http://127.0.0.1:8000/docs
echo.
echo Two terminal windows should have opened:
echo - "Personal Finance Backend" (Python/Uvicorn)
echo - "Personal Finance Frontend" (Node.js/Vite)
echo.
echo You can now open http://localhost:5173 in your browser.
echo.
pause
