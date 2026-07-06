"""
routes/auth_routes.py
----------------------
Module 1: Authentication

Endpoints:
    POST /api/auth/register  -> create a new user account
    POST /api/auth/login     -> authenticate and receive a JWT
    POST /api/auth/logout    -> client-side token invalidation helper
    GET  /api/auth/me        -> return the currently authenticated user

Passwords are hashed with Werkzeug's PBKDF2-based helpers (never stored
in plaintext). Sessions are stateless, backed by JWT access tokens.
"""

import re
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

from database import db
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _error(message: str, status: int = 400):
    """Helper to return a consistent JSON error shape."""
    return jsonify({"success": False, "message": message}), status


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user.

    Expected JSON body:
        { "name": str, "email": str, "password": str }
    """
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    # --- Validation ---
    if not name or len(name) < 2:
        return _error("Name must be at least 2 characters long.")
    if not email or not EMAIL_REGEX.match(email):
        return _error("A valid email address is required.")
    if not password or len(password) < 6:
        return _error("Password must be at least 6 characters long.")

    if User.query.filter_by(email=email).first():
        return _error("An account with this email already exists.", 409)

    # --- Create user ---
    user = User(name=name, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))

    return (
        jsonify(
            {
                "success": True,
                "message": "Account created successfully.",
                "token": access_token,
                "user": user.to_dict(),
            }
        ),
        201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate a user and issue a JWT access token.

    Expected JSON body:
        { "email": str, "password": str }
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return _error("Email and password are required.")

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return _error("Invalid email or password.", 401)

    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "success": True,
            "message": "Login successful.",
            "token": access_token,
            "user": user.to_dict(),
        }
    )


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """
    Stateless JWT logout.

    Since JWTs are stateless, real invalidation happens client-side by
    discarding the token. This endpoint exists so the frontend has a
    consistent API call to make, and so a token blocklist can be added
    later without changing the frontend contract.
    """
    return jsonify({"success": True, "message": "Logged out successfully."})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Return the profile of the currently authenticated user."""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return _error("User not found.", 404)

    return jsonify({"success": True, "user": user.to_dict()})
