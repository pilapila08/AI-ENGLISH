from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field, computed_field


class CorrectionMode(str, Enum):
    """纠错节奏会影响对话自然度，先作为配置层和 UI 层共享枚举。"""

    IMMERSIVE = "immersive"
    GENTLE = "gentle"
    STRICT = "strict"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Scenario(BaseModel):
    id: str
    name: str
    description: str
    user_role: str
    ai_role: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    goals: list[str] = Field(default_factory=list)
    opening_message: str
    correction_mode: CorrectionMode = CorrectionMode.GENTLE


class DialogueMessage(BaseModel):
    role: MessageRole
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CorrectionResult(BaseModel):
    original: str
    corrected: str
    error_type: str
    explanation: str
    better_expression: str
    severity: Literal["low", "medium", "high"] = "low"


class ScoreResult(BaseModel):
    pronunciation_score: float = Field(ge=0, le=100)
    grammar_score: float = Field(ge=0, le=100)
    fluency_score: float = Field(ge=0, le=100)
    vocabulary_score: float = Field(ge=0, le=100)
    naturalness_score: float = Field(ge=0, le=100)
    overall_score: float = Field(ge=0, le=100)


class LearningCard(BaseModel):
    title: str
    expression: str
    explanation: str
    example: str


class PracticeSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    scenario_id: str
    scenario_name: str
    correction_mode: CorrectionMode
    messages: list[DialogueMessage] = Field(default_factory=list)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: datetime | None = None

    @computed_field
    @property
    def turn_count(self) -> int:
        return sum(1 for message in self.messages if message.role == MessageRole.USER)


class PracticeReport(BaseModel):
    session_id: str
    scenario_name: str
    started_at: datetime
    ended_at: datetime
    duration_seconds: int
    turn_count: int
    score: ScoreResult
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    corrections: list[CorrectionResult] = Field(default_factory=list)
    recommended_expressions: list[str] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list)
    learning_cards: list[LearningCard] = Field(default_factory=list)


class ASRTranscription(BaseModel):
    text: str
    language: str = "en"
    duration_seconds: float | None = Field(default=None, ge=0)
    provider: str = "mock"


class TTSResult(BaseModel):
    audio_path: str
    provider: str
    voice: str | None = None
