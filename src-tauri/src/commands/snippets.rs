use crate::managers::snippets::{Snippet, SnippetManager};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

#[tauri::command]
#[specta::specta]
pub async fn list_snippets(
    app: AppHandle,
    snippet_manager: State<'_, Arc<SnippetManager>>,
) -> Result<Vec<Snippet>, String> {
    // Check if snippet manager exists (it may not if initialization failed)
    if app.try_state::<Arc<SnippetManager>>().is_none() {
        return Err("Snippet manager is not available".to_string());
    }
    snippet_manager.list_snippets().map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_snippet(
    app: AppHandle,
    snippet_manager: State<'_, Arc<SnippetManager>>,
    trigger: String,
    expansion: String,
) -> Result<Snippet, String> {
    if app.try_state::<Arc<SnippetManager>>().is_none() {
        return Err("Snippet manager is not available".to_string());
    }
    snippet_manager
        .create_snippet(trigger, expansion)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_snippet(
    app: AppHandle,
    snippet_manager: State<'_, Arc<SnippetManager>>,
    id: i64,
    trigger: String,
    expansion: String,
    is_enabled: bool,
) -> Result<Snippet, String> {
    if app.try_state::<Arc<SnippetManager>>().is_none() {
        return Err("Snippet manager is not available".to_string());
    }
    snippet_manager
        .update_snippet(id, trigger, expansion, is_enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_snippet(
    app: AppHandle,
    snippet_manager: State<'_, Arc<SnippetManager>>,
    id: i64,
) -> Result<(), String> {
    if app.try_state::<Arc<SnippetManager>>().is_none() {
        return Err("Snippet manager is not available".to_string());
    }
    snippet_manager
        .delete_snippet(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn set_snippets_enabled(app: AppHandle, enabled: bool) -> Result<(), String> {
    let mut settings = crate::settings::get_settings(&app);
    settings.snippets_enabled = enabled;
    crate::settings::write_settings(&app, settings)?;
    Ok(())
}