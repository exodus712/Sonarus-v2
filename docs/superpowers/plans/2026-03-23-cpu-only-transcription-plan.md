# CPU-Only transcribe-rs Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all GPU acceleration from transcribe-rs to fix crashes while maintaining existing transcription functionality and adding foundation for real-time streaming.

**Architecture:** Simplify dependencies to CPU-only, remove GPU settings management, force CPU mode in transcription manager, and add chunked processing infrastructure for future streaming.

**Tech Stack:** Rust, Tauri, transcribe-rs (CPU-only), serde, tokio

---

## Chunk 1: Remove GPU Dependencies from Cargo.toml

**Files:**

- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Backup current Cargo.toml**

```bash
cp src-tauri/Cargo.toml src-tauri/Cargo.toml.backup
```

- [ ] **Step 2: Remove Windows GPU features**

Find and remove these lines from the `[target.'cfg(windows)'.dependencies]` section:

```toml
transcribe-rs = { version = "0.3.2", features = ["whisper-vulkan", "ort-directml"] }
```

Replace with:

```toml
transcribe-rs = { version = "0.3.2", features = ["whisper-cpp", "onnx"] }
```

- [ ] **Step 3: Remove macOS GPU features**

Find and remove this line from the `[target.'cfg(target_os = "macos")'.dependencies]` section:

```toml
transcribe-rs = { version = "0.3.2", features = ["whisper-metal"] }
```

Replace with:

```toml
transcribe-rs = { version = "0.3.2", features = ["whisper-cpp", "onnx"] }
```

- [ ] **Step 4: Remove Linux GPU features**

Find and remove this line from the `[target.'cfg(target_os = "linux")'.dependencies]` section:

```toml
transcribe-rs = { version = "0.3.2", features = ["whisper-vulkan"] }
```

Replace with:

```toml
transcribe-rs = { version = "0.3.2", features = ["whisper-cpp", "onnx"] }
```

- [ ] **Step 5: Verify base dependencies**

Ensure the main dependencies section has:

```toml
transcribe-rs = { version = "0.3.2", features = ["whisper-cpp", "onnx"] }
```

- [ ] **Step 6: Test compilation**

```bash
cd src-tauri
cargo check
```

Expected: SUCCESS with no GPU-related compilation errors

- [ ] **Step 7: Commit changes**

```bash
git add src-tauri/Cargo.toml
git commit -m "feat: remove GPU acceleration features from transcribe-rs dependencies"
```

---

## Chunk 2: Simplify Settings Structure

**Files:**

- Modify: `src-tauri/src/settings.rs`

- [ ] **Step 1: Write failing test for GPU settings removal**

Create test file `src-tauri/src/settings_test.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cpu_only_default_settings() {
        let settings = AppSettings::default();
        assert!(settings.force_cpu_transcription);
    }

    #[test]
    fn test_no_gpu_fields_in_settings() {
        // This test will fail until we remove GPU fields
        let settings = AppSettings::default();
        // These fields shouldn't exist after migration
        // let _ = settings.whisper_accelerator; // Should cause compile error
        // let _ = settings.ort_accelerator; // Should cause compile error
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd src-tauri
cargo test settings_test::test_no_gpu_fields_in_settings
```

Expected: FAIL with compilation errors about missing fields

- [ ] **Step 3: Remove GPU accelerator enums**

Remove these entire sections from `settings.rs`:

```rust
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Type)]
#[serde(rename_all = "snake_case")]
pub enum WhisperAcceleratorSetting {
    Auto,
    Cpu,
    Gpu,
}

impl Default for WhisperAcceleratorSetting {
    fn default() -> Self {
        WhisperAcceleratorSetting::Auto
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Type)]
#[serde(rename_all = "snake_case")]
pub enum OrtAcceleratorSetting {
    Auto,
    Cpu,
    Cuda,
    #[serde(rename = "directml")]
    DirectMl,
    Rocm,
}

impl Default for OrtAcceleratorSetting {
    fn default() -> Self {
        OrtAcceleratorSetting::Auto
    }
}
```

- [ ] **Step 4: Add CPU-only setting**

Add to settings.rs:

```rust
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Type)]
pub struct ForceCpuTranscription {
    pub force_cpu: bool,
}

impl Default for ForceCpuTranscription {
    fn default() -> Self {
        ForceCpuTranscription { force_cpu: true }
    }
}
```

- [ ] **Step 5: Update AppSettings struct**

Remove these fields from `AppSettings`:

```rust
pub whisper_accelerator: WhisperAcceleratorSetting,
pub ort_accelerator: OrtAcceleratorSetting,
```

Add this field:

```rust
pub force_cpu_transcription: bool,
```

