import type { Page } from "@playwright/test";

const mockedModels = [
  {
    id: "whisper-large-v3-turbo",
    name: "Whisper Large v3 Turbo",
    description: "Fast general-purpose English model",
    filename: "whisper-large-v3-turbo.bin",
    url: null,
    sha256: null,
    size_mb: 1510,
    is_downloaded: true,
    is_downloading: false,
    partial_size: 0,
    is_directory: false,
    engine_type: "whisper",
    accuracy_score: 4,
    speed_score: 5,
    supports_translation: true,
    is_recommended: true,
    supported_languages: ["en"],
    supports_language_selection: true,
    is_custom: false,
  },
];

const mockedMicrophones = [
  { index: "default", name: "Default", is_default: true },
  { index: "mic-usb", name: "USB Microphone", is_default: false },
];

const mockedOutputDevices = [
  { index: "default", name: "Default", is_default: true },
  { index: "spk-usb", name: "USB Speakers", is_default: false },
];

const mockedSettings = {
  audio_feedback: false,
  audio_feedback_volume: 0.5,
  bindings: {
    transcribe: {
      current_binding: "Ctrl+Shift+Space",
      default_binding: "Ctrl+Shift+Space",
    },
  },
  external_script_path: null,
  selected_microphone: "Default",
  selected_output_device: "Default",
  sound_theme: "marimba",
  transcribing_visualizer: "dots",
};

export async function mockTauriBridge(page: Page): Promise<void> {
  await page.addInitScript(
    ({ settings }) => {
      const callbacks = new Map<number, unknown>();
      let nextCallbackId = 1;
      let nextEventListenerId = 1;

      Object.defineProperty(window, "__TAURI_OS_PLUGIN_INTERNALS__", {
        configurable: true,
        value: {
          arch: "x86_64",
          eol: "\n",
          exe_extension: "",
          family: "unix",
          os_type: "linux",
          platform: "linux",
          version: "playwright",
        },
      });

      Object.defineProperty(window, "__TAURI_EVENT_PLUGIN_INTERNALS__", {
        configurable: true,
        value: {
          unregisterListener: () => {},
        },
      });

      Object.defineProperty(window, "__TAURI_INTERNALS__", {
        configurable: true,
        value: {
          metadata: {
            currentWindow: {
              label: "main",
            },
          },
          invoke: async (cmd: string) => {
            switch (cmd) {
              case "get_app_settings":
              case "get_default_settings":
                return settings;
              case "has_any_models_available":
                return true;
              case "get_available_models":
                return mockedModels;
              case "get_current_model":
                return mockedModels[0].id;
              case "get_available_microphones":
                return mockedMicrophones;
              case "get_available_output_devices":
                return mockedOutputDevices;
              case "check_custom_sounds":
                return { start: false, stop: false };
              case "plugin:event|listen":
                return nextEventListenerId++;
              case "plugin:event|unlisten":
                return null;
              case "plugin:os|locale":
                return "en-US";
              default:
                throw new Error(`Unmocked tauri command: ${cmd}`);
            }
          },
          transformCallback: (callback: unknown) => {
            const id = nextCallbackId++;
            callbacks.set(id, callback);
            return id;
          },
          unregisterCallback: (id: number) => {
            callbacks.delete(id);
          },
          convertFileSrc: (filePath: string) => filePath,
        },
      });
    },
    { settings: mockedSettings },
  );
}
