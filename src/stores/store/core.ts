import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { listen } from "@tauri-apps/api/event";
import type { AppSettings as Settings, AudioDevice } from "@/bindings";
import { commands } from "@/bindings";
import { settingUpdaters } from "./updaters";
import { createPostProcessMethods } from "./post-process";
import { createAudioMethods } from "./audio";

const DEFAULT_AUDIO_DEVICE: AudioDevice = {
  index: "default",
  name: "Default",
  is_default: true,
};

interface SettingsStore {
  settings: Settings | null;
  defaultSettings: Settings | null;
  isLoading: boolean;
  isUpdating: Record<string, boolean>;
  audioDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  customSounds: { start: boolean; stop: boolean };
  postProcessModelOptions: Record<string, string[]>;

  // Actions
  initialize: () => Promise<void>;
  loadDefaultSettings: () => Promise<void>;
  updateSetting: <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => Promise<void>;
  resetSetting: (key: keyof Settings) => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshAudioDevices: () => Promise<void>;
  refreshOutputDevices: () => Promise<void>;
  updateBinding: (id: string, binding: string) => Promise<void>;
  resetBinding: (id: string) => Promise<void>;
  getSetting: <K extends keyof Settings>(key: K) => Settings[K] | undefined;
  isUpdatingKey: (key: string) => boolean;
  playTestSound: (soundType: "start" | "stop") => Promise<void>;
  checkCustomSounds: () => Promise<void>;

  // Post-processing methods
  setPostProcessProvider: (providerId: string) => Promise<void>;
  updatePostProcessSetting: (
    settingType: "base_url" | "api_key" | "model",
    providerId: string,
    value: string,
  ) => Promise<void>;
  updatePostProcessBaseUrl: (
    providerId: string,
    baseUrl: string,
  ) => Promise<void>;
  updatePostProcessApiKey: (
    providerId: string,
    apiKey: string,
  ) => Promise<void>;
  updatePostProcessModel: (providerId: string, model: string) => Promise<void>;
  fetchPostProcessModels: (providerId: string) => Promise<string[]>;