- [ ] **Step 6: Update default settings function**

In `default_app_settings()`, remove:

```rust
whisper_accelerator: WhisperAcceleratorSetting::default(),
ort_accelerator: OrtAcceleratorSetting::default(),
```

Add:

```rust
force_cpu_transcription: true,
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd src-tauri
cargo test settings_test
```

Expected: PASS

- [ ] **Step 8: Commit changes**

```bash
git add src-tauri/src/settings.rs
git commit -m "feat: remove GPU accelerator settings, add CPU-only option"
```

---

## Chunk 3: Update TranscriptionManager for CPU-Only

**Files:**

- Modify: `src-tauri/src/managers/transcription.rs`

- [ ] **Step 1: Write failing test for CPU-only enforcement**

Add to transcription.rs:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cpu_only_mode_enforced() {
        // This test will verify CPU-only mode is enforced
        // Implementation will check that accelerators are set to CPU
    }
}
```

- [ ] **Step 2: Remove GPU acceleration functions**

Remove these functions from transcription.rs:

```rust
pub fn apply_accelerator_settings(app: &tauri::AppHandle) {
    // Entire function implementation
}

pub fn get_available_accelerators() -> AvailableAccelerators {
    // Entire function implementation
}
```

- [ ] **Step 3: Remove AvailableAccelerators struct**

Remove:

```rust
#[derive(Serialize, Clone, Debug, Type)]
pub struct AvailableAccelerators {
    pub whisper: Vec<String>,
    pub ort: Vec<String>,
}
```

- [ ] **Step 4: Add CPU-only enforcement**

Add to transcription.rs:

```rust
/// Force CPU-only mode for all transcription engines
fn force_cpu_only_mode() {
    use transcribe_rs::accel;

    // Force CPU-only for all engines
    accel::set_whisper_accelerator(accel::WhisperAccelerator::CpuOnly);
    accel::set_ort_accelerator(accel::OrtAccelerator::CpuOnly);
    info!("All transcription engines forced to CPU-only mode");
}
```

- [ ] **Step 5: Call CPU-only enforcement at startup**

In `TranscriptionManager::new()`, add after manager creation:

```rust
// Force CPU-only mode to prevent GPU-related crashes
force_cpu_only_mode();
```

- [ ] **Step 6: Remove GPU-related imports**

Remove from imports:

```rust
use transcribe_rs::accel;
```

- [ ] **Step 7: Update lib.rs to remove GPU settings call**

In `src-tauri/src/lib.rs`, remove:

```rust
transcription::apply_accelerator_settings(&app);
```

- [ ] **Step 8: Run tests**

```bash
cd src-tauri
cargo test managers::transcription::tests
```

Expected: PASS

- [ ] **Step 9: Commit changes**

```bash
git add src-tauri/src/managers/transcription.rs src-tauri/src/lib.rs
git commit -m "feat: force CPU-only mode in transcription manager"
```

---

## Chunk 4: Add Streaming Foundation

**Files:**

- Modify: `src-tauri/src/managers/transcription.rs`
- Create: `src-tauri/src/managers/streaming.rs`

- [ ] **Step 1: Write failing test for streaming state**

Create `src-tauri/src/managers/streaming_test.rs`:

```rust
use crate::managers::streaming::StreamingState;
use std::sync::atomic::{AtomicBool, Ordering};

#[test]
fn test_streaming_state_creation() {
    let state = StreamingState::new();
    assert!(!state.is_streaming());
}

