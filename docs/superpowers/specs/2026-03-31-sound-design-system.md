# Sound Design System Design Document

**Date**: March 31, 2026

## Overview

Complete sound design system for Sonarus featuring 5 distinct sonic themes based on professional UX sound design principles from Apple, Google, and premium application design research.

## Design Philosophy

### Core Principles (from Apple HIG & Material Design)

1. **Sound is not a coat of paint** — it's designed from the beginning as part of the experience
2. **Sonic metaphors over skeuomorphism** — evoke emotions, not literal objects
3. **The repetitive tolerance rule** — frequent sounds must be subtle, short, and warm
4. **Design for device speakers** — mid-range focused, no boomy bass or brittle highs
5. **Learnability through consistency** — sounds should feel innate to the app

### Envelope Philosophy

Each sound follows an inverted envelope pattern:

- **Start (Microphone Open)**: Gentle attack → crescendo to emphasized peak at the **end**
  - Metaphor: "Coming online" — like an engine spinning up, light gradually brightening
  - Emotion: Anticipation resolving to readiness — "you're live, start speaking"

- **Stop (Microphone Close)**: Distinct opening note → smooth decrescendo fade
  - Metaphor: "Signing off" — like a gentle exhale, lights dimming
  - Emotion: Acknowledgment then release — "got it, processing"

- **Complete (Transcription Done)**: Pleasant resolving tone
  - Metaphor: Task completed successfully
  - Emotion: Quiet satisfaction — not celebratory, just "done"

- **Error**: Distinct but non-alarming
  - Metaphor: Gentle head shake
  - Emotion: Informative without anxiety

## Sound Themes

### 1. Glass — Clarity & Precision

Inspired by Apple Pay's crystalline success sound.

**Timbre**: Pure sine waves with subtle harmonic shimmer
**Character**: Premium, precise, modern
**Metaphor**: Like a wine glass being tapped — pure, clear, satisfying

**Technical**:

- Start: Clean 880Hz tone with slight brightness increase
- Stop: Same timbre, gentle fade
- Complete: Harmonically complete bell-like tone
- Error: Two quick descending tones, muted

### 2. Wood — Warmth & Authenticity

Organic, tactile quality. Quality mechanical craftsmanship.

**Timbre**: Warm wooden/mallet tones with natural harmonics
**Character**: Trustworthy, human, grounded
**Metaphor**: Physical craftsmanship, reliability

**Technical**:

- Start: Wooden attack that opens up
- Stop: Gentle wooden closure with natural decay
- Complete: Warm, resonant tone
- Error: Lower, muted wooden thump

### 3. Pulse — Subtle & Professional

Minimal electronic tones for users who want feedback without presence.

**Timbre**: Short filtered blips, precise and clinical
**Character**: Understated, sophisticated, almost subliminal
**Metaphor**: Medical equipment precision — reliable, clean

**Technical**:

- Start: Short filtered blip that opens
- Stop: Gentle filtered tail-off
- Complete: Quick confirming pulse
- Error: Lower frequency pulse

### 4. Zen — Calm & Intentional

Inspired by singing bowls and meditation apps.

**Timbre**: Complex harmonics, long attack and decay
**Character**: Mindful, spacious, unhurried
**Metaphor**: Taking a breath, creating space

**Technical**:

- Start: Bowl-like tone that blooms
- Stop: Resolving tone that gently decays
- Complete: Harmonically rich, satisfying
- Error: Soft, non-jarring tone

### 5. Spark — Energy & Efficiency

Quick, bright, digitally-native sounds.

**Timbre**: Bright, quick electronic tones
**Character**: Fast, capable, modern
**Metaphor**: Electricity connecting, task completed

**Technical**:

- Start: Bright, quick rising energy
- Stop: Satisfying snap with tail
- Complete: Quick confirming tone
- Error: Distinct but brief

## Technical Specifications

### Audio Parameters

- **Duration**: 200-400ms maximum
- **Format**: 44.1kHz, 16-bit WAV (mono)
- **Frequency range**: Mid-focused (300Hz-4kHz)
- **Envelope**: Custom per sound type following inverted philosophy

### File Structure

```text
src-tauri/resources/
├── glass_start.wav
├── glass_stop.wav
├── glass_complete.wav
├── glass_error.wav
├── wood_start.wav
├── wood_stop.wav
├── wood_complete.wav
├── wood_error.wav
├── pulse_start.wav
├── pulse_stop.wav
├── pulse_complete.wav
├── pulse_error.wav
├── zen_start.wav
├── zen_stop.wav
├── zen_complete.wav
├── zen_error.wav
├── spark_start.wav
├── spark_stop.wav
├── spark_complete.wav
└── spark_error.wav
```

### Rust Implementation

**SoundType enum extension**:

```rust
pub enum SoundType {
    Start,
    Stop,
    Complete,  // NEW
    Error,     // NEW
}
```

**SoundTheme enum update**:

```rust
pub enum SoundTheme {
    // Legacy themes (to be deprecated)
    Marimba,  // Legacy - will be removed after migration
    Pop,      // Legacy - will be removed after migration

    // New themes (5 distinct sonic themes)
    Glass,    // NEW
    Wood,     // NEW
    Pulse,    // NEW
    Zen,      // NEW
    Spark,    // NEW

    Custom,   // User-defined - allows custom sound file selection
}

// Migration plan:
// - Feature flag: use_new_sound_themes (default: false)
// - When flag enabled: UI shows only Glass, Wood, Pulse, Zen, Spark, Custom
// - Legacy users with Marimba/Pop auto-migrate to Glass
// - Remove Marimba/Pop enum values after 2 release cycles
```

## Integration Points

### Recording Lifecycle

1. Recording starts → `play_feedback_sound(SoundType::Start)`
2. Recording stops → `play_feedback_sound(SoundType::Stop)`
3. Transcription completes → `play_feedback_sound(SoundType::Complete)`
4. Error occurs → `play_feedback_sound(SoundType::Error)`

### UI Integration

- SoundPicker component added to GeneralSettings sound section
- Volume slider applies to all sounds
- Audio feedback toggle mutes all sounds

## Success Metrics

- All 4 sounds trigger at correct lifecycle points
- 5 themes available in settings
- Sounds ≤400ms duration
- No audible clicks/pops at start/end
- Consistent perceived loudness across themes

## Testing Plan

1. Generate all 20 WAV files
2. Test each theme through laptop speakers
3. Verify envelope shapes match philosophy
4. Test lifecycle integration
5. Gather user feedback on preference
6. Select 2-3 best themes as defaults

---

**Next Steps**: Implement sound generator script, extend enums, integrate with lifecycle, add SoundPicker UI to GeneralSettings (pending implementation).
