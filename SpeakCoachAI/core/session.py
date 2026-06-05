from __future__ import annotations

from datetime import datetime, timezone

from models.schemas import CorrectionMode, DialogueMessage, MessageRole, PracticeSession, Scenario


class SessionService:
    """Minimal session helper; full persistence will be added in later iterations."""

    def create_session(self, scenario: Scenario, correction_mode: CorrectionMode | None = None) -> PracticeSession:
        return PracticeSession(
            scenario_id=scenario.id,
            scenario_name=scenario.name,
            correction_mode=correction_mode or scenario.correction_mode,
            messages=[
                DialogueMessage(role=MessageRole.ASSISTANT, content=scenario.opening_message),
            ],
        )

    def add_message(self, session: PracticeSession, role: MessageRole, content: str) -> PracticeSession:
        session.messages.append(DialogueMessage(role=role, content=content))
        return session

    def end_session(self, session: PracticeSession) -> PracticeSession:
        session.ended_at = datetime.now(timezone.utc)
        return session
