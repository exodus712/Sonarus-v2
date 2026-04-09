//! Logging module for file-based debug logging
//!
//! Provides commands for log management and diagnostic information.

use serde::Serialize;
use specta::Type;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

use crate::portable;

/// Information about the log file
#[derive(Serialize, Type, Debug, Clone)]
pub struct LogFileInfo {
    /// Path to the log file
    pub path: String,
    /// Size of the log file in bytes
    pub size_bytes: u64,
    /// Whether the log file exists
    pub exists: bool,
    /// Last modified timestamp (Unix epoch seconds)
    pub last_modified: Option<u64>,
}

/// Log entry from the log file
#[derive(Serialize, Type, Debug, Clone)]
#[allow(dead_code)]
pub struct LogEntry {
    /// Timestamp of the log entry
    pub timestamp: String,
    /// Log level (TRACE, DEBUG, INFO, WARN, ERROR)
    pub level: String,
    /// Target module
    pub target: String,
    /// Log message
    pub message: String,
}

/// Get information about the current log file
#[tauri::command]
#[specta::specta]
pub fn get_log_file_info(app: AppHandle) -> Result<LogFileInfo, String> {
    let log_dir =
        portable::app_log_dir(&app).map_err(|e| format!("Failed to get log directory: {}", e))?;

    // The log file is named handy.log (from tauri-plugin-log configuration in lib.rs)
    let log_file = log_dir.join("handy.log");

    let metadata = fs::metadata(&log_file);

    let (exists, size_bytes, last_modified) = match metadata {
        Ok(meta) => {
            let size = meta.len();
            let modified = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs());
            (true, size, modified)
        }
        Err(_) => (false, 0, None),
    };

    Ok(LogFileInfo {
        path: log_file.to_string_lossy().to_string(),
        size_bytes,
        exists,
        last_modified,
    })
}

/// Read the last N lines from the log file
#[tauri::command]
#[specta::specta]
pub fn get_recent_logs(app: AppHandle, lines: u32) -> Result<Vec<String>, String> {
    let log_dir =
        portable::app_log_dir(&app).map_err(|e| format!("Failed to get log directory: {}", e))?;

    let log_file = log_dir.join("handy.log");

    if !log_file.exists() {
        return Ok(vec![]);
    }

    let content =
        fs::read_to_string(&log_file).map_err(|e| format!("Failed to read log file: {}", e))?;

    let all_lines: Vec<&str> = content.lines().collect();
    let start_idx = all_lines.len().saturating_sub(lines as usize);
    let recent: Vec<String> = all_lines[start_idx..]
        .iter()
        .map(|s| s.to_string())
        .collect();

    Ok(recent)
}

/// Clear all log files (rotated logs included)
#[tauri::command]
#[specta::specta]
pub fn clear_logs(app: AppHandle) -> Result<(), String> {
    let log_dir =
        portable::app_log_dir(&app).map_err(|e| format!("Failed to get log directory: {}", e))?;

    // Clear the main log file
    let main_log = log_dir.join("handy.log");
    if main_log.exists() {
        if let Err(e) = fs::write(&main_log, "") {
            return Err(format!("Failed to clear main log file: {}", e));
        }
        log::info!("Cleared main log file");
    }

    // Clear rotated log files (handy.log.0, handy.log.1, etc.)
    for entry in
        fs::read_dir(&log_dir).map_err(|e| format!("Failed to read log directory: {}", e))?
    {
        if let Ok(entry) = entry {
            let path = entry.path();
            if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                if filename.starts_with("handy.log.")
                    && filename["handy.log.".len()..].parse::<u32>().is_ok()
                {
                    if let Err(e) = fs::remove_file(&path) {
                        log::warn!("Failed to remove rotated log file {:?}: {}", path, e);
                    } else {
                        log::info!("Removed rotated log file: {:?}", path);
                    }
                }
            }
        }
    }

    Ok(())
}

/// Export logs to a specific location
#[tauri::command]
#[specta::specta]
pub fn export_logs(app: AppHandle, target_path: String) -> Result<(), String> {
    let log_dir =
        portable::app_log_dir(&app).map_err(|e| format!("Failed to get log directory: {}", e))?;

    let source_log = log_dir.join("handy.log");
    let target = PathBuf::from(target_path);

    if !source_log.exists() {
        return Err("Failed to export: log file does not exist".to_string());
    }

    fs::copy(&source_log, &target).map_err(|e| format!("Failed to copy log file: {}", e))?;

    log::info!("Exported logs to {:?}", target);
    Ok(())
}

/// Search logs for a specific pattern
#[tauri::command]
#[specta::specta]
pub fn search_logs(
    app: AppHandle,
    pattern: String,
    max_results: u32,
) -> Result<Vec<String>, String> {
    let log_dir =
        portable::app_log_dir(&app).map_err(|e| format!("Failed to get log directory: {}", e))?;

    let log_file = log_dir.join("handy.log");

    if !log_file.exists() {
        return Ok(vec![]);
    }

    let content =
        fs::read_to_string(&log_file).map_err(|e| format!("Failed to read log file: {}", e))?;

    let pattern_lower = pattern.to_lowercase();
    let results: Vec<String> = content
        .lines()
        .filter(|line| line.to_lowercase().contains(&pattern_lower))
        .take(max_results as usize)
        .map(|s| s.to_string())
        .collect();

    Ok(results)
}

/// Get all available log files (including rotated)
#[tauri::command]
#[specta::specta]
pub fn get_all_log_files(app: AppHandle) -> Result<Vec<LogFileInfo>, String> {
    let log_dir =
        portable::app_log_dir(&app).map_err(|e| format!("Failed to get log directory: {}", e))?;

    let mut files = vec![];

    // Main log file
    let main_log = log_dir.join("handy.log");
    if let Ok(meta) = fs::metadata(&main_log) {
        files.push(LogFileInfo {
            path: main_log.to_string_lossy().to_string(),
            size_bytes: meta.len(),
            exists: true,
            last_modified: meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs()),
        });
    }

    // Rotated log files
    for entry in
        fs::read_dir(&log_dir).map_err(|e| format!("Failed to read log directory: {}", e))?
    {
        if let Ok(entry) = entry {
            let path = entry.path();
            if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                if filename.starts_with("handy.log.")
                    && filename["handy.log.".len()..].parse::<u32>().is_ok()
                {
                    if let Ok(meta) = fs::metadata(&path) {
                        files.push(LogFileInfo {
                            path: path.to_string_lossy().to_string(),
                            size_bytes: meta.len(),
                            exists: true,
                            last_modified: meta
                                .modified()
                                .ok()
                                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                .map(|d| d.as_secs()),
                        });
                    }
                }
            }
        }
    }

    // Sort by name (which puts rotated logs in order)
    files.sort_by(|a, b| a.path.cmp(&b.path));

    Ok(files)
}
