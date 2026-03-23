# CPU-Only transcribe-rs Migration Design

**Date:** 2026-03-23  
**Author:** Cascade  
**Status:** Approved  
**Target:** Handy Speech-to-Text Application  

## Problem Statement

The current Handy application uses `transcribe-rs` with GPU acceleration features that are causing crashes on the user's Windows system. The GPU acceleration (Vulkan, DirectML, Metal) cannot be stabilized despite various troubleshooting attempts. Additionally, the user wants to add real-time streaming transcription capabilities for live captions.

## Proposed Solution

Remove all GPU acceleration from `transcribe-rs` to achieve system stability while maintaining the existing architecture. This approach will force CPU-only operation across all transcription engines and provide a foundation for future real-time streaming features.

## Architecture Overview

### Current State
- Uses `transcribe-rs` with multiple GPU acceleration features
- Supports Whisper, Parakeet, Moonshine, SenseVoice, GigaAM, Canary engines
- Complex GPU settings management per platform
- Batch-only transcription processing

### Target State
- CPU-only `transcribe-rs` with all GPU features removed
- Same engine support but CPU-optimized
- Simplified settings (no GPU options)
- Foundation for real-time streaming chunked processing

## Implementation Plan

### Phase 1: Remove GPU Dependencies

**Files to modify:**
- `src-tauri/Cargo.toml`

**Changes:**
1. Remove platform-specific GPU features:
   - Remove `whisper-vulkan` from Linux dependencies
   - Remove `ort-directml` from Windows dependencies  
   - Remove `whisper-metal` from macOS dependencies
   - Remove `whisper-vulkan` from Windows dependencies

2. Keep only base features:
   ```toml
   transcribe-rs = { version = "0.3.2", features = ["whisper-cpp", "onnx"] }
   ```

### Phase 2: Simplify Settings

**Files to modify:**
- `src-tauri/src/settings.rs`
- Frontend settings components

**Changes:**
1. Remove GPU accelerator enums:
   - Remove `WhisperAcceleratorSetting` enum
   - Remove `OrtAcceleratorSetting` enum

2. Replace with simple CPU-only setting:
   ```rust
   pub force_cpu_transcription: bool, // default: true
   ```

3. Remove from `AppSettings` struct:
   - `whisper_accelerator` field
   - `ort_accelerator` field

4. Update default settings to force CPU mode

### Phase 3: Update TranscriptionManager

**Files to modify:**
- `src-tauri/src/managers/transcription.rs`

**Changes:**
1. Remove GPU acceleration functions:
   - Remove `apply_accelerator_settings()` function
   - Remove `get_available_accelerators()` function

2. Force CPU-only mode at startup:
   ```rust
   use transcribe_rs::accel;
   
   // Force CPU-only for all engines
   accel::set_whisper_accelerator(accel::WhisperAccelerator::CpuOnly);
   accel::set_ort_accelerator(accel::OrtAccelerator::CpuOnly);
   ```

3. Remove GPU-related error handling paths

4. Simplify model loading by removing GPU context

### Phase 4: Add Streaming Foundation

**Files to modify:**
- `src-tauri/src/managers/transcription.rs`
- `src-tauri/src/commands/transcription.rs`

**Changes:**
1. Add streaming state management:
   ```rust
   pub struct StreamingState {
       is_streaming: AtomicBool,
       buffer: Arc<Mutex<Vec<f32>>>,
       last_partial: Arc<Mutex<String>>,
   }
   ```

2. Implement chunked transcription interface:
   ```rust
   pub fn transcribe_chunk(&self, audio_chunk: Vec<f32>) -> Result<String>
   pub fn start_streaming(&self) -> Result<()>
   pub fn stop_streaming(&self) -> Result<()>
   ```

3. Add events for partial results:
   ```rust
   pub struct PartialTranscriptionEvent {
       pub partial_text: String,
       pub is_final: bool,
   }
   ```

4. Create buffer management for real-time audio chunks

## Benefits

### Immediate Benefits
- **System Stability**: Eliminates GPU-related crashes
- **Simplified Architecture**: Removes complex GPU dependency management
- **Predictable Performance**: CPU-only performance is consistent across systems
- **Reduced Complexity**: Fewer settings, fewer failure modes

### Future Benefits
- **Streaming Ready**: Foundation for real-time transcription
- **Easy GPU Re-enable**: Can be added back later if issues are resolved
- **Better Testing**: CPU-only is easier to test and debug
- **Cross-Platform Consistency**: Same behavior across all platforms

## Risk Assessment

### Low Risk
- Removing GPU features is non-breaking for CPU functionality
- Existing transcription logic remains unchanged
- Settings simplification reduces complexity

### Medium Risk
- Performance will be slower than GPU (but more stable)
- Need to test all model types work on CPU
- Streaming addition requires careful buffer management

### Mitigation Strategies
- Comprehensive testing of all engines in CPU mode
- Gradual rollout of streaming features
- Performance benchmarking to set expectations

## Testing Strategy

### Unit Tests
- Test CPU-only mode enforcement
- Verify all model types load and transcribe on CPU
- Test streaming chunk processing

### Integration Tests
- Full transcription pipeline with CPU-only
- Model loading/unloading cycles
- Memory usage under sustained load

### Performance Tests
- Transcription speed benchmarks (CPU vs expected GPU)
- Memory usage patterns
- Latency measurements for streaming chunks

### User Acceptance Tests
- Verify no GPU-related crashes
- Test transcription accuracy remains high
- Validate simplified settings interface

## Rollback Plan

If issues arise, the changes can be easily rolled back by:
1. Restoring GPU features in Cargo.toml
2. Reverting settings structure changes
3. Restoring GPU acceleration code

The modular nature of the changes makes rollback straightforward.

## Success Criteria

1. **Stability**: No GPU-related crashes on user's system
2. **Functionality**: All existing transcription features work on CPU
3. **Performance**: Acceptable transcription speed for user needs
4. **Streaming**: Foundation ready for real-time implementation
5. **Simplicity**: Settings interface simplified and intuitive

## Next Steps

After implementing this CPU-only approach:
1. Test thoroughly on user's system
2. Implement real-time streaming features
3. Consider GPU re-enablement if stability issues are resolved in future `transcribe-rs` versions
4. Evaluate performance vs stability trade-offs

## Dependencies

### External Dependencies
- `transcribe-rs` crate (CPU-only features)
- No new dependencies required

### Internal Dependencies
- Existing transcription manager architecture
- Current settings system
- Audio recording infrastructure

## Timeline Estimate

- **Phase 1**: 1-2 hours (Cargo.toml changes)
- **Phase 2**: 2-3 hours (Settings simplification)
- **Phase 3**: 2-3 hours (TranscriptionManager updates)
- **Phase 4**: 4-6 hours (Streaming foundation)
- **Testing**: 2-4 hours

**Total Estimated Time**: 11-18 hours

---

*This design document has been approved and is ready for implementation.*
