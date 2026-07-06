"""
routes/reminder_routes.py
----------------------------
Module 4: Reminder Scheduler (API surface)

Endpoints:
    GET  /api/reminders/due            -> medicines due right now for the user
    POST /api/reminders/<id>/snooze    -> snooze a medicine's reminder
    POST /api/reminders/<id>/take      -> alias of medicine "take" action
    POST /api/reminders/<id>/skip      -> alias of medicine "skip" action

"Mark as Taken" and "Skip" share the same underlying logic as Module 3's
medicine endpoints (POST /api/medicines/<id>/take|skip); the aliases here
exist so the frontend reminder popup has a single, clearly-named surface
to call, and so a snooze can be cleared automatically on take/skip.
"""

from datetime import datetime, timedelta, date

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db
from models import Medicine, History
from reminder import get_due_reminders_for_user

reminder_bp = Blueprint("reminders", __name__, url_prefix="/api/reminders")

ALLOWED_SNOOZE_MINUTES = {5, 10}


def _error(message: str, status: int = 400):
    return jsonify({"success": False, "message": message}), status


def _get_owned_medicine(medicine_id: int, user_id: int):
    return Medicine.query.filter_by(id=medicine_id, user_id=user_id).first()


@reminder_bp.route("/due", methods=["GET"])
@jwt_required()
def get_due():
    """
    Return medicines that are due right now for the authenticated user.
    The frontend polls this endpoint to trigger the alarm/popup/voice
    reminder in the browser.
    """
    user_id = int(get_jwt_identity())
    due_medicines = get_due_reminders_for_user(user_id)

    return jsonify(
        {
            "success": True,
            "count": len(due_medicines),
            "due_reminders": [m.to_dict() for m in due_medicines],
        }
    )


@reminder_bp.route("/<int:medicine_id>/snooze", methods=["POST"])
@jwt_required()
def snooze_reminder(medicine_id):
    """
    Snooze a medicine's reminder for 5 or 10 minutes (per the product
    spec). During the snooze window it will not reappear as "due".
    """
    user_id = int(get_jwt_identity())
    medicine = _get_owned_medicine(medicine_id, user_id)

    if not medicine:
        return _error("Medicine not found.", 404)

    data = request.get_json(silent=True) or {}
    minutes = data.get("minutes", 5)

    if minutes not in ALLOWED_SNOOZE_MINUTES:
        return _error("Snooze duration must be 5 or 10 minutes.")

    medicine.snoozed_until = datetime.now() + timedelta(minutes=minutes)
    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": f"{medicine.medicine_name} snoozed for {minutes} minutes.",
            "snoozed_until": medicine.snoozed_until.isoformat(),
        }
    )


@reminder_bp.route("/<int:medicine_id>/take", methods=["POST"])
@jwt_required()
def reminder_take(medicine_id):
    """Mark the reminder's dose as taken (clears any active snooze)."""
    user_id = int(get_jwt_identity())
    medicine = _get_owned_medicine(medicine_id, user_id)

    if not medicine:
        return _error("Medicine not found.", 404)

    today = date.today()
    already_taken = any(
        h.status == "taken" and h.taken_time.date() == today
        for h in medicine.history
    )
    if already_taken:
        return _error("This medicine has already been marked as taken today.", 409)

    entry = History(medicine_id=medicine.id, taken_time=datetime.now(), status="taken")
    medicine.snoozed_until = None
    db.session.add(entry)
    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": f"{medicine.medicine_name} marked as taken.",
        }
    )


@reminder_bp.route("/<int:medicine_id>/skip", methods=["POST"])
@jwt_required()
def reminder_skip(medicine_id):
    """Mark the reminder's dose as skipped (clears any active snooze)."""
    user_id = int(get_jwt_identity())
    medicine = _get_owned_medicine(medicine_id, user_id)

    if not medicine:
        return _error("Medicine not found.", 404)

    entry = History(medicine_id=medicine.id, taken_time=datetime.now(), status="skipped")
    medicine.snoozed_until = None
    db.session.add(entry)
    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": f"{medicine.medicine_name} skipped.",
        }
    )
