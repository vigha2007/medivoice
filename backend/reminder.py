"""
reminder.py
------------
Module 4: Reminder Scheduler

This module contains:
    1. Shared scheduling helpers (is a medicine due today / right now)
       used by both the dashboard, the medicine routes, and the
       reminder API.
    2. An APScheduler background job that runs once a minute to
       automatically log a "missed" History entry for any medicine
       whose reminder window has passed without being taken, skipped,
       or snoozed. This keeps adherence reports (Module 7) accurate
       even if the user never opens the app to see a popup.

Note on voice/alarm playback:
    The *server* schedules and tracks reminder timing, but the actual
    alarm sound, browser popup, and spoken notification ("It is time to
    take your ...") are triggered client-side in the browser (Web Audio
    + Web Speech APIs), driven by the frontend polling
    GET /api/reminders/due. A server-side TTS engine (pyttsx3) speaks on
    the machine running the Flask process, not on the user's device, so
    it is not used for the in-browser reminder voice — see
    voice.py for how pyttsx3 IS used, for the voice assistant's
    server-rendered responses.
"""

import atexit
from datetime import datetime, date, timedelta

from apscheduler.schedulers.background import BackgroundScheduler

from database import db
from models import Medicine, History

# How long after the scheduled time a dose is still shown as "upcoming"
# before being swept into "missed" by the background job.
MISSED_GRACE_PERIOD_MINUTES = 15


def is_scheduled_today(medicine: Medicine, today: date) -> bool:
    """
    Determine whether a given medicine is scheduled to be taken today,
    based on its start/end date window and frequency.
    """
    if medicine.status != "active":
        return False

    if medicine.start_date and today < medicine.start_date:
        return False
    if medicine.end_date and today > medicine.end_date:
        return False

    frequency = (medicine.frequency or "Daily").lower()

    if frequency == "daily":
        return True
    if frequency == "weekly":
        anchor = medicine.start_date or today
        return anchor.weekday() == today.weekday()
    if frequency == "monthly":
        anchor = medicine.start_date or today
        return anchor.day == today.day

    return True


def has_resolved_dose_today(medicine: Medicine, today: date, statuses=("taken",)) -> bool:
    """Check whether this medicine already has a history entry with one
    of the given statuses recorded today."""
    for entry in medicine.history:
        if entry.status in statuses and entry.taken_time.date() == today:
            return True
    return False


def get_reminder_datetime(medicine: Medicine, today: date) -> datetime:
    """Combine a medicine's reminder_time (HH:MM) with today's date."""
    reminder_time_str = medicine.reminder_time or "09:00"
    try:
        hour, minute = map(int, reminder_time_str.split(":"))
        return datetime.combine(today, datetime.min.time().replace(hour=hour, minute=minute))
    except (ValueError, AttributeError):
        return datetime.combine(today, datetime.min.time())


def is_currently_snoozed(medicine: Medicine, now: datetime) -> bool:
    """True if the medicine has an active snooze that hasn't expired yet."""
    return bool(medicine.snoozed_until and medicine.snoozed_until > now)


def get_due_reminders_for_user(user_id: int):
    """
    Return the list of Medicine objects that are due RIGHT NOW for the
    given user: scheduled today, reminder time has arrived, not already
    taken/skipped today, and not currently snoozed.
    """
    now = datetime.now()
    today = now.date()

    medicines = Medicine.query.filter_by(user_id=user_id, status="active").all()
    due = []

    for medicine in medicines:
        if not is_scheduled_today(medicine, today):
            continue
        if has_resolved_dose_today(medicine, today, statuses=("taken", "skipped")):
            continue
        if is_currently_snoozed(medicine, now):
            continue

        reminder_dt = get_reminder_datetime(medicine, today)
        if reminder_dt <= now:
            due.append(medicine)

    return due


def sweep_missed_doses(app):
    """
    Background job body: for every user, find active medicines whose
    reminder time + grace period has elapsed today without being
    taken/skipped/snoozed, and log a 'missed' History entry (once).

    Runs inside a Flask app context because it needs DB access outside
    of a normal request.
    """
    with app.app_context():
        now = datetime.now()
        today = now.date()

        medicines = Medicine.query.filter_by(status="active").all()
        created = 0

        for medicine in medicines:
            if not is_scheduled_today(medicine, today):
                continue
            if has_resolved_dose_today(
                medicine, today, statuses=("taken", "skipped", "missed")
            ):
                continue
            if is_currently_snoozed(medicine, now):
                continue

            reminder_dt = get_reminder_datetime(medicine, today)
            grace_deadline = reminder_dt + timedelta(minutes=MISSED_GRACE_PERIOD_MINUTES)

            if now >= grace_deadline:
                entry = History(
                    medicine_id=medicine.id, taken_time=now, status="missed"
                )
                db.session.add(entry)
                created += 1

        if created:
            db.session.commit()


def init_scheduler(app) -> BackgroundScheduler:
    """
    Create, configure, and start the APScheduler background scheduler.
    Registers the missed-dose sweep to run every minute, and ensures
    the scheduler shuts down cleanly when the process exits.
    """
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(
        func=lambda: sweep_missed_doses(app),
        trigger="interval",
        minutes=1,
        id="sweep_missed_doses",
        replace_existing=True,
    )
    scheduler.start()
    atexit.register(lambda: scheduler.shutdown(wait=False))
    return scheduler
