# SONARUS

_Product Requirements Document_

Version 1.0 · March 2026
Platform: macOS · Windows · Open Source (MIT)

> **_"The speech-to-text tool you'll actually love using."_**

---

## 1. Overview

### 1.1 Product Vision

Sonarus is a premium speech-to-text desktop application for macOS and Windows, built on top of the open-source Handy project. Where Handy is the most forkable speech-to-text tool, Sonarus aims to be the most finished one — a fork that bets on experience over extensibility as its primary value.

Sonarus keeps everything that makes Handy excellent: fully offline processing, Whisper and Parakeet model support, VAD silence filtering, and global hotkeys. It layers on top a premium experience layer: a redesigned recording overlay, a rich transcription history, satisfying sound design, and a foundation for context-aware intelligence.

### 1.2 The One-Sentence Pitch

> _"Invisible until you need it. Extraordinary when you do."_

### 1.3 Design Philosophy

Sonarus draws from four reference points, synthesized into a single coherent identity:

- **Superwhisper —** The recording state is a moment. High contrast, the waveform is everything when you're speaking.
- **Notion —** Typography is the UI. Generous whitespace. History feels like a journal, not a database table.
- **Raycast —** Speed is a feature. Every interaction has a keyboard shortcut. Power users never touch the mouse.
- **Apple HIG —** Trust is earned through consistency and restraint. The app gets out of your way, and you notice that.

### 1.4 Design Principles

- **Nothing decorative.** Every visual element either communicates state or guides action.
- **Motion has meaning.** Every animation tells you something. No animation is eye candy.
- **Typography carries weight.** History panel uses a larger base size. Transcription text is readable at a glance.
- **Dual mode, not afterthought.** Dark and light are designed in parallel. Dark mode uses warm neutrals, not pure black.
- **The overlay is the brand.** More users see the recording pill than the settings panel. It must be extraordinary.

---

## 2. Context & Foundation

### 2.1 Baseline: Handy

Sonarus forks the Handy project (`github.com/cjpais/Handy`, MIT License). The following Handy capabilities are preserved in full:

- Tauri v2 application framework (Rust backend + React/TypeScript frontend)
- Whisper model support: Small, Medium, Turbo, Large (GPU-accelerated where available)
- Parakeet V3 model support: CPU-optimized, automatic language detection
- Voice Activity Detection (VAD) via Silero — silence is filtered before transcription
- Global keyboard shortcuts, push-to-talk mode
- Configurable text paste behavior (direct type or clipboard)
- Cross-platform: macOS (Intel + Apple Silicon), Windows x64
- Linux support preserved but not a V1 priority

Sonarus adds to this foundation — it does not remove or replace the core pipeline.

### 2.2 Tech Stack

| Layer      | Stack                                                           |
| ---------- | --------------------------------------------------------------- |
| Frontend   | React + TypeScript + Tailwind CSS (unchanged from Handy)        |
| Backend    | Rust via Tauri v2 (unchanged from Handy)                        |
| Audio      | cpal, vad-rs (Silero), rubato, whisper-rs, transcription-rs     |
| Build      | Bun + Vite, same as Handy                                       |
| Future LLM | llama.cpp or equivalent, bundled optionally for post-processing |

---

## 3. Target Users

### 3.1 Primary Audience

Sonarus targets general-purpose desktop users on macOS and Windows who want to speak instead of type. No single persona — the app must feel at home whether the user is a student drafting notes, a developer writing commit messages, or a professional composing emails.

### 3.2 User Scenarios

| User               | Scenario                                                                                    | Priority |
| ------------------ | ------------------------------------------------------------------------------------------- | -------- |
| Student            | Dictates lecture notes and paper drafts. Uses history to review and search past dictations. | Core     |
| Developer          | Speaks commit messages, code comments, Slack replies. Uses keyboard-only flow exclusively.  | Core     |
| Professional       | Composes emails and documents by voice. Relies on app-aware profiles for appropriate tone.  | V1+      |
| Accessibility user | Relies on voice input as a primary input method. Needs rock-solid reliability.              | Core     |
| Power user         | Customizes everything: shortcuts, profiles, sound packs, post-process rules.                | V2       |

