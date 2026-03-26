# Sonarus

**The speech-to-text tool you'll actually love using.**

Sonarus is a premium speech-to-text desktop application that combines the power of the open-source Sonarus project with an extraordinary user experience. Press a shortcut, speak, and have your words appear in any text field — entirely offline and private.

> _"Invisible until you need it. Extraordinary when you do."_

## Why Sonarus?

Sonarus is a fork of the Sonarus project that bets on **experience over extensibility** as its primary value. Where Sonarus aims to be the most forkable speech-to-text tool, Sonarus aims to be the most finished one.

### The Premium Experience

- **Extraordinary Design**: A redesigned recording overlay, rich transcription history, and satisfying sound design
- **Privacy First**: All audio processing is local. No audio data leaves your device under any circumstance
- **Keyboard-Driven**: Every interaction has a shortcut. Power users never need to touch the mouse
- **Thoughtful UX**: Inspired by Superwhisper, Notion, Raycast, and Apple HIG
- **Open Source**: Built on the foundation of Sonarus, preserving everything that makes it excellent

### What Makes Sonarus Different

- **The Recording Pill**: The most-seen surface is extraordinary — a floating overlay with live waveform visualization
- **Rich History**: Every transcription saved in a searchable, journal-like interface
- **Sound Design**: Every state transition has a satisfying audio cue
- **App-Aware Intelligence**: Context-aware transcription profiles (V1.x)
- **Local LLM Post-Processing**: Future-proof architecture for AI-powered enhancements

## How It Works

1. **Press** a configurable keyboard shortcut to start recording
2. **Speak** your words while the recording pill appears with live waveform
3. **Release** and watch the pill morph into a transcribing state
4. **Get** your transcribed text pasted directly into whatever app you're using

The process is entirely local and enhanced:

- **Voice Activity Detection**: Silence is filtered using Silero VAD
- **Premium Models**: Choose from Whisper (Small/Medium/Turbo/Large) or Parakeet V3
- **Rich History**: Every transcription saved automatically with full-text search
- **Sound Feedback**: Satisfying audio cues for every state transition

## Quick Start

### Installation

