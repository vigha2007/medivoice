"""
database.py
------------
Initializes the SQLAlchemy database instance.
This is kept in its own module (separate from app.py) to avoid
circular imports between app.py, models.py and routes.py.
"""

from flask_sqlalchemy import SQLAlchemy

# Single shared SQLAlchemy instance used across the whole backend
db = SQLAlchemy()
