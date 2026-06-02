@echo off
REM Personal Finance Dashboard Launcher
cd /d "%~dp0"

taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo.
echo ======================================
echo  Personal Finance Dashboard
echo ======================================
echo.

REM Start Backend
echo Starting Backend on 127.0.0.1:8000...
start "" "%~dp0venv\Scripts\python.exe" -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

echo Waiting for backend to fully start (waiting up to 30 seconds)...
set /a counter=0
:wait_backend
timeout /t 1 /nobreak >nul
set /a counter+=1
if %counter% lss 30 (
  echo Backend startup progress: %counter%/30 seconds...
  goto wait_backend
)

REM Start Frontend
echo Starting Frontend on localhost:5173...
start "" cmd /c "cd /d "%~dp0frontend" & npm run dev"

timeout /t 5 /nobreak

REM Open Browser
start http://localhost:5173

echo.
echo ======================================
echo  Dashboard Launched!
echo ======================================
echo.
echo Frontend:  http://localhost:5173
echo Backend:   http://127.0.0.1:8000
echo.
