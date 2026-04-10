import React from "react";
import { useTranslation } from "react-i18next";
import { Dropdown } from "../ui/Dropdown";
import { SettingContainer } from "../ui/SettingContainer";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { useSettings } from "../../hooks/useSettings";
import type { OverlayPosition } from "@/bindings";

interface ShowOverlayProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
}

export const ShowOverlay: React.FC<ShowOverlayProps> = React.memo(
  ({ descriptionMode = "tooltip", grouped = false }) => {
    const { t } = useTranslation();
    const { getSetting, updateSetting, isUpdating } = useSettings();

    const overlayOptions = [
      { value: "none", label: t("settings.general.overlay.options.none") },
      { value: "bottom", label: t("settings.general.overlay.options.bottom") },
      { value: "top", label: t("settings.general.overlay.options.top") },
    ];

    const selectedPosition = (getSetting("overlay_position") ||
      "bottom") as OverlayPosition;

    const idleIndicator = getSetting("overlay_idle_indicator") ?? false;
    const idleDisabled = selectedPosition === "none";

    return (
      <>
        <SettingContainer
          title={t("settings.general.overlay.title")}
          description={t("settings.general.overlay.description")}
          descriptionMode={descriptionMode}
          grouped={grouped}
        >
          <Dropdown
            options={overlayOptions}
            selectedValue={selectedPosition}
            onSelect={(value) =>
              updateSetting("overlay_position", value as OverlayPosition)
            }
            disabled={isUpdating("overlay_position")}
          />
        </SettingContainer>
        <ToggleSwitch
          checked={idleIndicator}
          onChange={(enabled) =>
            updateSetting("overlay_idle_indicator", enabled)
          }
          isUpdating={isUpdating("overlay_idle_indicator")}
          disabled={idleDisabled}
          label={t("settings.general.overlay.idleIndicator.label")}
          description={t("settings.general.overlay.idleIndicator.description")}
          descriptionMode={descriptionMode}
          grouped={grouped}
        />
      </>
    );
  },
);
