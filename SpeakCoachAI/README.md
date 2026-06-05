# SpeakCoach AI

SpeakCoach AI 是一个本地可运行的 AI 英语口语场景陪练工具，面向英语面试、点餐、会议、机场出行和自我介绍等真实场景，帮助用户进行半实时语音对话练习、表达纠错、能力评分和课后复盘。

当前版本为基础工程骨架，已完成目录结构、场景配置、Pydantic 数据模型、场景加载模块，以及一个最小可运行的 Streamlit 页面。LLM、ASR、TTS 暂时只保留接口，后续迭代再接入真实服务或 MockProvider。

## 功能规划

- 场景选择：从 YAML 加载英文面试、点餐、会议、机场出行、自我介绍等场景。
- 会话管理：创建练习会话，保存用户与 AI 的多轮对话。
- 语音输入：上传音频并通过 ASR 转写为英文文本。
- AI 对话：基于场景角色和历史对话生成自然追问。
- 纠错模式：支持 immersive、gentle、strict 三种纠错节奏。
- 评分系统：输出发音、语法、流利度、词汇、自然度和综合评分。
- 课后报告：生成优点、待改进问题、推荐表达和学习卡片。
- 历史记录：保存练习记录，便于复盘对比。

## 技术栈

- Python 3.10+
- Streamlit
- Pydantic
- PyYAML
- python-dotenv
- OpenAI Compatible API Provider 接口
- 可扩展 ASR Provider 接口
- 可扩展 TTS Provider 接口

## 快速启动

```bash
cd SpeakCoachAI
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

macOS 或 Linux 可使用：

```bash
source .venv/bin/activate
```

## 环境变量

复制 `.env.example` 为 `.env`，按需填写：

```bash
cp .env.example .env
```

当前骨架版本不要求配置 API Key。后续接入真实 LLM、ASR、TTS 时，会从 `.env` 读取配置。

## 当前项目结构

```text
SpeakCoachAI
├── app.py
├── README.md
├── requirements.txt
├── .env.example
├── config
│   └── scenarios.yaml
├── core
│   ├── session.py
│   ├── scenario_manager.py
│   ├── dialogue_manager.py
│   ├── correction_manager.py
│   ├── scoring.py
│   └── report_generator.py
├── speech
│   ├── asr.py
│   ├── tts.py
│   └── audio_utils.py
├── llm
│   ├── provider.py
│   ├── openai_provider.py
│   └── prompts.py
├── models
│   └── schemas.py
├── storage
│   └── repository.py
├── tests
│   ├── test_scoring.py
│   └── test_prompt_output.py
└── docs
    ├── architecture.md
    ├── design.md
    └── demo_guide.md
```

## Demo 流程初稿

1. 启动 Streamlit 页面。
2. 在左侧选择一个练习场景。
3. 查看场景角色、难度、练习目标和 AI 开场白。
4. 展示后续规划：上传音频、ASR 转写、AI 追问、纠错评分、课后报告和历史记录。

