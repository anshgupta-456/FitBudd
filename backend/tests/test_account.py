def test_register_returns_token_and_profile(client):
    res = client.post("/api/auth/register", json={
        "name": "Asha", "email": "  Asha@Example.com ", "password": "longenough", "city": "Pune", "goals": ["lose_fat"],
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["token"]
    assert data["user"]["email"] == "asha@example.com"
    assert data["user"]["city"] == "Pune"
    assert data["user"]["goals"] == ["lose_fat"]
    assert "password_hash" not in data["user"]


def test_register_rejects_duplicate_email_case_insensitively(client, signup):
    signup(email="same@example.com")
    res = client.post("/api/auth/register", json={"name": "B", "email": "SAME@example.com", "password": "longenough"})
    assert res.status_code == 409
    assert res.get_json()["error"]["fields"]["email"]


def test_register_validates_fields(client):
    res = client.post("/api/auth/register", json={"name": "A", "email": "not-an-email", "password": "longenough"})
    assert res.status_code == 422
    assert "email" in res.get_json()["error"]["fields"]

    res = client.post("/api/auth/register", json={"name": "A", "email": "a@b.co", "password": "short"})
    assert res.status_code == 422
    assert "password" in res.get_json()["error"]["fields"]


def test_login(client, signup):
    signup(email="me@example.com", password="right-password")
    assert client.post("/api/auth/login", json={"email": "me@example.com", "password": "wrong-password"}).status_code == 401
    res = client.post("/api/auth/login", json={"email": "ME@example.com", "password": "right-password"})
    assert res.status_code == 200
    assert res.get_json()["user"]["email"] == "me@example.com"


def test_protected_routes_need_a_valid_token(client):
    assert client.get("/api/auth/me").status_code == 401
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer nonsense"})
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "unauthorized"


def test_update_profile(signup):
    me = signup()
    res = me.patch("/api/profile", json={"age": 30, "height_cm": 170, "fitness_level": "advanced", "goals": ["mobility"]})
    assert res.status_code == 200
    user = res.get_json()["user"]
    assert (user["age"], user["height_cm"], user["fitness_level"], user["goals"]) == (30, 170, "advanced", ["mobility"])

    bad = me.patch("/api/profile", json={"fitness_level": "superhuman"})
    assert bad.status_code == 422


def test_change_password(client, signup):
    me = signup(email="pw@example.com", password="old-password")
    assert me.post("/api/profile/password", json={"current_password": "nope", "new_password": "new-password"}).status_code == 422
    assert me.post("/api/profile/password", json={"current_password": "old-password", "new_password": "new-password"}).status_code == 200
    assert client.post("/api/auth/login", json={"email": "pw@example.com", "password": "new-password"}).status_code == 200


def test_delete_account_removes_their_data(client, signup):
    me = signup(email="gone@example.com", password="password123")
    me.post("/api/workouts", json={"title": "Run", "kind": "cardio", "date": "2030-01-01", "duration_min": 30})
    assert me.delete("/api/profile", json={"password": "password123"}).status_code == 204
    assert client.post("/api/auth/login", json={"email": "gone@example.com", "password": "password123"}).status_code == 401
    assert me.get("/api/workouts").status_code == 401


def test_unknown_routes_return_json(client):
    res = client.get("/api/does-not-exist")
    assert res.status_code == 404
    assert res.get_json()["error"]["code"] == "not_found"
