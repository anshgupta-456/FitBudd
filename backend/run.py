"""Local development server.

    python run.py

Uses the development config (a throwaway secret key and a SQLite file in
backend/instance/), so no environment variables are needed.
"""

import os

from fitbudd import create_app

app = create_app(os.environ.get("FITBUDD_ENV", "development"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="127.0.0.1", port=port, debug=os.environ.get("FLASK_DEBUG", "1") == "1")
