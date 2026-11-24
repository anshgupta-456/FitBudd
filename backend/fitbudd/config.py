import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _database_url() -> str:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        return f"sqlite:///{BASE_DIR / 'instance' / 'fitbudd.db'}"
    # Render and Heroku still hand out the old postgres:// scheme.
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def _origins() -> list[str]:
    raw = os.environ.get("FRONTEND_URL", "")
    origins = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
    return origins + ["http://localhost:3000", "http://127.0.0.1:3000"]


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "")
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    JSON_SORT_KEYS = False
    TOKEN_TTL = timedelta(days=14)
    # Class and court times are local to the studios, which are all in India.
    APP_TIMEZONE = os.environ.get("APP_TIMEZONE", "Asia/Kolkata")
    # How far ahead the recurring class and court timetable is kept filled.
    TIMETABLE_DAYS = 14
    CORS_ORIGINS = _origins()
    # Fill an empty database with the sample gyms, classes and trainers on startup.
    SEED_ON_START = os.environ.get("SEED_ON_START", "true").lower() in ("1", "true", "yes")
    TESTING = False


class DevelopmentConfig(Config):
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-only-secret-do-not-use-in-production"


class TestingConfig(Config):
    TESTING = True
    SECRET_KEY = "test-secret-key-that-is-long-enough-for-hs256"
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SEED_ON_START = False
    # scrypt is deliberately slow; tests hash dozens of passwords.
    PASSWORD_HASH_METHOD = "pbkdf2:sha256:1000"


def get_config(name: str | None):
    name = (name or os.environ.get("FITBUDD_ENV") or "production").lower()
    return {
        "development": DevelopmentConfig,
        "dev": DevelopmentConfig,
        "testing": TestingConfig,
        "test": TestingConfig,
    }.get(name, Config)
