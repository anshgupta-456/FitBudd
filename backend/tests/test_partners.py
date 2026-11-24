def _connect(a, b):
    a.post("/api/partners/requests", json={"user_id": b.id, "note": "hi"})
    request_id = b.get("/api/partners/requests").get_json()["incoming"][0]["id"]
    assert b.post(f"/api/partners/requests/{request_id}/accept").status_code == 200


def test_suggestions_rank_by_fit_and_exclude_self(signup):
    me = signup(city="Mumbai", fitness_level="advanced", goals=["get_stronger"], preferred_time="evening")
    suggestions = me.get("/api/partners/suggestions").get_json()["suggestions"]
    assert me.id not in [s["id"] for s in suggestions]
    # The seeded Mumbai powerlifter matches on city, level, goal and time.
    assert suggestions[0]["name"] == "Aditya Joshi"
    assert suggestions[0]["match"] == 88
    assert "Also in Mumbai" in suggestions[0]["reasons"]
    assert "email" not in suggestions[0]


def test_request_accept_flow(signup):
    a, b = signup(), signup()
    assert a.post("/api/partners/requests", json={"user_id": b.id}).status_code == 201
    assert a.post("/api/partners/requests", json={"user_id": b.id}).status_code == 409

    assert [r["user"]["id"] for r in a.get("/api/partners/requests").get_json()["outgoing"]] == [b.id]
    incoming = b.get("/api/partners/requests").get_json()["incoming"]
    assert incoming[0]["user"]["id"] == a.id

    # Only the person asked can accept.
    assert a.post(f"/api/partners/requests/{incoming[0]['id']}/accept").status_code == 404
    assert b.post(f"/api/partners/requests/{incoming[0]['id']}/accept").status_code == 200

    assert [p["id"] for p in a.get("/api/partners").get_json()["partners"]] == [b.id]
    assert b.id not in [s["id"] for s in a.get("/api/partners/suggestions").get_json()["suggestions"]]


def test_mutual_request_connects_immediately(signup):
    a, b = signup(), signup()
    a.post("/api/partners/requests", json={"user_id": b.id})
    res = b.post("/api/partners/requests", json={"user_id": a.id})
    assert res.get_json()["status"] == "accepted"
    assert [p["id"] for p in a.get("/api/partners").get_json()["partners"]] == [b.id]


def test_decline_and_withdraw(signup):
    a, b, c = signup(), signup(), signup()
    a.post("/api/partners/requests", json={"user_id": b.id})
    rid = b.get("/api/partners/requests").get_json()["incoming"][0]["id"]
    assert b.post(f"/api/partners/requests/{rid}/decline").status_code == 204
    assert a.post("/api/partners/requests", json={"user_id": b.id}).status_code == 409

    a.post("/api/partners/requests", json={"user_id": c.id})
    rid = a.get("/api/partners/requests").get_json()["outgoing"][0]["id"]
    assert a.delete(f"/api/partners/requests/{rid}").status_code == 204
    assert c.get("/api/partners/requests").get_json()["incoming"] == []


def test_messages_only_between_partners(signup):
    a, b = signup(), signup()
    assert a.post(f"/api/messages/{b.id}", json={"body": "hey"}).status_code == 403

    _connect(a, b)
    first = a.post(f"/api/messages/{b.id}", json={"body": "Run on Saturday?"})
    assert first.status_code == 201
    assert b.get("/api/inbox/counts").get_json() == {"requests": 0, "unread_messages": 1}

    convo = b.get("/api/conversations").get_json()["conversations"][0]
    assert convo["partner"]["id"] == a.id and convo["unread"] == 1
    assert convo["last_message"]["body"] == "Run on Saturday?"

    thread = b.get(f"/api/messages/{a.id}").get_json()["messages"]
    assert [m["body"] for m in thread] == ["Run on Saturday?"]
    assert b.get("/api/inbox/counts").get_json()["unread_messages"] == 0

    b.post(f"/api/messages/{a.id}", json={"body": "Yes"})
    newer = a.get(f"/api/messages/{b.id}?after={thread[0]['id']}").get_json()["messages"]
    assert [m["body"] for m in newer] == ["Yes"]

    assert a.post(f"/api/messages/{b.id}", json={"body": "   "}).status_code == 422


def test_removing_partner_stops_messages(signup):
    a, b = signup(), signup()
    _connect(a, b)
    assert a.delete(f"/api/partners/{b.id}").status_code == 204
    assert b.post(f"/api/messages/{a.id}", json={"body": "still there?"}).status_code == 403
