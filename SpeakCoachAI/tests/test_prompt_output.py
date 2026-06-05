from core.scenario_manager import ScenarioManager
from llm.prompts import build_scenario_system_prompt


def test_prompt_contains_roles() -> None:
    manager = ScenarioManager("config/scenarios.yaml")
    scenario = manager.get_scenario("interview")

    prompt = build_scenario_system_prompt(scenario)

    assert scenario.ai_role in prompt
    assert scenario.user_role in prompt
