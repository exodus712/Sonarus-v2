# AGENTS.md

This file provides guidance to AI coding assistants working with code in this repository.

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

**Linting and Formatting (run before committing):**

```bash
bun run lint              # ESLint for frontend
bun run lint:fix          # ESLint with auto-fix
bun run format            # Prettier + cargo fmt
bun run format:check      # Check formatting without changes
bun run format:frontend   # Prettier only
bun run format:backend    # cargo fmt only
```

**Model Setup (Required for Development):**

```bash
mkdir -p src-tauri/resources/models
curl -o src-tauri/resources/models/silero_vad_v4.onnx https://blob.handy.computer/silero_vad_v4.onnx
```

For detailed platform-specific build setup, see [BUILD.md](BUILD.md).

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

### Architecture Overview

Sonarus is a cross-platform desktop speech-to-text app built with Tauri 2.x (Rust backend + React/TypeScript frontend).

### Backend Structure (src-tauri/src/)

- `lib.rs` - Main entry point, Tauri setup, manager initialization
- `managers/` - Core business logic:
  - `audio.rs` - Audio recording and device management
  - `model.rs` - Model downloading and management
  - `transcription.rs` - Speech-to-text processing pipeline
  - `history.rs` - Transcription history storage
- `audio_toolkit/` - Low-level audio processing:
  - `audio/` - Device enumeration, recording, resampling
  - `vad/` - Voice Activity Detection (Silero VAD)
- `commands/` - Tauri command handlers for frontend communication
- `cli.rs` - CLI argument definitions (clap derive)
- `shortcut.rs` - Global keyboard shortcut handling
- `settings.rs` - Application settings management
- `overlay.rs` - Recording overlay window (platform-specific)
- `signal_handle.rs` - `send_transcription_input()` reusable function
- `utils.rs` - Platform detection helpers
- `sound.rs` - Audio feedback system
- `app_context.rs` - Active application detection

### Frontend Structure (src/)

- `App.tsx` - Main component with onboarding flow
- `components/` - React UI components:
  - `settings/` - Settings UI
  - `model-selector/` - Model management interface
  - `onboarding/` - First-run experience
  - `overlay/` - Recording overlay UI
  - `history/` - Transcription history panel
  - `sound/` - Audio feedback management
  - `update-checker/` - App update notifications
  - `shared/`, `ui/`, `icons/`, `footer/` - Shared components
- `hooks/useSettings.ts`, `useModels.ts` - State management hooks
- `hooks/useHistory.ts` - History management hook
- `hooks/useSound.ts` - Sound feedback hook
- `stores/settingsStore.ts` - Zustand store for settings
- `stores/historyStore.ts` - Zustand store for history
- `bindings.ts` - Auto-generated Tauri type bindings (via tauri-specta)
- `overlay/` - Recording overlay window code functionality is organized into managers (Audio, Model, Transcription) that are initialized at startup and managed by Tauri's state system.
- `lib/types.ts` - Shared TypeScript type definitions

### Key Architecture Patterns

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
- Profile activation is instant and silent.

### Technology Stack

**Core Libraries:**

- `whisper-rs` - Local Whisper inference with GPU acceleration
- `cpal` - Cross-platform audio I/O
- `vad-rs` - Voice Activity Detection
- `rdev` - Global keyboard shortcuts
- `rubato` - Audio resampling
- `rodio` - Audio playback for feedback sounds

### Platform Notes

- **macOS**: Metal acceleration, accessibility permissions required, native feel with system fonts
- **Windows**: Vulkan acceleration, code signing, Segoe UI typography
- **Linux**: OpenBLAS + Vulkan, limited Wayland support, overlay uses GTK layer shell (disable with `SONARUS_NO_GTK_LAYER_SHELL=1`)

### Application Flow

1. **Initialization:** App starts minimized to tray, loads settings, initializes managers
2. **Model Setup:** First-run downloads preferred Whisper model (Small/Medium/Turbo/Large)
3. **Recording:** Global shortcut triggers audio recording with VAD filtering
4. **Processing:** Audio sent to Whisper model for transcription
5. **Output:** Text pasted to active application via system clipboard

When working on V1 features, ensure:

### Settings System

Settings are stored using Tauri's store plugin with reactive updates:

- Keyboard shortcuts (configurable, supports push-to-talk)
- Audio devices (microphone/output selection)
- Model preferences (Small/Medium/Turbo/Large Whisper variants)
- Audio feedback and translation options

### Single Instance Architecture

The app enforces single instance behavior — launching when already running brings the settings window to front rather than creating a new process. Remote control flags (`--toggle-transcription`, etc.) work by launching a second instance that sends args to the running instance via `tauri_plugin_single_instance`, then exits.

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
    ├── de/, es/, fr/, ja/, ru/, zh/, ...
    └── ...
```

For translation contribution guidelines, see [CONTRIBUTING_TRANSLATIONS.md](CONTRIBUTING_TRANSLATIONS.md).

## Code Style

**Rust:**

- Run `cargo fmt` and `cargo clippy` before committing
- Handle errors explicitly (avoid unwrap in production)
- Use descriptive names, add doc comments for public APIs

**TypeScript/React:**

- Strict TypeScript, avoid `any` types
- Functional components with hooks
- Tailwind CSS for styling
- Path aliases: `@/` → `./src/`

## Commit Guidelines

Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

## CLI Parameters

Sonarus supports command-line parameters on all platforms for integration with scripts, window managers, and autostart configurations.

**Implementation:** `cli.rs` (definitions), `main.rs` (parsing), `lib.rs` (applying), `signal_handle.rs` (shared logic)

| Flag                     | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `--toggle-transcription` | Toggle recording on/off on a running instance              |
| `--toggle-post-process`  | Toggle recording with post-processing on/off               |
| `--cancel`               | Cancel the current operation on a running instance         |
| `--start-hidden`         | Launch without showing the main window (tray icon visible) |
| `--no-tray`              | Launch without system tray (closing window quits the app)  |
| `--debug`                | Enable debug mode with verbose (Trace) logging             |

**Key design decisions:**

- CLI flags are runtime-only overrides — they do NOT modify persisted settings
- Remote control flags work via `tauri_plugin_single_instance`: second instance sends args, then exits
- `send_transcription_input()` in `signal_handle.rs` is shared between signal handlers and CLI

## Debug Mode

Access debug features: `Cmd+Shift+D` (macOS) or `Ctrl+Shift+D` (Windows/Linux)

## Platform Notes

- **macOS**: Metal acceleration, accessibility permissions required for keyboard shortcuts
- **Windows**: Vulkan acceleration, code signing
- **Linux**: OpenBLAS + Vulkan, limited Wayland support, overlay uses GTK layer shell (disable with `SONARUS_NO_GTK_LAYER_SHELL=1`)

## Troubleshooting

See the [Troubleshooting](README.md#troubleshooting) section in README.md.

## Contributing & PR Guidelines

Follow [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow and [PR template](.github/PULL_REQUEST_TEMPLATE.md) when submitting pull requests. For translations, see [CONTRIBUTING_TRANSLATIONS.md](CONTRIBUTING_TRANSLATIONS.md).

**Note:** Feature freeze is active — bug fixes are top priority. New features require community support via [Discussions](https://github.com/sonarus-app/Sonarus/discussions).
