from __future__ import annotations

from pathlib import Path


SUPPORTED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".flac", ".webm"}


def is_supported_audio_file(path: str | Path) -> bool:
    return Path(path).suffix.lower() in SUPPORTED_AUDIO_EXTENSIONS
