from __future__ import annotations

from models.schemas import CorrectionMode, CorrectionResult


class CorrectionManager:
    """Interface shell for grammar and expression correction."""

    def correct(self, text: str, mode: CorrectionMode) -> list[CorrectionResult]:
        raise NotImplementedError("Correction logic will be implemented in the next iteration.")