---

## 4. V1 Feature Requirements

_V1 ships the experience layer. Intelligence layer follows in V1.x / V2._

### 4.1 Recording Overlay — The Pill

The recording overlay is the most-seen surface in Sonarus. It is the brand. It must be redesigned from Handy's functional overlay into an identity moment.

**Requirements**

- Floating pill shape, always on top, never steals focus
- Three distinct visual states: idle (invisible), recording, transcribing
- Recording state: live audio waveform visualization inside the pill
- Transcribing state: subtle animated indicator (e.g. pulsing dots or morphing shape)
- Smooth morphing transitions between states — no abrupt snaps
- Pill disappears after transcription completes with a brief fade-out
- Configurable position: top-center, bottom-center, corners (inherits Handy positions)
- Respects Handy's existing overlay disable option for Linux compatibility

**Visual Spec**

- **Idle:** Not rendered. Zero visual footprint.
- **Recording:** Pill expands in, waveform animates to mic input. Accent color glow on border — subtle.
- **Transcribing:** Waveform fades, three dots pulse. Duration matches actual processing time.
- **Done:** Pill fades out over 300ms. No jarring disappearance.

### 4.2 Sound Design System

Every state transition has a corresponding audio cue. Sound is on by default but can be disabled in settings. Cues are designed to be satisfying without being intrusive — audible at normal volume, pleasant at low volume.

**Required Cues**

- Recording start — clean, short tone. Signals the mic is live.
- Recording stop — slightly lower tone. Signals capture is complete.
- Transcription complete — a brief resolving sound. Positive, not celebratory.
- Error — a neutral, distinct tone. Not alarming, clearly different from success.

**System Requirements**

- All sounds are short (≤ 400ms)
- Sounds are bundled assets, not synthesized at runtime
- Volume follows system volume
- A "Silent" mode toggle disables all audio feedback
- V2: custom sound packs via user-defined asset folder

### 4.3 Sonarus History

A dedicated history panel that makes Sonarus feel like a serious tool. Every transcription is stored locally in a searchable log. This is not a side feature — it is the second most important surface after the overlay.

**Requirements**

