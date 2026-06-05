from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from models.schemas import TTSResult


class TTSProvider(ABC):
    """TTS provider interface. The edge-tts implementation will be added later."""

    @abstractmethod
    def synthesize(self, text: str, output_dir: str | Path) -> TTSResult:
        raise NotImplementedError
