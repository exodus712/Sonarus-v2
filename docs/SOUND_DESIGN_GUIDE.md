# Sound Design Guide for Sonarus

## Overview

Sonarus is a premium speech-to-text application. Every sound must reinforce this positioning through thoughtful sonic metaphors, clean execution, and psychological appropriateness.

## Core Principles

### 1. Sonic Metaphors

Each sound event should map to a physical, intuitive action:

| Event                      | Sonic Metaphor               | Emotional Goal        |
| -------------------------- | ---------------------------- | --------------------- |
| **Recording Start**        | "Opening" / "Activation"     | Confidence, readiness |
| **Recording Stop**         | "Closing" / "Completion"     | Satisfaction, closure |
| **Transcription Complete** | "Success" / "Reward"         | Achievement, delight  |
| **Error**                  | "Gentle Alert" / "Soft Bump" | Awareness, not alarm  |

### 2. Envelope Design

The shape of each sound matters as much as the content:

**Recording Start — Crescendo**

- Begins quietly/subtly
- Builds to a clear peak at the end
- Creates anticipation → resolution
- Feels like "warming up" or "opening"

**Recording Stop — Decrescendo**

- Clear, distinct attack at the beginning
- Fades smoothly to silence
- Feels like "settling" or "closing"
- Never abrupt or clipped

**Transcription Complete — Resolving**

- Quick, confident attack
- Brief sustain
- Clean, satisfying decay
- Major key or consonant intervals preferred
- Slight pitch rise or harmonic resolution

**Error — Descending/Gentle**

- Lower pitch than other sounds
- Optional two-tone descending interval
- Soft, rounded attack
- Non-jarring — should never startle

### 3. Technical Constraints

All sounds must adhere to:

- **Format:** WAV, 44.1kHz, 16-bit, mono
- **Duration:** ≤400ms (ideally 200-350ms)
- **Volume:** Normalized to similar perceived loudness
- **Frequency:** Optimized for laptop speakers and headphones
  - Avoid excessive bass (<200Hz)
  - Focus on midrange clarity (500Hz-4kHz)
  - Slight presence boost (2-5kHz) for intelligibility

### 4. Repetitive Tolerance

Users will hear these sounds dozens of times per day:

- **No harsh transients** — avoid sharp clicks or pops
- **No ringing tails** — decay should be clean
- **Consistent timbre** — theme sounds should feel related
- **Short enough to not overlap** — rapid use shouldn't create mud

### 5. Learnability

Sounds should be immediately interpretable:

- **Start** = upward/opening energy
- **Stop** = downward/closing energy
- **Complete** = positive/resolving
- **Error** = distinct from positive sounds, but not negative

## Theme Concepts

When curating sounds, consider these thematic directions:

### "Glass" Theme

- **Character:** Clean, crystalline, precise
- **Timbre:** Clear tones with subtle harmonic content
- **Envelope:** Sharp attack, medium decay
- **Metaphor:** Clarity, transparency, modern

### "Wood" Theme

- **Character:** Warm, organic, rounded
- **Timbre:** Wooden percussion, xylophone, marimba
- **Envelope:** Soft attack, natural decay
- **Metaphor:** Craftsmanship, warmth, human

### "Pulse" Theme

- **Character:** Minimal, digital, clinical
- **Timbre:** Short blips, filtered tones
- **Envelope:** Very short, precise
- **Metaphor:** Efficiency, technology, focus

### "Zen" Theme

- **Character:** Meditative, resonant, spacious
- **Timbre:** Singing bowls, bells, long tails
- **Envelope:** Slow attack, long decay (but still under 400ms)
- **Metaphor:** Calm, mindfulness, patience

### "Spark" Theme

- **Character:** Bright, energetic, quick
- **Timbre:** High frequencies, crisp attacks
- **Envelope:** Fast attack, quick decay
- **Metaphor:** Inspiration, speed, lightness

## Selection Criteria

When evaluating sounds:

1. **Listen for the envelope** — does it match the intended metaphor?
2. **Check the tail** — does it ring too long? Cut it if needed
3. **Test at low volume** — premium sounds work at all levels
4. **Consider the context** — will this sound good on laptop speakers?
5. **Group by family** — sounds within a theme should feel related

## Processing Checklist

Before adding to Sonarus:

- [ ] Convert to 44.1kHz, 16-bit, mono WAV
- [ ] Trim/truncate to ≤400ms
- [ ] Normalize perceived loudness (not peak level)
- [ ] High-pass filter below 100Hz (remove rumble)
- [ ] Optional: slight compression for consistency
- [ ] Test on laptop speakers and headphones
- [ ] Verify no clipping or digital artifacts

## Attribution Template

For CC BY sounds, add to About/Credits:

```
Sound "[Sound Name]" by [Username] on "[Source]"
Licensed under CC BY 4.0
```

## Examples of Good Sound Characteristics

**Start Sound:**

- 250-400ms duration
- Slight pitch rise or opening harmonic series
- Medium attack (not instant, not slow)
- Clear, confident energy

**Stop Sound:**

- 200-400ms duration
- Distinct beginning, smooth fade
- Slight pitch fall optional
- Satisfying closure feeling

**Complete Sound:**

- 200-400ms duration
- Higher pitch than start/stop
- Quick attack, clean decay
- Major third or perfect fifth interval optional
- "Ding" or "chime" character

**Error Sound:**

- 150-400ms duration (brief)
- Lower pitch than other sounds
- Soft attack
- Optional two-tone descending
- Never harsh or alarming

## Reference Points

Study these for inspiration:

- Apple macOS system sounds (clean, minimal)
- iOS notification sounds (brief, clear)
- Material Design sounds (subtle, tactile)
- Superhuman email client (premium, restrained)
- Notion (barely there, elegant)

## Final Note

The best UI sounds are ones users don't consciously notice — they simply _feel right_. When in doubt, simplify. A clean, simple tone executed well beats a complex sound that draws attention to itself.
