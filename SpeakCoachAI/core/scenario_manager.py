from __future__ import annotations

from pathlib import Path

import yaml
from pydantic import ValidationError

from models.schemas import Scenario


class ScenarioManager:
    """Loads and validates speaking practice scenarios from YAML."""

    def __init__(self, config_path: str | Path) -> None:
        self.config_path = Path(config_path)
        self._scenarios = self._load_scenarios()

    def _load_scenarios(self) -> dict[str, Scenario]:
        if not self.config_path.exists():
            raise FileNotFoundError(f"Scenario config not found: {self.config_path}")

        with self.config_path.open("r", encoding="utf-8") as file:
            raw_data = yaml.safe_load(file) or {}

        raw_scenarios = raw_data.get("scenarios", [])
        if not isinstance(raw_scenarios, list):
            raise ValueError("Scenario config must contain a 'scenarios' list.")

        scenarios: dict[str, Scenario] = {}
        for item in raw_scenarios:
            try:
                scenario = Scenario.model_validate(item)
            except ValidationError as exc:
                raise ValueError(f"Invalid scenario config: {item}") from exc

            if scenario.id in scenarios:
                raise ValueError(f"Duplicate scenario id: {scenario.id}")
            scenarios[scenario.id] = scenario

        if not scenarios:
            raise ValueError("At least one scenario must be configured.")

        return scenarios

    def list_scenarios(self) -> list[Scenario]:
        return list(self._scenarios.values())

    def get_scenario(self, scenario_id: str) -> Scenario:
        try:
            return self._scenarios[scenario_id]
        except KeyError as exc:
            raise KeyError(f"Unknown scenario id: {scenario_id}") from exc

    def get_default_scenario(self) -> Scenario:
        return self.list_scenarios()[0]
