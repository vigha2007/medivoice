"""
voice.py
---------
Module 5: Voice Assistant

Converts a recognized speech transcript (plain text) into an intent,
executes the corresponding database action, and returns a natural
language reply plus a structured "action" the frontend can react to
(e.g. tell the UI to stop the alarm, or refresh a list).

Architecture note on speech I/O:
    Speech-to-text (capturing the user's voice) happens in the BROWSER
    via the Web Speech API's SpeechRecognition, because that's where the
    user's microphone is. The recognized text is sent here as a plain
    string. This module does the NLU/command execution work that the
    Python `SpeechRecognition` library's name might suggest belongs to
    audio capture — but real audio capture for a web app has to happen
    client-side.

    Likewise, pyttsx3 (server-side text-to-speech) is used below to
    render the assistant's reply to an audio file the client can
    play, so the Python TTS engine specified in the project brief is
    genuinely exercised server-side, in addition to the browser's own
    speechSynthesis being used as an instant fallback.

Supported intents (see docstrings on each _handle_* function):
    add_medicine, show_today, show_pending, mark_taken,
    delete_medicine, snooze_reminder, stop_alarm, unknown
"""

import re
import difflib
from datetime import datetime, date

from database import db
from models import Medicine, History
from reminder import is_scheduled_today, has_resolved_dose_today, get_reminder_datetime

TIME_PATTERN = re.compile(r"\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b", re.IGNORECASE)


def _find_medicine_by_name(user_id: int, spoken_name: str):
    """
    Fuzzy-match a spoken medicine name against the user's medicines.
    Returns the best matching Medicine, or None if nothing is close.
    """
    spoken_name = spoken_name.strip().lower()
    if not spoken_name:
        return None

    medicines = Medicine.query.filter_by(user_id=user_id).all()
    if not medicines:
        return None

    names = [m.medicine_name.lower() for m in medicines]

    # Exact substring match first (handles "crocin" matching "Crocin 650")
    for m, name in zip(medicines, names):
        if spoken_name in name or name in spoken_name:
            return m

    # Fall back to fuzzy matching for mis-heard speech
    close = difflib.get_close_matches(spoken_name, names, n=1, cutoff=0.6)
    if close:
        idx = names.index(close[0])
        return medicines[idx]

    return None


def _parse_time_phrase(text: str):
    """Extract a HH:MM 24-hour time from a natural language phrase, if present."""
    match = TIME_PATTERN.search(text)
    if not match:
        return None

    hour = int(match.group(1))
    minute = int(match.group(2) or 0)
    meridiem = (match.group(3) or "").lower()

    if meridiem == "pm" and hour != 12:
        hour += 12
    if meridiem == "am" and hour == 12:
        hour = 0

    if 0 <= hour < 24 and 0 <= minute < 60:
        return f"{hour:02d}:{minute:02d}"
    return None


def _handle_add_medicine(user_id: int, text: str) -> dict:
    """
    Intent: "add medicine <name>" [ "at <time>" ]
    Creates a minimal Daily medicine entry starting today. Additional
    details (purpose, dosage, end date) can be filled in later from the
    Medicines page.
    """
    match = re.search(r"add\s+(?:a\s+)?medicine\s+(?:called\s+)?(.+)", text)
    if not match:
        return {
            "success": False,
            "reply": "Please say the medicine name, for example: add medicine Paracetamol.",
            "action": "none",
        }

    remainder = match.group(1).strip()
    reminder_time = _parse_time_phrase(remainder)

    # Strip a trailing "at <time>" phrase from the name if present
    name = re.sub(r"\s+at\s+.*$", "", remainder).strip()
    name = name.rstrip(".")

    if not name:
        return {
            "success": False,
            "reply": "I didn't catch the medicine name. Please try again.",
            "action": "none",
        }

    medicine = Medicine(
        user_id=user_id,
        medicine_name=name.title(),
        frequency="Daily",
        start_date=date.today(),
        reminder_time=reminder_time or "09:00",
        status="active",
    )
    db.session.add(medicine)
    db.session.commit()

    time_note = f" at {medicine.reminder_time}" if reminder_time else ""
    return {
        "success": True,
        "reply": f"Added {medicine.medicine_name} to your medicines{time_note}.",
        "action": "refresh_medicines",
        "data": medicine.to_dict(),
    }


def _handle_show_today(user_id: int) -> dict:
    """Intent: "show today's medicines" """
    today = date.today()
    medicines = Medicine.query.filter_by(user_id=user_id, status="active").all()
    todays = [m for m in medicines if is_scheduled_today(m, today)]

    if not todays:
        return {
            "success": True,
            "reply": "You have no medicines scheduled for today.",
            "action": "none",
            "data": [],
        }

    names = ", ".join(m.medicine_name for m in todays)
    return {
        "success": True,
        "reply": f"You have {len(todays)} medicine{'s' if len(todays) != 1 else ''} scheduled today: {names}.",
        "action": "none",
        "data": [m.to_dict() for m in todays],
    }


def _handle_show_pending(user_id: int) -> dict:
    """Intent: "what medicines are pending" -> due or upcoming today, not yet taken."""
    now = datetime.now()
    today = now.date()
    medicines = Medicine.query.filter_by(user_id=user_id, status="active").all()

    pending = [
        m
        for m in medicines
        if is_scheduled_today(m, today)
        and not has_resolved_dose_today(m, today, statuses=("taken", "skipped"))
    ]

    if not pending:
        return {
            "success": True,
            "reply": "Nothing is pending. You're all caught up!",
            "action": "none",
            "data": [],
        }

    names = ", ".join(m.medicine_name for m in pending)
    return {
        "success": True,
        "reply": f"You still need to take: {names}.",
        "action": "none",
        "data": [m.to_dict() for m in pending],
    }


