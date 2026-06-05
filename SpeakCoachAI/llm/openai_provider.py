from __future__ import annotations

from models.schemas import DialogueMessage

from llm.provider import LLMProvider


class OpenAICompatibleProvider(LLMProvider):
    """Interface placeholder for DeepSeek, Qwen, OpenAI and other compatible APIs."""

    def __init__(self, base_url: str, api_key: str, model: str) -> None:
        self.base_url = base_url
        self.api_key = api_key
        self.model = model

    def chat(self, messages: list[DialogueMessage], *, temperature: float = 0.7) -> str:
        raise NotImplementedError("OpenAI-compatible API calls are not implemented in the skeleton version.")
