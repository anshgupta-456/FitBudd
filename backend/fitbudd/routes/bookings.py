"""Studio classes and sports courts: browse the timetable, book, cancel."""

from datetime import datetime, timedelta

from flask import Blueprint, current_app, jsonify, request

from .. import validation as v
from ..auth import current_user, login_required
from ..clock import local_now, local_today
from ..errors import ApiError, NotFound
from ..extensions import db
from ..models import CLASS_CATEGORIES, SPORTS, ClassBooking, CourtSlot, StudioClass, TrainerSession, utcnow
from ..timetable import ensure_timetable

bp = Blueprint("bookings", __name__)


def _window():
    """The day range a timetable request covers: one day if ?date= is given, else the coming week."""
    day = v.query_date("date")
    now = local_now()
    if day:
        start = max(datetime.combine(day, datetime.min.time()), now)
        end = datetime.combine(day + timedelta(days=1), datetime.min.time())
    else:
        start = now
        end = datetime.combine(local_today() + timedelta(days=v.query_int("days", 7, minimum=1, maximum=14)), datetime.min.time())
    return start, end


# ---------- Classes ----------


@bp.get("/classes")
@login_required
def list_classes():
    ensure_timetable(current_app.config["TIMETABLE_DAYS"])
    start, end = _window()
    query = db.select(StudioClass).where(StudioClass.starts_at >= start, StudioClass.starts_at < end)
    if city := request.args.get("city", "").strip():
        query = query.where(StudioClass.city.ilike(city))
    if category := request.args.get("category"):
        if category not in CLASS_CATEGORIES:
            raise ApiError("Unknown class category", 400)
        query = query.where(StudioClass.category == category)
    if level := request.args.get("level"):
        query = query.where(StudioClass.level.in_([level, "all"]))

    classes = db.session.scalars(query.order_by(StudioClass.starts_at).limit(300)).all()
    uid = current_user().id
    return jsonify({"classes": [c.to_dict(uid) for c in classes]})


@bp.post("/classes/<int:class_id>/booking")
@login_required
def book_class(class_id: int):
    studio_class = db.session.get(StudioClass, class_id)
    if studio_class is None:
        raise NotFound("Class")
    if studio_class.starts_at <= local_now():
        raise ApiError("This class has already started", 409)

    user = current_user()
    booking = db.session.scalar(
        db.select(ClassBooking).where(ClassBooking.class_id == class_id, ClassBooking.user_id == user.id)
    )
    if booking and booking.status == "confirmed":
        raise ApiError("You're already booked into this class", 409)
    if studio_class.booked >= studio_class.capacity:
        raise ApiError("This class is full", 409, code="full")

    if booking:
        booking.status = "confirmed"
    else:
        booking = ClassBooking(user_id=user.id, class_id=class_id, status="confirmed")
        db.session.add(booking)
    db.session.commit()
    db.session.refresh(studio_class)
    return jsonify({"class": studio_class.to_dict(user.id)}), 201


@bp.delete("/classes/<int:class_id>/booking")
@login_required
def cancel_class(class_id: int):
    user = current_user()
    booking = db.session.scalar(
        db.select(ClassBooking).where(
            ClassBooking.class_id == class_id,
            ClassBooking.user_id == user.id,
            ClassBooking.status == "confirmed",
        )
    )
    if booking is None:
        raise NotFound("Booking")
    if booking.studio_class.starts_at <= local_now():
        raise ApiError("Classes can't be cancelled after they start", 409)
    booking.status = "cancelled"
    db.session.commit()
    db.session.refresh(booking.studio_class)
    return jsonify({"class": booking.studio_class.to_dict(user.id)})


# ---------- Courts ----------


@bp.get("/courts")
@login_required
def list_courts():
    ensure_timetable(current_app.config["TIMETABLE_DAYS"])
    start, end = _window()
    query = db.select(CourtSlot).where(CourtSlot.starts_at >= start, CourtSlot.starts_at < end)
    if city := request.args.get("city", "").strip():
        query = query.where(CourtSlot.city.ilike(city))
    if sport := request.args.get("sport"):
        if sport not in SPORTS:
            raise ApiError("Unknown sport", 400)
        query = query.where(CourtSlot.sport == sport)
    if request.args.get("available") == "1":
        query = query.where(CourtSlot.booked_by_id.is_(None))

    slots = db.session.scalars(query.order_by(CourtSlot.starts_at, CourtSlot.venue, CourtSlot.court).limit(400)).all()
    uid = current_user().id
    return jsonify({"courts": [s.to_dict(uid) for s in slots]})


@bp.post("/courts/<int:slot_id>/booking")
@login_required
def book_court(slot_id: int):
    slot = db.session.get(CourtSlot, slot_id)
    if slot is None:
        raise NotFound("Court slot")
    if slot.starts_at <= local_now():
        raise ApiError("This slot has already started", 409)

    user = current_user()
    # Conditional update so two people can't grab the same slot at once.
    result = db.session.execute(
        db.update(CourtSlot)
        .where(CourtSlot.id == slot_id, CourtSlot.booked_by_id.is_(None))
        .values(booked_by_id=user.id, booked_at=utcnow())
    )
    if result.rowcount == 0:
        db.session.rollback()
        raise ApiError("Someone just booked this slot", 409, code="taken")
    db.session.commit()
    db.session.refresh(slot)
    return jsonify({"court": slot.to_dict(user.id)}), 201


@bp.delete("/courts/<int:slot_id>/booking")
@login_required
def cancel_court(slot_id: int):
    user = current_user()
    slot = db.session.get(CourtSlot, slot_id)
    if slot is None or slot.booked_by_id != user.id:
        raise NotFound("Booking")
    if slot.starts_at - local_now() < timedelta(hours=2):
        raise ApiError("Court bookings can be cancelled up to 2 hours before the slot", 409)
    slot.booked_by_id = None
    slot.booked_at = None
    db.session.commit()
    return jsonify({"court": slot.to_dict(user.id)})


# ---------- Everything the member has booked ----------


@bp.get("/bookings")
@login_required
def my_bookings():
    """Upcoming classes, courts and trainer sessions in one list, soonest first."""
    user = current_user()
    now = local_now()
    include_past = request.args.get("past") == "1"
    since = now - timedelta(days=30) if include_past else now - timedelta(hours=2)
    items = []

    classes = db.session.scalars(
        db.select(StudioClass)
        .join(ClassBooking)
        .where(ClassBooking.user_id == user.id, ClassBooking.status == "confirmed", StudioClass.starts_at >= since)
    ).all()
    for c in classes:
        items.append({"type": "class", "starts_at": c.starts_at, "item": c.to_dict(user.id)})

    courts = db.session.scalars(
        db.select(CourtSlot).where(CourtSlot.booked_by_id == user.id, CourtSlot.starts_at >= since)
    ).all()
    for s in courts:
        items.append({"type": "court", "starts_at": s.starts_at, "item": s.to_dict(user.id)})

    sessions = db.session.scalars(
        db.select(TrainerSession).where(
            TrainerSession.user_id == user.id,
            TrainerSession.status == "booked",
            TrainerSession.date >= since.date(),
        )
    ).all()
    for s in sessions:
        items.append({"type": "trainer", "starts_at": datetime.combine(s.date, s.start_time), "item": s.to_dict()})

    items.sort(key=lambda i: i["starts_at"])
    for i in items:
        i["starts_at"] = i["starts_at"].isoformat(timespec="minutes")
    return jsonify({"bookings": items})
