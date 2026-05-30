# Personal Finance Assistant - PowerShell Launcher

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Personal Finance Assistant" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Stop existing processes
Write-Host "Stopping existing servers..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "uvicorn" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Check and setup Python
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & .\venv\Scripts\activate.ps1
    pip install -r requirements.txt
} else {
    & .\venv\Scripts\activate.ps1
}

# Check and setup Frontend
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..
}

# Start Backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendScript = @"
cd '$PWD'
& .\venv\Scripts\activate.ps1
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
"@

Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    $backendScript
) -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$frontendScript = @"
cd '$PWD\frontend'
npm run dev
"@

Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    $frontendScript
) -WindowStyle Normal

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✓ Servers started!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "`nThe servers are running in the background.`n" -ForegroundColor Yellow