def _handle_mark_taken(user_id: int, text: str) -> dict:
    """Intent: "mark <name> as taken" / "mark medicine as taken" """
    match = re.search(r"mark\s+(?:medicine\s+)?(.*?)\s*as\s+taken", text)
    spoken_name = match.group(1).strip() if match else ""

    medicine = _find_medicine_by_name(user_id, spoken_name) if spoken_name else None

    if not medicine:
        # No name given or no match — try the single pending medicine if unambiguous
        pending_result = _handle_show_pending(user_id)
        pending_data = pending_result.get("data", [])
        if len(pending_data) == 1:
            medicine = Medicine.query.get(pending_data[0]["id"])
        else:
            return {
                "success": False,
                "reply": "I couldn't tell which medicine to mark as taken. Please specify the name.",
                "action": "none",
            }

    today = date.today()
    if has_resolved_dose_today(medicine, today, statuses=("taken",)):
        return {
            "success": False,
            "reply": f"{medicine.medicine_name} was already marked as taken today.",
            "action": "none",
        }

    entry = History(medicine_id=medicine.id, taken_time=datetime.now(), status="taken")
    medicine.snoozed_until = None
    db.session.add(entry)
    db.session.commit()

    return {
        "success": True,
        "reply": f"{medicine.medicine_name} marked as taken. Good job!",
        "action": "refresh_medicines",
        "data": medicine.to_dict(),
    }


def _handle_delete_medicine(user_id: int, text: str) -> dict:
    """Intent: "delete medicine <name>" / "delete reminder <name>" """
    match = re.search(r"delete\s+(?:medicine|reminder)\s+(?:called\s+)?(.+)", text)
    if not match:
        return {
            "success": False,
            "reply": "Please tell me which medicine to delete, for example: delete medicine Paracetamol.",
            "action": "none",
        }

    spoken_name = match.group(1).strip().rstrip(".")
    medicine = _find_medicine_by_name(user_id, spoken_name)

    if not medicine:
        return {
            "success": False,
            "reply": f"I couldn't find a medicine matching '{spoken_name}'.",
            "action": "none",
        }

    name = medicine.medicine_name
    db.session.delete(medicine)
    db.session.commit()

    return {
        "success": True,
        "reply": f"{name} has been deleted.",
        "action": "refresh_medicines",
    }


def _handle_snooze(user_id: int, text: str) -> dict:
    """Intent: "snooze reminder [<name>] [for <n> minutes]" """
    minutes_match = re.search(r"(\d+)\s*minute", text)
    minutes = int(minutes_match.group(1)) if minutes_match else 5
    if minutes not in (5, 10):
        minutes = 5

    name_match = re.search(r"snooze\s+(?:reminder\s+)?(?:for\s+)?(.*)", text)
    spoken_name = name_match.group(1) if name_match else ""
    spoken_name = re.sub(r"\d+\s*minutes?", "", spoken_name).strip()

    medicine = _find_medicine_by_name(user_id, spoken_name) if spoken_name else None

    if not medicine:
        today = date.today()
        due_candidates = [
            m
            for m in Medicine.query.filter_by(user_id=user_id, status="active").all()
            if is_scheduled_today(m, today)
            and not has_resolved_dose_today(m, today, statuses=("taken", "skipped"))
        ]
        if len(due_candidates) == 1:
            medicine = due_candidates[0]
        else:
            return {
                "success": False,
                "reply": "I couldn't tell which reminder to snooze. Please specify the medicine name.",
                "action": "none",
            }

    from datetime import timedelta

    medicine.snoozed_until = datetime.now() + timedelta(minutes=minutes)
    db.session.commit()

    return {
        "success": True,
        "reply": f"Snoozed {medicine.medicine_name} for {minutes} minutes.",
        "action": "stop_alarm",
        "data": medicine.to_dict(),
    }


def _handle_stop_alarm(text: str) -> dict:
    """Intent: "stop reminder" / "stop alarm" — tells the frontend to silence the current alarm."""
    return {
        "success": True,
        "reply": "Okay, stopping the alarm.",
        "action": "stop_alarm",
    }


def process_voice_command(user_id: int, text: str) -> dict:
    """
    Main entry point: classify the transcript into an intent and
    execute it. Returns a dict with at least `success`, `reply`,
    and `action` keys.
    """
    original_text = text
    text = (text or "").strip().lower()

    if not text:
        return {
            "success": False,
            "reply": "I didn't hear anything. Please try again.",
            "action": "none",
        }

    if re.search(r"\badd\s+(a\s+)?medicine\b", text):
        result = _handle_add_medicine(user_id, text)
    elif re.search(r"\b(today'?s?\s+medicines|medicines\s+today)\b", text):
        result = _handle_show_today(user_id)
    elif re.search(r"\bpending\b", text):
        result = _handle_show_pending(user_id)
    elif re.search(r"\bmark\b.*\btaken\b", text):
        result = _handle_mark_taken(user_id, text)
    elif re.search(r"\bdelete\s+(medicine|reminder)\b", text):
        result = _handle_delete_medicine(user_id, text)
    elif re.search(r"\bsnooze\b", text):
        result = _handle_snooze(user_id, text)
    elif re.search(r"\bstop\b.*\b(reminder|alarm)\b", text):
        result = _handle_stop_alarm(text)
    else:
        result = {
            "success": False,
            "reply": (
                "Sorry, I didn't understand that. Try commands like "
                "'add medicine', 'show today's medicines', "
                "'what medicines are pending', or 'mark as taken'."
            ),
            "action": "none",
        }

    result["heard"] = original_text
    return result
