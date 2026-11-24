"""The member's own training calendar: planned sessions and the log of finished ones."""

from datetime import date, timedelta

from flask import Blueprint, jsonify, request

from .. import validation as v
from ..auth import current_user, login_required
from ..clock import local_today
from ..errors import ApiError, NotFound
from ..extensions import db
from ..models import WORKOUT_KINDS, WORKOUT_STATUSES, Workout, utcnow
from .partners import is_partner

bp = Blueprint("workouts", __name__)


def _own_workout(workout_id: int) -> Workout:
    workout = db.session.get(Workout, workout_id)
    # Someone else's workout is reported as missing, not forbidden, so ids can't be probed.
    if workout is None or workout.user_id != current_user().id:
        raise NotFound("Workout")
    return workout


def _apply(workout: Workout, data: dict, *, creating: bool) -> None:
    if creating or "title" in data:
        workout.title = v.string(data, "title", required=True, max_len=120)
    if creating or "kind" in data:
        workout.kind = v.choice(data, "kind", WORKOUT_KINDS, required=True)
    if creating or "date" in data:
        workout.date = v.date_field(data, "date", required=True)
    if "start_time" in data:
        workout.start_time = v.time_field(data, "start_time")
    if creating or "duration_min" in data:
        workout.duration_min = v.number(data, "duration_min", required=True, minimum=5, maximum=600, integer=True)
    if "location" in data:
        workout.location = v.string(data, "location", max_len=120)
    if "notes" in data:
        workout.notes = v.string(data, "notes", max_len=1000)
    if "effort" in data:
        workout.effort = v.number(data, "effort", minimum=1, maximum=10, integer=True)
    if "partner_id" in data:
        partner_id = data.get("partner_id")
        if partner_id in (None, ""):
            workout.partner_id = None
        else:
            partner_id = v.number(data, "partner_id", integer=True)
            if not is_partner(current_user().id, partner_id):
                raise v.invalid("partner_id", "You can only add people you're connected with")
            workout.partner_id = partner_id
    if "status" in data:
        status = v.choice(data, "status", WORKOUT_STATUSES, required=True)
        # One day of slack covers members in timezones ahead of the server's.
        if status == "done" and workout.date > local_today() + timedelta(days=1):
            raise v.invalid("status", "You can log this once the day comes round")
        if status == "done" and workout.status != "done":
            workout.completed_at = utcnow()
        elif status != "done":
            workout.completed_at = None
        workout.status = status


@bp.get("/workouts")
@login_required
def list_workouts():
    query = db.select(Workout).where(Workout.user_id == current_user().id)
    start = v.query_date("from")
    end = v.query_date("to")
    if start:
        query = query.where(Workout.date >= start)
    if end:
        query = query.where(Workout.date <= end)
    status = request.args.get("status")
    if status:
        if status not in WORKOUT_STATUSES:
            raise ApiError("Unknown status filter", 400)
        query = query.where(Workout.status == status)
    query = query.order_by(Workout.date, Workout.start_time.is_(None), Workout.start_time)
    workouts = db.session.scalars(query.limit(v.query_int("limit", 200, minimum=1, maximum=500))).all()
    return jsonify({"workouts": [w.to_dict() for w in workouts]})


@bp.post("/workouts")
@login_required
def create_workout():
    workout = Workout(user_id=current_user().id, status="planned")
    _apply(workout, v.json_body(), creating=True)
    db.session.add(workout)
    db.session.commit()
    return jsonify({"workout": workout.to_dict()}), 201


@bp.patch("/workouts/<int:workout_id>")
@login_required
def update_workout(workout_id: int):
    workout = _own_workout(workout_id)
    _apply(workout, v.json_body(), creating=False)
    db.session.commit()
    return jsonify({"workout": workout.to_dict()})


@bp.delete("/workouts/<int:workout_id>")
@login_required
def delete_workout(workout_id: int):
    db.session.delete(_own_workout(workout_id))
    db.session.commit()
    return "", 204


def _streak(done_days: set[date], today: date) -> int:
    """Consecutive days with a finished workout, ending today (or yesterday if today is still open)."""
    day = today if today in done_days else today - timedelta(days=1)
    streak = 0
    while day in done_days:
        streak += 1
        day -= timedelta(days=1)
    return streak


@bp.get("/workouts/summary")
@login_required
def summary():
    """Numbers for the dashboard. `today` comes from the client so the week matches their timezone."""
    today = v.query_date("today") or date.today()
    week_start = today - timedelta(days=today.weekday())
    weeks = 8
    history_start = week_start - timedelta(weeks=weeks - 1)

    rows = db.session.execute(
        db.select(Workout.date, Workout.status, Workout.duration_min).where(
            Workout.user_id == current_user().id,
            Workout.date >= min(history_start, today - timedelta(days=366)),
        )
    ).all()

    done = [r for r in rows if r.status == "done"]
    this_week = [r for r in rows if week_start <= r.date < week_start + timedelta(days=7)]

    weekly = []
    for i in range(weeks):
        start = history_start + timedelta(weeks=i)
        minutes = sum(r.duration_min for r in done if start <= r.date < start + timedelta(days=7))
        sessions = sum(1 for r in done if start <= r.date < start + timedelta(days=7))
        weekly.append({"week_start": start.isoformat(), "minutes": minutes, "sessions": sessions})

    return jsonify(
        {
            "week_start": week_start.isoformat(),
            "this_week": {
                "planned": sum(1 for r in this_week if r.status != "skipped"),
                "done": sum(1 for r in this_week if r.status == "done"),
                "minutes": sum(r.duration_min for r in this_week if r.status == "done"),
            },
            "streak_days": _streak({r.date for r in done if r.date <= today}, today),
            "total_done": db.session.scalar(
                db.select(db.func.count(Workout.id)).where(
                    Workout.user_id == current_user().id, Workout.status == "done"
                )
            ),
            "weekly": weekly,
        }
    )
