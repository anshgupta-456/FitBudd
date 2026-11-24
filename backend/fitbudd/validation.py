"""Small helpers for reading and validating request bodies and query strings.

Each helper raises ApiError(422) with a field name so the frontend can show the
message next to the right input.
"""

import re
from datetime import date, datetime, time
from typing import Any, Iterable

from flask import request

from .errors import ApiError

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def json_body() -> dict:
    data = request.get_json(silent=True)
    if data is None:
        return {}
    if not isinstance(data, dict):
        raise ApiError("Request body must be a JSON object", 400)
    return data


def invalid(field: str, message: str) -> ApiError:
    return ApiError(message, 422, fields={field: message})


def string(data: dict, field: str, *, required=False, max_len=200, min_len=0, default=None) -> str | None:
    value = data.get(field)
    if value is None or (isinstance(value, str) and not value.strip()):
        if required:
            raise invalid(field, "This field is required")
        return default
    if not isinstance(value, str):
        raise invalid(field, "Must be text")
    value = value.strip()
    if len(value) < min_len:
        raise invalid(field, f"Must be at least {min_len} characters")
    if len(value) > max_len:
        raise invalid(field, f"Must be at most {max_len} characters")
    return value


def email(data: dict, field: str = "email") -> str:
    value = string(data, field, required=True, max_len=120)
    value = value.lower()
    if not EMAIL_RE.match(value):
        raise invalid(field, "Enter a valid email address")
    return value


def number(data: dict, field: str, *, required=False, minimum=None, maximum=None, integer=False, default=None):
    value = data.get(field)
    if value is None or value == "":
        if required:
            raise invalid(field, "This field is required")
        return default
    if isinstance(value, bool):
        raise invalid(field, "Must be a number")
    try:
        value = int(value) if integer else float(value)
    except (TypeError, ValueError):
        raise invalid(field, "Must be a number")
    if integer and isinstance(data.get(field), float) and not float(data[field]).is_integer():
        raise invalid(field, "Must be a whole number")
    if minimum is not None and value < minimum:
        raise invalid(field, f"Must be at least {minimum}")
    if maximum is not None and value > maximum:
        raise invalid(field, f"Must be at most {maximum}")
    return value


def choice(data: dict, field: str, options: Iterable[str], *, required=False, default=None) -> str | None:
    value = data.get(field)
    if value is None or value == "":
        if required:
            raise invalid(field, "This field is required")
        return default
    options = tuple(options)
    if value not in options:
        raise invalid(field, f"Must be one of: {', '.join(options)}")
    return value


def choices(data: dict, field: str, options: Iterable[str], *, default=None) -> list[str] | None:
    value = data.get(field)
    if value is None:
        return default
    if not isinstance(value, list):
        raise invalid(field, "Must be a list")
    options = tuple(options)
    bad = [v for v in value if v not in options]
    if bad:
        raise invalid(field, f"Unknown value: {bad[0]}")
    # Keep order, drop duplicates.
    return list(dict.fromkeys(value))


def parse_date(value: Any, field: str = "date") -> date:
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise invalid(field, "Use the format YYYY-MM-DD")


def parse_time(value: Any, field: str = "time") -> time:
    if isinstance(value, time):
        return value
    try:
        return datetime.strptime(str(value)[:5], "%H:%M").time()
    except (TypeError, ValueError):
        raise invalid(field, "Use the format HH:MM")


def date_field(data: dict, field: str, *, required=False, default=None) -> date | None:
    value = data.get(field)
    if value in (None, ""):
        if required:
            raise invalid(field, "This field is required")
        return default
    return parse_date(value, field)


def time_field(data: dict, field: str, *, required=False, default=None) -> time | None:
    value = data.get(field)
    if value in (None, ""):
        if required:
            raise invalid(field, "This field is required")
        return default
    return parse_time(value, field)


def query_date(name: str) -> date | None:
    value = request.args.get(name)
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise ApiError(f"Query parameter '{name}' must be YYYY-MM-DD", 400)


def query_int(name: str, default: int, *, minimum: int = 0, maximum: int = 100) -> int:
    value = request.args.get(name)
    if value is None or value == "":
        return default
    try:
        parsed = int(value)
    except ValueError:
        raise ApiError(f"Query parameter '{name}' must be a whole number", 400)
    return max(minimum, min(maximum, parsed))
