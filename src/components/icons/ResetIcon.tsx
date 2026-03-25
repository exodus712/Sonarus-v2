import React from "react";
import { RotateCw } from "lucide-react";

interface ResetIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  animateOnHover?: boolean;
}

const ResetIcon: React.FC<ResetIconProps> = ({
  width = 16,
  height = 16,
  className = "",
  animateOnHover = true,
}) => {
  return (
    <RotateCw
      width={width}
      height={height}
      className={`${className} ${animateOnHover ? "hover:rotate-45" : ""} transition-transform duration-200`}
    />
  );
};

export default ResetIcon;
