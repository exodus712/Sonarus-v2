import { listen } from "@tauri-apps/api/event";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MicrophoneIcon,
  TranscriptionIcon,
  CancelIcon,
} from "../components/icons";
import "./RecordingOverlay.css";
import { commands } from "@/bindings";
import i18n, { syncLanguageFromSettings } from "@/i18n";
import { getLanguageDirection } from "@/lib/utils/rtl";
import {
  TranscribingVisualizer,
  TranscribingVariant,
} from "./TranscribingVisualizer";

type OverlayState = "recording" | "transcribing" | "processing";

const RecordingOverlay: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [state, setState] = useState<OverlayState>("recording");
  const [transcribingVariant, setTranscribingVariant] =
    useState<TranscribingVariant>("dots");
  const [levels, setLevels] = useState<number[]>(Array(16).fill(0));
  const smoothedLevelsRef = useRef<number[]>(Array(16).fill(0));
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

        // Apply smoothing to reduce jitter
        const smoothed = smoothedLevelsRef.current.map((prev, i) => {
          const target = newLevels[i] || 0;
          return prev * 0.7 + target * 0.3; // Smooth transition
        });

        smoothedLevelsRef.current = smoothed;
        runIfMounted(() => {
          setLevels(smoothed.slice(0, 9));
        });
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

  const getIcon = () => {
    if (state === "recording") {
      return <MicrophoneIcon />;
    } else {
      return <TranscriptionIcon />;
    }
  };

  return (
    <div
      dir={direction}
      className={`recording-overlay ${isVisible ? "fade-in" : ""}`}
    >
      <div className="overlay-left">{getIcon()}</div>

      <div className="overlay-middle">
        {state === "recording" && (
          <div className="bars-container">
            {levels.map((v, i) => (
              <div
                key={i}
                className="bar"
                style={{
                  height: `${Math.min(20, 4 + Math.pow(v, 0.7) * 16)}px`, // Cap at 20px max height
                  transition: "height 60ms ease-out, opacity 120ms ease-out",
                  opacity: Math.max(0.2, v * 1.7), // Minimum opacity for visibility
                }}
              />
            ))}
          </div>
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
            className="cancel-button"
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
