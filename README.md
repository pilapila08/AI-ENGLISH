# SpeakCoach AI Desktop

SpeakCoach AI Desktop 是一款本地优先的 AI 英语口语陪练桌面客户端。用户可以在英文面试、餐厅点餐、商务会议、机场出行和自我介绍等真实场景中，通过语音或文本与 AI 教练进行对话，并获得实时纠错、多维评分、课后报告与学习卡片。

项目采用 Electron + React + TypeScript + Vite + TailwindCSS 开发。Renderer 只负责界面与交互，文件读写、会话管理、LLM、ASR、TTS 和本地存储均在 Electron Main Process 中完成，并通过安全的 preload API 与 IPC 调用。

## 项目亮点

- AI 语言训练舱风格：深色玻璃拟态、动态语音波形、教练反馈面板与能力仪表盘。
- 五类场景训练：英文面试、餐厅点餐、商务会议、机场出行、自我介绍。
- 一键语音闭环：开始录音后可自动完成转写、提交、AI 回复、纠错和评分。
- 三种纠错模式：沉浸、轻度、严格，兼顾对话自然度与纠错时机。
- 六维能力评分：发音清晰度估算、语法、流利度、词汇、自然度、语境适切度。
- 完整课后报告：优点、待改进点、典型错误、推荐表达、下次练习建议与学习卡片。
- 本地历史记录：结束练习后自动保存，可在报告页查看完整历史分析。
- Provider 降级机制：没有 API Key 或远程服务失败时，自动切换 Mock Provider 或启发式分析，保证 Demo 可运行。

## 界面与交互

主界面采用训练驾驶舱布局：

- 顶部状态栏：当前场景、纠错模式、练习状态、服务状态与自动朗读开关。
- 左侧任务舱：场景卡片、训练目标、AI 角色、用户角色与纠错模式。
- 中间对话区：AI 教练回复、语音转写、文本输入、音色和英语口音选择。
- 右侧反馈区：实时纠错、推荐表达与临时评分。
- 底部语音控制台：开始练习、录音、停止并发送、手动输入和结束练习。

## 技术栈

- Electron 36
- React 19
- TypeScript 5
- Vite 6
- TailwindCSS 3
- electron-builder
- YAML 场景配置
- Node.js 原生测试运行器

## 架构概览

```text
React Renderer
  │
  │ window.speakCoachAPI
  ▼
preload.ts / contextBridge
  │
  │ ipcRenderer.invoke
  ▼
Electron IPC Handlers
  │
  ├─ Session / Dialogue / Correction / Scoring / Report Services
  ├─ LLM / Analysis / ASR / TTS Providers
  ├─ YAML Scenario Service
  └─ JSON Storage Service
```

安全基线：

- Renderer 禁止直接使用 Node.js。
- `contextIsolation`、Electron sandbox 已启用。
- preload 仅暴露白名单 API，不暴露 `ipcRenderer` 本体。
- IPC 参数在 Main Process 中进行校验。
- API Key 只由 Main Process 读取，不会暴露给 Renderer。
- 外部 API 失败时自动降级，不会导致客户端白屏或崩溃。

## 环境要求

- Node.js 20 或更高版本
- npm 10 或更高版本
- Windows 10/11，用于生成 NSIS 安装包
- 使用真实语音服务时需要可用的麦克风和网络连接

## 快速开始

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

Vite 会启动 Renderer 开发服务器，随后 Electron 自动打开桌面客户端。首次录音时需要允许麦克风权限。

项目默认可以在无 API Key 的情况下运行：

- LLM：`MockLLMProvider`
- ASR：`MockASRProvider`
- 纠错与评分：启发式规则
- TTS：未配置时不朗读，但不影响文本对话

## 环境变量配置

客户端会优先检测并使用项目根目录中的 `.env`。检测到有效 `.env` 配置后，API 配置界面只展示当前来源，不要求重复输入。

没有 `.env` 时，点击顶部状态栏中的“API 配置”，只需选择服务商并输入一个 API Key。服务地址、模型和语音能力由客户端自动套用：

