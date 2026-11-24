"""Production entry point: gunicorn wsgi:app"""

from fitbudd import create_app

app = create_app()
