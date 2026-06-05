from __future__ import annotations

from typing import Protocol

from models.schemas import PracticeSession, Scenario


class DialogueProvider(Protocol):
    def generate_reply(self, scenario: Scenario, session: PracticeSession, user_input: str) -> str:
        """Generate the next assistant reply."""
        ...


class DialogueManager:
    """Placeholder dialogue manager; real LLM orchestration comes next."""

    def __init__(self, provider: DialogueProvider | None = None) -> None:
        self.provider = provider

    def generate_reply(self, scenario: Scenario, session: PracticeSession, user_input: str) -> str:
        if self.provider is None:
            raise NotImplementedError("Dialogue provider is not configured yet.")
        return self.provider.generate_reply(scenario, session, user_input)
