"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ReactShaderToy } from "@/components/react-shader-toy";
import { hexToRgb } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

const DEFAULT_COLOR = "#ffe5ee";

// Modified shader that shows a horizontal slice through the circular aura
const sliceShaderSource = `
uniform float uSpeed;
uniform float uBlur;
uniform float uScale;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uBloom;
uniform float uMix;
uniform float uSpacing;
uniform float uColorShift;
uniform float uVariance;
uniform float uSmoothing;
uniform float uMode;
uniform vec3 uColor;

const float TAU = 6.283185;

// Noise for dithering
vec2 randFibo(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.xx + p.yx) * p.xy);
}

// Tonemap
vec3 Tonemap(vec3 x) {
  x *= 4.0;
  return x / (1.0 + x);
}

// Luma for alpha
float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

// RGB to HSV
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// SDF for circle
float sdCircle(vec2 st, float r) {
  return length(st) - r;
}

vec2 turb(vec2 pos, float t, float it) {
  mat2 rotation = mat2(0.6, -0.25, 0.25, 0.9);
  mat2 layerRotation = mat2(0.6, -0.8, 0.8, 0.6);
  
  float frequency = mix(2.0, 15.0, uFrequency);
  float amplitude = uAmplitude;
  float frequencyGrowth = 1.4;
  float animTime = t * 0.1 * uSpeed;
  
  const int LAYERS = 4;
  for(int i = 0; i < LAYERS; i++) {
    vec2 rotatedPos = pos * rotation;
    vec2 wave = sin(frequency * rotatedPos + float(i) * animTime + it);
    pos += (amplitude / frequency) * rotation[0] * wave;
    rotation *= layerRotation;
    amplitude *= mix(1.0, max(wave.x, wave.y), uVariance);
    frequency *= frequencyGrowth;
  }
  return pos;
}

const float ITERATIONS = 36.0;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  
  vec3 pp = vec3(0.0);
  vec3 bloom = vec3(0.0);
  float t = iTime * 0.5;
  
  // Horizontal slice: sample along x at y=0 (center of circle)
  float x = uv.x - 0.5;
  float yOffset = (uv.y - 0.5) * 0.02;
  vec2 pos = vec2(x, yOffset);
  
  vec2 prevPos = turb(pos, t, 0.0 - 1.0 / ITERATIONS);
  float spacing = mix(1.0, TAU, uSpacing);

  for(float i = 1.0; i < ITERATIONS + 1.0; i++) {
    float iter = i / ITERATIONS;
    vec2 st = turb(pos, t, iter * spacing);
    float d = abs(sdCircle(st, uScale));
    float pd = distance(st, prevPos);
    prevPos = st;
    float dynamicBlur = exp2(pd * 2.0 * 1.4426950408889634) - 1.0;
    float ds = smoothstep(0.0, uBlur * 0.05 + max(dynamicBlur * uSmoothing, 0.001), d);
    
    vec3 color = uColor;
    if(uColorShift > 0.01) {
      vec3 hsv = rgb2hsv(color);
      hsv.x = fract(hsv.x + (1.0 - iter) * uColorShift * 0.3); 
      color = hsv2rgb(hsv);
    }
    
    float invd = 1.0 / max(d + dynamicBlur, 0.001);
    pp += (ds - 1.0) * color;
    bloom += clamp(invd, 0.0, 250.0) * color;
  }

  pp *= 1.0 / ITERATIONS;
  
  vec3 color;
  
  if(uMode < 0.5) {
    bloom = bloom / (bloom + 2e4);
    color = (-pp + bloom * 3.0 * uBloom) * 1.2;
    color += (randFibo(fragCoord).x - 0.5) / 255.0;
    color = Tonemap(color);
    float alpha = max(0.6, luma(color) * uMix); // Ensure minimum visibility
    fragColor = vec4(color * uMix * 2.0, alpha); // Boost brightness
  } else {
    color = -pp;
    color += (randFibo(fragCoord).x - 0.5) / 255.0;
    float brightness = length(color);
    vec3 direction = brightness > 0.0 ? color / brightness : color;
    float factor = 2.0;
    float mappedBrightness = (brightness * factor) / (1.0 + brightness * factor);
    color = direction * mappedBrightness;
    float gray = dot(color, vec3(0.2, 0.5, 0.1));
    float saturationBoost = 3.0;
    color = mix(vec3(gray), color, saturationBoost);
    color = clamp(color, 0.0, 1.0);
    float alpha = max(mappedBrightness * clamp(uMix, 1.0, 2.0), 0.2); // Boost shader visibility with minimum alpha
    fragColor = vec4(color, alpha);
  }
}
`;

interface AuraSliceShaderProps {
  speed?: number;
  amplitude?: number;
  frequency?: number;
  scale?: number;
  blur?: number;
  color?: string;
  colorShift?: number;
  brightness?: number;
  themeMode?: "dark" | "light";
  className?: string;
}

export function AuraSliceShader({
  speed = 30,
  amplitude = 0.5,
  frequency = 0.5,
  scale = 0.3,
  blur = 1.0,
  color = DEFAULT_COLOR,
  colorShift = 0.3,
  brightness = 1.5,
  themeMode = "dark",
  className,
}: AuraSliceShaderProps) {
  const rgbColor = useMemo(() => hexToRgb(color, DEFAULT_COLOR), [color]);
  const dpr =
    typeof window !== "undefined" ? (window.devicePixelRatio ?? 1) : 1;

  return (
    <div className={cn("w-full h-full overflow-hidden bg-white/10", className)}>
      <ReactShaderToy
        fs={sliceShaderSource}
        devicePixelRatio={dpr}
        clearColor={[0, 0, 0, 0]}
        animateWhenNotVisible={true}
        uniforms={{
          uSpeed: { type: "1f", value: speed },
          uBlur: { type: "1f", value: blur },
          uScale: { type: "1f", value: scale },
          uFrequency: { type: "1f", value: frequency },
          uAmplitude: { type: "1f", value: amplitude },
          uBloom: { type: "1f", value: 0.8 },
          uMix: { type: "1f", value: brightness },
          uSpacing: { type: "1f", value: 0.5 },
          uColorShift: { type: "1f", value: colorShift },
          uVariance: { type: "1f", value: 0.15 },
          uSmoothing: { type: "1f", value: 0.5 },
          uMode: { type: "1f", value: themeMode === "light" ? 1.0 : 0.0 },
          uColor: { type: "3fv", value: rgbColor ?? [1, 0.9, 0.93] },
        }}
        onError={(error) => {
          console.error("[AuraSliceShader] Error:", error);
        }}
        onWarning={(warning) => {
          console.warn("[AuraSliceShader] Warning:", warning);
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}

// Simplified pill-optimized version
export function AuraSliceVisualizer({
  color = "#ffe5ee",
  className,
}: {
  color?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-full h-full bg-white/20 rounded", className)} />
    );
  }

  return (
    <AuraSliceShader
      color={color}
      speed={20}
      amplitude={0.8}
      frequency={0.5}
      scale={0.3}
      brightness={2.5}
      colorShift={0.3}
      className={className}
    />
  );
}
