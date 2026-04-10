import { act, render, waitFor } from "@testing-library/react";
import React from "react";
import { mockedUseState, setStateCalls } from "../support/mockedReactUseState";

const eventHandlers = new Map<string, (event: any) => unknown>();

jest.mock("react", () => {
  const actual = jest.requireActual("react") as typeof React;

  return {
    __esModule: true,
    ...actual,
    default: actual,
    useState: mockedUseState,
  };
});

jest.mock("../../src/overlay/RecordingOverlay.css", () => ({}));

jest.mock("@tauri-apps/api/event", () => ({
  listen: jest.fn(
    async (eventName: string, handler: (event: any) => unknown) => {
      eventHandlers.set(eventName, handler);
      return jest.fn();
    },
  ),
}));

jest.mock("@/bindings", () => ({
  commands: {
    getAppSettings: jest.fn(async () => ({
      status: "ok",
      data: {
        transcribing_visualizer: "dots",
        overlay_idle_indicator: false,
        overlay_position: "bottom",
      },
    })),
    cancelOperation: jest.fn(),
  },
}));

const syncLanguageFromSettings = jest.fn(async () => {});

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: { language: "en" },
  syncLanguageFromSettings,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@/lib/utils/rtl", () => ({
  getLanguageDirection: () => "ltr",
}));

jest.mock("../../src/components/icons", () => ({
  MicrophoneIcon: () => <span>mic</span>,
  TranscriptionIcon: () => <span>tx</span>,
  CancelIcon: () => <span>cancel</span>,
}));

describe("RecordingOverlay", () => {
  beforeEach(() => {
    eventHandlers.clear();
    setStateCalls.length = 0;
    syncLanguageFromSettings.mockClear();
  });

  it("ignores event callbacks after the component unmounts", async () => {
    const { default: RecordingOverlay } = await import(
      "../../src/overlay/RecordingOverlay"
    );

    const view = render(<RecordingOverlay />);

    await waitFor(() => {
      expect(eventHandlers.size).toBe(6);
    });

    setStateCalls.length = 0;
    view.unmount();

    await act(async () => {
      await eventHandlers.get("show-overlay")?.({ payload: "transcribing" });
      eventHandlers.get("hide-overlay")?.({});
      eventHandlers.get("mic-level")?.({ payload: [1, 0.5, 0.25] });
      eventHandlers.get("transcribing-visualizer-changed")?.({
        payload: { visualizer: "gradient" },
      });
      eventHandlers.get("overlay-surface-state")?.({
        payload: { surface: "idle_stick" },
      });
      eventHandlers.get("overlay-idle-indicator-changed")?.({
        payload: { enabled: true },
      });
    });

    expect(syncLanguageFromSettings).not.toHaveBeenCalled();
    expect(setStateCalls).toEqual([]);
  });
});
