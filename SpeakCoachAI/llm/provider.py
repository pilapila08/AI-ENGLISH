from __future__ import annotations

from abc import ABC, abstractmethod

from models.schemas import DialogueMessage


class LLMProvider(ABC):
    """Unified LLM interface for OpenAI-compatible providers."""

    @abstractmethod
    def chat(self, messages: list[DialogueMessage], *, temperature: float = 0.7) -> str:
        raise NotImplementedError
