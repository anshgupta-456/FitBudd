#!/bin/bash
# Shell script to start the Next.js frontend server
# Usage: ./start-frontend.sh

echo "Starting FitSanskriti Frontend Server..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    echo "NEXT_PUBLIC_API_BASE=http://localhost:5001" > .env.local
fi

# Run the frontend development server
echo "Starting Next.js development server on port 3000..."
npm run dev
