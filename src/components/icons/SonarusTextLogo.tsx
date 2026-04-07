import React from "react";

const SonarusTextLogo = ({
  width,
  height,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) => {
  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox="0 0 220 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="currentColor"
        className="logo-primary"
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "28px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        Sonarus
      </text>
    </svg>
  );
};

export default SonarusTextLogo;
