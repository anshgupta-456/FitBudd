# PowerShell deployment script for both Netlify and GitHub Pages
# Usage: .\deploy.ps1 [netlify|github|both|test]

param(
    [Parameter(Position=0)]
    [ValidateSet("netlify", "github", "both", "test")]
    [string]$Target = "both"
)

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

function Deploy-GitHub {
    Write-Host "📄 Deploying to GitHub Pages..." -ForegroundColor Blue
    $env:GITHUB_PAGES = "true"
    npm run build:github
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GitHub Pages build complete!" -ForegroundColor Green
        Write-Host "🌐 Your app will be available at: https://nishant-gupta1.github.io/Fitness_Health_Monitoring_AI/" -ForegroundColor Cyan
    } else {
        Write-Host "❌ GitHub Pages build failed!" -ForegroundColor Red
        exit 1
    }
}

function Deploy-Netlify {
    Write-Host "🌐 Deploying to Netlify..." -ForegroundColor Blue
    npm run build:netlify
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Netlify build complete!" -ForegroundColor Green
        
        # Check if Netlify CLI is installed
        $netlifyCli = Get-Command netlify -ErrorAction SilentlyContinue
        if (-not $netlifyCli) {
            Write-Host "Installing Netlify CLI..." -ForegroundColor Yellow
            npm install -g netlify-cli
        }
        
        Write-Host "🚀 Run 'netlify deploy --prod' to publish to production" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Netlify build failed!" -ForegroundColor Red
        exit 1
    }
}

function Test-Builds {
    Write-Host "🧪 Testing builds locally..." -ForegroundColor Yellow
    
    Write-Host "Testing GitHub Pages build..." -ForegroundColor Blue
    $env:GITHUB_PAGES = "true"
    npm run build:github
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GitHub Pages build successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ GitHub Pages build failed!" -ForegroundColor Red
        return
    }
    
    Write-Host "Testing Netlify build..." -ForegroundColor Blue
    npm run build:netlify
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Netlify build successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Netlify build failed!" -ForegroundColor Red
        return
    }
}

# Main deployment logic
switch ($Target) {
    "github" {
        Deploy-GitHub
    }
    "netlify" {
        Deploy-Netlify
    }
    "both" {
        Write-Host "🎯 Deploying to both platforms..." -ForegroundColor Magenta
        Deploy-Netlify
        Deploy-GitHub
    }
    "test" {
        Test-Builds
    }
    default {
        Write-Host @"
Usage: .\deploy.ps1 [github|netlify|both|test]

Commands:
  github  - Deploy to GitHub Pages
  netlify - Deploy to Netlify
  both    - Deploy to both platforms (default)
  test    - Test builds locally
"@ -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
