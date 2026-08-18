#!/usr/bin/env python3
"""
FitSanskriti Backend Server
Run this script to start the Flask backend server
"""

import os
import sys
from app import app, init_db

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5001))
    
    print(f"Starting FitSanskriti Backend Server on port {port}")
    print("API Documentation available at: http://localhost:5001/")
    print("Press Ctrl+C to stop the server")
    
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() in ('1', 'true', 'yes')
    app.run(
        debug=debug,
        host='0.0.0.0',
        port=port,
        threaded=True
    )

