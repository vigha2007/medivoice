"""
routes/medicine_routes.py
----------------------------
Module 3: Medicine CRUD

Endpoints (all scoped to the authenticated user):
    POST   /api/medicines              -> create a new medicine
    GET    /api/medicines              -> list medicines (supports ?search=)
    GET    /api/medicines/<id>         -> get a single medicine
    PUT    /api/medicines/<id>         -> update a medicine
    DELETE /api/medicines/<id>         -> delete a medicine
    POST   /api/medicines/<id>/take    -> mark a dose as taken (adds History row)
    POST   /api/medicines/<id>/skip    -> mark a dose as skipped (adds History row)
    GET    /api/medicines/<id>/history -> view dose history for a medicine
"""

from datetime import datetime, date

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db
from models import Medicine, History

medicine_bp = Blueprint("medicines", __name__, url_prefix="/api/medicines")

VALID_FREQUENCIES = {"Daily", "Weekly", "Monthly"}
VALID_STATUSES = {"active", "completed", "paused"}


def _error(message: str, status: int = 400):
    return jsonify({"success": False, "message": message}), status


def _parse_date(value):
    """Parse an ISO date string (YYYY-MM-DD) into a date object, or None."""
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"Invalid date format: '{value}'. Use YYYY-MM-DD.")


def _get_owned_medicine(medicine_id: int, user_id: int):
    """Fetch a medicine by id, ensuring it belongs to the given user."""
    return Medicine.query.filter_by(id=medicine_id, user_id=user_id).first()


@medicine_bp.route("", methods=["POST"])
@jwt_required()
def create_medicine():
    """Add a new medicine for the authenticated user."""
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    medicine_name = (data.get("medicine_name") or "").strip()
    if not medicine_name:
        return _error("Medicine name is required.")

    frequency = data.get("frequency", "Daily")
    if frequency not in VALID_FREQUENCIES:
        return _error(f"Frequency must be one of {sorted(VALID_FREQUENCIES)}.")

    reminder_time = data.get("reminder_time")
    if reminder_time:
        try:
            hour, minute = map(int, reminder_time.split(":"))
            if not (0 <= hour < 24 and 0 <= minute < 60):
                raise ValueError
        except ValueError:
            return _error("reminder_time must be in HH:MM 24-hour format.")

    try:
        start_date = _parse_date(data.get("start_date"))
        end_date = _parse_date(data.get("end_date"))
    except ValueError as e:
        return _error(str(e))

    if start_date and end_date and end_date < start_date:
        return _error("end_date cannot be before start_date.")

    medicine = Medicine(
        user_id=user_id,
        medicine_name=medicine_name,
        dosage=(data.get("dosage") or "").strip() or None,
        purpose=(data.get("purpose") or "").strip() or None,
        start_date=start_date,
        end_date=end_date,
        reminder_time=reminder_time,
        frequency=frequency,
        notes=(data.get("notes") or "").strip() or None,
        status=data.get("status", "active")
        if data.get("status") in VALID_STATUSES
        else "active",
    )

    db.session.add(medicine)
    db.session.commit()

    return (
        jsonify(
            {
                "success": True,
                "message": "Medicine added successfully.",
                "medicine": medicine.to_dict(),
            }
        ),
        201,
    )


@medicine_bp.route("", methods=["GET"])
@jwt_required()
def list_medicines():
    """
    List all medicines belonging to the authenticated user.
    Supports optional ?search= query param to filter by name/purpose.
    """
    user_id = int(get_jwt_identity())
    search = request.args.get("search", "").strip()

    query = Medicine.query.filter_by(user_id=user_id)

    if search:
        like_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Medicine.medicine_name.ilike(like_pattern),
                Medicine.purpose.ilike(like_pattern),
            )
        )

    medicines = query.order_by(Medicine.created_at.desc()).all()

    return jsonify(
        {
            "success": True,
            "count": len(medicines),
            "medicines": [m.to_dict() for m in medicines],
        }
    )


@medicine_bp.route("/<int:medicine_id>", methods=["GET"])
@jwt_required()
def get_medicine(medicine_id):
    """Get a single medicine by id."""
    user_id = int(get_jwt_identity())
    medicine = _get_owned_medicine(medicine_id, user_id)

    if not medicine:
        return _error("Medicine not found.", 404)

    return jsonify({"success": True, "medicine": medicine.to_dict()})


