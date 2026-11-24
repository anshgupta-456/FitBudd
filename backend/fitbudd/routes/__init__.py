from flask import Flask, jsonify

from . import account, bookings, gyms, messages, nutrition, partners, progress, trainers, workouts


def register_routes(app: Flask) -> None:
    for module in (account, workouts, progress, gyms, bookings, trainers, nutrition, partners, messages):
        app.register_blueprint(module.bp, url_prefix="/api")

    @app.get("/")
    @app.get("/api/health")
    def health():
        return jsonify({"service": "fitbudd-api", "status": "ok"})
