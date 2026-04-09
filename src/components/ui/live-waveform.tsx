import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { cn } from "@/lib/utils";

export interface LiveWaveformRef {
  setLevels: (levels: number[]) => void;
}

export interface LiveWaveformProps
  extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  processing?: boolean;
  barWidth?: number;
  barHeight?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: string | number;
  mode?: "scrolling" | "static";
  className?: string;
}

const LiveWaveform = forwardRef<LiveWaveformRef, LiveWaveformProps>(
  (
    {
      active = false,
      processing = false,
      barWidth = 3,
      barHeight = 4,
      barGap = 2,
      barRadius = 1.5,
      barColor,
      fadeEdges = true,
      fadeWidth = 24,
      height = 64,
      mode = "static",
      className,
      ...props
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const levelsRef = useRef<number[]>([]);
    const historyRef = useRef<number[]>([]);
    const animationRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const setLevels = useCallback((levels: number[]) => {
      levelsRef.current = levels;
    }, []);

    useImperativeHandle(ref, () => ({
      setLevels,
    }));

    const barCount = useMemo(() => {
      if (!containerRef.current) return 20;
      const containerWidth = containerRef.current.clientWidth;
      const barUnit = barWidth + barGap;
      return Math.max(1, Math.floor(containerWidth / barUnit));
    }, [barWidth, barGap]);

    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const canvasHeight = typeof height === "number" ? height : rect.height;

      canvas.width = rect.width * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${canvasHeight}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }, [height, dpr]);

    useEffect(() => {
      resizeCanvas();
      const handleResize = () => {
        resizeCanvas();
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [resizeCanvas]);

    const getBarColor = useCallback(
      (ctx: CanvasRenderingContext2D, opacity: number = 1): string => {
        if (barColor) {
          // Parse hex color and apply opacity
          const hex = barColor.replace("#", "");
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        // Default to text color with opacity
        const style = getComputedStyle(ctx.canvas);
        const color = style.color || "rgb(191, 219, 254)";
        const rgb = color.match(/\d+/g);
        if (rgb) {
          return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
        }
        return `rgba(191, 219, 254, ${opacity})`;
      },
      [barColor],
    );

    const drawStaticMode = useCallback(
      (ctx: CanvasRenderingContext2D, width: number, canvasHeight: number) => {
        const actualBarCount = Math.min(
          barCount,
          levelsRef.current.length || barCount,
        );
        const totalBarsWidth =
          actualBarCount * barWidth + (actualBarCount - 1) * barGap;
        const startX = (width - totalBarsWidth) / 2;
        const maxBarHeight = canvasHeight - 8;

        ctx.clearRect(0, 0, width, canvasHeight);

        for (let i = 0; i < actualBarCount; i++) {
          const level = levelsRef.current[i] || 0;
          const gain = 2.5;
          const clamped = Math.min(1, level * gain);
          const amplified = Math.pow(clamped, 0.7);
          const barH = barHeight + amplified * (maxBarHeight - barHeight);
          const x = startX + i * (barWidth + barGap);
          const y = (canvasHeight - barH) / 2;

          const opacity = Math.max(0.3, 0.3 + amplified * 0.7);

          ctx.fillStyle = getBarColor(ctx, opacity);
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, barRadius);
          ctx.fill();
        }
      },
      [barCount, barWidth, barGap, barHeight, barRadius, getBarColor],
    );

    const drawScrollingMode = useCallback(
      (ctx: CanvasRenderingContext2D, width: number, canvasHeight: number) => {
        // Calculate average level for this frame
        const avgLevel =
          levelsRef.current.length > 0
            ? levelsRef.current.reduce((a, b) => a + b, 0) /
              levelsRef.current.length
            : 0;

        // Add to history
        historyRef.current.push(avgLevel);
        if (historyRef.current.length > barCount) {
          historyRef.current.shift();
        }

        const maxBarHeight = canvasHeight - 8;

        ctx.clearRect(0, 0, width, canvasHeight);

        // Draw from right to left
        const history = historyRef.current;
        const displayCount = history.length;
        const totalBarsWidth =
          displayCount * barWidth + (displayCount - 1) * barGap;
        const startX = width - totalBarsWidth - (width - totalBarsWidth) / 2;

        for (let i = 0; i < displayCount; i++) {
          const level = history[i] || 0;
          const gain = 2.5;
          const clamped = Math.min(1, level * gain);
          const amplified = Math.pow(clamped, 0.7);
          const barH = barHeight + amplified * (maxBarHeight - barHeight);
          const x = startX + i * (barWidth + barGap);
          const y = (canvasHeight - barH) / 2;

          const opacity = Math.max(0.3, 0.3 + amplified * 0.7);

          ctx.fillStyle = getBarColor(ctx, opacity);
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, barRadius);
          ctx.fill();
        }
      },
      [barCount, barWidth, barGap, barHeight, barRadius, getBarColor],
    );

    const drawProcessing = useCallback(
      (ctx: CanvasRenderingContext2D, width: number, canvasHeight: number) => {
        const time = timeRef.current;
        const maxBarHeight = canvasHeight - 8;
        const centerCount = 12;
        const totalBarsWidth =
          centerCount * barWidth + (centerCount - 1) * barGap;
        const startX = (width - totalBarsWidth) / 2;

        ctx.clearRect(0, 0, width, canvasHeight);

        for (let i = 0; i < centerCount; i++) {
          // Animated sine wave pattern
          const offset = (i - centerCount / 2) * 0.5;
          const wave = Math.sin(time * 0.003 + offset * 0.8);
          const wave2 = Math.sin(time * 0.005 + offset * 0.5);
          const combined = (wave + wave2) / 2;
          const normalized = (combined + 1) / 2;

          const barH = barHeight + normalized * (maxBarHeight - barHeight);
          const x = startX + i * (barWidth + barGap);
          const y = (canvasHeight - barH) / 2;
          const opacity = 0.4 + normalized * 0.6;

          ctx.fillStyle = getBarColor(ctx, opacity);
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, barRadius);
          ctx.fill();
        }
      },
      [barWidth, barGap, barHeight, barRadius, getBarColor],
    );

    const drawFadeEdges = useCallback(
      (ctx: CanvasRenderingContext2D, width: number, canvasHeight: number) => {
        if (!fadeEdges) return;

        const gradientLeft = ctx.createLinearGradient(0, 0, fadeWidth, 0);
        gradientLeft.addColorStop(0, "rgba(0, 0, 0, 1)");
        gradientLeft.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradientLeft;
        ctx.fillRect(0, 0, fadeWidth, canvasHeight);

        const gradientRight = ctx.createLinearGradient(
          width - fadeWidth,
          0,
          width,
          0,
        );
        gradientRight.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradientRight.addColorStop(1, "rgba(0, 0, 0, 1)");
        ctx.fillStyle = gradientRight;
        ctx.fillRect(width - fadeWidth, 0, fadeWidth, canvasHeight);
      },
      [fadeEdges, fadeWidth],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let lastTime = performance.now();

      const render = (currentTime: number) => {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        timeRef.current += deltaTime;

        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.clearRect(0, 0, width, height);

        if (processing) {
          drawProcessing(ctx, width, height);
        } else if (active) {
          if (mode === "scrolling") {
            drawScrollingMode(ctx, width, height);
          } else {
            drawStaticMode(ctx, width, height);
          }
        } else {
          // Idle state - draw minimal bars
          const centerCount = 12;
          const totalBarsWidth =
            centerCount * barWidth + (centerCount - 1) * barGap;
          const startX = (width - totalBarsWidth) / 2;
          const y = (height - barHeight) / 2;

          for (let i = 0; i < centerCount; i++) {
            const x = startX + i * (barWidth + barGap);
            ctx.fillStyle = getBarColor(ctx, 0.2);
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          }
        }

        drawFadeEdges(ctx, width, height);

        animationRef.current = requestAnimationFrame(render);
      };

      animationRef.current = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animationRef.current);
      };
    }, [
      active,
      processing,
      mode,
      dpr,
      barWidth,
      barGap,
      barHeight,
      barRadius,
      drawStaticMode,
      drawScrollingMode,
      drawProcessing,
      drawFadeEdges,
      getBarColor,
    ]);

    // Reset history when becoming inactive
    useEffect(() => {
      if (!active) {
        historyRef.current = [];
      }
    }, [active]);

    const heightStyle = typeof height === "number" ? `${height}px` : height;

    return (
      <div
        ref={containerRef}
        className={cn("relative overflow-hidden", className)}
        style={{ height: heightStyle }}
        {...props}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          style={{ imageRendering: "crisp-edges" }}
        />
      </div>
    );
  },
);

LiveWaveform.displayName = "LiveWaveform";

export { LiveWaveform };
