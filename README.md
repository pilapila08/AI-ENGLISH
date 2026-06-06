# SpeakCoach AI Desktop

SpeakCoach AI Desktop is a local-first English speaking practice client built
with Electron, React, TypeScript, Vite, and TailwindCSS.

This repository currently contains the foundational desktop application only.
LLM, ASR, TTS, scoring, and practice-session features will be added in later
stages.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Windows 10/11 for building the NSIS installer

## Development

```bash
npm install
npm run dev
```

Vite starts the renderer development server, then Electron opens the desktop
window.

## LLM Configuration

Copy `.env.example` to `.env`, then configure an OpenAI Chat Completions
compatible API:

```env
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
USE_MOCK_LLM=false
```

Set `USE_MOCK_LLM=true`, or leave `OPENAI_API_KEY` empty, to run entirely with
the offline MockLLMProvider. If a configured remote provider fails, the current
practice session automatically falls back to the mock provider.

## ASR Configuration

The default ASR provider is the stable offline mock. Supported values are
`mock`, `whisper`, and `mimo`:

```env
ASR_PROVIDER=mock
WHISPER_API_KEY=
WHISPER_BASE_URL=https://api.openai.com/v1
WHISPER_MODEL=whisper-1
```

To use a Whisper-compatible transcription API, set `ASR_PROVIDER=whisper`,
provide an API key, and restart the application. If the Whisper request fails,
the application automatically uses MockASRProvider and shows a fallback warning
without blocking manual text input.

To use Xiaomi MiMo V2.5 ASR:

```env
ASR_PROVIDER=mimo
MIMO_ASR_API_KEY=your-mimo-api-key
MIMO_ASR_BASE_URL=https://api.xiaomimimo.com/v1
MIMO_ASR_MODEL=mimo-v2.5-asr
```

`MIMO_ASR_API_KEY` may be omitted when the Xiaomi key is already configured as
`OPENAI_API_KEY`. Recorded WebM audio is converted to WAV before it is sent to
the Main Process because MiMo V2.5 ASR accepts WAV or MP3 input.

## TTS Configuration

MiMo TTS is used for automatic and manual English reply playback:

```env
TTS_PROVIDER=mimo
MIMO_TTS_API_KEY=your-mimo-api-key
MIMO_TTS_BASE_URL=https://api.xiaomimimo.com/v1
MIMO_TTS_MODEL=mimo-v2.5-tts
MIMO_TTS_VOICE=Chloe
```

`MIMO_TTS_API_KEY` may be omitted to reuse `MIMO_API_KEY` or
`OPENAI_API_KEY`. The API key stays in the Electron Main Process. Replies are
split into sentences, synthesized in parallel, cached in memory, and played in
order to reduce time to first audio. The application does not fall back to
browser Web Speech.

## Build

```bash
npm run build
```

The renderer output is written to `dist/`, and Electron main/preload output is
written to `dist-electron/`.

## Package for Windows

```bash
npm run dist
```

The generated Windows installer is written to `release/`.

## Security Baseline

- Renderer process has no direct Node.js access.
- `contextIsolation` and Electron sandboxing are enabled.
- Future system APIs must be exposed through `electron/preload.ts`.
