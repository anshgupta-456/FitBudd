#!/bin/bash
# Shell script to start the Flask backend server
# Usage: ./start-backend.sh

echo "Starting FitSanskriti Backend Server..."

# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
if ! python -c "import flask" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Run the backend server
echo "Starting Flask server on port 5001..."
python run.py
