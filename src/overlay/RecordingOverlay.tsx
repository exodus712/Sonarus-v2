import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CancelIcon } from "../components/icons";
import "./RecordingOverlay.css";
import { commands } from "@/bindings";
import i18n, { syncLanguageFromSettings } from "@/i18n";
import { getLanguageDirection } from "@/lib/utils/rtl";
import {
  TranscribingVisualizer,
  TranscribingVariant,
} from "./TranscribingVisualizer";
import { LiveWaveform, LiveWaveformRef } from "@/components/ui/live-waveform";

type OverlayActivityState = "recording" | "transcribing" | "processing";

type OverlaySurface = "hidden" | "active" | "idle_stick";

const CANCEL_AREA_WIDTH = 50; // Rightmost third approx

function parseShowOverlayPayload(raw: unknown): {
  state: OverlayActivityState;
  expand_from_idle: boolean;
} {
  if (typeof raw === "string") {
    return { state: raw as OverlayActivityState, expand_from_idle: false };
  }
  if (raw && typeof raw === "object" && "state" in raw) {
    const o = raw as { state: string; expand_from_idle?: boolean };
    return {
      state: o.state as OverlayActivityState,
      expand_from_idle: Boolean(o.expand_from_idle),
    };
  }
  return { state: "recording", expand_from_idle: false };
}

function parseHideOverlayPayload(raw: unknown): boolean {
  if (raw && typeof raw === "object" && "to_idle_stick" in raw) {
    return Boolean((raw as { to_idle_stick?: boolean }).to_idle_stick);
  }
  return false;
}

