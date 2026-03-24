import React, { useState } from "react";
import ResetIcon from "../icons/ResetIcon";

interface ResetButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}

export const ResetButton: React.FC<ResetButtonProps> = React.memo(
  ({ onClick, disabled = false, className = "", ariaLabel, children }) => {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = async () => {
      if (disabled) return;
      
      // Start animation
      setIsAnimating(true);
      
      // Call the original onClick
      await onClick();
      
      // Stop animation after a short delay
      setTimeout(() => setIsAnimating(false), 500);
    };

    return (
      <button
        type="button"
        aria-label={ariaLabel}
        className={`p-1 rounded-md border border-transparent transition-all duration-150 ${
          disabled
            ? "opacity-50 cursor-not-allowed text-text-secondary"
            : "hover:bg-logo-primary/30 active:bg-logo-primary/50 active:translate-y-px hover:cursor-pointer hover:border-logo-primary text-text-primary"
        } ${className}`}
        onClick={handleClick}
        disabled={disabled}
      >
        {children ?? (
          <div className={`transition-transform duration-200 hover:rotate-45 ${isAnimating ? "animate-spin" : ""}`}>
            <ResetIcon animateOnHover={false} />
          </div>
        )}
      </button>
    );
  },
);
