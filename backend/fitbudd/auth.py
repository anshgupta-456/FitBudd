from datetime import timedelta
from functools import wraps

import jwt
from flask import current_app, g, request
from werkzeug.security import check_password_hash, generate_password_hash

from .errors import ApiError
from .extensions import db
from .models import User, utcnow

ALGORITHM = "HS256"
# Sample members can be found and messaged but never signed in to.
UNUSABLE_PASSWORD = "!"


def hash_password(password: str) -> str:
    return generate_password_hash(password, method=current_app.config.get("PASSWORD_HASH_METHOD", "scrypt"))


def verify_password(user: User, password: str) -> bool:
    if not user.password_hash or user.password_hash == UNUSABLE_PASSWORD:
        return False
    return check_password_hash(user.password_hash, password)


def issue_token(user: User) -> str:
    now = utcnow()
    payload = {
        "sub": str(user.id),
        "iat": now,
        "exp": now + current_app.config["TOKEN_TTL"],
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm=ALGORITHM)


def _user_from_request() -> User:
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise ApiError("Sign in to continue", 401)
    try:
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except jwt.ExpiredSignatureError:
        raise ApiError("Your session has expired. Sign in again.", 401, code="token_expired")
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise ApiError("Sign in to continue", 401)

    user = db.session.get(User, user_id)
    if user is None:
        raise ApiError("Account no longer exists", 401)
    return user


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        user = _user_from_request()
        # Cheap presence tracking for partner suggestions; write at most every few minutes.
        if not user.last_active_at or utcnow() - user.last_active_at > timedelta(minutes=5):
            user.last_active_at = utcnow()
            db.session.commit()
        g.user = user
        return view(*args, **kwargs)

    return wrapper


def current_user() -> User:
    return g.user
