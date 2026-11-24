from datetime import datetime, time, timedelta

from fitbudd.clock import local_now
from fitbudd.extensions import db
from fitbudd.models import ClassBooking, CourtSlot, StudioClass


def _future_class(capacity=2):
    studio_class = StudioClass(
        title="Test Flow", category="yoga", instructor="T", studio="S", city="Pune",
        starts_at=local_now() + timedelta(days=2), duration_min=60, capacity=capacity, price=400,
    )
    db.session.add(studio_class)
    db.session.commit()
    return studio_class.id


def _future_court(hours=24):
    slot = CourtSlot(sport="badminton", venue="V", court="1", city="Pune",
                     starts_at=local_now() + timedelta(hours=hours), price=500)
    db.session.add(slot)
    db.session.commit()
    return slot.id


def test_timetable_is_generated_for_the_coming_days(signup):
    me = signup()
    classes = me.get("/api/classes?city=Bengaluru").get_json()["classes"]
    assert classes
    assert all(c["city"] == "Bengaluru" for c in classes)
    starts = [c["starts_at"] for c in classes]
    assert starts == sorted(starts)
    assert me.get("/api/courts?sport=badminton").get_json()["courts"]


def test_book_and_cancel_class(signup):
    me, other, third = signup(), signup(), signup()
    class_id = _future_class(capacity=2)

    res = me.post(f"/api/classes/{class_id}/booking")
    assert res.status_code == 201
    assert res.get_json()["class"]["booked_by_me"] is True
    assert res.get_json()["class"]["spots_left"] == 1
    assert me.post(f"/api/classes/{class_id}/booking").status_code == 409

    assert other.post(f"/api/classes/{class_id}/booking").status_code == 201
    full = third.post(f"/api/classes/{class_id}/booking")
    assert full.status_code == 409 and full.get_json()["error"]["code"] == "full"

    assert me.delete(f"/api/classes/{class_id}/booking").get_json()["class"]["spots_left"] == 1
    assert third.post(f"/api/classes/{class_id}/booking").status_code == 201
    # Rebooking after cancelling reuses the same row.
    assert db.session.scalar(db.select(db.func.count(ClassBooking.id)).where(ClassBooking.class_id == class_id)) == 3


def test_past_class_cannot_be_booked(signup):
    me = signup()
    past = StudioClass(title="Old", category="yoga", instructor="T", studio="S", city="Pune",
                       starts_at=local_now() - timedelta(hours=1), duration_min=60, capacity=5, price=400)
    db.session.add(past)
    db.session.commit()
    assert me.post(f"/api/classes/{past.id}/booking").status_code == 409


def test_court_booking_is_exclusive(signup):
    me, other = signup(), signup()
    slot_id = _future_court()
    assert me.post(f"/api/courts/{slot_id}/booking").status_code == 201
    taken = other.post(f"/api/courts/{slot_id}/booking")
    assert taken.status_code == 409 and taken.get_json()["error"]["code"] == "taken"
    assert other.delete(f"/api/courts/{slot_id}/booking").status_code == 404
    assert me.delete(f"/api/courts/{slot_id}/booking").get_json()["court"]["available"] is True


def test_court_cancellation_window(signup):
    me = signup()
    slot_id = _future_court(hours=1)
    me.post(f"/api/courts/{slot_id}/booking")
    assert me.delete(f"/api/courts/{slot_id}/booking").status_code == 409


def test_trainer_session_booking(signup):
    me, other = signup(), signup()
    trainers = me.get("/api/trainers?city=Delhi&women_focus=1").get_json()["trainers"]
    assert trainers and all(t["city"] == "Delhi" and t["women_clients_focus"] for t in trainers)
    trainer = trainers[0]

    day = (local_now() + timedelta(days=3)).date().isoformat()
    body = {"date": day, "start_time": "07:00", "duration_min": 60, "address": "Flat 4B, Green Park Main", "focus": "strength"}
    res = me.post(f"/api/trainers/{trainer['id']}/sessions", json=body)
    assert res.status_code == 201
    session = res.get_json()["session"]
    assert session["price"] == trainer["hourly_rate"]

    # Overlaps (including travel buffer) are refused.
    clash = other.post(f"/api/trainers/{trainer['id']}/sessions", json={**body, "start_time": "08:15"})
    assert clash.status_code == 409
    assert other.post(f"/api/trainers/{trainer['id']}/sessions", json={**body, "start_time": "09:30"}).status_code == 201

    assert me.post(f"/api/trainers/{trainer['id']}/sessions", json={**body, "start_time": "05:00"}).status_code == 422
    assert me.post(f"/api/trainers/{trainer['id']}/sessions", json={**body, "duration_min": 20}).status_code == 422

    bookings = me.get("/api/bookings").get_json()["bookings"]
    assert [b["type"] for b in bookings] == ["trainer"]

    assert me.post(f"/api/sessions/{session['id']}/cancel").get_json()["session"]["status"] == "cancelled"
    assert other.post(f"/api/sessions/{session['id']}/cancel").status_code == 404
