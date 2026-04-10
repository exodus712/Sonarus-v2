// Settings section components
export { GeneralSettings } from "./general/GeneralSettings";
export { AdvancedSettings } from "./advanced/AdvancedSettings";
export { DebugSettings } from "./debug/DebugSettings";
export { HistorySettings } from "./history/HistorySettings";
export { AboutSettings } from "./about/AboutSettings";
export { PostProcessingSettings } from "./post-processing/PostProcessingSettings";
export { ModelsSettings } from "./models/ModelsSettings";
export { SnippetsSettings } from "./snippets/SnippetsSettings";

// Audio components
export { MicrophoneSelector } from "./audio/MicrophoneSelector";
export { ClamshellMicrophoneSelector } from "./audio/ClamshellMicrophoneSelector";
export { OutputDeviceSelector } from "./audio/OutputDeviceSelector";
export { AudioFeedback } from "./audio/AudioFeedback";
export { VolumeSlider } from "./audio/VolumeSlider";
export { SoundPicker } from "./audio/SoundPicker";
export { MuteWhileRecording } from "./audio/MuteWhileRecording";

// Shortcut components
export { GlobalShortcutInput } from "./shortcuts/GlobalShortcutInput";
export { HandyKeysShortcutInput } from "./shortcuts/HandyKeysShortcutInput";
export { ShortcutInput } from "./shortcuts/ShortcutInput";

// Toggle components
export { AlwaysOnMicrophone } from "./toggles/AlwaysOnMicrophone";
export { PushToTalk } from "./toggles/PushToTalk";
export { PostProcessingToggle } from "./toggles/PostProcessingToggle";
export { AutostartToggle } from "./toggles/AutostartToggle";
export { UpdateChecksToggle } from "./toggles/UpdateChecksToggle";
export { StartHidden } from "./toggles/StartHidden";
export { ShowTrayIcon } from "./toggles/ShowTrayIcon";
export { ExperimentalToggle } from "./toggles/ExperimentalToggle";
export { LazyStreamClose } from "./toggles/LazyStreamClose";
export { AppendTrailingSpace } from "./toggles/AppendTrailingSpace";
export { ThemeToggle } from "./toggles/ThemeToggle";
export { SmartSnippetsToggle } from "./toggles/SmartSnippetsToggle";

// Individual setting components (remaining in root)
export { ShowOverlay } from "./ShowOverlay";
export { TranslateToEnglish } from "./TranslateToEnglish";
export { CustomWords } from "./CustomWords";
export { PostProcessingSettingsApi } from "./PostProcessingSettingsApi";
export { PostProcessingSettingsPrompts } from "./PostProcessingSettingsPrompts";
export { AppDataDirectory } from "./AppDataDirectory";
export { ModelUnloadTimeoutSetting } from "./ModelUnloadTimeout";
export { HistoryLimit } from "./HistoryLimit";
export { RecordingRetentionPeriodSelector } from "./RecordingRetentionPeriod";
export { AccelerationSelector } from "./AccelerationSelector";
export { AppLanguageSelector } from "./AppLanguageSelector";
export { AutoSubmit } from "./AutoSubmit";
export { ClipboardHandlingSetting as ClipboardHandling } from "./ClipboardHandling";
export { LanguageSelector } from "./LanguageSelector";
export { PasteMethodSetting as PasteMethod } from "./PasteMethod";
export { TypingToolSetting as TypingTool } from "./TypingTool";
