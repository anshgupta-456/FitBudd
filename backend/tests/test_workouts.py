from datetime import date, timedelta


def _workout(**overrides):
    return {"title": "Squats", "kind": "strength", "date": "2025-03-04", "start_time": "07:00", "duration_min": 45, **overrides}


def test_crud(signup):
    me = signup()
    res = me.post("/api/workouts", json=_workout())
    assert res.status_code == 201
    workout = res.get_json()["workout"]
    assert workout["status"] == "planned"
    assert workout["start_time"] == "07:00"

    res = me.patch(f"/api/workouts/{workout['id']}", json={"status": "done", "effort": 8})
    assert res.get_json()["workout"]["status"] == "done"
    assert res.get_json()["workout"]["completed_at"]

    listed = me.get("/api/workouts?from=2025-03-01&to=2025-03-31").get_json()["workouts"]
    assert [w["id"] for w in listed] == [workout["id"]]

    assert me.delete(f"/api/workouts/{workout['id']}").status_code == 204
    assert me.get("/api/workouts").get_json()["workouts"] == []


def test_validation(signup):
    me = signup()
    res = me.post("/api/workouts", json=_workout(kind="napping"))
    assert res.status_code == 422
    assert "kind" in res.get_json()["error"]["fields"]
    assert me.post("/api/workouts", json=_workout(date="04/03/2025")).status_code == 422
    assert me.post("/api/workouts", json=_workout(duration_min=0)).status_code == 422


def test_cannot_touch_someone_elses_workout(signup):
    owner, stranger = signup(), signup()
    workout = owner.post("/api/workouts", json=_workout()).get_json()["workout"]
    assert stranger.patch(f"/api/workouts/{workout['id']}", json={"title": "mine now"}).status_code == 404
    assert stranger.delete(f"/api/workouts/{workout['id']}").status_code == 404
    assert stranger.get("/api/workouts").get_json()["workouts"] == []


def test_partner_must_be_a_connection(signup):
    me, other = signup(), signup()
    res = me.post("/api/workouts", json=_workout(partner_id=other.id))
    assert res.status_code == 422

    me.post("/api/partners/requests", json={"user_id": other.id})
    request_id = other.get("/api/partners/requests").get_json()["incoming"][0]["id"]
    other.post(f"/api/partners/requests/{request_id}/accept")

    res = me.post("/api/workouts", json=_workout(partner_id=other.id))
    assert res.status_code == 201
    assert res.get_json()["workout"]["partner"]["id"] == other.id


def test_summary_counts_week_and_streak(signup):
    me = signup()
    today = date(2025, 5, 14)  # a Wednesday
    for offset, status in [(0, "done"), (1, "done"), (2, "done"), (4, "skipped"), (-1, "planned")]:
        w = me.post("/api/workouts", json=_workout(date=(today - timedelta(days=offset)).isoformat())).get_json()["workout"]
        if status != "planned":
            me.patch(f"/api/workouts/{w['id']}", json={"status": status})

    summary = me.get(f"/api/workouts/summary?today={today.isoformat()}").get_json()
    assert summary["week_start"] == "2025-05-12"
    assert summary["this_week"] == {"planned": 4, "done": 3, "minutes": 135}
    assert summary["streak_days"] == 3
    assert summary["total_done"] == 3
    assert len(summary["weekly"]) == 8
    assert summary["weekly"][-1]["minutes"] == 135


def test_cannot_log_a_future_workout(signup):
    me = signup()
    future = (date.today() + timedelta(days=5)).isoformat()
    workout = me.post("/api/workouts", json=_workout(date=future)).get_json()["workout"]
    res = me.patch(f"/api/workouts/{workout['id']}", json={"status": "done"})
    assert res.status_code == 422
    assert "status" in res.get_json()["error"]["fields"]
    # Skipping ahead of time is fine.
    assert me.patch(f"/api/workouts/{workout['id']}", json={"status": "skipped"}).status_code == 200
