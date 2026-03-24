import React from 'react';
import { RefreshCw, RefreshCcw } from 'lucide-react';

interface AnimatedRefreshIconProps {
  direction?: 'cw' | 'ccw';
  animate?: boolean;
  className?: string;
  size?: number;
}

export const AnimatedRefreshIcon: React.FC<AnimatedRefreshIconProps> = ({
  direction = 'cw',
  animate = false,
  className = '',
  size = 16,
}) => {
  const Icon = direction === 'cw' ? RefreshCw : RefreshCcw;
  
  return (
    <Icon
      size={size}
      className={`${className} ${animate ? 'animate-spin' : ''} transition-transform duration-300`}
    />
  );
};

export default AnimatedRefreshIcon;
