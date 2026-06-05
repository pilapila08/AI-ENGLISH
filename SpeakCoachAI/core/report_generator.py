from __future__ import annotations

from models.schemas import PracticeReport, PracticeSession, ScoreResult


class ReportGenerator:
    """Interface shell for post-practice report generation."""

    def generate(self, session: PracticeSession, score: ScoreResult) -> PracticeReport:
        raise NotImplementedError("Report generation will be implemented in the next iteration.")
