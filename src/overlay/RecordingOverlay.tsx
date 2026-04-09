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

type OverlayState = "recording" | "transcribing" | "processing";

const CANCEL_AREA_WIDTH = 50; // Rightmost third approx

const RecordingOverlay: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [state, setState] = useState<OverlayState>("recording");
  const [transcribingVariant, setTranscribingVariant] =
    useState<TranscribingVariant>("dots");
  const smoothedLevelsRef = useRef<number[]>(Array(32).fill(0));
  const [isHoveringRight, setIsHoveringRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<LiveWaveformRef>(null);
  const direction = getLanguageDirection(i18n.language);

  useEffect(() => {
    let isDisposed = false;
    const runIfMounted = (callback: () => void) => {
      if (!isDisposed) {
        callback();
      }
    };

    const setupEventListeners = async () => {
      // Listen for show-overlay event from Rust
      const unlistenShow = await listen("show-overlay", async (event) => {
        if (isDisposed) {
          return;
        }
        // Sync language from settings each time overlay is shown
        await syncLanguageFromSettings();
        const overlayState = event.payload as OverlayState;
        runIfMounted(() => {
          setState(overlayState);
          setIsVisible(true);
        });
      });

      // Listen for hide-overlay event from Rust
      const unlistenHide = await listen("hide-overlay", () => {
        runIfMounted(() => {
          setIsVisible(false);
        });
      });

      // Listen for mic-level updates
      const unlistenLevel = await listen<number[]>("mic-level", (event) => {
        if (isDisposed) {
          return;
        }
        const newLevels = event.payload as number[];

        // Apply smoothing - balanced between reactivity and smoothness
        const smoothed = smoothedLevelsRef.current.map((prev, i) => {
          const target = newLevels[i] || 0;
          // Blend with neighbor bars for visual cohesion (bars influence each other slightly)
          const leftNeighbor = newLevels[i - 1] || target;
          const rightNeighbor = newLevels[i + 1] || target;
          const blendedTarget =
            target * 0.7 + leftNeighbor * 0.15 + rightNeighbor * 0.15;
          // Smooth transition: 40% previous value, 60% new blended target
          return prev * 0.4 + blendedTarget * 0.6;
        });

        smoothedLevelsRef.current = smoothed;

        // Pass levels to LiveWaveform via ref
        if (waveformRef.current) {
          waveformRef.current.setLevels(smoothed);
        }
      });

      // Listen for transcribing visualizer setting changes
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

      // Cleanup function
      return () => {
        unlistenShow();
        unlistenHide();
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

    // Load initial visualizer setting
    void (async () => {
      try {
        const result = await commands.getAppSettings();
        if (
          !isDisposed &&
          result.status === "ok" &&
          result.data.transcribing_visualizer &&
          ["dots", "equalizer", "gradient"].includes(
            result.data.transcribing_visualizer,
          )
        ) {
          setTranscribingVariant(
            result.data.transcribing_visualizer as TranscribingVariant,
          );
        }
      } catch (error) {
        if (!isDisposed) {
          console.error(
            "Failed to load transcribing visualizer setting:",
            error,
          );
        }
      }
    })();

    return () => {
      isDisposed = true;
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

  return (
    <div
      ref={containerRef}
      dir={direction}
      className={`recording-overlay ${isVisible ? "fade-in" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
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
          <div className="transcribing-text">{t("overlay.processing")}</div>
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
    </div>
  );
};

export default RecordingOverlay;
