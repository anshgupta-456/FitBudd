"""Studio and court times are stored as local wall-clock time in the app's timezone."""

from datetime import date, datetime
from zoneinfo import ZoneInfo

from flask import current_app


def tz() -> ZoneInfo:
    return ZoneInfo(current_app.config.get("APP_TIMEZONE", "Asia/Kolkata"))


def local_now() -> datetime:
    return datetime.now(tz()).replace(tzinfo=None, second=0, microsecond=0)


def local_today() -> date:
    return local_now().date()
