from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from models.schemas import ASRTranscription


class ASRProvider(ABC):
    """ASR provider interface. Real providers and mock providers share this contract."""

    @abstractmethod
    def transcribe(self, audio_path: str | Path) -> ASRTranscription:
        raise NotImplementedError
