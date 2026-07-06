"""
routes/notification_routes.py
--------------------------------
Module 6: Browser & Voice Notifications

Endpoints:
    GET /api/notifications/preferences -> current user's notification settings
    PUT /api/notifications/preferences -> update one or more settings

These preferences are read by the frontend's ReminderWatcher/ReminderPopup
to decide whether to show a browser Notification, speak the reminder
aloud, and/or play the alarm tone when a dose becomes due.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db
from models import User

notification_bp = Blueprint(
    "notifications", __name__, url_prefix="/api/notifications"
)


def _error(message: str, status: int = 400):
    return jsonify({"success": False, "message": message}), status


@notification_bp.route("/preferences", methods=["GET"])
@jwt_required()
def get_preferences():
    """Return the authenticated user's notification preferences."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return _error("User not found.", 404)

    return jsonify(
        {"success": True, "preferences": user.to_dict()["notification_preferences"]}
    )


@notification_bp.route("/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    """
    Update one or more notification preferences.

    Expected JSON body (all fields optional):
        {
          "browser_enabled": true|false,
          "voice_enabled": true|false,
          "alarm_enabled": true|false
        }
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return _error("User not found.", 404)

    data = request.get_json(silent=True) or {}

    for field, column in (
        ("browser_enabled", "notif_browser_enabled"),
        ("voice_enabled", "notif_voice_enabled"),
        ("alarm_enabled", "notif_alarm_enabled"),
    ):
        if field in data:
            if not isinstance(data[field], bool):
                return _error(f"'{field}' must be a boolean.")
            setattr(user, column, data[field])

    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "Notification preferences updated.",
            "preferences": user.to_dict()["notification_preferences"],
        }
    )
