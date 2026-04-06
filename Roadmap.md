# Sonarus Roadmap

**Executive Timeline for V1 Launch and Beyond**

This roadmap outlines the development path for Sonarus from V1 launch through future enhancements. All timelines are estimates and subject to change based on development resources and community feedback.

---

## V1 Launch (Q2 2026)

**Target Release: June 2026**

### Core Experience Features ✅

#### Recording Overlay - The Pill

- **Timeline**: Complete by April 2026
- **Owner**: Frontend Team
- **Deliverables**:
  - Floating pill shape with three distinct states (idle, recording, transcribing)
  - Live audio waveform visualization during recording
  - Smooth morphing transitions between states (≤ 300ms)
  - Configurable positioning (top-center, bottom-center, corners)
  - Respects system reduced motion preferences
  - Always on top, never steals focus

#### Sound Design System

- **Timeline**: Complete by April 2026
- **Owner**: Audio/UI Team
- **Deliverables**:
  - Recording start cue (clean, short tone, ≤ 400ms)
  - Recording stop cue (slightly lower tone, ≤ 400ms)
  - Transcription complete cue (resolving sound, ≤ 400ms)
  - Error cue (neutral, distinct tone, ≤ 400ms)
  - Silent mode toggle in settings
  - All sounds bundled as assets, follow system volume

#### History System

- **Timeline**: Complete by May 2026
- **Owner**: Backend/Frontend Team
- **Deliverables**:
  - SQLite database for local storage
  - Automatic saving of all transcriptions
  - Full-text search with highlighting
  - Date separators and organization
  - Pin/star functionality
  - Export to .md and .csv formats

#### UI Refresh

