from __future__ import annotations

from models.schemas import PracticeReport, PracticeSession


class PracticeRepository:
    """Storage interface shell. JSON or SQLite persistence will be added later."""

    def save_session(self, session: PracticeSession) -> None:
        raise NotImplementedError("Session persistence is not implemented in the skeleton version.")

    def save_report(self, report: PracticeReport) -> None:
        raise NotImplementedError("Report persistence is not implemented in the skeleton version.")

    def list_reports(self) -> list[PracticeReport]:
        raise NotImplementedError("Report listing is not implemented in the skeleton version.")
