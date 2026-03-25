import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingContainer } from "../ui/SettingContainer";
import { Dropdown, type DropdownOption } from "../ui/Dropdown";
import { useSettings } from "../../hooks/useSettings";
import { commands } from "@/bindings";
// TODO: Fix accelerator types when backend is implemented
// import type {
//   WhisperAcceleratorSetting,
//   OrtAcceleratorSetting,
// } from "@/bindings";

// Temporary types until backend is implemented
type WhisperAcceleratorSetting = "auto" | "cpu" | "gpu";
type OrtAcceleratorSetting = "auto" | "cpu" | "gpu";

const WHISPER_LABELS: Record<WhisperAcceleratorSetting, string> = {
  auto: "Auto",
  cpu: "CPU",
  gpu: "GPU",
};

const ORT_LABELS: Record<OrtAcceleratorSetting, string> = {
  auto: "Auto",
  cpu: "CPU",
  gpu: "GPU",
};

interface AccelerationSelectorProps {
  descriptionMode?: "tooltip" | "inline";
  grouped?: boolean;
}

export const AccelerationSelector: FC<AccelerationSelectorProps> = ({
  descriptionMode = "tooltip",
  grouped = false,
}) => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isUpdating } = useSettings();

  const [whisperOptions, setWhisperOptions] = useState<DropdownOption[]>([]);
  const [ortOptions, setOrtOptions] = useState<DropdownOption[]>([]);

  useEffect(() => {
    // TODO: Implement getAvailableAccelerators command in backend
    // commands.getAvailableAccelerators().then((available) => {
    //   setWhisperOptions(
    //     available.whisper.map((v) => ({
    //       value: v,
    //       label: WHISPER_LABELS[v as WhisperAcceleratorSetting] ?? v,
    //     })),
    //   );
    //   // Always include "auto" for ORT even though available() only returns compiled-in backends
    //   const ortVals = available.ort.includes("auto")
    //     ? available.ort
    //     : ["auto", ...available.ort];
    //   setOrtOptions(
    //     ortVals.map((v) => ({
    //       value: v,
    //       label: ORT_LABELS[v as OrtAcceleratorSetting] ?? v,
    //     })),
    //   );
    // });

    // Temporary static options until backend is implemented
    const staticWhisperOptions: DropdownOption[] = Object.entries(
      WHISPER_LABELS,
    ).map(([value, label]) => ({
      value,
      label,
    }));
    const staticOrtOptions: DropdownOption[] = Object.entries(ORT_LABELS).map(
      ([value, label]) => ({
        value,
        label,
      }),
    );

    setWhisperOptions(staticWhisperOptions);
    setOrtOptions(staticOrtOptions);
  }, []);

  // TODO: Add whisper_accelerator and ort_accelerator to AppSettings when backend is implemented
  // const currentWhisper = getSetting("whisper_accelerator") ?? "auto";
  // const currentOrt = getSetting("ort_accelerator") ?? "auto";
  const currentWhisper = "auto";
  const currentOrt = "auto";

  return (
    <>
      <SettingContainer
        title={t("settings.advanced.acceleration.whisper.title")}
        description={t("settings.advanced.acceleration.whisper.description")}
        descriptionMode={descriptionMode}
        grouped={grouped}
        layout="horizontal"
      >
        <Dropdown
          options={whisperOptions}
          selectedValue={currentWhisper}
          onSelect={(value) => {
            // TODO: Implement whisper_accelerator setting in backend
            // updateSetting(
            //   "whisper_accelerator",
            //   value as WhisperAcceleratorSetting,
            // )
            console.log(
              "Whisper accelerator setting not yet implemented:",
              value,
            );
          }}
          disabled={false} // TODO: use isUpdating("whisper_accelerator") when implemented
        />
      </SettingContainer>
      {ortOptions.length > 2 && (
        <SettingContainer
          title={t("settings.advanced.acceleration.ort.title")}
          description={t("settings.advanced.acceleration.ort.description")}
          descriptionMode={descriptionMode}
          grouped={grouped}
          layout="horizontal"
        >
          <Dropdown
            options={ortOptions}
            selectedValue={currentOrt}
            onSelect={(value) => {
              // TODO: Implement ort_accelerator setting in backend
              // updateSetting("ort_accelerator", value as OrtAcceleratorSetting)
              console.log(
                "ORT accelerator setting not yet implemented:",
                value,
              );
            }}
            disabled={false} // TODO: use isUpdating("ort_accelerator") when implemented
          />
        </SettingContainer>
      )}
    </>
  );
};
