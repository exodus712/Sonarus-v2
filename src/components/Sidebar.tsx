import React from "react";
import { useTranslation } from "react-i18next";
import { FlaskConical, Sparkles } from "lucide-react";
import HandyTextLogo from "./icons/HandyTextLogo";
import { CpuIcon } from "./ui/cpu";
import { HistoryIcon } from "./ui/history";
import { CogIcon } from "./ui/cog";
import { CircleHelpIcon } from "./ui/circle-help";
import { AudioLinesIcon } from "./ui/audio-lines";
import { useSettings } from "../hooks/useSettings";
import {
  GeneralSettings,
  AdvancedSettings,
  HistorySettings,
  DebugSettings,
  AboutSettings,
  PostProcessingSettings,
  ModelsSettings,
} from "./settings";

export type SidebarSection = keyof typeof SECTIONS_CONFIG;

interface IconProps {
  width?: number | string;
  height?: number | string;
  size?: number | string;
  className?: string;
  [key: string]: any;
}

// Wrapper components to adapt animated icons to our interface
const AnimatedAudioLinesIcon: React.FC<IconProps> = ({
  size,
  className,
  ...props
}) => (
  <AudioLinesIcon
    size={typeof size === "string" ? parseInt(size) : size}
    className={className}
    {...props}
  />
);

const AnimatedCpuIcon: React.FC<IconProps> = ({
  size,
  className,
  ...props
}) => (
  <CpuIcon
    size={typeof size === "string" ? parseInt(size) : size}
    className={className}
    {...props}
  />
);

const AnimatedCogIcon: React.FC<IconProps> = ({
  size,
  className,
  ...props
}) => (
  <CogIcon
    size={typeof size === "string" ? parseInt(size) : size}
    className={className}
    {...props}
  />
);

const AnimatedHistoryIcon: React.FC<IconProps> = ({
  size,
  className,
  ...props
}) => (
  <HistoryIcon
    size={typeof size === "string" ? parseInt(size) : size}
    className={className}
    {...props}
  />
);

const AnimatedCircleHelpIcon: React.FC<IconProps> = ({
  size,
  className,
  ...props
}) => (
  <CircleHelpIcon
    size={typeof size === "string" ? parseInt(size) : size}
    className={className}
    {...props}
  />
);

interface SectionConfig {
  labelKey: string;
  icon: React.ComponentType<IconProps>;
  component: React.ComponentType;
  enabled: (settings: any) => boolean;
}

export const SECTIONS_CONFIG = {
  general: {
    labelKey: "sidebar.general",
    icon: AnimatedAudioLinesIcon,
    component: GeneralSettings,
    enabled: () => true,
  },
  models: {
    labelKey: "sidebar.models",
    icon: AnimatedCpuIcon,
    component: ModelsSettings,
    enabled: () => true,
  },
  advanced: {
    labelKey: "sidebar.advanced",
    icon: AnimatedCogIcon,
    component: AdvancedSettings,
    enabled: () => true,
  },
  postprocessing: {
    labelKey: "sidebar.postProcessing",
    icon: Sparkles,
    component: PostProcessingSettings,
    enabled: (settings) => settings?.post_process_enabled ?? false,
  },
  history: {
    labelKey: "sidebar.history",
    icon: AnimatedHistoryIcon,
    component: HistorySettings,
    enabled: () => true,
  },
  debug: {
    labelKey: "sidebar.debug",
    icon: FlaskConical,
    component: DebugSettings,
    enabled: (settings) => settings?.debug_mode ?? false,
  },
  about: {
    labelKey: "sidebar.about",
    icon: AnimatedCircleHelpIcon,
    component: AboutSettings,
    enabled: () => true,
  },
} as const satisfies Record<string, SectionConfig>;

interface SidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation();
  const { settings } = useSettings();

  const availableSections = Object.entries(SECTIONS_CONFIG)
    .filter(([_, config]) => config.enabled(settings))
    .map(([id, config]) => ({ id: id as SidebarSection, ...config }));

  return (
    <div className="flex flex-col w-40 h-full border-e border-mid-gray/20 items-center px-2">
      <HandyTextLogo width={120} className="m-4" />
      <div className="flex flex-col w-full items-center gap-1 pt-2 border-t border-mid-gray/20">
        {availableSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <div
              key={section.id}
              data-testid={`sidebar-${section.id}`}
              className={`flex gap-2 items-center p-2 w-full rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? "bg-logo-primary/80"
                  : "hover:bg-mid-gray/20 hover:opacity-100 opacity-85"
              }`}
              onClick={() => onSectionChange(section.id)}
            >
              <Icon size={24} className="shrink-0" />
              <p
                className="text-sm font-medium truncate"
                title={t(section.labelKey)}
              >
                {t(section.labelKey)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
