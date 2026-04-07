import { cn } from "@/lib/utils";

interface AuroraFallbackProps {
  color?: string;
  className?: string;
}

export function AuroraFallback({
  color = "#ffe5ee",
  className,
}: AuroraFallbackProps) {
  return (
    <div
      className={cn(
        "w-full h-full relative overflow-hidden rounded-sm",
        className,
      )}
      style={{ background: "transparent" }}
    >
      {/* Base glow layer */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(ellipse 80% 100% at 50% 50%, ${color}40 0%, transparent 70%)`,
          animation: "aurora-pulse 2s ease-in-out infinite",
        }}
      />

      {/* Flowing gradient layers */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color}60 25%, ${color}80 50%, ${color}60 75%, transparent 100%)`,
          animation: "aurora-flow 3s ease-in-out infinite",
          filter: "blur(2px)",
        }}
      />

      {/* Second flowing layer - offset */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${color}40 0%, transparent 30%, transparent 70%, ${color}40 100%)`,
          animation: "aurora-flow-reverse 4s ease-in-out infinite",
          filter: "blur(3px)",
        }}
      />

      {/* Center bright line */}
      <div
        className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${color}90 50%, transparent 100%)`,
          animation: "aurora-center 2.5s ease-in-out infinite",
          filter: "blur(1px)",
        }}
      />

      {/* Noise/dither overlay for texture */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
