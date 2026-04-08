// src/components/settings/general/ThemeSettings.tsx
import React from "react";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { ThemeToggle } from "../toggles/ThemeToggle";

export const ThemeSettings: React.FC = () => {
  return (
    <SettingsGroup title="Appearance">
      <ThemeToggle grouped={true} descriptionMode="tooltip" />
    </SettingsGroup>
  );
};
