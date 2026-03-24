# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- `overlay/` - Recording overlay window code functionality is organized into managers (Audio, Model, Transcription) that are initialized at startup and managed by Tauri's state system.

**Command-Event Architecture:** Frontend communicates with backend via Tauri commands, backend sends updates via events.

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

**Platform-Specific## Platform Notes

- **macOS**: Metal acceleration, accessibility permissions required, native feel with system fonts
- **Windows**: Vulkan acceleration, code signing, Segoe UI typography
- **Linux**: OpenBLAS + Vulkan, limited Wayland support, overlay disabled by default

## Sonarus V1 Feature Requirements

When working on V1 features, ensure:

### Settings System

Settings are stored using Tauri's store plugin with reactive updates:

- Keyboard shortcuts (configurable, supports push-to-talk)
- Audio devices (microphone/output selection)
- Model preferences (Small/Medium/Turbo/Large Whisper variants)
- Audio feedback and translation options

### Single Instance Architecture

The app enforces single instance behavior - launching when already running brings the settings window to front rather than creating a new process.
