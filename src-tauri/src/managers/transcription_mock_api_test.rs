use super::transcription_mock::TranscriptionManager;
use anyhow::Result;

#[test]
fn mock_transcription_manager_matches_streaming_command_api() {
    let _start_streaming: fn(&TranscriptionManager) -> Result<()> =
        TranscriptionManager::start_streaming;
    let _stop_streaming: fn(&TranscriptionManager) -> Result<()> =
        TranscriptionManager::stop_streaming;
    let _transcribe_chunk: fn(&TranscriptionManager, Vec<f32>) -> Result<String> =
        TranscriptionManager::transcribe_chunk;
    let _is_streaming: fn(&TranscriptionManager) -> bool = TranscriptionManager::is_streaming;
}
