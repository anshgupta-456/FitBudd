"""Training partners: suggestions, requests, and the people a member is connected with."""

from flask import Blueprint, jsonify

from .. import validation as v
from ..auth import current_user, login_required
from ..errors import ApiError, NotFound
from ..extensions import db
from ..models import LEVELS, Connection, Message, User, utcnow

bp = Blueprint("partners", __name__)

GOAL_LABELS = {
    "lose_fat": "losing fat",
    "build_muscle": "building muscle",
    "get_stronger": "getting stronger",
    "endurance": "endurance",
    "mobility": "mobility",
    "stay_active": "staying active",
}


def _pair(a: int, b: int):
    return db.or_(
        db.and_(Connection.requester_id == a, Connection.addressee_id == b),
        db.and_(Connection.requester_id == b, Connection.addressee_id == a),
    )


def connection_between(a: int, b: int) -> Connection | None:
    return db.session.scalar(db.select(Connection).where(_pair(a, b)))


def is_partner(a: int, b: int) -> bool:
    conn = connection_between(a, b)
    return conn is not None and conn.status == "accepted"


def score(me: User, other: User) -> tuple[int, list[str]]:
    """How good a training match two members are, 0-100, with the reasons shown on the card."""
    points, reasons = 0, []
    if me.city and other.city and me.city.lower() == other.city.lower():
        points += 35
        reasons.append(f"Also in {other.city}")
    if me.fitness_level and other.fitness_level:
        gap = abs(LEVELS.index(me.fitness_level) - LEVELS.index(other.fitness_level))
        if gap == 0:
            points += 25
            reasons.append(f"Same level ({other.fitness_level})")
        elif gap == 1:
            points += 10
    shared = [g for g in (other.goals or []) if g in (me.goals or [])]
    if shared:
        points += min(len(shared) * 12, 24)
        reasons.append("Both working on " + " and ".join(GOAL_LABELS.get(g, g) for g in shared[:2]))
    if me.preferred_time and me.preferred_time == other.preferred_time:
        points += 16
        reasons.append(f"Trains in the {other.preferred_time}")
    return min(points, 100), reasons


def _card(user: User, **extra) -> dict:
    return {**user.public_dict(), **extra}


@bp.get("/partners/suggestions")
@login_required
def suggestions():
    me = current_user()
    linked = db.session.execute(
        db.select(Connection.requester_id, Connection.addressee_id).where(
            db.or_(Connection.requester_id == me.id, Connection.addressee_id == me.id)
        )
    ).all()
    exclude = {me.id} | {uid for row in linked for uid in row}

    candidates = db.session.scalars(
        db.select(User).where(User.id.not_in(exclude)).order_by(User.last_active_at.desc()).limit(300)
    ).all()
    ranked = []
    for other in candidates:
        points, reasons = score(me, other)
        ranked.append((points, other.last_active_at, _card(other, match=points, reasons=reasons)))
    ranked.sort(key=lambda r: (r[0], r[1]), reverse=True)
    limit = v.query_int("limit", 20, minimum=1, maximum=50)
    return jsonify({"suggestions": [card for _, _, card in ranked[:limit]]})


@bp.get("/partners")
@login_required
def list_partners():
    me = current_user()
    conns = db.session.scalars(
        db.select(Connection).where(
            Connection.status == "accepted",
            db.or_(Connection.requester_id == me.id, Connection.addressee_id == me.id),
        )
    ).all()
    partners = [_card(c.other(me.id), connected_at=(c.responded_at or c.created_at).isoformat() + "Z") for c in conns]
    partners.sort(key=lambda p: p["name"].lower())
    return jsonify({"partners": partners})


@bp.get("/partners/requests")
@login_required
def list_requests():
    me = current_user()
    pending = db.session.scalars(
        db.select(Connection)
        .where(
            Connection.status == "pending",
            db.or_(Connection.requester_id == me.id, Connection.addressee_id == me.id),
        )
        .order_by(Connection.created_at.desc())
    ).all()

    def row(c: Connection):
        other = c.other(me.id)
        points, reasons = score(me, other)
        return {
            "id": c.id,
            "note": c.note,
            "sent_at": c.created_at.isoformat() + "Z",
            "user": _card(other, match=points, reasons=reasons),
        }

    return jsonify({
        "incoming": [row(c) for c in pending if c.addressee_id == me.id],
        "outgoing": [row(c) for c in pending if c.requester_id == me.id],
    })


@bp.post("/partners/requests")
@login_required
def send_request():
    me = current_user()
    data = v.json_body()
    other_id = v.number(data, "user_id", required=True, integer=True)
    note = v.string(data, "note", max_len=280)
    if other_id == me.id:
        raise ApiError("You can't send a request to yourself", 422)
    other = db.session.get(User, other_id)
    if other is None:
        raise NotFound("Member")

    existing = connection_between(me.id, other_id)
    if existing:
        if existing.status == "accepted":
            raise ApiError(f"You're already partners with {other.name}", 409)
        if existing.status == "pending" and existing.requester_id == me.id:
            raise ApiError("Request already sent", 409)
        if existing.status == "pending":
            # They asked first; sending one back means yes.
            existing.status = "accepted"
            existing.responded_at = utcnow()
            db.session.commit()
            return jsonify({"status": "accepted", "partner": other.public_dict()}), 200
        raise ApiError("This member isn't available to connect", 409)

    db.session.add(Connection(requester_id=me.id, addressee_id=other_id, status="pending", note=note))
    db.session.commit()
    return jsonify({"status": "pending"}), 201


def _incoming(request_id: int) -> Connection:
    conn = db.session.get(Connection, request_id)
    if conn is None or conn.addressee_id != current_user().id or conn.status != "pending":
        raise NotFound("Request")
    return conn


@bp.post("/partners/requests/<int:request_id>/accept")
@login_required
def accept(request_id: int):
    conn = _incoming(request_id)
    conn.status = "accepted"
    conn.responded_at = utcnow()
    db.session.commit()
    return jsonify({"partner": conn.requester.public_dict()})


@bp.post("/partners/requests/<int:request_id>/decline")
@login_required
def decline(request_id: int):
    conn = _incoming(request_id)
    conn.status = "declined"
    conn.responded_at = utcnow()
    db.session.commit()
    return "", 204


@bp.delete("/partners/requests/<int:request_id>")
@login_required
def withdraw(request_id: int):
    conn = db.session.get(Connection, request_id)
    if conn is None or conn.requester_id != current_user().id or conn.status != "pending":
        raise NotFound("Request")
    db.session.delete(conn)
    db.session.commit()
    return "", 204


@bp.delete("/partners/<int:user_id>")
@login_required
def remove_partner(user_id: int):
    conn = connection_between(current_user().id, user_id)
    if conn is None or conn.status != "accepted":
        raise NotFound("Partner")
    db.session.delete(conn)
    db.session.commit()
    return "", 204


@bp.get("/inbox/counts")
@login_required
def counts():
    """Badge numbers for the navigation."""
    me = current_user()
    requests = db.session.scalar(
        db.select(db.func.count(Connection.id)).where(Connection.addressee_id == me.id, Connection.status == "pending")
    )
    unread = db.session.scalar(
        db.select(db.func.count(Message.id)).where(Message.recipient_id == me.id, Message.read_at.is_(None))
    )
    return jsonify({"requests": requests, "unread_messages": unread})
