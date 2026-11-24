# Start the API and the web app for local development (Windows PowerShell).
#   .\start-all.ps1
# First run creates backend\.venv and installs dependencies for both halves.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

if (-not (Test-Path "$root\backend\.venv")) {
    Write-Host "Creating backend virtualenv..."
    python -m venv "$root\backend\.venv"
    & "$root\backend\.venv\Scripts\python.exe" -m pip install -r "$root\backend\requirements-dev.txt"
}
if (-not (Test-Path "$root\node_modules")) {
    Write-Host "Installing web dependencies..."
    Push-Location $root; npm install; Pop-Location
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; .\.venv\Scripts\python.exe run.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; npm run dev"

Write-Host "API: http://localhost:5001   Web: http://localhost:3000"