- **Timeline**: Complete by May 2026
- **Owner**: Frontend Team
- **Deliverables**:
  - "Quiet Confidence" design language implementation
  - System fonts (SF Pro on macOS, Segoe UI on Windows)
  - Two-weight typography (Regular 400, Medium 500)
  - Generous whitespace, Notion-style layout
  - Dark mode with warm neutrals (#0E0E14)
  - Light mode with cream-tinted whites (#F7F7F9)
  - All transitions ≤ 300ms

### Performance & Quality Targets

#### Performance Benchmarks

- **Timeline**: Meet by June 2026
- **Owner**: Engineering Team
- **Targets**:
  - App launch to ready state: ≤ 2 seconds
  - History panel open: ≤ 200ms (even with 1000+ entries)
  - Search results: ≤ 100ms
  - Recording overlay appearance: ≤ 50ms

#### Platform Support

- **Timeline**: Launch ready by June 2026
- **Owner**: Platform Team
- **Deliverables**:
  - macOS 12+ (Intel + Apple Silicon) with Metal acceleration
  - Windows 10+ x64 with Vulkan acceleration
  - Linux support preserved but not prioritized
  - Accessibility: WCAG AA contrast, full keyboard navigation, screen reader support

#### Privacy & Security

- **Timeline**: Complete by June 2026
- **Owner**: Security Team
- **Requirements**:
  - All audio processing local
  - No telemetry or analytics in V1
  - Local SQLite storage only
  - No network requests except model downloads and update checks

---

## V1.x Post-Launch (H2 2026)

**Target Releases: August - December 2026**

### App-Aware Profiles

- **Timeline**: Alpha August 2026, Stable October 2026
- **Owner**: Features Team
- **Phased Rollout**:
  - **Phase 1 (August)**: Built-in profiles for common apps
    - Slack, email clients, VS Code, browsers, word processors
    - Default profile for unrecognized apps
  - **Phase 2 (October)**: User-defined custom profiles
    - No-code rule builder interface
    - Profile assignment and management
    - Instant and silent profile switching

### Post-Process Modes

- **Timeline**: Alpha September 2026, Stable November 2026
- **Owner**: AI/Features Team
- **Implementation**:
  - **Phase 1**: Rule-based transforms (V1.x)
    - Clean (remove filler words/grammar)
    - Bullets (convert to list format)
    - Formal/Casual tone adjustment
    - Custom user-defined rules
  - **Phase 2**: LLM-ready architecture preparation
    - Pluggable post-processing pipeline
    - Interface ready for local LLM integration

### Smart Snippets

- **Timeline**: October 2026
- **Owner**: Features Team
- **Deliverables**:
  - Voice shortcut system
  - Trigger phrase + expansion text management
  - Inline expansion during transcription pipeline
  - Settings interface for snippet management

---

## V2 Development (2027)

**Target Release: Q2 2027**

### Local LLM Post-Processing

- **Timeline**: Alpha Q1 2027, Stable Q2 2027
- **Owner**: AI Team
- **Architecture**:
  - Leverage V1.x pluggable pipeline
  - Opt-in model download (Phi-4, Gemma 3, or equivalent)
  - Background Rust thread inference (non-blocking)
  - BYOAK mode (Bring Your Own API Key) option

### Voice Profiles & Personal Vocabulary

- **Timeline**: Q3 2027
- **Owner**: AI/Features Team
- **Features**:
  - User-trained vocabulary list
  - Names, jargon, brand terms, acronyms
  - Whisper hotwords parameter integration
  - Post-process find-replace fallback

### Transcription Stats & Streaks

- **Timeline**: Q4 2027
- **Owner**: Frontend Team
- **Implementation**:
  - Words spoken today counter
  - Weekly summaries and trends
  - Notion-style data visualization
  - Calm, non-gamified approach

---

## Future Roadmap (2028+)

### iOS Companion App

- **Timeline**: 2028
- **Owner**: Mobile Team
- **Features**:
  - iCloud device-to-device sync
  - On-device recording and transcription
  - iOS Whisper port integration
  - No server infrastructure required

### Advanced Intelligence Features

- **Timeline**: 2028+
- **Owner**: AI Research Team
- **Exploration**:
  - Context-aware transcription improvements
  - Multi-language real-time detection
  - Advanced post-processing capabilities
  - Integration with platform AI assistants

---

## Development Milestones & Checkpoints

### Q2 2026 - V1 Feature Freeze

- **April 15**: Feature complete for core V1 experience
- **May 15**: Beta testing begins with community
- **June 1**: Feature freeze, only bug fixes
- **June 15**: V1 launch

### H2 2026 - V1.x Releases

- **Monthly releases**: August, October, December
- **Each release**: 1-2 major features + bug fixes
- **Community feedback integration**: GitHub Discussions → issue tracking

### 2027 - V2 Development

- **Q1**: Local LLM integration development
- **Q2**: V2 beta and launch
- **H2**: Voice profiles and advanced features

---

## Success Metrics & KPIs

### V1 Launch Success

- **Adoption**: 2x GitHub stars/forks vs Handy baseline within 30 days
- **Retention**: 40%+ users return 5+ days after first install
- **History Engagement**: 60%+ users open history panel weekly
- **Quality**: Zero regressions on Handy transcription accuracy/latency

### V1.x Success

- **Feature Adoption**: 30%+ users enable app-aware profiles
- **Post-Process Usage**: 25%+ users use post-process features
- **Community Growth**: 500+ active contributors in Discussions

### V2 Success

- **LLM Adoption**: 20%+ users opt-in to local LLM features
- **Profile Creation**: 15%+ users create custom voice profiles
- **Cross-Platform Sync**: 10%+ users use iOS companion

---

## Resource Allocation & Dependencies

### Critical Path Dependencies

1. **Recording Overlay**: Blocks all other V1 features (must be extraordinary)
2. **History System**: Blocks search and export functionality
3. **Sound Design**: Blocks user experience polish
4. **App Context Detection**: Blocks V1.x profile features

### Team Structure

- **Core Team**: 3-5 engineers (backend, frontend, audio)
- **Design**: 1-2 UX/UI designers
- **Community**: 1 community manager
- **QA**: 1-2 testers (platform-specific)

### Technology Dependencies

- **Tauri v2**: Core framework stability
- **whisper-rs**: Model performance and GPU acceleration
- **SQLite**: History system performance
- **LLM Libraries**: Local inference capabilities (2027)

---

## Risk Assessment & Mitigation

### High-Risk Items

1. **Recording Overlay Performance**: Complex animations + audio processing
   - **Mitigation**: Early prototyping, performance testing
2. **Cross-Platform Audio**: Different audio subsystem behaviors
   - **Mitigation**: Extensive testing on all platforms
3. **LLM Integration (V2)**: Resource usage and performance
   - **Mitigation**: Optional opt-in, background processing

### Medium-Risk Items

1. **History Search Performance**: Large dataset queries
   - **Mitigation**: SQLite optimization, pagination
2. **App Context Detection**: Platform-specific APIs
   - **Mitigation**: Fallback to default profiles

---

_This roadmap is a living document and will be updated based on development progress, community feedback, and changing priorities._

**Last Updated**: March 2026
**Next Review**: June 2026 (post-V1 launch)
