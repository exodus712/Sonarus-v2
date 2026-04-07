/**
 * @jest-environment jsdom
 */

import type { Page } from "@playwright/test";

import { mockTauriBridge } from "./mockTauri";

type InitScript = (args: Record<string, unknown>) => Promise<void>;
type TauriWindow = Window & {
  __TAURI_INTERNALS__?: {
    invoke: (cmd: string) => Promise<unknown>;
  };
  __TAURI_EVENT_PLUGIN_INTERNALS__?: unknown;
  __TAURI_OS_PLUGIN_INTERNALS__?: unknown;
};

function getBridgeInternals() {
  return (window as TauriWindow).__TAURI_INTERNALS__;
}

describe("mockTauriBridge", () => {
  afterEach(() => {
    delete (window as TauriWindow).__TAURI_INTERNALS__;
    delete (window as TauriWindow).__TAURI_EVENT_PLUGIN_INTERNALS__;
    delete (window as TauriWindow).__TAURI_OS_PLUGIN_INTERNALS__;
  });

  async function initializeBridge() {
    const addInitScript = jest.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript,
    } as unknown as Page;

    await mockTauriBridge(page);

    const [initScript, initArgs] = addInitScript.mock.calls[0] as [
      InitScript,
      Record<string, unknown>,
    ];

    await initScript(initArgs);

    const internals = getBridgeInternals();
    if (!internals) {
      throw new Error("mock Tauri bridge was not initialized");
    }

    return internals;
  }

  it("returns settings and runtime data that match the current frontend contract", async () => {
    const internals = await initializeBridge();

    const settings = (await internals.invoke("get_app_settings")) as Record<
      string,
      unknown
    >;
    const defaultSettings = (await internals.invoke(
      "get_default_settings",
    )) as Record<string, unknown>;
    const hasModels = (await internals.invoke(
      "has_any_models_available",
    )) as boolean;
    const availableModels = (await internals.invoke(
      "get_available_models",
    )) as Array<{ id: string }>;
    const currentModel = (await internals.invoke(
      "get_current_model",
    )) as string;
    const microphones = (await internals.invoke(
      "get_available_microphones",
    )) as Array<{ name: string }>;
    const outputDevices = (await internals.invoke(
      "get_available_output_devices",
    )) as Array<{ name: string }>;

    expect(settings.external_script_path).toBeNull();
    expect(settings.transcribing_visualizer).toBe("dots");
    expect(defaultSettings.external_script_path).toBeNull();
    expect(defaultSettings.transcribing_visualizer).toBe("dots");
    expect(hasModels).toBe(true);
    expect(availableModels.length).toBeGreaterThan(0);
    expect(availableModels.map((model) => model.id)).toContain(currentModel);
    expect(microphones.map((device) => device.name)).toContain(
      settings.selected_microphone,
    );
    expect(outputDevices.map((device) => device.name)).toContain(
      settings.selected_output_device,
    );
  });

  it("throws on unmocked Tauri commands so missing coverage fails fast", async () => {
    const internals = await initializeBridge();

    await expect(internals.invoke("missing_command")).rejects.toThrow(
      "Unmocked tauri command: missing_command",
    );
  });
});
