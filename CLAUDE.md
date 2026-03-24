# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sonarus** is a premium speech-to-text desktop application that builds on the Handy foundation. While Handy focuses on being the most forkable speech-to-text tool, Sonarus focuses on being the most finished one — betting on experience over extensibility as its primary value.

### Design Philosophy

Sonarus draws from four reference points, synthesized into a single coherent identity:

- **Superwhisper —** The recording state is a moment. High contrast, the waveform is everything when you're speaking.
- **Notion —** Typography is the UI. Generous whitespace. History feels like a journal, not a database table.
- **Raycast —** Speed is a feature. Every interaction has a keyboard shortcut. Power users never touch the mouse.
- **Apple HIG —** Trust is earned through consistency and restraint. The app gets out of your way, and you notice that.

### Design Principles

- **Nothing decorative.** Every visual element either communicates state or guides action.
- **Motion has meaning.** Every animation tells you something. No animation is eye candy.
- **Typography carries weight.** History panel uses a larger base size. Transcription text is readable at a glance.
- **Dual mode, not afterthought.** Dark and light are designed in parallel. Dark mode uses warm neutrals, not pure black.
- **The overlay is the brand.** More users see the recording pill than the settings panel. It must be extraordinary.

## Development Commands

**Prerequisites:** [Rust](https://rustup.rs/) (latest stable), [Bun](https://bun.sh/)

```bash
# Install dependencies
bun install

# Run in development mode
bun run tauri dev
# If cmake error on macOS:
CMAKE_POLICY_VERSION_MINIMUM=3.5 bun run tauri dev

# Build for production
bun run tauri build

# Linting and formatting (run before committing)
bun run lint              # ESLint for frontend
bun run lint:fix          # ESLint with auto-fix
bun run format            # Prettier + cargo fmt
bun run format:check      # Check formatting without changes
```

**Model Setup (Required for Development):**

```bash
mkdir -p src-tauri/resources/models
curl -o src-tauri/resources/models/silero_vad_v4.onnx https://blob.handy.computer/silero_vad_v4.onnx
```

## Architecture Overview

Handy is a cross-platform desktop speech-to-text app built with Tauri 2.x (Rust backend + React/TypeScript frontend).

### Backend Structure (src-tauri/src/)

- `lib.rs` - Main entry point, Tauri setup, manager initialization
- `managers/` - Core business logic:
  - `audio.rs` - Audio recording and device management
  - `model.rs` - Model downloading and management
  - `transcription.rs` - Speech-to-text processing pipeline
  - `history.rs` - Transcription history storage (NEW for Sonarus)
- `audio_toolkit/` - Low-level audio processing:
  - `audio/` - Device enumeration, recording, resampling
  - `vad/` - Voice Activity Detection (Silero VAD)
- `commands/` - Tauri command handlers for frontend communication
- `shortcut.rs` - Global keyboard shortcut handling
- `settings.rs` - Application settings management
- `sound.rs` - Audio feedback system (NEW for Sonarus)
- `app_context.rs` - Active application detection (NEW for Sonarus)

### Frontend Structure (src/)

- `App.tsx` - Main component with onboarding flow
- `components/settings/` - Settings UI (35+ files)
- `components/model-selector/` - Model management interface
- `components/onboarding/` - First-run experience
- `components/overlay/` - Recording overlay pill (REDESIGNED for Sonarus)
- `components/history/` - Transcription history panel (NEW for Sonarus)
- `components/sound/` - Audio feedback management (NEW for Sonarus)
- `hooks/useSettings.ts`, `useModels.ts` - State management hooks
- `hooks/useHistory.ts` - History management hook (NEW for Sonarus)
- `hooks/useSound.ts` - Sound feedback hook (NEW for Sonarus)
- `stores/settingsStore.ts` - Zustand store for settings
- `stores/historyStore.ts` - Zustand store for history (NEW for Sonarus)
- `bindings.ts` - Auto-generated Tauri type bindings (via tauri-specta)
- `overlay/` - Recording overlay window code

### Key Patterns

**Manager Pattern:** Core functionality organized into managers (Audio, Model, Transcription) initialized at startup and managed via Tauri state.

**Command-Event Architecture:** Frontend → Backend via Tauri commands; Backend → Frontend via events.

**Pipeline Processing:** Audio → VAD → Whisper/Parakeet → Text output → Post-Processing → Clipboard/Paste

**State Flow:** Zustand → Tauri Command → Rust State → Persistence (tauri-plugin-store)

## Sonarus-Specific Patterns

### Recording Overlay (The Pill)

The recording overlay is the most-seen surface in Sonarus. It must be extraordinary:

- Three distinct visual states: idle (invisible), recording (live waveform), transcribing (animated dots)
- Smooth morphing transitions between states — no abrupt snaps
- Configurable position: top-center, bottom-center, corners
- Respects system reduced motion preferences
- Always on top, never steals focus

### History System

Every transcription is saved automatically in a local SQLite database:

- Stores: full text, timestamp, app context, character count, duration
- Full-text search across all entries with highlighting
- Organized by day with date separators
- Pin/star entries to surface them at the top
- Export to .md or .csv formats
- Accessible via keyboard shortcut from anywhere

### Sound Design System

Every state transition has a corresponding audio cue:

- Recording start — clean, short tone
- Recording stop — slightly lower tone
- Transcription complete — brief resolving sound
- Error — neutral, distinct tone
- All sounds are ≤ 400ms, bundled assets, follow system volume
- "Silent" mode toggle disables all audio feedback

### App Context Detection

Sonarus detects the active application and applies transcription profiles:

- Built-in profiles for common apps: Slack, email clients, VS Code, browsers
- Default profile for unrecognized apps
- User can create custom profiles via no-code rule builder
- Profile activation is instant and silent

## Internationalization (i18n)

All user-facing strings must use i18next translations. ESLint enforces this (no hardcoded strings in JSX).

**Adding new text:**

1. Add key to `src/i18n/locales/en/translation.json`
2. Use in component: `const { t } = useTranslation(); t('key.path')`

**File structure:**

```
src/i18n/
├── index.ts           # i18n setup
├── languages.ts       # Language metadata
└── locales/
    ├── en/translation.json  # English (source)
    ├── es/translation.json  # Spanish
    ├── fr/translation.json  # French
    └── vi/translation.json  # Vietnamese
```

## Code Style

**Rust:**

- Run `cargo fmt` and `cargo clippy` before committing
- Handle errors explicitly (avoid unwrap in production)
- Use descriptive names, add doc comments for public APIs
- Follow Sonarus design principles in UI-related code
- Keep audio processing code performant and memory-safe

**TypeScript/React:**

- Strict TypeScript, avoid `any` types
- Functional components with hooks
- Tailwind CSS for styling
- Path aliases: `@/` → `./src/`
- Follow "Quiet Confidence" design language:
  - System fonts only (SF Pro on macOS, Segoe UI on Windows)
  - Two weights only: Regular (400) and Medium (500)
  - Generous whitespace, Notion-style typography
  - All transitions ≤ 300ms, respect reduced motion
  - Dark mode uses warm neutrals (`#0E0E14`), not pure black

**UI/UX Guidelines:**

- Every primary action has a keyboard shortcut
- Settings are applied immediately — no save/apply button pattern
- Error states are calm and specific
- Destructive actions require confirmation
- Typography is the UI — avoid decorative elements
- Motion has meaning, never just for show

## Commit Guidelines

Use conventional commits:

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation
- `refactor:` code refactoring
- `chore:` maintenance

## CLI Parameters

Handy supports command-line parameters on all platforms for integration with scripts, window managers, and autostart configurations.

**Implementation files:**

- `src-tauri/src/cli.rs` - CLI argument definitions (clap derive)
- `src-tauri/src/main.rs` - Argument parsing before Tauri launch
- `src-tauri/src/lib.rs` - Applying CLI overrides (setup closure + single-instance callback)
- `src-tauri/src/signal_handle.rs` - `send_transcription_input()` reusable function

**Available flags:**

| Flag                     | Description                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `--toggle-transcription` | Toggle recording on/off on a running instance (via `tauri_plugin_single_instance`) |
| `--toggle-post-process`  | Toggle recording with post-processing on/off on a running instance                 |
| `--cancel`               | Cancel the current operation on a running instance                                 |
| `--start-hidden`         | Launch without showing the main window (tray icon still visible)                   |
| `--no-tray`              | Launch without the system tray icon (closing window quits the app)                 |
| `--debug`                | Enable debug mode with verbose (Trace) logging                                     |

**Key design decisions:**

- CLI flags are runtime-only overrides — they do NOT modify persisted settings
- Remote control flags (`--toggle-transcription`, `--toggle-post-process`, `--cancel`) work by launching a second instance that sends its args to the running instance via `tauri_plugin_single_instance`, then exits
- `send_transcription_input()` in `signal_handle.rs` is shared between signal handlers and CLI to avoid code duplication
- `CliArgs` is stored in Tauri managed state (`.manage()`) so it's accessible in `on_window_event` and other handlers

## Debug Mode

Access debug features: `Cmd+Shift+D` (macOS) or `Ctrl+Shift+D` (Windows/Linux)

## Platform Notes

- **macOS**: Metal acceleration, accessibility permissions required, native feel with system fonts
- **Windows**: Vulkan acceleration, code signing, Segoe UI typography
- **Linux**: OpenBLAS + Vulkan, limited Wayland support, overlay disabled by default

## Sonarus V1 Feature Requirements

When working on V1 features, ensure:

- Recording overlay has three distinct states with smooth transitions
- All transcriptions are saved to SQLite history automatically
- Sound cues are present for all state transitions
- History panel is searchable and keyboard-navigable
- Settings UI follows the "Quiet Confidence" design language
- Performance targets: ≤ 2s app launch, ≤ 200ms history panel open, ≤ 100ms search
- Privacy: All processing local, no telemetry in V1
- Accessibility: Full keyboard navigation, WCAG AA contrast, screen reader support

## Future Architecture Considerations

V1 code should not block V1.x/V2 features:

- Post-processing pipeline must be pluggable for rule-based → LLM transition
- App context detection should support user-defined profiles
- History system should support additional metadata fields
- Sound system should support custom sound packs
- Settings architecture should support profile management
