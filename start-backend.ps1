# PowerShell script to start the Flask backend server
# Usage: .\start-backend.ps1

Write-Host "Starting FitSanskriti Backend Server..." -ForegroundColor Green

# Navigate to backend directory
Set-Location -Path "backend"

# Check if virtual environment exists
if (-Not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Check if requirements are installed
if (-Not (Test-Path "venv\Lib\site-packages\flask")) {
    Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Run the backend server
Write-Host "Starting Flask server on port 5001..." -ForegroundColor Green
python run.py
