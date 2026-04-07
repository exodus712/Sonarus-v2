use crate::settings::SoundTheme;
use crate::settings::{self, AppSettings};
use cpal::traits::{DeviceTrait, HostTrait};
use log::{debug, error, warn};
use rodio::OutputStreamBuilder;
use std::fs::File;
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::thread;
use tauri::{AppHandle, Manager};

#[derive(Clone, Copy, Debug)]
pub enum SoundType {
    Start,
    Stop,
    Complete,
    Error,
}

const DEFAULT_START_SOUND: &str = "resources/marimba_start.wav";
const DEFAULT_STOP_SOUND: &str = "resources/marimba_stop.wav";

fn resolve_sound_path(
    app: &AppHandle,
    settings: &AppSettings,
    sound_type: SoundType,
) -> Option<PathBuf> {
    let candidates = get_sound_path_candidates(settings, sound_type);
    let primary = candidates.first()?.clone();

    for candidate in candidates {
        let Some(path) = resolve_candidate_path(app, settings, &candidate) else {
            continue;
        };

        if path.is_file() {
            if candidate != primary {
                warn!(
                    "Sound file '{}' is missing for {:?}. Falling back to '{}'",
                    primary, settings.sound_theme, candidate
                );
            }
            return Some(path);
        }
    }

    warn!(
        "No usable sound file found for {:?} ({:?}). Checked '{}'",
        settings.sound_theme, sound_type, primary
    );
    None
}

fn resolve_candidate_path(
    app: &AppHandle,
    settings: &AppSettings,
    sound_file: &str,
) -> Option<PathBuf> {
    let base_dir = match settings.sound_theme {
        SoundTheme::Custom if !sound_file.starts_with("resources/") => {
            tauri::path::BaseDirectory::AppData
        }
        _ => tauri::path::BaseDirectory::Resource,
    };

    match base_dir {
        tauri::path::BaseDirectory::AppData => {
            crate::portable::resolve_app_data(app, sound_file).ok()
        }
        _ => app.path().resolve(sound_file, base_dir).ok(),
    }
}

fn get_sound_path(settings: &AppSettings, sound_type: SoundType) -> String {
    get_sound_path_candidates(settings, sound_type)
        .into_iter()
        .next()
        .unwrap_or_else(|| fallback_sound_path(sound_type).to_string())
}

fn get_sound_path_candidates(settings: &AppSettings, sound_type: SoundType) -> Vec<String> {
    match (settings.sound_theme, sound_type) {
        (SoundTheme::Custom, SoundType::Start) => vec![
            "custom_start.wav".to_string(),
            DEFAULT_START_SOUND.to_string(),
        ],
        (SoundTheme::Custom, SoundType::Stop) => vec![
            "custom_stop.wav".to_string(),
            DEFAULT_STOP_SOUND.to_string(),
        ],
        (SoundTheme::Custom, SoundType::Complete) => vec![
            "custom_complete.wav".to_string(),
            "custom_stop.wav".to_string(),
            DEFAULT_STOP_SOUND.to_string(),
        ],
        (SoundTheme::Custom, SoundType::Error) => vec![
            "custom_error.wav".to_string(),
            "custom_stop.wav".to_string(),
            DEFAULT_STOP_SOUND.to_string(),
        ],
        (_, SoundType::Start) => vec![
            settings.sound_theme.to_start_path(),
            DEFAULT_START_SOUND.to_string(),
        ],
        (_, SoundType::Stop) => vec![
            settings.sound_theme.to_stop_path(),
            DEFAULT_STOP_SOUND.to_string(),
        ],
        (_, SoundType::Complete) => vec![
            settings.sound_theme.to_complete_path(),
            settings.sound_theme.to_stop_path(),
            DEFAULT_STOP_SOUND.to_string(),
        ],
        (_, SoundType::Error) => vec![
            settings.sound_theme.to_error_path(),
            settings.sound_theme.to_stop_path(),
            DEFAULT_STOP_SOUND.to_string(),
        ],
    }
}

