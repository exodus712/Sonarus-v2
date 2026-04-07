import React from "react";
import { useTranslation } from "react-i18next";
import { SettingContainer } from "../ui/SettingContainer";
import { Dropdown, type DropdownOption } from "../ui/Dropdown";
import { useSettings } from "../../hooks/useSettings";
import { commands } from "@/bindings";
import { toast } from "sonner";
import type { TranscribingVariant } from "@/overlay/TranscribingVisualizer";

interface TranscribingVisualizerSelectorProps {
  descriptionMode?: "tooltip" | "inline";
  grouped?: boolean;
}

export const TranscribingVisualizerSelector: React.FC<
  TranscribingVisualizerSelectorProps
> = ({ descriptionMode = "tooltip", grouped = false }) => {
  const { t } = useTranslation();
  const { getSetting, isUpdating, refreshSettings, updateSetting } =
    useSettings();
  const currentVisualizer = getSetting("transcribing_visualizer") ?? "dots";
  const visualizerOptions: DropdownOption[] = [
    {
      value: "dots",
      label: t("settings.debug.transcribingVisualizer.options.dots", {
        defaultValue: "Dots (Pulse Wave)",
      }),
    },
    {
      value: "equalizer",
      label: t("settings.debug.transcribingVisualizer.options.equalizer", {
        defaultValue: "Micro Equalizer",
      }),
    },
    {
      value: "gradient",
      label: t("settings.debug.transcribingVisualizer.options.gradient", {
        defaultValue: "Aurora",
      }),
    },
  ];

  const handleSelect = async (value: string) => {
    if (value === currentVisualizer) return;

    try {
      await updateSetting("transcribing_visualizer", value as any);
      await refreshSettings();
    } catch (error) {
      console.error("Failed to update transcribing visualizer:", error);
      toast.error(String(error));
    }
  };

  return (
    <SettingContainer
      title={t("settings.debug.transcribingVisualizer.title")}
      description={t("settings.debug.transcribingVisualizer.description")}
      descriptionMode={descriptionMode}
      grouped={grouped}
      layout="horizontal"
    >
      <Dropdown
        options={visualizerOptions}
        selectedValue={currentVisualizer as TranscribingVariant}
        onSelect={handleSelect}
        disabled={isUpdating("transcribing_visualizer")}
      />
    </SettingContainer>
  );
};
