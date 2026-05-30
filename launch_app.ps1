# Personal Finance Assistant Launcher
# This script starts both backend and frontend servers

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Personal Finance Assistant" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# Check venv
if (-not (Test-Path "venv")) {
    Write-Host "[1/3] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "[2/3] Activating environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Check frontend dependencies
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "[2/3] Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host "[3/3] Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Start backend in new window
Write-Host "Starting Backend (http://127.0.0.1:8000)..." -ForegroundColor Green
$backendScript = {
    cd "$projectRoot"
    & ".\venv\Scripts\Activate.ps1"
    python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
}
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; & '.\venv\Scripts\Activate.ps1'; python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start frontend in new window
Write-Host "Starting Frontend (http://localhost:5173)..." -ForegroundColor Green
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Servers started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:   http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "API Docs:  http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two new terminal windows have opened." -ForegroundColor Yellow
Write-Host "Open your browser to: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
