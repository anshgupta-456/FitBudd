"""Body measurements the member logs over time (weight, body fat, waist, resting heart rate)."""

from flask import Blueprint, jsonify

from .. import validation as v
from ..auth import current_user, login_required
from ..errors import ApiError, NotFound
from ..extensions import db
from ..models import Measurement

bp = Blueprint("progress", __name__)

FIELDS = {
    "weight_kg": dict(minimum=25, maximum=300),
    "body_fat_pct": dict(minimum=2, maximum=70),
    "waist_cm": dict(minimum=40, maximum=200),
    "resting_hr": dict(minimum=30, maximum=140, integer=True),
}


@bp.get("/measurements")
@login_required
def list_measurements():
    rows = db.session.scalars(
        db.select(Measurement)
        .where(Measurement.user_id == current_user().id)
        .order_by(Measurement.date.desc())
        .limit(v.query_int("limit", 120, minimum=1, maximum=1000))
    ).all()
    return jsonify({"measurements": [m.to_dict() for m in rows]})


@bp.post("/measurements")
@login_required
def save_measurement():
    """Create or replace the entry for a day. One entry per day keeps the charts honest."""
    data = v.json_body()
    day = v.date_field(data, "date", required=True)
    values = {name: v.number(data, name, **rules) for name, rules in FIELDS.items()}
    if all(value is None for value in values.values()):
        raise ApiError("Enter at least one measurement", 422)

    user = current_user()
    entry = db.session.scalar(
        db.select(Measurement).where(Measurement.user_id == user.id, Measurement.date == day)
    )
    created = entry is None
    if created:
        entry = Measurement(user_id=user.id, date=day)
        db.session.add(entry)
    for name, value in values.items():
        setattr(entry, name, value)
    entry.notes = v.string(data, "notes", max_len=200)

    # Keep the profile weight in step with the latest weigh-in.
    if values["weight_kg"] is not None:
        latest = db.session.scalar(
            db.select(db.func.max(Measurement.date)).where(
                Measurement.user_id == user.id, Measurement.weight_kg.is_not(None)
            )
        )
        if latest is None or day >= latest:
            user.weight_kg = values["weight_kg"]

    db.session.commit()
    return jsonify({"measurement": entry.to_dict()}), 201 if created else 200


@bp.delete("/measurements/<int:measurement_id>")
@login_required
def delete_measurement(measurement_id: int):
    entry = db.session.get(Measurement, measurement_id)
    if entry is None or entry.user_id != current_user().id:
        raise NotFound("Measurement")
    db.session.delete(entry)
    db.session.commit()
    return "", 204
