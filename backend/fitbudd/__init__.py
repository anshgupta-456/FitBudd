import logging
from pathlib import Path

from flask import Flask
from flask_cors import CORS

from .config import get_config
from .errors import register_error_handlers
from .extensions import db


def create_app(config_name: str | None = None, **overrides) -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))
    app.config.update(overrides)

    if not app.config.get("SECRET_KEY"):
        raise RuntimeError(
            "SECRET_KEY is not set. Export SECRET_KEY, or run with FITBUDD_ENV=development for local work."
        )

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    uri = app.config["SQLALCHEMY_DATABASE_URI"]
    if uri.startswith("sqlite:///"):
        Path(uri.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        allow_headers=["Authorization", "Content-Type"],
        methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        max_age=600,
    )
    register_error_handlers(app)

    from .routes import register_routes

    register_routes(app)

    from . import seed

    seed.register_cli(app)

    with app.app_context():
        db.create_all()
        if app.config["SEED_ON_START"]:
            seed.seed_if_empty()

    return app
