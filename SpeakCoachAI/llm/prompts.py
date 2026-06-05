from __future__ import annotations

from models.schemas import Scenario


def build_scenario_system_prompt(scenario: Scenario) -> str:
    return (
        f"You are {scenario.ai_role}. "
        f"The user is {scenario.user_role}. "
        "Keep each reply natural and concise, usually within 1-3 sentences. "
        "Ask follow-up questions to help the user continue speaking."
    )