- Every transcription is saved automatically on completion
- Each entry stores: full text, timestamp, app context (name of active app), character count, duration
- Full-text search across all entries. Results highlight matching terms.
- Entries organized by day with date separators in the timeline view
- Pin / star entries to surface them at the top
- Delete individual entries or clear all
- Export: selected entries or full history as `.md` or `.csv`
- History is stored in a local SQLite database (via Tauri's file system API)
- History panel is accessible via keyboard shortcut from anywhere

**UI Approach**

The history panel should feel like a journal, not a database. Generous line height, transcription text at 15–16px, timestamps and context labels smaller and muted. Reading your history should feel calm.

### 4.4 Inherited Handy Features (Preserved, UI Refreshed)

The following features ship in V1 with updated UI treatment but unchanged underlying behavior:

| Feature          | Description                                                                 | Status     |
| ---------------- | --------------------------------------------------------------------------- | ---------- |
| Model selection  | Whisper (S/M/Turbo/Large) and Parakeet V3. Same download + switching logic. | Preserved  |
| Global shortcuts | Configurable hotkeys for record toggle and push-to-talk.                    | Preserved  |
| VAD filtering    | Silero-based silence detection, same parameters.                            | Preserved  |
| Paste behavior   | Direct type or clipboard paste, user-configurable.                          | Preserved  |
| Settings panel   | Rebuilt UI, same settings surface area. Keyboard-navigable.                 | UI refresh |
| Debug mode       | Cmd/Ctrl+Shift+D debug panel preserved.                                     | Preserved  |

---

## 5. V1.x Feature Roadmap

_Planned for releases after V1 launch. Architecture decisions in V1 should not block these._

### 5.1 App-Aware Profiles

Sonarus detects the active application and automatically applies a transcription profile. Profiles define post-processing rules: tone adjustments, formatting, vocabulary preferences.

- Built-in profiles for common apps: Slack, email clients, VS Code, browsers, word processors
- Default profile for unrecognized apps
- User can create, edit, and assign custom profiles via a no-code rule builder
- Profile activation is instant and silent — no UI interruption
- Profile in use is visible in the history entry for each transcription

### 5.2 Post-Process Modes

After transcription, a floating action strip appears briefly. Users can apply one-tap transforms to the transcribed text before it is pasted.

- Strip appears for ~4 seconds after transcription, then fades
- Hovering the strip pauses the fade timer
- Built-in transforms: Clean (fix filler words/grammar), Bullets (convert to list), Formal, Casual
- User-defined custom transforms in settings
- If ignored, raw transcription pastes as normal — zero friction
- V1 implementation: rule-based, no LLM required
- Architecture must be LLM-ready for when local model support ships

### 5.3 Smart Snippets

User-defined voice shortcuts that expand inline. Speak a trigger phrase, get a pre-defined output.

- Example: "sign off" → expands to email signature
- Example: "task" → formats next sentence as a Markdown checkbox
- Managed in settings: trigger phrase + expansion text
- Expansion happens post-transcription, pre-paste

---

## 6. V2 & Future Roadmap

### 6.1 Local LLM Post-Processing

The highest-value future feature. A bundled or on-demand small language model (Phi-4, Gemma 3, or equivalent) enables true reformatting, summarization, and tone transformation — all offline.

- **Architecture note:** V1 post-process pipeline must be designed as a pluggable layer. Rule-based transforms in V1 slot into the same interface that a local LLM will occupy in V2. No rearchitecting required.
- Model download is opt-in, initiated from settings
- Inference runs in a background Rust thread, non-blocking
- BYOAK mode (Bring Your Own API Key) as an alternative for users who prefer cloud-quality inference with local data routing

### 6.2 Voice Profiles & Personal Vocabulary

- User-trained vocabulary list: names, jargon, brand terms, acronyms
- Fed into Whisper's hotwords parameter where supported
- Post-process find-replace layer as fallback for terms Whisper can't learn
- Over time, Sonarus gets smarter about your specific voice and domain

### 6.3 Transcription Stats & Streaks

- Words spoken today counter, weekly summaries
- Calm, data-curious — Notion-style, not Duolingo-style
- Surfaced in history panel, not as notifications or badges

### 6.4 iOS Companion

- Syncs history over iCloud device-to-device
- No server ever touches the data
- Recording and transcription on-device via iOS Whisper port

---

## 7. UI Design Language: "Quiet Confidence"

### 7.1 Color

| Token         | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Dark mode bg  | Near-black with warm undertone — never pure `#000000`. Suggested: `#0E0E14`          |
| Light mode bg | Off-white, never pure `#FFFFFF`. Suggested: `#F7F7F9`                                |
| Accent        | A single signature color used sparingly for active states and CTAs. Purple-adjacent. |
| Text          | High contrast primary, soft secondary, very soft tertiary. No mid-gray ambiguity.    |
| Surfaces      | Three elevation levels only: base, raised (cards/panels), floating (pill/overlays).  |

### 7.2 Typography

- System font stack — SF Pro on macOS, Segoe UI on Windows. Never a bundled font.
- Two weights only: Regular (400) and Medium (500). No bold/semibold in UI text.
- History panel base size: 15–16px. Settings and utility text: 13px.
- Sentence case everywhere. Never title case in UI labels.
- Line height: 1.6 for reading surfaces, 1.3 for utility/compact text.

### 7.3 Motion

- All transitions ≤ 300ms. No animation for animation's sake.
- Easing: ease-out for elements entering, ease-in for elements leaving.
- The pill morphing between states is the signature animation. It must be fluid.
- Respect `prefers-reduced-motion` — all animations are wrapped in media query.
- No bounce, spring, or elastic easing in the main UI. Reserved for delight moments only.

### 7.4 Interaction Patterns

- Every primary action has a keyboard shortcut. Settings panel is keyboard-navigable.
- Hover states are present but subtle. Focus states are always visible for accessibility.
- Destructive actions (delete history, clear all) require confirmation. One extra step, no more.
- Settings are applied immediately — no save/apply button pattern.
- Error states are calm and specific. Never "Something went wrong." Always tell the user what.

### 7.5 Dark & Light Mode

- Both modes are designed from scratch in parallel — dark is not a color inversion of light.
- Dark mode: warm neutrals (`#0E0E14` base, `#1A1A2E` surfaces). No blue-black or cold gray.
- Light mode: cream-tinted whites (`#F7F7F9` base, `#FFFFFF` surfaces). No clinical pure white.
- Mode follows system setting by default. User can override in settings.

---

## 8. Non-Functional Requirements

### 8.1 Privacy

- All audio processing is local. No audio data leaves the device under any circumstance.
- Transcription history is stored in a local SQLite database only.
- No telemetry, analytics, or crash reporting in V1. Opt-in analytics may be added following Handy's model.
- No network requests except: model downloads (user-initiated) and update checks (opt-in).

### 8.2 Performance

- Transcription latency matches or beats Handy baseline for equivalent hardware.
- History panel opens in ≤ 200ms even with thousands of entries.
- Search results appear in ≤ 100ms for typical history sizes.
- App launch to ready state in ≤ 2 seconds on supported hardware.

### 8.3 Accessibility

- Full keyboard navigation for all settings and history panel UI.
- WCAG AA contrast minimums for all text in both light and dark mode.
- Sound design cues are never the sole indicator of state — visual state always exists.
- Screen reader support for the settings panel (ARIA labels on all interactive elements).

### 8.4 Platform

- **macOS:** 12 Monterey minimum. Universal binary (Intel + Apple Silicon).
- **Windows:** Windows 10 x64 minimum.
- **Linux:** Inherited Handy support preserved but not tested or prioritized for V1.

---

## 9. Out of Scope for V1

- Mobile app (iOS / Android) — planned for future
- Cloud sync or server-side storage of any kind
- Real-time transcription / streaming (Handy's push-to-talk model is sufficient)
- Multi-language UI localization
- Local LLM inference (architecture prepared, not shipped)
- Voice profile training / personal vocabulary (V2)
- Team or shared features of any kind

---

## 10. Success Metrics

_As an open-source project, success is measured by adoption, community response, and qualitative feedback._

- **Launch:** GitHub stars and forks relative to Handy baseline within 30 days of release.
- **Retention:** Users who return to the app more than 5 days after first install (measured via opt-in analytics in V1.x).
- **History engagement:** Percentage of users who open the history panel at least once per week.
- **Qualitative:** Community feedback specifically mentions the overlay, sound design, or history as differentiators.
- **Reliability:** Zero regressions on core Handy transcription accuracy or latency benchmarks.

---

## Appendix: Reference Projects

| Project      | Role                | Notes                                                          |
| ------------ | ------------------- | -------------------------------------------------------------- |
| Handy        | Foundation codebase | Tauri + Whisper + VAD. MIT licensed.                           |
| superwhisper | UI/UX inspiration   | Premium STT for macOS. Recording state design.                 |
| Notion       | Design philosophy   | Whitespace, typography, calm UI.                               |
| Raycast      | Interaction model   | Productivity-first, keyboard-driven, invisible-to-present.     |
| Apple HIG    | Design values       | Emotional attachment, trust through consistency, sound design. |

---

_Sonarus · Open Source (MIT) · github.com/[your-handle]/sonarus_
