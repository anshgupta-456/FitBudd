import pytest

from fitbudd import create_app
from fitbudd.extensions import db
from fitbudd.seed import seed_reference_data


@pytest.fixture()
def app():
    app = create_app("testing")
    with app.app_context():
        seed_reference_data()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


class Member:
    """A signed-up test user with helpers that send the auth header."""

    def __init__(self, client, token, user):
        self.client = client
        self.token = token
        self.user = user
        self.id = user["id"]

    def _headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    def get(self, url, **kw):
        return self.client.get(url, headers=self._headers(), **kw)

    def post(self, url, json=None, **kw):
        return self.client.post(url, json=json if json is not None else {}, headers=self._headers(), **kw)

    def patch(self, url, json=None, **kw):
        return self.client.patch(url, json=json or {}, headers=self._headers(), **kw)

    def delete(self, url, json=None, **kw):
        return self.client.delete(url, json=json, headers=self._headers(), **kw)


@pytest.fixture()
def signup(client):
    counter = {"n": 0}

    def make(**profile) -> Member:
        counter["n"] += 1
        body = {
            "name": profile.pop("name", f"Tester {counter['n']}"),
            "email": profile.pop("email", f"tester{counter['n']}@example.com"),
            "password": profile.pop("password", "correct-horse"),
            **profile,
        }
        res = client.post("/api/auth/register", json=body)
        assert res.status_code == 201, res.get_json()
        data = res.get_json()
        return Member(client, data["token"], data["user"])

    return make
