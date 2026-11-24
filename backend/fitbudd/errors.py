import logging

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

log = logging.getLogger(__name__)


class ApiError(Exception):
    """An error that is safe to show to the client."""

    def __init__(self, message: str, status: int = 400, code: str | None = None, fields: dict | None = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code or {
            400: "bad_request",
            401: "unauthorized",
            403: "forbidden",
            404: "not_found",
            409: "conflict",
            422: "invalid",
        }.get(status, "error")
        self.fields = fields or {}


class NotFound(ApiError):
    def __init__(self, what: str = "Resource"):
        super().__init__(f"{what} not found", 404)


def _body(code: str, message: str, fields: dict | None = None):
    error = {"code": code, "message": message}
    if fields:
        error["fields"] = fields
    return {"error": error}


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        return jsonify(_body(err.code, err.message, err.fields)), err.status

    @app.errorhandler(HTTPException)
    def handle_http_error(err: HTTPException):
        code = (err.name or "error").lower().replace(" ", "_")
        return jsonify(_body(code, err.description or err.name)), err.code

    @app.errorhandler(Exception)
    def handle_unexpected(err: Exception):
        log.exception("Unhandled error")
        return jsonify(_body("server_error", "Something went wrong on our side.")), 500
