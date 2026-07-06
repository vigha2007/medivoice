"""
app.py
-------
Application factory and entrypoint for the MediVoice backend.

Run locally with:
    python app.py

This will:
    1. Create the Flask app
    2. Configure the database (SQLite by default)
    3. Register all blueprints (routes)
    4. Create database tables if they do not already exist
    5. Start the development server on http://localhost:5000
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import config_by_name
from database import db

# Blueprints are imported inside create_app() to avoid circular imports,
# since each blueprint module imports `db` from database.py.


def create_app(env: str = None) -> Flask:
    """Application factory: builds and configures the Flask app instance."""

    env = env or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_by_name.get(env, config_by_name["development"]))

    # Ensure the instance folder exists (holds the SQLite file)
    os.makedirs(app.instance_path, exist_ok=True)

    # --- Extensions ---
    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # --- Blueprints ---
    from routes.auth_routes import auth_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.medicine_routes import medicine_bp
    from routes.reminder_routes import reminder_bp
    from routes.voice_routes import voice_bp
    from routes.notification_routes import notification_bp
    from routes.report_routes import report_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(medicine_bp)
    app.register_blueprint(reminder_bp)
    app.register_blueprint(voice_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(report_bp)

    # --- Health check ---
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "MediVoice backend"})

    # --- Generic error handlers ---
    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"success": False, "message": "Resource not found."}), 404

    @app.errorhandler(500)
    def server_error(_e):
        return (
            jsonify({"success": False, "message": "Internal server error."}),
            500,
        )

    # --- Create tables on startup (safe if they already exist) ---
    with app.app_context():
        db.create_all()

    # --- Background scheduler (Module 4: Reminder Scheduler) ---
    # Guard against starting twice when Flask's debug reloader spawns a
    # second process (WERKZEUG_RUN_MAIN is only set in the reloaded child).
    if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        from reminder import init_scheduler

        init_scheduler(app)

    return app


# Module-level app instance for WSGI servers (gunicorn app:app)
app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=os.environ.get("FLASK_ENV", "development") == "development",
    )
