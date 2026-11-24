from flask import Blueprint, jsonify, request

from .. import validation as v
from ..auth import current_user, login_required
from ..errors import ApiError
from ..extensions import db
from ..models import DIETS, GENDERS, DietPlan
from ..nutrition import ACTIVITY, CYCLE_PHASES, GOAL_ADJUST, Body, build_targets

bp = Blueprint("nutrition", __name__)


@bp.get("/diet-plans")
@login_required
def list_plans():
    query = db.select(DietPlan)
    if goal := request.args.get("goal"):
        if goal not in GOAL_ADJUST:
            raise ApiError("Unknown goal", 400)
        query = query.where(DietPlan.goal == goal)
    if diet := request.args.get("diet"):
        if diet not in DIETS:
            raise ApiError("Unknown diet", 400)
        query = query.where(DietPlan.diet == diet)
    if request.args.get("for_women") == "1":
        query = query.where(DietPlan.for_women.is_(True))
    plans = db.session.scalars(query.order_by(DietPlan.goal, DietPlan.daily_calories)).all()
    return jsonify({"plans": [p.to_dict() for p in plans]})


@bp.post("/nutrition/targets")
@login_required
def targets():
    """Calculate targets. Anything not sent falls back to the member's profile."""
    user = current_user()
    data = v.json_body()
    defaults = {
        "age": user.age,
        "gender": user.gender,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "diet": user.diet or "vegetarian",
    }
    merged = {**defaults, **{k: val for k, val in data.items() if val not in (None, "")}}

    body = Body(
        age=v.number(merged, "age", required=True, minimum=16, maximum=90, integer=True),
        gender=v.choice(merged, "gender", GENDERS, default="other"),
        height_cm=v.number(merged, "height_cm", required=True, minimum=120, maximum=230),
        weight_kg=v.number(merged, "weight_kg", required=True, minimum=30, maximum=250),
    )
    result = build_targets(
        body,
        activity=v.choice(merged, "activity", ACTIVITY.keys(), default="moderate"),
        goal=v.choice(merged, "goal", GOAL_ADJUST.keys(), default="maintain"),
        diet=v.choice(merged, "diet", DIETS, required=True),
        cycle_phase=v.choice(merged, "cycle_phase", CYCLE_PHASES),
    )
    return jsonify({"targets": result})
