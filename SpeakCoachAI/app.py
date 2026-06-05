from pathlib import Path

import streamlit as st

from core.scenario_manager import ScenarioManager
from models.schemas import CorrectionMode


BASE_DIR = Path(__file__).resolve().parent
SCENARIO_PATH = BASE_DIR / "config" / "scenarios.yaml"


def main() -> None:
    st.set_page_config(page_title="SpeakCoach AI", page_icon="SC", layout="wide")

    st.title("SpeakCoach AI")
    st.caption("本地可运行的 AI 英语口语场景陪练工具 - 基础工程骨架")

    manager = ScenarioManager(SCENARIO_PATH)
    scenarios = manager.list_scenarios()

    with st.sidebar:
        st.header("练习设置")
        selected_id = st.selectbox(
            "选择场景",
            options=[scenario.id for scenario in scenarios],
            format_func=lambda scenario_id: manager.get_scenario(scenario_id).name,
        )
        correction_mode = st.selectbox(
            "纠错模式",
            options=[mode.value for mode in CorrectionMode],
            index=1,
        )

    scenario = manager.get_scenario(selected_id)

    st.subheader(scenario.name)
    st.write(scenario.description)

    left, right = st.columns(2)
    with left:
        st.markdown("**用户角色**")
        st.info(scenario.user_role)
        st.markdown("**AI 角色**")
        st.info(scenario.ai_role)

    with right:
        st.markdown("**难度**")
        st.info(scenario.difficulty)
        st.markdown("**当前纠错模式**")
        st.info(correction_mode)

    st.markdown("**练习目标**")
    for goal in scenario.goals:
        st.checkbox(goal, value=True, disabled=True)

    st.markdown("**开场白**")
    st.chat_message("assistant").write(scenario.opening_message)

    st.divider()
    st.warning("当前版本只完成基础工程骨架。LLM、ASR、TTS 将在后续迭代接入。")


if __name__ == "__main__":
    main()
