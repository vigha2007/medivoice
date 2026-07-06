"""
routes/voice_routes.py
------------------------
Module 5: Voice Assistant

Endpoints:
    POST /api/voice/command -> process a recognized speech transcript
                                and execute the matching action
    POST /api/voice/speak   -> synthesize a short reply to speech using
                                pyttsx3 (server-side TTS), returned as a
                                WAV file the browser can play
"""

import os
import tempfile
import uuid

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from voice import process_voice_command

voice_bp = Blueprint("voice", __name__, url_prefix="/api/voice")


@voice_bp.route("/command", methods=["POST"])
@jwt_required()
def voice_command():
    """
    Accepts a speech-to-text transcript from the browser and executes
    the corresponding voice assistant command.

    Expected JSON body:
        { "text": "show today's medicines" }
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")

    if not isinstance(text, str) or not text.strip():
        return (
            jsonify(
                {
                    "success": False,
                    "reply": "No speech text was received.",
                    "action": "none",
                }
            ),
            400,
        )

    result = process_voice_command(user_id, text)
    status_code = 200 if result.get("success") else 200  # always 200; success flag conveys outcome
    return jsonify(result), status_code


@voice_bp.route("/speak", methods=["POST"])
@jwt_required()
def voice_speak():
    """
    Synthesizes the given text to speech using pyttsx3 and returns a
    WAV audio file. This is an optional enhancement on top of the
    browser's own speechSynthesis (used as the instant, zero-latency
    default) — useful for consistent voice/accent across devices, or
    server environments where pyttsx3 is configured with a specific voice.
    """
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()

    if not text:
        return jsonify({"success": False, "message": "No text provided."}), 400

    try:
        import pyttsx3
    except ImportError:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Server-side text-to-speech (pyttsx3) is not available in this environment.",
                }
            ),
            501,
        )

    import io

    tmp_path = os.path.join(tempfile.gettempdir(), f"medivoice_tts_{uuid.uuid4().hex}.wav")

    try:
        engine = pyttsx3.init()
        engine.setProperty("rate", 165)
        engine.save_to_file(text, tmp_path)
        engine.runAndWait()

        if not os.path.exists(tmp_path):
            raise RuntimeError("TTS engine did not produce an audio file.")

        with open(tmp_path, "rb") as f:
            audio_bytes = f.read()

        return send_file(
            io.BytesIO(audio_bytes),
            mimetype="audio/wav",
            as_attachment=False,
            download_name="reminder.wav",
        )
    except Exception as exc:  # pragma: no cover - depends on system TTS availability
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Text-to-speech failed: {exc}",
                }
            ),
            500,
        )
    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except OSError:
            pass