  // Internal state setters
  setSettings: (settings: Settings | null) => void;
  setDefaultSettings: (defaultSettings: Settings | null) => void;
  setLoading: (loading: boolean) => void;
  setUpdating: (key: string, updating: boolean) => void;
  setAudioDevices: (devices: AudioDevice[]) => void;
  setOutputDevices: (devices: AudioDevice[]) => void;
  setCustomSounds: (sounds: { start: boolean; stop: boolean }) => void;
  setPostProcessModelOptions: (providerId: string, models: string[]) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector((set, get) => {
    const postProcessMethods = createPostProcessMethods(set, get);
    const audioMethods = createAudioMethods(set, get);

    return {
      settings: null,
      defaultSettings: null,
      isLoading: true,
      isUpdating: {},
      audioDevices: [],
      outputDevices: [],
      customSounds: { start: false, stop: false },
      postProcessModelOptions: {},

      // Internal setters
      setSettings: (settings) => set({ settings }),
      setDefaultSettings: (defaultSettings) => set({ defaultSettings }),
      setLoading: (isLoading) => set({ isLoading }),
      setUpdating: (key, updating) =>
        set((state) => ({
          isUpdating: { ...state.isUpdating, [key]: updating },
        })),
      setAudioDevices: (audioDevices) => set({ audioDevices }),
      setOutputDevices: (outputDevices) => set({ outputDevices }),
      setCustomSounds: (customSounds) => set({ customSounds }),
      setPostProcessModelOptions: (providerId, models) =>
        set((state) => ({
          postProcessModelOptions: {
            ...state.postProcessModelOptions,
            [providerId]: models,
          },
        })),

      // Getters
      getSetting: (key) => get().settings?.[key],
      isUpdatingKey: (key) => get().isUpdating[key] || false,

      // Load settings from store
      refreshSettings: async () => {
        try {
          const result = await commands.getAppSettings();
          if (result.status === "ok") {
            const settings = result.data;
            const normalizedSettings: Settings = {
              ...settings,
              always_on_microphone: settings.always_on_microphone ?? false,
              selected_microphone: settings.selected_microphone ?? "Default",
              clamshell_microphone: settings.clamshell_microphone ?? "Default",
              selected_output_device:
                settings.selected_output_device ?? "Default",
            };
            set({ settings: normalizedSettings, isLoading: false });
          } else {
            console.error("Failed to load settings:", result.error);
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Failed to load settings:", error);
          set({ isLoading: false });
        }
      },

      // Play a test sound
      playTestSound: async (soundType: "start" | "stop") => {
        try {
          await commands.playTestSound(soundType);
        } catch (error) {
          console.error(`Failed to play test sound (${soundType}):`, error);
        }
      },

      checkCustomSounds: async () => {
        try {
          const sounds = await commands.checkCustomSounds();
          get().setCustomSounds(sounds);
        } catch (error) {
          console.error("Failed to check custom sounds:", error);
        }
      },

      // Update a specific setting
      updateSetting: async <K extends keyof Settings>(
        key: K,
        value: Settings[K],
      ) => {
        const { settings, setUpdating } = get();
        const updateKey = String(key);
        const originalValue = settings?.[key];

        setUpdating(updateKey, true);

        try {
          set((state) => ({
            settings: state.settings
              ? { ...state.settings, [key]: value }
              : null,
          }));

          const updater = settingUpdaters[key];
          if (updater) {
            await updater(value);
          } else if (key !== "bindings" && key !== "selected_model") {
            console.warn(`No handler for setting: ${String(key)}`);
          }
        } catch (error) {
          console.error(`Failed to update setting ${String(key)}:`, error);
          if (settings) {
            set({ settings: { ...settings, [key]: originalValue } });
          }
        } finally {
          setUpdating(updateKey, false);
        }
      },

      // Reset a setting to its default value
      resetSetting: async (key) => {
        const { defaultSettings } = get();
        if (defaultSettings) {
          const defaultValue = defaultSettings[key];
          if (defaultValue !== undefined) {
            await get().updateSetting(key, defaultValue as any);
          }
        }
      },

      // Update a specific binding
      updateBinding: async (id, binding) => {
        const { settings, setUpdating } = get();
        const updateKey = `binding_${id}`;
        const originalBinding = settings?.bindings?.[id]?.current_binding;

        setUpdating(updateKey, true);

        try {
          // Optimistic update
          set((state) => ({
            settings: state.settings
              ? {
                  ...state.settings,
                  bindings: {
                    ...state.settings.bindings,
                    [id]: {
                      ...state.settings.bindings[id]!,
                      current_binding: binding,
                    },
                  },
                }
              : null,
          }));

          const result = await commands.changeBinding(id, binding);

          // Check if the command executed successfully
          if (result.status === "error") {
            throw new Error(result.error);
          }

          // Check if the binding change was successful
          if (!result.data.success) {
            throw new Error(result.data.error || "Failed to update binding");
          }
        } catch (error) {
          console.error(`Failed to update binding ${id}:`, error);

          // Rollback on error
          if (originalBinding && get().settings) {
            set((state) => ({
              settings: state.settings
                ? {
                    ...state.settings,
                    bindings: {
                      ...state.settings.bindings,
                      [id]: {
                        ...state.settings.bindings[id]!,
                        current_binding: originalBinding,
                      },
                    },
                  }
                : null,
            }));
          }

          // Re-throw to let the caller know it failed
          throw error;
        } finally {
          setUpdating(updateKey, false);
        }
      },

      // Reset a specific binding
      resetBinding: async (id) => {
        const { setUpdating, refreshSettings } = get();
        const updateKey = `binding_${id}`;

        setUpdating(updateKey, true);

        try {
          await commands.resetBinding(id);
          await refreshSettings();
        } catch (error) {
          console.error(`Failed to reset binding ${id}:`, error);
        } finally {
          setUpdating(updateKey, false);
        }
      },

      // Load default settings from Rust
      loadDefaultSettings: async () => {
        try {
          const result = await commands.getDefaultSettings();
          if (result.status === "ok") {
            set({ defaultSettings: result.data });
          } else {
            console.error("Failed to load default settings:", result.error);
          }
        } catch (error) {
          console.error("Failed to load default settings:", error);
        }
      },

      // Initialize everything
      initialize: async () => {
        const { refreshSettings, checkCustomSounds, loadDefaultSettings } =
          get();

        // Note: Audio devices are NOT refreshed here. The frontend (App.tsx)
        // is responsible for calling refreshAudioDevices/refreshOutputDevices
        // after onboarding completes. This avoids triggering permission dialogs
        // on macOS before the user is ready.
        await Promise.all([
          loadDefaultSettings(),
          refreshSettings(),
          checkCustomSounds(),
        ]);

        // Re-fetch settings when the backend changes them (e.g. language
        // reset during model switch). The backend is the source of truth.
        listen("model-state-changed", () => {
          get().refreshSettings();
        });
      },

      // Audio methods
      refreshAudioDevices: audioMethods.refreshAudioDevices,
      refreshOutputDevices: audioMethods.refreshOutputDevices,

      // Post-processing methods
      ...postProcessMethods,
    };
  }),
);
