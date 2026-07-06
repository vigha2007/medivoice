"""
routes/report_routes.py
--------------------------
Module 7: Reports & Charts

Endpoint:
    GET /api/reports?period=daily|weekly|monthly&date=YYYY-MM-DD

Returns, for the requested period ending on `date` (default: today):
    - per-day breakdown of taken/missed/skipped counts (chart-ready)
    - overall totals and adherence percentage
"""

from datetime import datetime, date, timedelta
from calendar import monthrange

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import Medicine, History

report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

VALID_PERIODS = {"daily", "weekly", "monthly"}


def _error(message: str, status: int = 400):
    return jsonify({"success": False, "message": message}), status


def _date_range_for_period(period: str, anchor: date):
    """Return (start_date, end_date) inclusive for the given period."""
    if period == "daily":
        return anchor, anchor
    if period == "weekly":
        start = anchor - timedelta(days=6)
        return start, anchor
    if period == "monthly":
        start = anchor.replace(day=1)
        _, last_day = monthrange(anchor.year, anchor.month)
        end = anchor.replace(day=last_day)
        return start, end
    raise ValueError("Invalid period")


@report_bp.route("", methods=["GET"])
@jwt_required()
def get_report():
    """Generate an adherence report for the authenticated user."""
    user_id = int(get_jwt_identity())

    period = request.args.get("period", "daily")
    if period not in VALID_PERIODS:
        return _error(f"period must be one of {sorted(VALID_PERIODS)}.")

    date_str = request.args.get("date")
    try:
        anchor = (
            datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else date.today()
        )
    except ValueError:
        return _error("date must be in YYYY-MM-DD format.")

    start_date, end_date = _date_range_for_period(period, anchor)

    medicines = Medicine.query.filter_by(user_id=user_id).all()
    medicine_ids = [m.id for m in medicines]

    history_entries = []
    if medicine_ids:
        history_entries = (
            History.query.filter(History.medicine_id.in_(medicine_ids))
            .filter(History.taken_time >= datetime.combine(start_date, datetime.min.time()))
            .filter(History.taken_time <= datetime.combine(end_date, datetime.max.time()))
            .all()
        )

    # Build a day-by-day breakdown
    day_buckets = {}
    current = start_date
    while current <= end_date:
        day_buckets[current.isoformat()] = {"taken": 0, "missed": 0, "skipped": 0}
        current += timedelta(days=1)

    for entry in history_entries:
        day_key = entry.taken_time.date().isoformat()
        if day_key in day_buckets and entry.status in day_buckets[day_key]:
            day_buckets[day_key][entry.status] += 1

    daily_breakdown = [
        {
            "date": day,
            "taken": counts["taken"],
            "missed": counts["missed"],
            "skipped": counts["skipped"],
        }
        for day, counts in sorted(day_buckets.items())
    ]

    total_taken = sum(d["taken"] for d in daily_breakdown)
    total_missed = sum(d["missed"] for d in daily_breakdown)
    total_skipped = sum(d["skipped"] for d in daily_breakdown)
    total_resolved = total_taken + total_missed + total_skipped

    adherence_percent = (
        round((total_taken / total_resolved) * 100) if total_resolved else 0
    )

    # Per-medicine breakdown (useful for identifying which medicine is most missed)
    per_medicine = []
    for medicine in medicines:
        med_entries = [h for h in history_entries if h.medicine_id == medicine.id]
        taken = sum(1 for h in med_entries if h.status == "taken")
        missed = sum(1 for h in med_entries if h.status == "missed")
        skipped = sum(1 for h in med_entries if h.status == "skipped")
        resolved = taken + missed + skipped
        if resolved == 0:
            continue
        per_medicine.append(
            {
                "medicine_id": medicine.id,
                "medicine_name": medicine.medicine_name,
                "taken": taken,
                "missed": missed,
                "skipped": skipped,
                "adherence_percent": round((taken / resolved) * 100),
            }
        )

    return jsonify(
        {
            "success": True,
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "summary": {
                "total_taken": total_taken,
                "total_missed": total_missed,
                "total_skipped": total_skipped,
                "adherence_percent": adherence_percent,
            },
            "daily_breakdown": daily_breakdown,
            "per_medicine": per_medicine,
        }
    )
