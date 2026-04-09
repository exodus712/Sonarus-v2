use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

pub struct StreamingState {
    is_streaming: AtomicBool,
    buffer: Arc<Mutex<Vec<f32>>>,
    #[allow(dead_code)]
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
