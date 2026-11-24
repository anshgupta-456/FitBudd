"""Sign up, sign in, and the signed-in member's own profile."""

from flask import Blueprint, jsonify

from .. import validation as v
from ..auth import current_user, hash_password, issue_token, login_required, verify_password
from ..errors import ApiError
from ..extensions import db
from ..models import DIETS, GENDERS, GOALS, LEVELS, TIMES_OF_DAY, User, utcnow

bp = Blueprint("account", __name__)

MIN_PASSWORD = 8


def _session(user: User, status: int = 200):
    return jsonify({"token": issue_token(user), "user": user.private_dict()}), status


def _apply_profile(user: User, data: dict) -> None:
    """Copy optional profile fields from a request body onto the user."""
    if "name" in data:
        user.name = v.string(data, "name", required=True, max_len=80)
    if "age" in data:
        user.age = v.number(data, "age", minimum=13, maximum=100, integer=True)
    if "gender" in data:
        user.gender = v.choice(data, "gender", GENDERS)
    if "height_cm" in data:
        user.height_cm = v.number(data, "height_cm", minimum=100, maximum=250)
    if "weight_kg" in data:
        user.weight_kg = v.number(data, "weight_kg", minimum=25, maximum=300)
    if "fitness_level" in data:
        user.fitness_level = v.choice(data, "fitness_level", LEVELS, required=True)
    if "city" in data:
        user.city = v.string(data, "city", max_len=80)
    if "bio" in data:
        user.bio = v.string(data, "bio", max_len=500)
    if "goals" in data:
        user.goals = v.choices(data, "goals", GOALS, default=[])
    if "preferred_time" in data:
        user.preferred_time = v.choice(data, "preferred_time", TIMES_OF_DAY)
    if "diet" in data:
        user.diet = v.choice(data, "diet", DIETS)


@bp.post("/auth/register")
def register():
    data = v.json_body()
    name = v.string(data, "name", required=True, max_len=80)
    email = v.email(data)
    password = v.string(data, "password", required=True, min_len=MIN_PASSWORD, max_len=128)

    if db.session.scalar(db.select(User.id).where(User.email == email)):
        raise ApiError("An account with this email already exists", 409, fields={"email": "Already registered"})

    user = User(name=name, email=email, password_hash=hash_password(password), goals=[])
    _apply_profile(user, {k: data[k] for k in data if k not in ("name", "email", "password")})
    db.session.add(user)
    db.session.commit()
    return _session(user, 201)


@bp.post("/auth/login")
def login():
    data = v.json_body()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    if not email or not password:
        raise ApiError("Enter your email and password", 422)

    user = db.session.scalar(db.select(User).where(User.email == email))
    if user is None or not verify_password(user, password):
        raise ApiError("Email or password is incorrect", 401, code="bad_credentials")

    user.last_active_at = utcnow()
    db.session.commit()
    return _session(user)


@bp.get("/auth/me")
@login_required
def me():
    return jsonify({"user": current_user().private_dict()})


@bp.patch("/profile")
@login_required
def update_profile():
    user = current_user()
    _apply_profile(user, v.json_body())
    db.session.commit()
    return jsonify({"user": user.private_dict()})


@bp.post("/profile/password")
@login_required
def change_password():
    user = current_user()
    data = v.json_body()
    if not verify_password(user, data.get("current_password") or ""):
        raise ApiError("Current password is incorrect", 422, fields={"current_password": "Incorrect password"})
    user.password_hash = hash_password(
        v.string(data, "new_password", required=True, min_len=MIN_PASSWORD, max_len=128)
    )
    db.session.commit()
    return jsonify({"ok": True})


@bp.delete("/profile")
@login_required
def delete_account():
    user = current_user()
    data = v.json_body()
    if not verify_password(user, data.get("password") or ""):
        raise ApiError("Password is incorrect", 422, fields={"password": "Incorrect password"})
    db.session.delete(user)
    db.session.commit()
    return "", 204
