import React from "react";
import { Star as LucideStar } from "lucide-react";

interface AnimatedStarProps {
  size?: number;
  fill?: string;
  className?: string;
  isSaved?: boolean;
  onHover?: boolean;
  onTap?: boolean;
}

const AnimatedStar: React.FC<AnimatedStarProps> = ({
  size = 16,
  fill = "none",
  className = "",
  isSaved = false,
  onHover = false,
  onTap = false,
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <LucideStar
        width={size}
        height={size}
        fill={fill}
        className={`
          transition-all duration-300 ease-in-out
          ${onHover ? "animate-pulse scale-110" : ""}
          ${onTap ? "animate-bounce" : ""}
          ${isSaved ? "text-yellow-500" : "text-text-secondary"}
        `}
      />
      {onTap && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full rounded-full bg-yellow-400/30 animate-ping" />
        </div>
      )}
    </div>
  );
};

export default AnimatedStar;
