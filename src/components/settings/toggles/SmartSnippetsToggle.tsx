import React from "react";
import { useTranslation } from "react-i18next";
import { ToggleSwitch } from "../../ui/ToggleSwitch";
import { useSettings } from "../../../hooks/useSettings";

interface SmartSnippetsToggleProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
}

export const SmartSnippetsToggle: React.FC<SmartSnippetsToggleProps> =
  React.memo(({ descriptionMode = "tooltip", grouped = false }) => {
    const { t } = useTranslation();
    const { getSetting, updateSetting, isUpdating } = useSettings();

    const enabled = getSetting("snippets_enabled") ?? false;

    return (
      <ToggleSwitch
        checked={enabled}
        onChange={(value) => updateSetting("snippets_enabled", value)}
        isUpdating={isUpdating("snippets_enabled")}
        label={t("settings.snippets.enabledLabel")}
        description={t("settings.snippets.enabledDescription")}
        descriptionMode={descriptionMode}
        grouped={grouped}
      />
    );
  });
