import React from "react";
import { useTranslation } from "react-i18next";
import { MicrophoneSelector } from "../audio/MicrophoneSelector";
import { ShortcutInput } from "../shortcuts/ShortcutInput";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { OutputDeviceSelector } from "../audio/OutputDeviceSelector";
import { PushToTalk } from "../toggles/PushToTalk";
import { AudioFeedback } from "../audio/AudioFeedback";
import { useSettings } from "../../../hooks/useSettings";
import { VolumeSlider } from "../audio/VolumeSlider";
import { MuteWhileRecording } from "../audio/MuteWhileRecording";
import { ModelSettingsCard } from "./ModelSettingsCard";
import { ThemeSettings } from "./ThemeSettings";
import { SoundPicker } from "../audio/SoundPicker";
import { ShowOverlay } from "../ShowOverlay";

export const GeneralSettings: React.FC = () => {
  const { t } = useTranslation();
  const { audioFeedbackEnabled } = useSettings();
  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <SettingsGroup title={t("settings.general.title")}>
        <ShortcutInput shortcutId="transcribe" grouped={true} />
        <PushToTalk descriptionMode="tooltip" grouped={true} />
        <ShowOverlay descriptionMode="tooltip" grouped={true} />
      </SettingsGroup>
      <ThemeSettings />
      <ModelSettingsCard />
      <SettingsGroup title={t("settings.sound.title")}>
        <MicrophoneSelector descriptionMode="tooltip" grouped={true} />
        <MuteWhileRecording descriptionMode="tooltip" grouped={true} />
        <AudioFeedback descriptionMode="tooltip" grouped={true} />
        <SoundPicker
          label={t("settings.sound.theme.label")}
          description={t("settings.sound.theme.description")}
        />
        <OutputDeviceSelector
          descriptionMode="tooltip"
          grouped={true}
          disabled={!audioFeedbackEnabled}
        />
        <VolumeSlider disabled={!audioFeedbackEnabled} />
      </SettingsGroup>
    </div>
  );
};
