@echo off
REM Personal Finance Assistant - Debug Launcher
REM This keeps terminal windows visible so you can see logs and errors

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ========================================
echo Personal Finance Assistant - DEBUG MODE
echo ========================================
echo.

REM Stop existing processes
echo Stopping existing servers...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Personal Finance*" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM Setup Python
if not exist "venv\" (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

REM Setup Frontend
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ========================================
echo Servers starting... (Windows will stay open to show logs)
echo ========================================
echo.

REM Start backend in visible window
echo Starting backend...
start "Personal Finance Backend - DEBUG" python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

timeout /t 2 /nobreak >nul

REM Start frontend in visible window
echo Starting frontend...
start "Personal Finance Frontend - DEBUG" cmd /k "cd /d %CD%\frontend && npm run dev"

echo.
echo ✓ Both servers started in separate windows
echo.
echo Watch the terminal windows for logs and errors.
echo Close a window to stop that server.
echo.
