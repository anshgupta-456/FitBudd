#!/bin/bash
# Shell script to start both backend and frontend
# Usage: ./start-all.sh

echo "Starting FitSanskriti Application..."
echo "====================================="

# Make scripts executable
chmod +x start-backend.sh start-frontend.sh

# Start backend in background
echo ""
echo "Starting Backend Server..."
./start-backend.sh &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "Starting Frontend Server..."
./start-frontend.sh &
FRONTEND_PID=$!

echo ""
echo "Both servers are starting..."
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
