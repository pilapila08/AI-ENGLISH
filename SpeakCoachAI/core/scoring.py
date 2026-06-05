from __future__ import annotations

from models.schemas import PracticeSession, ScoreResult


class ScoringService:
    """Interface shell for scoring spoken English performance."""

    def score(self, session: PracticeSession) -> ScoreResult:
        raise NotImplementedError("Scoring logic will be implemented in the next iteration.")
