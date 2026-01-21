#!/bin/bash

# Deployment script for both Netlify and GitHub Pages
# Usage: ./deploy.sh [netlify|github|both]

set -e

echo "🚀 Starting deployment process..."

# Function to deploy to GitHub Pages
deploy_github() {
    echo "📄 Deploying to GitHub Pages..."
    export GITHUB_PAGES=true
    npm run build:github
    echo "✅ GitHub Pages build complete!"
    echo "🌐 Your app will be available at: https://nishant-gupta1.github.io/Fitness_Health_Monitoring_AI/"
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "🌐 Deploying to Netlify..."
    npm run build:netlify
    
    # Check if Netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        echo "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    echo "✅ Netlify build complete!"
    echo "🚀 Run 'netlify deploy --prod' to publish to production"
}

# Function to test builds locally
test_builds() {
    echo "🧪 Testing builds locally..."
    
    echo "Testing GitHub Pages build..."
    npm run build:github
    echo "✅ GitHub Pages build successful!"
    
    echo "Testing Netlify build..."
    npm run build:netlify
    echo "✅ Netlify build successful!"
}

# Main deployment logic
case $1 in
    "github")
        deploy_github
        ;;
    "netlify")
        deploy_netlify
        ;;
    "both")
        echo "🎯 Deploying to both platforms..."
        deploy_netlify
        deploy_github
        ;;
    "test")
        test_builds
        ;;
    *)
        echo "Usage: $0 [github|netlify|both|test]"
        echo ""
        echo "Commands:"
        echo "  github  - Deploy to GitHub Pages"
        echo "  netlify - Deploy to Netlify"
        echo "  both    - Deploy to both platforms"
        echo "  test    - Test builds locally"
        exit 1
        ;;
esac

echo "🎉 Deployment process completed!"