fn fallback_sound_path(sound_type: SoundType) -> &'static str {
    match sound_type {
        SoundType::Start => DEFAULT_START_SOUND,
        SoundType::Stop | SoundType::Complete | SoundType::Error => DEFAULT_STOP_SOUND,
    }
}

pub fn play_feedback_sound(app: &AppHandle, sound_type: SoundType) {
    let settings = settings::get_settings(app);
    if !settings.audio_feedback {
        return;
    }
    if let Some(path) = resolve_sound_path(app, &settings, sound_type) {
        play_sound_async(app, path);
    }
}

pub fn play_feedback_sound_blocking(app: &AppHandle, sound_type: SoundType) {
    let settings = settings::get_settings(app);
    if !settings.audio_feedback {
        return;
    }
    if let Some(path) = resolve_sound_path(app, &settings, sound_type) {
        play_sound_blocking(app, &path);
    }
}

pub fn play_test_sound(app: &AppHandle, sound_type: SoundType) {
    let settings = settings::get_settings(app);
    if let Some(path) = resolve_sound_path(app, &settings, sound_type) {
        play_sound_blocking(app, &path);
    }
}

fn play_sound_async(app: &AppHandle, path: PathBuf) {
    let app_handle = app.clone();
    thread::spawn(move || {
        if let Err(e) = play_sound_at_path(&app_handle, path.as_path()) {
            error!("Failed to play sound '{}': {}", path.display(), e);
        }
    });
}

fn play_sound_blocking(app: &AppHandle, path: &Path) {
    if let Err(e) = play_sound_at_path(app, path) {
        error!("Failed to play sound '{}': {}", path.display(), e);
    }
}

fn play_sound_at_path(app: &AppHandle, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let settings = settings::get_settings(app);
    let volume = settings.audio_feedback_volume;
    let selected_device = settings.selected_output_device.clone();
    play_audio_file(path, selected_device, volume)
}

fn play_audio_file(
    path: &std::path::Path,
    selected_device: Option<String>,
    volume: f32,
) -> Result<(), Box<dyn std::error::Error>> {
    let stream_builder = if let Some(device_name) = selected_device {
        if device_name == "Default" {
            debug!("Using default device");
            OutputStreamBuilder::from_default_device()?
        } else {
            let host = crate::audio_toolkit::get_cpal_host();
            let devices = host.output_devices()?;

            let mut found_device = None;
            for device in devices {
                if device.name()? == device_name {
                    found_device = Some(device);
                    break;
                }
            }

            match found_device {
                Some(device) => OutputStreamBuilder::from_device(device)?,
                None => {
                    warn!("Device '{}' not found, using default device", device_name);
                    OutputStreamBuilder::from_default_device()?
                }
            }
        }
    } else {
        debug!("Using default device");
        OutputStreamBuilder::from_default_device()?
    };

    let stream_handle = stream_builder.open_stream()?;
    let mixer = stream_handle.mixer();

    let file = File::open(path)?;
    let buf_reader = BufReader::new(file);

    let sink = rodio::play(mixer, buf_reader)?;
    sink.set_volume(volume);
    sink.sleep_until_end();

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_complete_sound_has_an_existing_fallback_resource() {
        let settings = crate::settings::get_default_settings();
        let paths = get_sound_path_candidates(&settings, SoundType::Complete);

        assert!(
            paths.iter().any(|path| Path::new(path).exists()),
            "expected at least one complete sound candidate to exist: {:?}",
            paths
        );
    }

    #[test]
    fn default_error_sound_has_an_existing_fallback_resource() {
        let settings = crate::settings::get_default_settings();
        let paths = get_sound_path_candidates(&settings, SoundType::Error);

        assert!(
            paths.iter().any(|path| Path::new(path).exists()),
            "expected at least one error sound candidate to exist: {:?}",
            paths
        );
    }
}