1. Download the latest release from the [releases page](https://github.com/exodus7124712/Sonarus-v2/releases) (WIP)
   - **macOS**: WIP
   - **Windows**: WIP
2. Install the application
3. Launch Sonarus and grant necessary system permissions (microphone, accessibility)
4. Configure your preferred keyboard shortcuts in Settings
5. Start transcribing!

### Development Setup

For detailed build instructions including platform-specific requirements, see [BUILD.md](BUILD.md).

## Architecture

Sonarus builds on the solid foundation of Sonarus, maintaining the same technical architecture while adding premium experience layers:

### Core Foundation (Preserved from Sonarus)

- **Frontend**: React + TypeScript with Tailwind CSS for the settings UI
- **Backend**: Rust for system integration, audio processing, and ML inference
- **Core Libraries**:
  - `whisper-rs`: Local speech recognition with Whisper models
  - `transcription-rs`: CPU-optimized speech recognition with Parakeet models
  - `cpal`: Cross-platform audio I/O
  - `vad-rs`: Voice Activity Detection
  - `rdev`: Global keyboard shortcuts and system events
  - `rubato`: Audio resampling

### Sonarus Experience Layer

- **Recording Overlay**: Floating pill with live waveform visualization and smooth state transitions
- **History System**: SQLite-based transcription history with search and export
- **Sound Design**: Bundled audio assets for state feedback
- **App Context**: Active application detection for profile switching
- **Post-Processing Pipeline**: Pluggable architecture for rule-based and LLM transforms

### Debug Mode

Sonarus includes an advanced debug mode for development and troubleshooting. Access it by pressing:

- **macOS**: `Cmd+Shift+D`
- **Windows/Linux**: `Ctrl+Shift+D`

### CLI Parameters

Sonarus supports command-line flags for controlling a running instance and customizing startup behavior. These work on all platforms (macOS, Windows, Linux).

**Remote control flags** (sent to an already-running instance via the single-instance plugin):

```bash
Sonarus --toggle-transcription    # Toggle recording on/off
Sonarus --toggle-post-process     # Toggle recording with post-processing on/off
Sonarus --cancel                  # Cancel the current operation
```

**Startup flags:**

```bash
Sonarus --start-hidden            # Start without showing the main window
Sonarus --no-tray                 # Start without the system tray icon
Sonarus --debug                   # Enable debug mode with verbose logging
Sonarus --help                    # Show all available flags
```

Flags can be combined for autostart scenarios:

```bash
Sonarus --start-hidden --no-tray
```

> **macOS tip:** When Sonarus is installed as an app bundle, invoke the binary directly:
>
> ```bash
> /Applications/Sonarus.app/Contents/MacOS/Sonarus --toggle-transcription
> ```

## Known Issues & Current Limitations

This project is actively being developed and has some known issues. We believe in transparency about the current state:

### Major Issues (Help Wanted)

- **Whisper Model Crashes:**
- Whisper models crash on certain system configurations (Windows and Linux)
- Does not affect all systems - issue is configuration-dependent
- If you experience crashes and are a developer, please help to fix and provide debug logs!

**Wayland Support (Linux):**

- Limited support for Wayland display server
- Requires [`wtype`](https://github.com/atx/wtype) or [`dotool`](https://sr.ht/~geb/dotool/) for text input to work correctly (see [Linux Notes](#linux-notes) below for installation)

### Linux Notes

**Text Input Tools:**

For reliable text input on Linux, install the appropriate tool for your display server:

| Display Server | Recommended Tool | Install Command                                    |
| -------------- | ---------------- | -------------------------------------------------- |
| X11            | `xdotool`        | `sudo apt install xdotool`                         |
| Wayland        | `wtype`          | `sudo apt install wtype`                           |
| Both           | `dotool`         | `sudo apt install dotool` (requires `input` group) |

- **X11**: Install `xdotool` for both direct typing and clipboard paste shortcuts
- **Wayland**: Install `wtype` (preferred) or `dotool` for text input to work correctly
- **dotool setup**: Requires adding your user to the `input` group: `sudo usermod -aG input $USER` (then log out and back in)

Without these tools, Sonarus falls back to enigo which may have limited compatibility, especially on Wayland.

**Other Notes:**

- **Runtime library dependency (`libgtk-layer-shell.so.0`)**:
  - Sonarus links `gtk-layer-shell` on Linux. If startup fails with `error while loading shared libraries: libgtk-layer-shell.so.0`, install the runtime package for your distro:

    | Distro        | Package to install    | Example command                        |
    | ------------- | --------------------- | -------------------------------------- |
    | Ubuntu/Debian | `libgtk-layer-shell0` | `sudo apt install libgtk-layer-shell0` |
    | Fedora/RHEL   | `gtk-layer-shell`     | `sudo dnf install gtk-layer-shell`     |
    | Arch Linux    | `gtk-layer-shell`     | `sudo pacman -S gtk-layer-shell`       |

  - For building from source on Ubuntu/Debian, you may also need `libgtk-layer-shell-dev`.

- The recording overlay is disabled by default on Linux (`Overlay Position: None`) because certain compositors treat it as the active window. When the overlay is visible it can steal focus, which prevents Sonarus from pasting back into the application that triggered transcription. If you enable the overlay anyway, be aware that clipboard-based pasting might fail or end up in the wrong window.
- If you are having trouble with the app, running with the environment variable `WEBKIT_DISABLE_DMABUF_RENDERER=1` may help
- **Global keyboard shortcuts (Wayland):** On Wayland, system-level shortcuts must be configured through your desktop environment or window manager. Use the [CLI flags](#cli-parameters) as the command for your custom shortcut.

  **GNOME:**
  1. Open **Settings > Keyboard > Keyboard Shortcuts > Custom Shortcuts**
  2. Click the **+** button to add a new shortcut
  3. Set the **Name** to `Toggle Sonarus Transcription`
  4. Set the **Command** to `Sonarus --toggle-transcription`
  5. Click **Set Shortcut** and press your desired key combination (e.g., `Super+O`)

  **KDE Plasma:**
  1. Open **System Settings > Shortcuts > Custom Shortcuts**
  2. Click **Edit > New > Global Shortcut > Command/URL**
  3. Name it `Toggle Sonarus Transcription`
  4. In the **Trigger** tab, set your desired key combination
  5. In the **Action** tab, set the command to `Sonarus --toggle-transcription`

  **Sway / i3:**

  Add to your config file (`~/.config/sway/config` or `~/.config/i3/config`):

  ```ini
  bindsym $mod+o exec Sonarus --toggle-transcription
  ```

  **Hyprland:**

  Add to your config file (`~/.config/hypr/hyprland.conf`):

  ```ini
  bind = $mainMod, O, exec, Sonarus --toggle-transcription
  ```

- You can also manage global shortcuts outside of Sonarus via Unix signals, which lets Wayland window managers or other hotkey daemons keep ownership of keybindings:

  | Signal    | Action                                    | Example                  |
  | --------- | ----------------------------------------- | ------------------------ |
  | `SIGUSR2` | Toggle transcription                      | `pkill -USR2 -n Sonarus` |
  | `SIGUSR1` | Toggle transcription with post-processing | `pkill -USR1 -n Sonarus` |

  Example Sway config:

  ```ini
  bindsym $mod+o exec pkill -USR2 -n Sonarus
  bindsym $mod+p exec pkill -USR1 -n Sonarus
  ```

  `pkill` here simply delivers the signal—it does not terminate the process.

## Platform Support

- **macOS**: 12 Monterey minimum (Intel + Apple Silicon)
- **Windows**: Windows 10 x64 minimum
- **Linux**: Inherited Sonarus support preserved but not a V1 priority

## System Requirements

**Recommended for optimal performance:**

### macOS

- Apple Silicon M1/M2/M3 or Intel Mac
- 8GB RAM minimum, 16GB recommended
- macOS 12 Monterey or later

### Windows

- Intel i5/AMD Ryzen 5 or better
- 8GB RAM minimum, 16GB recommended
- Windows 10 x64 or later
- Optional: NVIDIA/AMD GPU for acceleration (WIP)

### Linux

- Intel i5/AMD Ryzen 5 or better
- 8GB RAM minimum
- Ubuntu 22.04+ or equivalent
- GPU acceleration available where supported (WIP)

## Roadmap & Active Development

We're actively working on several features and improvements. Contributions and feedback are welcome!

### In Progress

**Debug Logging:**

- Adding debug logging to a file to help diagnose issues

**macOS Keyboard Improvements:**

- Support for Globe key as transcription trigger
- A rewrite of global shortcut handling for MacOS, and potentially other OS's too.

**Opt-in Analytics:**

- Collect anonymous usage data to help improve Sonarus
- Privacy-first approach with clear opt-in

**Settings Refactoring:**

- Cleanup and refactor settings system which is becoming bloated and messy
- Implement better abstractions for settings management

**Tauri Commands Cleanup:**

- Abstract and organize Tauri command patterns
- Investigate tauri-specta for improved type safety and organization

## Troubleshooting

### Manual Model Installation (For Proxy Users or Network Restrictions)

If you're behind a proxy, firewall, or in a restricted network environment where Sonarus cannot download models automatically, you can manually download and install them. The URLs are publicly accessible from any browser.

#### Step 1: Find Your App Data Directory

1. Open Sonarus settings
2. Navigate to the **About** section
3. Copy the "App Data Directory" path shown there, or use the shortcuts:
   - **macOS**: `Cmd+Shift+D` to open debug menu
   - **Windows/Linux**: `Ctrl+Shift+D` to open debug menu

The typical paths are:

- **macOS**: `~/Library/Application Support/com.exodus712.sonarus/`
- **Windows**: `C:\Users\{username}\AppData\Roaming\com.exodus712.sonarus\`
- **Linux**: `~/.config/com.exodus712.sonarus/`

#### Step 2: Create Models Directory

Inside your app data directory, create a `models` folder if it doesn't already exist:

```bash
# macOS/Linux
mkdir -p ~/Library/Application\ Support/com.exodus712.Sonarus/models

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\com.exodus712.sonarus\models"
```

#### Step 3: Download Model Files

Download the models you want from below (will be providing our own blob storage soon)

**Whisper Models (single .bin files):**

- Small (487 MB): `https://blob.Sonarus.computer/ggml-small.bin`
- Medium (492 MB): `https://blob.Sonarus.computer/whisper-medium-q4_1.bin`
- Turbo (1600 MB): `https://blob.Sonarus.computer/ggml-large-v3-turbo.bin`
- Large (1100 MB): `https://blob.Sonarus.computer/ggml-large-v3-q5_0.bin`

**Parakeet Models (compressed archives):**

- V2 (473 MB): `https://blob.Sonarus.computer/parakeet-v2-int8.tar.gz`
- V3 (478 MB): `https://blob.Sonarus.computer/parakeet-v3-int8.tar.gz`

#### Step 4: Install Models

**For Whisper Models (.bin files):**

Simply place the `.bin` file directly into the `models` directory:

```
{app_data_dir}/models/
├── ggml-small.bin
├── whisper-medium-q4_1.bin
├── ggml-large-v3-turbo.bin
└── ggml-large-v3-q5_0.bin
```

**For Parakeet Models (.tar.gz archives):**

1. Extract the `.tar.gz` file
2. Place the **extracted directory** into the `models` folder
3. The directory must be named exactly as follows:
   - **Parakeet V2**: `parakeet-tdt-0.6b-v2-int8`
   - **Parakeet V3**: `parakeet-tdt-0.6b-v3-int8`

Final structure should look like:

```
{app_data_dir}/models/
├── parakeet-tdt-0.6b-v2-int8/     (directory with model files inside)
│   ├── (model files)
│   └── (config files)
└── parakeet-tdt-0.6b-v3-int8/     (directory with model files inside)
    ├── (model files)
    └── (config files)
```

**Important Notes:**

- For Parakeet models, the extracted directory name **must** match exactly as shown above
- Do not rename the `.bin` files for Whisper models—use the exact filenames from the download URLs
- After placing the files, restart Sonarus to detect the new models

#### Step 5: Verify Installation

1. Restart Sonarus
2. Open Settings → Models
3. Your manually installed models should now appear as "Downloaded"
4. Select the model you want to use and test transcription

### Custom Whisper Models

Sonarus can auto-discover custom Whisper GGML models placed in the `models` directory. This is useful for users who want to use fine-tuned or community models not included in the default model list.

**How to use:**

1. Obtain a Whisper model in GGML `.bin` format (e.g., from [Hugging Face](https://huggingface.co/models?search=whisper%20ggml))
2. Place the `.bin` file in your `models` directory (see paths above)
3. Restart Sonarus to discover the new model
4. The model will appear in the "Custom Models" section of the Models settings page

**Important:**

- Community models are user-provided and may not receive troubleshooting assistance
- The model must be a valid Whisper GGML format (`.bin` file)
- Model name is derived from the filename (e.g., `my-custom-model.bin` → "My Custom Model")

### How to Contribute

1. **Check existing issues** at [github.com/exodus712/Sonarus-v2/issues](https://github.com/exodus712/Sonarus-v2/issues)
2. **Fork the repository** and create a feature branch
3. **Test thoroughly** on your target platform
4. **Submit a pull request** with clear description of changes

The goal is to create both a useful tool and a foundation for others to build upon—a well-patterned, simple codebase that serves the community.

## Related Projects

- **Handy CLI**: The original Python command-line version
- **[handy.computer](https://handy.computer)** - The original project's website with demos and documentation

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Whisper** by OpenAI for the speech recognition model
- **whisper.cpp and ggml** for amazing cross-platform whisper inference/acceleration
- **Silero** for great lightweight VAD
- **Tauri** team for excellent Rust-based app framework
- **Community contributors** helping make Sonarus better
- **Sonarus** - The original project that serves as foundation and inspiration for Sonarus
