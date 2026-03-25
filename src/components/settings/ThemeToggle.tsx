// src/components/settings/ThemeToggle.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { SettingContainer } from "../ui/SettingContainer";
import { Dropdown, type DropdownOption } from "../ui/Dropdown";
import { useThemeValue } from "../../hooks/useTheme";

interface ThemeToggleProps {
  descriptionMode?: "tooltip" | "inline";
  grouped?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  descriptionMode = "tooltip",
  grouped = false,
}) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeValue();

  const options: DropdownOption[] = [
    { value: "system", label: t("settings.theme.system", "System") },
    { value: "light", label: t("settings.theme.light", "Light") },
    { value: "dark", label: t("settings.theme.dark", "Dark") },
  ];

  return (
    <SettingContainer
      title={t("settings.theme.title", "Theme")}
      description={t(
        "settings.theme.description",
        "Choose your preferred theme",
      )}
      descriptionMode={descriptionMode}
      grouped={grouped}
    >
      <Dropdown
        options={options}
        selectedValue={theme}
        onSelect={(value) => setTheme(value as "system" | "light" | "dark")}
        placeholder={t("settings.theme.title", "Theme")}
      />
    </SettingContainer>
  );
};

export default ThemeToggle;
