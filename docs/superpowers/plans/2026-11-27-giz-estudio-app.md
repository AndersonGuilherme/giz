# giz Estúdio — Phases 2–4 (AI providers, Electron app, installers) — Implementation Plan

> **Note (2026-11-27):** the project was renamed before its first public release: giz → **Gizzycera**, giz Estúdio → **Gizzycera** (the app), the CLI `giz` → `gizzy`, the rig `giz` → `gizzy`, `giz.config.json` → `gizzycera.config.json`, `GIZ_*` → `GIZZY_*`. This document keeps the names of its time; the README's "Vindo do giz" section maps them.

> **For agentic workers:** executed with superpowers:subagent-driven-development (one implementer + one reviewer per task). Briefs are extracted per task.

**Goal:** a desktop app (Electron, Mac/Windows/Linux) where anyone installs, configures their own AI accounts, writes (or generates) a script, picks/creates characters, generates or uploads scenarios, records voices, reviews each stage and renders the final video — on top of the existing `core/` engine.

**Spec:** `docs/superpowers/specs/2026-11-23-giz-estudio-design.md` (sections 5.1–5.11, phases 2–4 in section 6). User priority (2026-11-27): "o mais importante é terminar o app Electron".

**Architecture decisions (controller rulings):**
- AI providers live inside `core/` (domain ports in `application/ports`, adapters in `infrastructure/ai/…`), not in a separate package — same pattern as the voice providers already in core (M2). The spec's `providers/` folder is folded into core.
- The app lives in `studio/` (Electron Forge + Vite + React + TypeScript). Main process owns files, keys, renders and AI calls by importing core use cases; the renderer only talks to the main process through a typed preload API (contextIsolation on, nodeIntegration off). Remotion renders run in the main process (`@remotion/renderer`, bundle built at package time, compositor binaries unpacked from asar — per the Remotion Electron guide).
- Keys: Electron `safeStorage` (encrypted at rest); never logged; core receives them through a `KeyStore` port (CLI keeps env/~/.config/giz).
- All rules from constraints.md still apply (English code, layers, domain rules + tests, registries, no switch, ≤150-line files, pt-BR/en UI text via translation files).

## Phase 2 — AI in core (CLI first)
- **P1 Text providers.** Port `TextProvider` (`generate(request: {system, prompt, schema?}) → text/json`, cost estimate per call) + adapters Anthropic (Claude), OpenAI, Google (Gemini) with retry/backoff like the voice providers, injected `fetch`, keys via `KeyStore`. Tests with fake fetch only. `giz keys test <provider>` (one tiny real call, opt-in).
- **P2 Script generation.** `GenerateScript` use case: from an Idea (format story|lesson, aspect, target duration, theme, audience, tone, language, cast available, backgrounds/presets available) build the prompt from format guides (`core/formats/<format>/guide.<lang>.md`, derived from docs/guides + the README's script reference), ask for script.json + cast choices, validate with the real schema + CheckProject, and repair (send the readable errors back, max 3 rounds). Output a valid project folder. `giz new --idea <file>` / `giz script <folder>`. Golden tests with a fake provider returning fixed JSON (including an invalid first answer that gets repaired).
- **P3 Image providers + scenario images.** Port `ImageProvider` (`generate({prompt, size, seed?}) → bytes`, cost estimate) + adapters OpenAI (gpt-image), Google (Gemini image), fal.ai (Flux). `GenerateScenarioImages` use case: for each scenario scene marked `background.generate: {prompt}` (schema addition) build the prompt with the project's style preset (`project.style`: painted-2d | flat-vector | watercolor | chalk), size by aspect with camera margin, save to `scenes/<id>.png`, cache by hash (prompt+style+aspect+provider+model), never regenerate unchanged. `giz images <folder>` with `--estimate`. Fake-provider tests.
- **P4 Stages and costs.** `ProjectStages` (domain): stages idea → script → cast → scenarios → voices → video; each stage's state (empty/ready/stale/done) derived from file hashes (a changed line marks only its voice stale; a changed image prompt only that image); `EstimateCosts` across pending paid steps. `giz status <folder>` prints stages + estimate. Tests.

## Phase 3 — The Studio app (`studio/`)
- **S1 Scaffold + bridge.** Electron Forge (Vite + TS + React) in `studio/`; workspace wiring so `studio` imports `core` (npm workspaces at repo root or a file: dependency); typed preload API (`window.giz.*`) with zod-validated IPC; main-process services wrapping core use cases (load/check project, generate voices, build, render with progress events, keys via safeStorage). Lint/depcruise/test gates like core (+ a smoke test that the app window boots headless with `xvfb-run` or Electron's offscreen mode).
- **S2 First run and Settings.** Screens: language (pt-BR/en), projects folder, GPU detection + `gpu install` with progress, model downloads with progress (Qwen 0.6b/1.7b, Whisper), AI accounts (text/image/voice providers: add key, "test key", remove), Remotion license notice. All strings via i18n files.
- **S3 Projects + Idea + Script.** Project list (open/new/duplicate/delete-to-trash), New project wizard (format, aspect, duration, theme…), Script editor (line list: speaker, text, pronunciation, scene picker, beats; live validation from CheckProject; "Gerar roteiro com IA" via P2 with cost estimate and confirmation).
- **S4 Cast + Scenarios + Voices.** Cast editor: pick from presets or create (rig, species, outfit, hair, headwear, colors…) with a live Remotion `<Player>` preview of the character talking; voice picker with "ouvir amostra". Scenarios grid: vector background / upload image / generate with AI (P3) per scene, regenerate one, estimate. Voices list: play each line, regenerate one, record own voice (MediaRecorder → WAV 16-bit), stale markers from P4.
- **S5 Preview and render.** Remotion `<Player>` preview of the whole video (props from BuildTimeline), check panel (errors/warnings linked to lines), render 9:16/16:9 with progress bar and cancel, open output folder, export SRT.
- (UI design: clean, friendly, consistent with the giz identity — chalk/slate accents; the controller will review screenshots of every screen.)

## Phase 4 — Installers
- **I1 Packaging.** Forge makers: Linux AppImage/deb (built and smoke-tested here under WSLg/xvfb), Windows (zip + Squirrel; built on Linux if wine is available, else via CI), macOS dmg (CI only). Remotion bundle prebuilt at package time; compositor binaries + Chrome Headless Shell unpacked from asar; models downloaded at first run (not bundled). GitHub Actions workflow building all three on tags (not pushed without the user's OK). README "Instalar" section. No code signing (spec ruling).

## Order and parallelism
P1 → P2 → P3 → P4 (core) can overlap with S1 (studio scaffold); S2–S5 after S1 and P4; I1 last. The running migration (M3–M6) continues in parallel; implementers commit only explicit paths.
