"""
routes/dashboard_routes.py
----------------------------
Module 2: Dashboard

Endpoint:
    GET /api/dashboard/stats -> aggregated counts + today's medicine list
                                 for the currently authenticated user.

Definitions used for the stats:
    - total_medicines     : all medicines belonging to the user (any status)
    - today_medicines     : active medicines whose schedule includes today
                             (based on start_date/end_date and frequency)
    - upcoming_reminders  : today's medicines whose reminder_time is still
                             ahead of the current server time and have not
                             yet been marked taken today
    - missed_medicines    : today's medicines whose reminder_time has
                             already passed and have NOT been marked taken
    - taken_today         : today's medicines already marked taken today
"""

from datetime import datetime

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import Medicine
from reminder import (
    is_scheduled_today,
    has_resolved_dose_today,
    get_reminder_datetime,
)

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """Return aggregated dashboard statistics for the logged-in user."""
    user_id = int(get_jwt_identity())
    now = datetime.now()
    today = now.date()

    all_medicines = Medicine.query.filter_by(user_id=user_id).all()

    total_medicines = len(all_medicines)

    todays_medicines = [m for m in all_medicines if is_scheduled_today(m, today)]

    upcoming = []
    missed = []
    taken_today_list = []

    for medicine in todays_medicines:
        if has_resolved_dose_today(medicine, today, statuses=("taken",)):
            taken_today_list.append(medicine)
            continue

        reminder_dt = get_reminder_datetime(medicine, today)

        if reminder_dt >= now:
            upcoming.append(medicine)
        else:
            missed.append(medicine)

    adherence_percent = 0
    if todays_medicines:
        adherence_percent = round(
            (len(taken_today_list) / len(todays_medicines)) * 100
        )

    return jsonify(
        {
            "success": True,
            "stats": {
                "total_medicines": total_medicines,
                "today_medicines_count": len(todays_medicines),
                "upcoming_reminders_count": len(upcoming),
                "missed_medicines_count": len(missed),
                "taken_today_count": len(taken_today_list),
                "adherence_percent": adherence_percent,
            },
            "today_medicines": [m.to_dict() for m in todays_medicines],
            "upcoming_reminders": [m.to_dict() for m in upcoming],
            "missed_medicines": [m.to_dict() for m in missed],
            "date": today.isoformat(),
        }
    )
