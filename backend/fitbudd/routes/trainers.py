"""Personal trainers who come to the member's home, and the sessions booked with them."""

from datetime import datetime, time, timedelta

from flask import Blueprint, jsonify, request

from .. import validation as v
from ..auth import current_user, login_required
from ..clock import local_now
from ..errors import ApiError, NotFound
from ..extensions import db
from ..models import SESSION_FOCUS, Trainer, TrainerSession

bp = Blueprint("trainers", __name__)

FIRST_SLOT = time(6, 0)
LAST_END = time(21, 0)
DURATIONS = (45, 60, 90)


@bp.get("/trainers")
@login_required
def list_trainers():
    query = db.select(Trainer).where(Trainer.accepting_clients.is_(True))
    if city := request.args.get("city", "").strip():
        query = query.where(Trainer.city.ilike(city))
    if request.args.get("women_focus") == "1":
        query = query.where(Trainer.women_clients_focus.is_(True))
    if gender := request.args.get("gender"):
        query = query.where(Trainer.gender == gender)
    if max_rate := request.args.get("max_rate", type=int):
        query = query.where(Trainer.hourly_rate <= max_rate)

    sort = request.args.get("sort", "rating")
    order = {
        "rating": (Trainer.rating.desc(), Trainer.review_count.desc()),
        "price": (Trainer.hourly_rate.asc(),),
        "experience": (Trainer.experience_years.desc(),),
    }.get(sort)
    if order is None:
        raise ApiError("sort must be one of: rating, price, experience", 400)

    trainers = db.session.scalars(query.order_by(*order)).all()

    # JSON list columns are filtered here rather than in SQL so this works the same on SQLite and Postgres.
    if specialty := request.args.get("specialty"):
        trainers = [t for t in trainers if specialty in (t.specialties or [])]
    if language := request.args.get("language"):
        trainers = [t for t in trainers if language in (t.languages or [])]

    cities = db.session.scalars(db.select(Trainer.city).distinct().order_by(Trainer.city)).all()
    return jsonify({"trainers": [t.to_dict() for t in trainers], "filters": {"cities": cities}})


@bp.get("/trainers/<int:trainer_id>")
@login_required
def get_trainer(trainer_id: int):
    trainer = db.session.get(Trainer, trainer_id)
    if trainer is None:
        raise NotFound("Trainer")
    return jsonify({"trainer": trainer.to_dict()})


def _overlaps(a_start: datetime, a_minutes: int, b_start: datetime, b_minutes: int) -> bool:
    return a_start < b_start + timedelta(minutes=b_minutes) and b_start < a_start + timedelta(minutes=a_minutes)


@bp.post("/trainers/<int:trainer_id>/sessions")
@login_required
def book_session(trainer_id: int):
    trainer = db.session.get(Trainer, trainer_id)
    if trainer is None:
        raise NotFound("Trainer")
    if not trainer.accepting_clients:
        raise ApiError(f"{trainer.name} isn't taking new clients right now", 409)

    data = v.json_body()
    day = v.date_field(data, "date", required=True)
    start = v.time_field(data, "start_time", required=True)
    duration = v.number(data, "duration_min", required=True, integer=True)
    if duration not in DURATIONS:
        raise v.invalid("duration_min", "Sessions are 45, 60 or 90 minutes")
    address = v.string(data, "address", required=True, min_len=10, max_len=200)
    focus = v.choice(data, "focus", SESSION_FOCUS, required=True)
    notes = v.string(data, "notes", max_len=500)

    starts_at = datetime.combine(day, start)
    if starts_at < local_now() + timedelta(hours=12):
        raise v.invalid("date", "Book at least 12 hours ahead so the trainer can plan travel")
    if starts_at > local_now() + timedelta(days=60):
        raise v.invalid("date", "Sessions can be booked up to 60 days ahead")
    if start < FIRST_SLOT or (starts_at + timedelta(minutes=duration)).time() > LAST_END or start.minute % 15:
        raise v.invalid("start_time", "Pick a start between 06:00 and 21:00, on the quarter hour")

    clashes = db.session.scalars(
        db.select(TrainerSession).where(
            TrainerSession.trainer_id == trainer.id,
            TrainerSession.date == day,
            TrainerSession.status == "booked",
        )
    ).all()
    # Leave 30 minutes either side for travel between clients.
    for other in clashes:
        other_start = datetime.combine(other.date, other.start_time) - timedelta(minutes=30)
        if _overlaps(starts_at, duration, other_start, other.duration_min + 60):
            raise ApiError(f"{trainer.name} is already booked around that time. Try another slot.", 409, code="clash")

    session = TrainerSession(
        user_id=current_user().id,
        trainer_id=trainer.id,
        date=day,
        start_time=start,
        duration_min=duration,
        address=address,
        focus=focus,
        notes=notes,
        status="booked",
        price=round(trainer.hourly_rate * duration / 60),
    )
    db.session.add(session)
    db.session.commit()
    return jsonify({"session": session.to_dict()}), 201


@bp.get("/sessions")
@login_required
def my_sessions():
    sessions = db.session.scalars(
        db.select(TrainerSession)
        .where(TrainerSession.user_id == current_user().id)
        .order_by(TrainerSession.date.desc(), TrainerSession.start_time.desc())
        .limit(100)
    ).all()
    return jsonify({"sessions": [s.to_dict() for s in sessions]})


@bp.post("/sessions/<int:session_id>/cancel")
@login_required
def cancel_session(session_id: int):
    session = db.session.get(TrainerSession, session_id)
    if session is None or session.user_id != current_user().id:
        raise NotFound("Session")
    if session.status != "booked":
        raise ApiError("This session isn't active", 409)
    if datetime.combine(session.date, session.start_time) - local_now() < timedelta(hours=6):
        raise ApiError("Sessions can be cancelled up to 6 hours before the start", 409)
    session.status = "cancelled"
    db.session.commit()
    return jsonify({"session": session.to_dict()})