| 服务商 | 自动启用能力 |
| --- | --- |
| OpenAI | 文本对话、LLM 纠错评分、Whisper 转写 |
| 小米 MiMo | 文本对话、LLM 纠错评分、MiMo ASR、MiMo TTS |
| DeepSeek | 文本对话、LLM 纠错评分，语音转写使用 Mock |
| 通义千问 | 文本对话、LLM 纠错评分，语音转写使用 Mock |

API Key 由 Electron Main Process 加密保存，Renderer 无法读取已保存的明文。保存后点击“重启并应用”即可生效。

复制环境变量模板：

```powershell
Copy-Item .env.example .env
```

`.env` 已被 Git 忽略，请勿提交真实 API Key。

### 文本对话 LLM

支持 OpenAI Chat Completions Compatible API，例如 OpenAI、DeepSeek、Qwen 或其他兼容服务：

```env
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
USE_MOCK_LLM=false
```

设置 `USE_MOCK_LLM=true`，或不填写 `OPENAI_API_KEY`，将使用 Mock 对话。真实 LLM 调用失败后，也会临时切换至 Mock 模式。

### LLM 纠错与评分

纠错和评分可以复用文本对话模型，也可以单独配置：

```env
USE_LLM_ANALYSIS=true
ANALYSIS_API_KEY=
ANALYSIS_BASE_URL=
ANALYSIS_MODEL=
```

当 `ANALYSIS_*` 留空时，会复用 `OPENAI_*`。设置 `USE_LLM_ANALYSIS=false` 或未配置 API Key 时，系统使用稳定、可解释的启发式规则。

评分维度及综合权重：

| 维度 | 权重 | 当前含义 |
| --- | ---: | --- |
| 发音清晰度估算 | 15% | 基于 ASR 转写完整度估算，不是音素级声学评分 |
| 语法准确度 | 20% | 语法、句式、时态、词形等准确性 |
| 表达流利度 | 15% | 回答完整性、连贯性与多轮持续表达能力 |
| 词汇丰富度 | 15% | 词汇多样性、准确性与场景词汇使用 |
| 表达自然度 | 15% | 口语表达是否自然、礼貌、符合英语习惯 |
| 语境适切度 | 20% | 是否回应上文、符合角色并推进场景目标 |

### ASR 语音转写

`ASR_PROVIDER` 支持 `mock`、`whisper` 和 `mimo`。

Mock 模式：

```env
ASR_PROVIDER=mock
```

Whisper Compatible API：

```env
ASR_PROVIDER=whisper
WHISPER_API_KEY=your-api-key
WHISPER_BASE_URL=https://api.openai.com/v1
WHISPER_MODEL=whisper-1
```

小米 MiMo V2.5 ASR：

```env
ASR_PROVIDER=mimo
MIMO_ASR_API_KEY=your-mimo-api-key
MIMO_ASR_BASE_URL=https://api.xiaomimimo.com/v1
MIMO_ASR_MODEL=mimo-v2.5-asr
```

MiMo ASR 可以复用 `OPENAI_API_KEY`。Renderer 录制的 WebM 音频会在发送到 Main Process 前转换为 WAV，以兼容 MiMo ASR。

真实 ASR 调用失败时，系统会自动使用 Mock 转写并在界面提示当前使用模拟模式。

### MiMo TTS 语音朗读

当前版本使用 MiMo TTS，不使用浏览器 Web Speech：

```env
TTS_PROVIDER=mimo
MIMO_TTS_API_KEY=your-mimo-api-key
MIMO_TTS_BASE_URL=https://api.xiaomimimo.com/v1
MIMO_TTS_MODEL=mimo-v2.5-tts
MIMO_TTS_VOICE=Chloe
```

`MIMO_TTS_API_KEY` 留空时，会尝试复用 `MIMO_API_KEY` 或 `OPENAI_API_KEY`。

可选音色：

- 女声：`Chloe`、`Mia`
- 男声：`Milo`、`Dean`

