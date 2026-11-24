import pytest

from fitbudd import create_app
from fitbudd.config import parse_origins


def _preflight(app, origin):
    res = app.test_client().options(
        "/api/auth/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    return res.headers.get("Access-Control-Allow-Origin")


def test_any_origin_when_frontend_url_unset():
    app = create_app("testing", CORS_ORIGINS=parse_origins(""))
    origin = "https://fit-budd-abc123-team.vercel.app"
    # flask-cors echoes the caller's origin rather than sending "*"; browsers accept either.
    assert _preflight(app, origin) in ("*", origin)


@pytest.mark.parametrize(
    "origin, allowed",
    [
        ("https://fitbudd.example.com", True),
        ("https://fit-budd-h75bzy7dn-team.vercel.app", True),
        ("http://localhost:3000", True),
        ("https://evil.example.com", False),
        # The wildcard must not stretch across the domain boundary.
        ("https://fit-budd-x.vercel.app.evil.com", False),
        ("https://fit-budd-x.evil.com/.vercel.app", False),
    ],
)
def test_frontend_url_restricts_origins(origin, allowed):
    app = create_app("testing", CORS_ORIGINS=parse_origins("https://fitbudd.example.com/, https://fit-budd-*.vercel.app"))
    assert (_preflight(app, origin) == origin) is allowed


def test_no_credentials_header():
    """Auth is a bearer token, so the API never asks browsers to send cookies."""
    app = create_app("testing", CORS_ORIGINS=parse_origins(""))
    res = app.test_client().get("/api/health", headers={"Origin": "https://anywhere.example"})
    assert "Access-Control-Allow-Credentials" not in res.headers
