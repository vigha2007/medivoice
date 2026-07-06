"""
models.py
----------
SQLAlchemy ORM models for MediVoice.

Tables:
    - User      : registered application users
    - Medicine  : medicines added by a user, with reminder configuration
    - History   : log of taken / missed / skipped doses for a medicine

Only the User model is actively used by Module 1 (Authentication).
Medicine and History are defined now so the schema is complete and
ready for Module 3 (Medicine CRUD) and Module 4 (Reminder Scheduler)
without requiring a migration later.
"""

from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from database import db


class User(db.Model):
    """Represents a registered user of the application."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Module 6: Browser & Voice Notification preferences
    notif_browser_enabled = db.Column(db.Boolean, default=True, nullable=False)
    notif_voice_enabled = db.Column(db.Boolean, default=True, nullable=False)
    notif_alarm_enabled = db.Column(db.Boolean, default=True, nullable=False)

    # One user can have many medicines
    medicines = db.relationship(
        "Medicine", backref="owner", lazy=True, cascade="all, delete-orphan"
    )

    def set_password(self, raw_password: str) -> None:
        """Hash and store the given plaintext password."""
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        """Verify a plaintext password against the stored hash."""
        return check_password_hash(self.password_hash, raw_password)

    def to_dict(self) -> dict:
        """Serialize user (excluding sensitive fields) for JSON responses."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "notification_preferences": {
                "browser_enabled": self.notif_browser_enabled,
                "voice_enabled": self.notif_voice_enabled,
                "alarm_enabled": self.notif_alarm_enabled,
            },
        }


class Medicine(db.Model):
    """Represents a medicine entry configured by a user."""

    __tablename__ = "medicines"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    medicine_name = db.Column(db.String(150), nullable=False)
    dosage = db.Column(db.String(80))
    purpose = db.Column(db.String(255))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    reminder_time = db.Column(db.String(5))  # stored as "HH:MM"
    frequency = db.Column(db.String(20), default="Daily")  # Daily/Weekly/Monthly
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default="active")  # active/completed/paused
    snoozed_until = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    history = db.relationship(
        "History", backref="medicine", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "medicine_name": self.medicine_name,
            "dosage": self.dosage,
            "purpose": self.purpose,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "reminder_time": self.reminder_time,
            "frequency": self.frequency,
            "notes": self.notes,
            "status": self.status,
            "snoozed_until": self.snoozed_until.isoformat()
            if self.snoozed_until
            else None,
        }


class History(db.Model):
    """Represents a single dose event (taken/missed/skipped) for a medicine."""

    __tablename__ = "history"

    id = db.Column(db.Integer, primary_key=True)
    medicine_id = db.Column(db.Integer, db.ForeignKey("medicines.id"), nullable=False)
    taken_time = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default="taken")  # taken/missed/skipped

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "medicine_id": self.medicine_id,
            "taken_time": self.taken_time.isoformat() if self.taken_time else None,
            "status": self.status,
        }
