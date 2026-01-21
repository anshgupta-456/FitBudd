# PowerShell script to start the Next.js frontend server
# Usage: .\start-frontend.ps1

Write-Host "Starting FitSanskriti Frontend Server..." -ForegroundColor Green

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
}

# Create .env.local if it doesn't exist
if (-Not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    "NEXT_PUBLIC_API_BASE=http://localhost:5001" | Out-File -FilePath ".env.local" -Encoding utf8
}

# Run the frontend development server
Write-Host "Starting Next.js development server on port 3000..." -ForegroundColor Green
npm run dev