可选英语表达风格包括国际标准、美式、英式、澳式、爱尔兰、非裔美式、印度和东亚英语。MiMo TTS 当前没有独立的口音参数，因此项目通过自然语言风格指令控制口音，实际效果可能因文本和音色而变化。

TTS 服务会进行句子并行合成、内存缓存和顺序播放，以缩短首段语音等待时间。

## 常用命令

```bash
# 启动开发客户端
npm run dev

# 执行全部测试
npm test

# 构建 Renderer 与 Electron Main/Preload
npm run build

# 构建 Windows NSIS 安装包
npm run dist
```

构建产物：

- Renderer：`dist/`
- Electron Main/Preload：`dist-electron/`
- 测试编译产物：`dist-tests/`
- Windows 安装包：`release/`

## Windows 打包

执行：

```bash
npm run dist
```

electron-builder 会在 `release/` 中生成可安装的 Windows NSIS 程序，安装时允许用户选择安装目录。

注意：

- `.env` 不会被打包进安装程序，这是为了避免泄露 API Key。
- 当前打包版本如需使用真实 API，需要通过运行环境提供对应环境变量。
- 未提供 API Key 时，文本对话与 ASR 仍可使用 Mock 模式完成 Demo。
- 后续可增加系统凭据库与首次启动配置页面，为安装版安全保存用户 API Key。

## 场景配置

场景定义位于：

```text
config/scenarios.yaml
```

每个场景包含：

- `id`
- `name`
- `description`
- `userRole`
- `aiRole`
- `difficulty`
- `goals`
- `openingMessage`
- `sampleQuestions`

场景由 Main Process 读取并解析，Renderer 不直接访问文件系统。YAML 读取失败时会自动使用内置默认场景。

## 本地历史记录

开发环境默认使用项目目录下的 `data/sessions.json`。Electron 启动后会将实际保存路径切换到系统用户数据目录：

```text
<Electron userData>/data/sessions.json
```

历史记录写入采用串行队列和临时文件替换，避免并发保存覆盖。JSON 损坏时会自动备份损坏文件，并以空历史记录继续运行。

## 测试

执行：

```bash
npm test
```

当前测试覆盖：

- 空会话和多错误评分
- LLM 纠错与语境适切度评分
- 完整课后报告生成
- 本地历史保存、读取、损坏数据恢复与并发写入
- Mock ASR + Mock LLM 一键语音对话链路
- 会话并发操作顺序

## Demo 建议流程

1. 启动客户端，展示训练舱界面和五类场景。
2. 选择“英文面试”和严格纠错模式。
3. 点击“开始练习”，展示 AI 开场白与自动朗读。
4. 点击麦克风进行语音回答，停止后自动完成转写和 AI 回复。
5. 展示右侧实时纠错、推荐表达和六维临时评分。
6. 切换不同口音与男女音色，播放 AI 回复。
7. 结束练习，展示课后报告、学习卡片和历史记录。
8. 可断开 API 或启用 Mock，演示服务失败时的稳定降级能力。

## 项目结构

```text
electron/
  ipc/          IPC 通道、处理器与参数校验
  providers/    LLM、分析、ASR、TTS Provider
  services/     会话、对话、纠错、评分、报告和存储服务
src/
  components/   训练舱 UI 组件
  hooks/        会话、录音、语音与一键语音对话 Hooks
  pages/        练习页与历史页
  styles/       TailwindCSS 与通用动画样式
  types/        Renderer 类型与 preload 全局声明
config/         YAML 场景配置
tests/          核心服务测试
```

## 后续方向

- 增加首次启动 API Key 配置页，并使用系统凭据库安全保存。
- 接入音素级发音评测，替换当前 ASR 清晰度估算。
- 增加流式 ASR、流式 LLM 与更低延迟 TTS。
- 将 JSON 历史记录迁移至 SQLite。
- 增加学习趋势、能力雷达图和长期进步分析。
- 增加更多自定义场景、难度等级与训练目标。