@medicine_bp.route("/<int:medicine_id>", methods=["PUT"])
@jwt_required()
def update_medicine(medicine_id):
    """Update an existing medicine's fields."""
    user_id = int(get_jwt_identity())
    medicine = _get_owned_medicine(medicine_id, user_id)

    if not medicine:
        return _error("Medicine not found.", 404)

    data = request.get_json(silent=True) or {}

    if "medicine_name" in data:
        name = (data.get("medicine_name") or "").strip()
        if not name:
            return _error("Medicine name cannot be empty.")
        medicine.medicine_name = name

    if "frequency" in data:
        if data["frequency"] not in VALID_FREQUENCIES:
            return _error(f"Frequency must be one of {sorted(VALID_FREQUENCIES)}.")
        medicine.frequency = data["frequency"]

    if "reminder_time" in data and data["reminder_time"]:
        try:
            hour, minute = map(int, data["reminder_time"].split(":"))
            if not (0 <= hour < 24 and 0 <= minute < 60):
                raise ValueError
            medicine.reminder_time = data["reminder_time"]
        except ValueError:
            return _error("reminder_time must be in HH:MM 24-hour format.")

    try:
        if "start_date" in data:
            medicine.start_date = _parse_date(data["start_date"])
        if "end_date" in data:
            medicine.end_date = _parse_date(data["end_date"])
    except ValueError as e:
        return _error(str(e))

    if (
        medicine.start_date
        and medicine.end_date
        and medicine.end_date < medicine.start_date
    ):
        return _error("end_date cannot be before start_date.")

    if "dosage" in data:
        medicine.dosage = (data.get("dosage") or "").strip() or None
    if "purpose" in data:
        medicine.purpose = (data.get("purpose") or "").strip() or None
    if "notes" in data:
        medicine.notes = (data.get("notes") or "").strip() or None
    if "status" in data:
        if data["status"] not in VALID_STATUSES:
            return _error(f"Status must be one of {sorted(VALID_STATUSES)}.")
        medicine.status = data["status"]

    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "Medicine updated successfully.",
            "medicine": medicine.to_dict(),
        }
    )


@medicine_bp.route("/<int:medicine_id>", methods=["DELETE"])
@jwt_required()
def delete_medicine(medicine_id):
    """Delete a medicine (and its history, via cascade)."""
    user_id = int(get_jwt_identity())
    medicine = _get_owned_medicine(medicine_id, user_id)

    if not medicine:
        return _error("Medicine not found.", 404)

    db.session.delete(medicine)
    db.session.commit()

    return jsonify({"success": True, "message": "Medicine deleted successfully."})


@medicine_bp.route("/<int:medicine_id>/take", methods=["POST"])
@jwt_required()
def mark_taken(medicine_id):
    """Mark today's dose of a medicine as taken."""
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
    db.session.add(entry)
    db.session.commit()

    return (
        jsonify(
            {
                "success": True,
                "message": f"{medicine.medicine_name} marked as taken.",
                "history": entry.to_dict(),
            }
        ),
        201,
    )


@medicine_bp.route("/<int:medicine_id>/skip", methods=["POST"])
@jwt_required()
def mark_skipped(medicine_id):
    """Mark today's dose of a medicine as skipped."""
    user_id = int(get_jwt_identity())
    medicine = _get_owned_medicine(medicine_id, user_id)

    if not medicine:
        return _error("Medicine not found.", 404)

    entry = History(medicine_id=medicine.id, taken_time=datetime.now(), status="skipped")
    db.session.add(entry)
    db.session.commit()

    return (
        jsonify(
            {
                "success": True,
                "message": f"{medicine.medicine_name} marked as skipped.",
                "history": entry.to_dict(),
            }
        ),
        201,
    )


@medicine_bp.route("/<int:medicine_id>/history", methods=["GET"])
@jwt_required()
def get_history(medicine_id):
    """View the full dose history of a medicine, most recent first."""
    user_id = int(get_jwt_identity())
    medicine = _get_owned_medicine(medicine_id, user_id)

    if not medicine:
        return _error("Medicine not found.", 404)

    history = sorted(medicine.history, key=lambda h: h.taken_time, reverse=True)

    return jsonify(
        {
            "success": True,
            "medicine": medicine.to_dict(),
            "history": [h.to_dict() for h in history],
        }
    )
