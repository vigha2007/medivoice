"""
config.py
----------
Central configuration for the MediVoice Flask backend.
Reads sensitive values from environment variables where possible,
falling back to sane local-development defaults.
"""

import os
from datetime import timedelta

# Base directory of the backend folder
BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Base configuration shared by all environments."""

    # --- Flask / general ---
    SECRET_KEY = os.environ.get(
        "SECRET_KEY", "medivoice-dev-secret-key-change-me-please-32bytes"
    )

    # --- Database ---
    # Default: local SQLite file stored inside backend/instance/medicine.db
    _raw_db_url = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'medicine.db')}",
    )
    # Render (and Heroku) provide Postgres URLs as "postgres://", but
    # SQLAlchemy 2.x / psycopg2 require the "postgresql://" scheme.
    if _raw_db_url.startswith("postgres://"):
        _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = _raw_db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- JWT ---
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY", "medivoice-jwt-secret-change-me-please-32-bytes-long"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    # --- CORS ---
    # Comma separated list of allowed origins (frontend dev server by default)
    CORS_ORIGINS = os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


# Select config based on FLASK_ENV, default to development
config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
