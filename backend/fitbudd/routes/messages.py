"""Direct messages between connected partners."""

from flask import Blueprint, jsonify, request

from .. import validation as v
from ..auth import current_user, login_required
from ..errors import ApiError, NotFound
from ..extensions import db
from ..models import Connection, Message, User, utcnow
from .partners import is_partner

bp = Blueprint("messages", __name__)


def _partner(user_id: int) -> User:
    other = db.session.get(User, user_id)
    if other is None:
        raise NotFound("Member")
    if not is_partner(current_user().id, user_id):
        raise ApiError("You can only message people you're connected with", 403)
    return other


def _between(a: int, b: int):
    return db.or_(
        db.and_(Message.sender_id == a, Message.recipient_id == b),
        db.and_(Message.sender_id == b, Message.recipient_id == a),
    )


@bp.get("/conversations")
@login_required
def conversations():
    """Every partner, with the latest message and unread count, most recent conversation first."""
    me = current_user()
    conns = db.session.scalars(
        db.select(Connection).where(
            Connection.status == "accepted",
            db.or_(Connection.requester_id == me.id, Connection.addressee_id == me.id),
        )
    ).all()

    threads = []
    for conn in conns:
        other = conn.other(me.id)
        last = db.session.scalar(
            db.select(Message).where(_between(me.id, other.id)).order_by(Message.id.desc()).limit(1)
        )
        unread = db.session.scalar(
            db.select(db.func.count(Message.id)).where(
                Message.sender_id == other.id, Message.recipient_id == me.id, Message.read_at.is_(None)
            )
        )
        threads.append({
            "partner": {"id": other.id, "name": other.name, "city": other.city},
            "last_message": last.to_dict() if last else None,
            "unread": unread,
            "_sort": last.sent_at if last else (conn.responded_at or conn.created_at),
        })
    threads.sort(key=lambda t: t["_sort"], reverse=True)
    for t in threads:
        del t["_sort"]
    return jsonify({"conversations": threads})


@bp.get("/messages/<int:user_id>")
@login_required
def thread(user_id: int):
    me = current_user()
    other = _partner(user_id)
    query = db.select(Message).where(_between(me.id, other.id))
    after = request.args.get("after", type=int)
    if after:
        query = query.where(Message.id > after)
        messages = db.session.scalars(query.order_by(Message.id)).all()
    else:
        latest = db.session.scalars(query.order_by(Message.id.desc()).limit(200)).all()
        messages = list(reversed(latest))

    unread = [m for m in messages if m.recipient_id == me.id and m.read_at is None]
    if unread:
        now = utcnow()
        for m in unread:
            m.read_at = now
        db.session.commit()

    return jsonify({
        "partner": other.public_dict(),
        "messages": [m.to_dict() for m in messages],
    })


@bp.post("/messages/<int:user_id>")
@login_required
def send(user_id: int):
    me = current_user()
    other = _partner(user_id)
    body = v.string(v.json_body(), "body", required=True, max_len=2000)
    message = Message(sender_id=me.id, recipient_id=other.id, body=body)
    db.session.add(message)
    db.session.commit()
    return jsonify({"message": message.to_dict()}), 201