#[test]
fn test_streaming_state_toggle() {
    let state = StreamingState::new();
    state.start_streaming();
    assert!(state.is_streaming());
    state.stop_streaming();
    assert!(!state.is_streaming());
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd src-tauri
cargo test managers::streaming_test
```

Expected: FAIL with "module not found"

- [ ] **Step 3: Create streaming module**

Create `src-tauri/src/managers/streaming.rs`:

```rust
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

pub struct StreamingState {
    is_streaming: AtomicBool,
    buffer: Arc<Mutex<Vec<f32>>>,
    last_partial: Arc<Mutex<String>>,
}

impl StreamingState {
    pub fn new() -> Self {
        Self {
            is_streaming: AtomicBool::new(false),
            buffer: Arc::new(Mutex::new(Vec::new())),
            last_partial: Arc::new(Mutex::new(String::new())),
        }
    }

    pub fn is_streaming(&self) -> bool {
        self.is_streaming.load(Ordering::Relaxed)
    }

    pub fn start_streaming(&self) {
        self.is_streaming.store(true, Ordering::Relaxed);
        // Clear buffer when starting new session
        if let Ok(mut buffer) = self.buffer.lock() {
            buffer.clear();
        }
    }

    pub fn stop_streaming(&self) {
        self.is_streaming.store(false, Ordering::Relaxed);
    }

    pub fn add_audio_chunk(&self, chunk: Vec<f32>) -> Result<(), String> {
        if !self.is_streaming() {
            return Err("Not currently streaming".to_string());
        }

        if let Ok(mut buffer) = self.buffer.lock() {
            buffer.extend(chunk);
            // Keep buffer size manageable (keep last 5 seconds at 16kHz)
            if buffer.len() > 80000 {
                buffer.drain(0..40000); // Remove first 2.5 seconds
            }
        }
        Ok(())
    }

    pub fn get_buffer(&self) -> Vec<f32> {
        if let Ok(buffer) = self.buffer.lock() {
            buffer.clone()
        } else {
            Vec::new()
        }
    }
}
```

- [ ] **Step 4: Add streaming module to mod.rs**

Update `src-tauri/src/managers/mod.rs`:

```rust
pub mod streaming;
pub use streaming::StreamingState;
```

- [ ] **Step 5: Add streaming to TranscriptionManager**

In transcription.rs, add to imports:

```rust
use crate::managers::streaming::StreamingState;
```

Add to TranscriptionManager struct:

```rust
streaming_state: Arc<StreamingState>,
```

Add to TranscriptionManager::new():

```rust
streaming_state: Arc::new(StreamingState::new()),
```

- [ ] **Step 6: Add streaming methods**

Add to TranscriptionManager:

```rust
pub fn start_streaming(&self) -> Result<()> {
    self.streaming_state.start_streaming();
    info!("Started real-time transcription streaming");
    Ok(())
}

pub fn stop_streaming(&self) -> Result<()> {
    self.streaming_state.stop_streaming();
    info!("Stopped real-time transcription streaming");
    Ok(())
}

pub fn transcribe_chunk(&self, audio_chunk: Vec<f32>) -> Result<String> {
    // Add chunk to buffer
    self.streaming_state.add_audio_chunk(audio_chunk)?;

    // Get current buffer for transcription
    let buffer = self.streaming_state.get_buffer();

    if buffer.is_empty() {
        return Ok(String::new());
    }

    // Use existing transcribe method on buffer
    self.transcribe(buffer)
}

pub fn is_streaming(&self) -> bool {
    self.streaming_state.is_streaming()
}
```

- [ ] **Step 7: Run tests**

```bash
cd src-tauri
cargo test managers::streaming_test
```

Expected: PASS

- [ ] **Step 8: Commit changes**

```bash
git add src-tauri/src/managers/streaming.rs src-tauri/src/managers/mod.rs src-tauri/src/managers/transcription.rs
git commit -m "feat: add streaming foundation for real-time transcription"
```

---

## Chunk 5: Update Commands and Events

**Files:**

- Modify: `src-tauri/src/commands/transcription.rs`
- Create: `src-tauri/src/events/transcription.rs`

- [ ] **Step 1: Write failing test for streaming commands**

Add to transcription commands test file:

```rust
#[test]
fn test_streaming_command_handling() {
    // Test will verify streaming commands work properly
}
```

- [ ] **Step 2: Create transcription events module**

Create `src-tauri/src/events/transcription.rs`:

```rust
use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
pub struct PartialTranscriptionEvent {
    pub partial_text: String,
    pub is_final: bool,
    pub timestamp: u64,
}

#[derive(Clone, Debug, Serialize)]
pub struct StreamingStateChangedEvent {
    pub is_streaming: bool,
    pub timestamp: u64,
}
```

- [ ] **Step 3: Add events to mod.rs**

Update `src-tauri/src/events/mod.rs`:

```rust
pub mod transcription;
pub use transcription::{PartialTranscriptionEvent, StreamingStateChangedEvent};
```

- [ ] **Step 4: Add streaming commands**

Update `src-tauri/src/commands/transcription.rs`:

```rust
use crate::events::transcription::{PartialTranscriptionEvent, StreamingStateChangedEvent};

#[tauri::command]
pub async fn start_streaming_transcription(
    app: tauri::AppHandle,
) -> Result<(), String> {
    let transcription_manager = app.state::<Arc<TranscriptionManager>>();
    transcription_manager.start_streaming()
        .map_err(|e| e.to_string())?;

    // Emit streaming state changed event
    let event = StreamingStateChangedEvent {
        is_streaming: true,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };

    app.emit("streaming-state-changed", event)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn stop_streaming_transcription(
    app: tauri::AppHandle,
) -> Result<(), String> {
    let transcription_manager = app.state::<Arc<TranscriptionManager>>();
    transcription_manager.stop_streaming()
        .map_err(|e| e.to_string())?;

    // Emit streaming state changed event
    let event = StreamingStateChangedEvent {
        is_streaming: false,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };

    app.emit("streaming-state-changed", event)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn transcribe_audio_chunk(
    app: tauri::AppHandle,
    audio_chunk: Vec<f32>,
) -> Result<String, String> {
    let transcription_manager = app.state::<Arc<TranscriptionManager>>();

    let result = transcription_manager.transcribe_chunk(audio_chunk)
        .map_err(|e| e.to_string())?;

    // Emit partial transcription event
    let event = PartialTranscriptionEvent {
        partial_text: result.clone(),
        is_final: false,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };

    app.emit("partial-transcription", event)
        .map_err(|e| e.to_string())?;

    Ok(result)
}

#[tauri::command]
pub async fn is_streaming_active(
    app: tauri::AppHandle,
) -> Result<bool, String> {
    let transcription_manager = app.state::<Arc<TranscriptionManager>>();
    Ok(transcription_manager.is_streaming())
}
```

- [ ] **Step 5: Register new commands**

Update `src-tauri/src/lib.rs` in the invoke handler:

```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands ...
    start_streaming_transcription,
    stop_streaming_transcription,
    transcribe_audio_chunk,
    is_streaming_active,
])
```

- [ ] **Step 6: Run tests**

```bash
cd src-tauri
cargo test commands::transcription::tests
```

Expected: PASS

- [ ] **Step 7: Commit changes**

```bash
git add src-tauri/src/events/transcription.rs src-tauri/src/events/mod.rs src-tauri/src/commands/transcription.rs src-tauri/src/lib.rs
git commit -m "feat: add streaming commands and events for real-time transcription"
```

---

## Chunk 6: Integration Testing

**Files:**

- Modify: Various (integration tests)

- [ ] **Step 1: Create integration test**

Create `src-tauri/tests/cpu_only_transcription.rs`:

```rust
use handy_app_lib::*;
use std::time::Duration;

#[test]
fn test_cpu_only_transcription_workflow() {
    // Test that transcription works in CPU-only mode
    // This would require mock audio data
}

#[test]
fn test_streaming_workflow() {
    // Test that streaming start/stop works
    // Test chunk processing
}

#[test]
fn test_no_gpu_acceleration() {
    // Verify that no GPU acceleration is used
    // This might involve checking logs or environment
}
```

- [ ] **Step 2: Run integration tests**

```bash
cd src-tauri
cargo test --test cpu_only_transcription
```

Expected: PASS

- [ ] **Step 3: Manual testing checklist**

Create manual testing checklist:

- [ ] Application starts without GPU-related errors
- [ ] Model loading works on CPU
- [ ] Transcription produces accurate results
- [ ] Streaming can be started and stopped
- [ ] Audio chunks are processed correctly
- [ ] Events are emitted properly
- [ ] No crashes during extended use

- [ ] **Step 4: Performance benchmarking**

Create simple benchmark script to measure:

- Model loading time (CPU vs expected GPU)
- Transcription speed for typical audio lengths
- Memory usage patterns

- [ ] **Step 5: Commit integration tests**

```bash
git add src-tauri/tests/cpu_only_transcription.rs
git commit -m "test: add integration tests for CPU-only transcription"
```

---

## Final Verification

- [ ] **Step 1: Full test suite**

```bash
cd src-tauri
cargo test
```

Expected: All tests pass

- [ ] **Step 2: Build verification**

```bash
cd src-tauri
cargo build --release
```

Expected: Successful build

- [ ] **Step 3: Documentation update**

Update any relevant documentation to reflect CPU-only requirements

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete CPU-only transcription migration with streaming foundation"
```

---

## Testing Strategy Summary

1. **Unit Tests**: Each component tested in isolation
2. **Integration Tests**: End-to-end workflow verification
3. **Manual Tests**: Real-world usage scenarios
4. **Performance Tests**: Benchmark CPU-only performance
5. **Stability Tests**: Extended usage without crashes

## Rollback Instructions

If issues arise, rollback by:

1. Restore `Cargo.toml.backup` to `src-tauri/Cargo.toml`
2. Revert settings.rs changes from git history
3. Revert transcription.rs changes from git history
4. Remove new streaming files

## Success Criteria

- [ ] No GPU-related crashes
- [ ] All transcription engines work on CPU
- [ ] Streaming infrastructure in place
- [ ] Settings simplified to CPU-only
- [ ] All tests pass
- [ ] Documentation updated

---

**Total Estimated Time:** 11-18 hours  
**Dependencies:** Rust toolchain, existing Handy codebase  
**Risk Level:** Low (removing features is safer than adding)
