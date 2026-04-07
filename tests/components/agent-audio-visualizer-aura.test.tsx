import { render, screen } from "@testing-library/react";
import React from "react";

import {
  AgentAudioVisualizerAura,
  AgentAudioVisualizerAuraVariants,
} from "../../src/components/agent-audio-visualizer-aura";

const shaderToySpy = jest.fn();

jest.mock("@/components/react-shader-toy", () => ({
  ReactShaderToy: (props: unknown) => {
    shaderToySpy(props);
    return <canvas data-testid="shader-toy" />;
  },
}));

jest.mock("@/hooks/use-agent-audio-visualizer-aura", () => ({
  useAgentAudioVisualizerAura: () => ({
    speed: 1.2,
    scale: 0.3,
    amplitude: 0.4,
    frequency: 0.6,
    brightness: 0.8,
  }),
}));

describe("AgentAudioVisualizerAura", () => {
  beforeEach(() => {
    shaderToySpy.mockClear();
  });

  it("passes the complete aura shader uniform set", () => {
    render(
      <AgentAudioVisualizerAura
        size="sm"
        state="speaking"
        themeMode="light"
        colorShift={0.25}
      />,
    );

    expect(screen.getByTestId("shader-toy")).toBeInTheDocument();

    const [{ uniforms }] = shaderToySpy.mock.calls as [
      [{ uniforms: Record<string, { type: string; value: unknown }> }],
    ];

    expect(Object.keys(uniforms).sort()).toEqual(
      [
        "uAmplitude",
        "uBloom",
        "uBlur",
        "uColor",
        "uColorShift",
        "uFrequency",
        "uMix",
        "uMode",
        "uScale",
        "uShape",
        "uSpacing",
        "uSmoothing",
        "uSpeed",
        "uVariance",
      ].sort(),
    );
    expect(uniforms.uVariance).toEqual({ type: "1f", value: 0.15 });
    expect(uniforms.uSmoothing).toEqual({ type: "1f", value: 0.5 });
    expect(uniforms.uColorShift).toEqual({ type: "1f", value: 0.25 });
    expect(uniforms.uMode).toEqual({ type: "1f", value: 1.0 });
  });

  it("does not include gap utility classes in size variants", () => {
    expect(AgentAudioVisualizerAuraVariants({ size: "icon" })).toBe(
      "aspect-square h-[24px]",
    );
    expect(AgentAudioVisualizerAuraVariants({ size: "sm" })).toBe(
      "aspect-square h-[56px]",
    );
    expect(AgentAudioVisualizerAuraVariants({ size: "md" })).toBe(
      "aspect-square h-[112px]",
    );
    expect(AgentAudioVisualizerAuraVariants({ size: "lg" })).toBe(
      "aspect-square h-[224px]",
    );
    expect(AgentAudioVisualizerAuraVariants({ size: "xl" })).toBe(
      "aspect-square h-[448px]",
    );
  });
});
