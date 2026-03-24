import React, { useState } from 'react';
import { RotateCw } from '@/components/animate-ui/icons/rotate-cw';
import { RotateCcw } from '@/components/animate-ui/icons/rotate-ccw';

interface AnimatedRefreshButtonProps {
  direction?: 'cw' | 'ccw';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  size?: number;
  ariaLabel?: string;
  isAnimating?: boolean;
}

export const AnimatedRefreshButton: React.FC<AnimatedRefreshButtonProps> = ({
  direction = 'cw',
  onClick,
  disabled = false,
  className = '',
  size = 16,
  ariaLabel,
  isAnimating = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const Icon = direction === 'cw' ? RotateCw : RotateCcw;
  
  const handleClick = () => {
    if (!disabled) {
      setIsPressed(true);
      onClick();
      // Reset pressed state after animation
      setTimeout(() => setIsPressed(false), 500);
    }
  };
  
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`p-1 rounded-md border border-transparent transition-all duration-150 ${
        disabled
          ? 'opacity-50 cursor-not-allowed text-text/40'
          : 'hover:bg-logo-primary/30 active:bg-logo-primary/50 active:translate-y-px hover:cursor-pointer hover:border-logo-primary text-text/80'
      } ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <Icon
        size={size}
        animate={isPressed || isAnimating ? 'rotate' : 'default'}
        animateOnTap="rotate"
        animateOnHover="default"
        loop={isAnimating}
        className="transition-transform duration-300"
      />
    </button>
  );
};

export default AnimatedRefreshButton;
