use crate::events::transcription::{PartialTranscriptionEvent, StreamingStateChangedEvent};
use crate::managers::transcription::TranscriptionManager;
use crate::settings::{get_settings, write_settings, ModelUnloadTimeout};
use serde::Serialize;
use specta::Type;
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Serialize, Type)]
pub struct ModelLoadStatus {
    is_loaded: bool,
    current_model: Option<String>,
}

#[tauri::command]
#[specta::specta]
pub fn set_model_unload_timeout(app: AppHandle, timeout: ModelUnloadTimeout) {
    let mut settings = get_settings(&app);
    settings.model_unload_timeout = timeout;
    write_settings(&app, settings);
}

#[tauri::command]
#[specta::specta]
pub fn get_model_load_status(
    transcription_manager: State<TranscriptionManager>,
) -> Result<ModelLoadStatus, String> {
    Ok(ModelLoadStatus {
        is_loaded: transcription_manager.is_model_loaded(),
        current_model: transcription_manager.get_current_model(),
    })
}

#[tauri::command]
#[specta::specta]
pub fn unload_model_manually(
    transcription_manager: State<TranscriptionManager>,
) -> Result<(), String> {
    transcription_manager
        .unload_model()
        .map_err(|e| format!("Failed to unload model: {}", e))
}

#[tauri::command]
#[specta::specta]
pub async fn start_streaming_transcription(app: AppHandle) -> Result<(), String> {
    let transcription_manager = app.state::<std::sync::Arc<TranscriptionManager>>();
    transcription_manager
        .start_streaming()
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
#[specta::specta]
pub async fn stop_streaming_transcription(app: AppHandle) -> Result<(), String> {
    let transcription_manager = app.state::<std::sync::Arc<TranscriptionManager>>();
    transcription_manager
        .stop_streaming()
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
#[specta::specta]
pub async fn transcribe_audio_chunk(
    app: AppHandle,
    audio_chunk: Vec<f32>,
) -> Result<String, String> {
    let transcription_manager = app.state::<std::sync::Arc<TranscriptionManager>>();

    let result = transcription_manager
        .transcribe_chunk(audio_chunk)
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
#[specta::specta]
pub async fn is_streaming_active(app: AppHandle) -> Result<bool, String> {
    let transcription_manager = app.state::<std::sync::Arc<TranscriptionManager>>();
    Ok(transcription_manager.is_streaming())
}
