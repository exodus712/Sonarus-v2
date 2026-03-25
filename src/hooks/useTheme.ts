// src/hooks/useTheme.ts
import { useTheme as useThemeContext } from "../contexts/ThemeProvider";

export const useTheme = () => {
  return useThemeContext();
};

// Re-export for consistency with naming convention
export const useThemeValue = useTheme;
