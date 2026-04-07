import type { FC } from "react";
import { AuroraFallback } from "./AuroraFallback";

export type TranscribingVariant = "dots" | "equalizer" | "gradient";

interface TranscribingVisualizerProps {
  variant: TranscribingVariant;
}

// Original 8-dot pulse wave
const DotsVisualizer: FC = () => (
  <div className="transcribing-dots">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="dot" />
    ))}
  </div>
);

// Center-line focused equalizer
const EqualizerVisualizer: FC = () => (
  <div className="transcribing-equalizer">
    {Array.from({ length: 12 }).map((_, index) => (
      <div key={index} className="eq-bar-container">
        <div className="eq-bar" />
      </div>
    ))}
  </div>
);

// Aurora visualizer - CSS-based flowing energy effect
const GradientVisualizer: FC = () => (
  <div className="transcribing-gradient">
    <AuroraFallback className="w-full h-full" />
  </div>
);

export const TranscribingVisualizer: FC<TranscribingVisualizerProps> = ({
  variant,
}) => {
  switch (variant) {
    case "dots":
      return <DotsVisualizer />;
    case "equalizer":
      return <EqualizerVisualizer />;
    case "gradient":
      return <GradientVisualizer />;
    default:
      return <DotsVisualizer />;
  }
};
