# SpeakCoach AI Architecture

当前文档为基础工程骨架说明，后续会随着 LLM、ASR、TTS、存储和报告模块完善。

## 模块职责

- `app.py`：Streamlit 前端入口，负责页面布局和用户交互。
- `config/scenarios.yaml`：场景配置文件，统一管理角色、难度、目标和开场白。
- `models/schemas.py`：Pydantic 数据模型，作为模块之间的数据契约。
- `core/scenario_manager.py`：加载、校验和查询场景。
- `llm/provider.py`：统一 LLM Provider 接口。
- `speech/asr.py`：ASR Provider 接口。
- `speech/tts.py`：TTS Provider 接口。
- `storage/repository.py`：练习记录和报告的存储接口。

## 数据流规划

1. 用户在页面选择场景。
2. `ScenarioManager` 从 YAML 加载场景并返回 `Scenario`。
3. 后续迭代中，用户上传音频后由 ASR 转写。
4. `DialogueManager` 构造 Prompt 并调用 LLM。
5. `CorrectionManager` 根据纠错模式输出结构化纠错。
6. `ScoringService` 计算维度评分。
7. `ReportGenerator` 汇总课后报告。
8. `PracticeRepository` 保存历史记录。
