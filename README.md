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