const RecordingOverlay: React.FC = () => {
  const { t } = useTranslation();
  const [surface, setSurface] = useState<OverlaySurface>("hidden");
  const [pillLayout, setPillLayout] = useState<"compact" | "full">("full");
  const [state, setState] = useState<OverlayActivityState>("recording");
  const [transcribingVariant, setTranscribingVariant] =
    useState<TranscribingVariant>("dots");
  const smoothedLevelsRef = useRef<number[]>(Array(32).fill(0));
  const [isHoveringRight, setIsHoveringRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<LiveWaveformRef>(null);
  const direction = getLanguageDirection(i18n.language);
  const expandRafRef = useRef<number | null>(null);
  const surfaceRef = useRef<OverlaySurface>(surface);
  surfaceRef.current = surface;

  useEffect(() => {
    let isDisposed = false;
    const runIfMounted = (callback: () => void) => {
      if (!isDisposed) {
        callback();
      }
    };

    const setupEventListeners = async () => {
      const unlistenShow = await listen("show-overlay", async (event) => {
        if (isDisposed) {
          return;
        }
        await syncLanguageFromSettings();
        const { state: nextState, expand_from_idle } = parseShowOverlayPayload(
          event.payload,
        );
        runIfMounted(() => {
          setState(nextState);
          setSurface("active");
          if (expand_from_idle) {
            setPillLayout("compact");
            if (expandRafRef.current !== null) {
              cancelAnimationFrame(expandRafRef.current);
            }
            expandRafRef.current = requestAnimationFrame(() => {
              expandRafRef.current = requestAnimationFrame(() => {
                expandRafRef.current = null;
                if (!isDisposed) {
                  setPillLayout("full");
                }
              });
            });
          } else {
            setPillLayout("full");
          }
        });
      });

      const unlistenHide = await listen("hide-overlay", (event) => {
        const toStick = parseHideOverlayPayload(event.payload);
        runIfMounted(() => {
          if (toStick) {
            setSurface("idle_stick");
            setPillLayout("compact");
          } else {
            setSurface("hidden");
          }
        });
      });

      const unlistenSurface = await listen<{ surface?: string }>(
        "overlay-surface-state",
        (event) => {
          if (isDisposed) return;
          if (event.payload?.surface === "idle_stick") {
            runIfMounted(() => {
              setSurface("idle_stick");
              setPillLayout("compact");
            });
          }
        },
      );

      const unlistenIdleToggle = await listen<{ enabled?: boolean }>(
        "overlay-idle-indicator-changed",
        (event) => {
          if (isDisposed) return;
          if (event.payload?.enabled && surfaceRef.current !== "active") {
            runIfMounted(() => {
              setSurface("idle_stick");
              setPillLayout("compact");
            });
          }
        },
      );

      const unlistenLevel = await listen<number[]>("mic-level", (event) => {
        if (isDisposed) {
          return;
        }
        const newLevels = event.payload as number[];

        const smoothed = smoothedLevelsRef.current.map((prev, i) => {
          const target = newLevels[i] || 0;
          const leftNeighbor = newLevels[i - 1] || target;
          const rightNeighbor = newLevels[i + 1] || target;
          const blendedTarget =
            target * 0.7 + leftNeighbor * 0.15 + rightNeighbor * 0.15;
          return prev * 0.4 + blendedTarget * 0.6;
        });

        smoothedLevelsRef.current = smoothed;

        if (waveformRef.current) {
          waveformRef.current.setLevels(smoothed);
        }
      });

      const unlistenVisualizer = await listen<{ visualizer: string }>(
        "transcribing-visualizer-changed",
        (event) => {
          if (isDisposed) {
            return;
          }
          const visualizer = event.payload.visualizer as TranscribingVariant;
          if (["dots", "equalizer", "gradient"].includes(visualizer)) {
            runIfMounted(() => {
              setTranscribingVariant(visualizer);
            });
          }
        },
      );

      return () => {
        unlistenShow();
        unlistenHide();
        unlistenSurface();
        unlistenIdleToggle();
        unlistenLevel();
        unlistenVisualizer();
      };
    };

    let cleanupFn: (() => void) | undefined;
    setupEventListeners().then((fn) => {
      if (isDisposed) {
        fn();
        return;
      }
      cleanupFn = fn;
    });

    void (async () => {
      try {
        const result = await commands.getAppSettings();
        if (!isDisposed && result.status === "ok") {
          const data = result.data;
          if (
            data.transcribing_visualizer &&
            ["dots", "equalizer", "gradient"].includes(
              data.transcribing_visualizer,
            )
          ) {
            setTranscribingVariant(
              data.transcribing_visualizer as TranscribingVariant,
            );
          }
          const pos = data.overlay_position ?? "bottom";
          if (data.overlay_idle_indicator && pos !== "none") {
            setSurface("idle_stick");
            setPillLayout("compact");
          }
        }
      } catch (error) {
        if (!isDisposed) {
          console.error(
            "Failed to load overlay / transcribing visualizer settings:",
            error,
          );
        }
      }
    })();

    return () => {
      isDisposed = true;
      if (expandRafRef.current !== null) {
        cancelAnimationFrame(expandRafRef.current);
        expandRafRef.current = null;
      }
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [syncLanguageFromSettings]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isRight = x > rect.width - CANCEL_AREA_WIDTH;
    setIsHoveringRight(isRight);
  };

  const handleMouseLeave = () => {
    setIsHoveringRight(false);
  };

  const rootClass =
    surface === "hidden"
      ? "recording-overlay-root is-hidden"
      : "recording-overlay-root is-visible";

  const pillClass =
    pillLayout === "compact"
      ? "recording-overlay-pill pill-compact"
      : "recording-overlay-pill pill-full";

  const showActivity = surface === "active";

  return (
    <div
      ref={containerRef}
      dir={direction}
      className={rootClass}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={pillClass}>
        {showActivity && (
          <>
            <div className="overlay-middle">
              {state === "recording" && (
                <LiveWaveform
                  ref={waveformRef}
                  active={true}
                  mode="static"
                  barWidth={3}
                  barHeight={4}
                  barGap={2}
                  barRadius={1.5}
                  barColor="#bfdbfe"
                  height={24}
                  fadeEdges={false}
                  className="w-full"
                />
              )}
              {state === "transcribing" && (
                <TranscribingVisualizer variant={transcribingVariant} />
              )}
              {state === "processing" && (
                <div className="transcribing-text">
                  {t("overlay.processing")}
                </div>
              )}
            </div>

            <div className="overlay-right">
              {state === "recording" && (
                <div
                  className={`cancel-button ${isHoveringRight ? "visible" : ""}`}
                  onClick={() => {
                    commands.cancelOperation();
                  }}
                >
                  <CancelIcon />
                </div>
              )}
            </div>
          </>
        )}
        {surface === "idle_stick" && (
          <div className="idle-stick-shine" aria-hidden />
        )}
      </div>
    </div>
  );
};

export default RecordingOverlay;
