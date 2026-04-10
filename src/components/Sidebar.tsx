import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FlaskConical, Sparkles, TextQuote } from "lucide-react";
import SonarusTextLogo from "./icons/SonarusTextLogo";
import { CpuIcon, type CpuIconHandle } from "./ui/cpu";
import { HistoryIcon, type HistoryIconHandle } from "./ui/history";
import { CogIcon, type CogIconHandle } from "./ui/cog";
import { CircleHelpIcon, type CircleHelpIconHandle } from "./ui/circle-help";
import { AudioLinesIcon, type AudioLinesIconHandle } from "./ui/audio-lines";
import { useSettings } from "../hooks/useSettings";
import {
  GeneralSettings,
  AdvancedSettings,
  HistorySettings,
  DebugSettings,
  AboutSettings,
  PostProcessingSettings,
  ModelsSettings,
  SnippetsSettings,
} from "./settings";

export type SidebarSection = keyof typeof SECTIONS_CONFIG;

interface IconProps {
  width?: number | string;
  height?: number | string;
  size?: number | string;
  className?: string;
  [key: string]: any;
}

// Wrapper components to adapt animated icons to our interface with refs forwarded
const AnimatedAudioLinesIcon = React.forwardRef<
  AudioLinesIconHandle,
  IconProps
>(({ size, className, ...props }, ref) => (
  <AudioLinesIcon
    ref={ref}
    size={typeof size === "string" ? parseInt(size) : size}
    className={className}
    {...props}
  />
));
AnimatedAudioLinesIcon.displayName = "AnimatedAudioLinesIcon";

const AnimatedCpuIcon = React.forwardRef<CpuIconHandle, IconProps>(
  ({ size, className, ...props }, ref) => (
    <CpuIcon
      ref={ref}
      size={typeof size === "string" ? parseInt(size) : size}
      className={className}
      {...props}
    />
  ),
);
AnimatedCpuIcon.displayName = "AnimatedCpuIcon";

const AnimatedCogIcon = React.forwardRef<CogIconHandle, IconProps>(
  ({ size, className, ...props }, ref) => (
    <CogIcon
      ref={ref}
      size={typeof size === "string" ? parseInt(size) : size}
      className={className}
      {...props}
    />
  ),
);
AnimatedCogIcon.displayName = "AnimatedCogIcon";

const AnimatedHistoryIcon = React.forwardRef<HistoryIconHandle, IconProps>(
  ({ size, className, ...props }, ref) => (
    <HistoryIcon
      ref={ref}
      size={typeof size === "string" ? parseInt(size) : size}
      className={className}
      {...props}
    />
  ),
);
AnimatedHistoryIcon.displayName = "AnimatedHistoryIcon";

const AnimatedCircleHelpIcon = React.forwardRef<
  CircleHelpIconHandle,
  IconProps
>(({ size, className, ...props }, ref) => (
  <CircleHelpIcon
    ref={ref}
    size={typeof size === "string" ? parseInt(size) : size}
    className={className}
    {...props}
  />
));
AnimatedCircleHelpIcon.displayName = "AnimatedCircleHelpIcon";

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
  snippets: {
    labelKey: "sidebar.snippets",
    icon: TextQuote,
    component: SnippetsSettings,
    enabled: (settings) => settings?.snippets_enabled ?? false,
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

// Animated icon refs type
interface AnimatedIconHandles {
  general: React.RefObject<AudioLinesIconHandle | null>;
  models: React.RefObject<CpuIconHandle | null>;
  advanced: React.RefObject<CogIconHandle | null>;
  history: React.RefObject<HistoryIconHandle | null>;
  about: React.RefObject<CircleHelpIconHandle | null>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation();
  const { settings } = useSettings();

  // Create refs for animated icons
  const iconRefs = {
    general: useRef<AudioLinesIconHandle>(null),
    models: useRef<CpuIconHandle>(null),
    advanced: useRef<CogIconHandle>(null),
    history: useRef<HistoryIconHandle>(null),
    about: useRef<CircleHelpIconHandle>(null),
  } as AnimatedIconHandles;

  const availableSections = Object.entries(SECTIONS_CONFIG)
    .filter(([_, config]) => config.enabled(settings))
    .map(([id, config]) => ({ id: id as SidebarSection, ...config }));

  const handleTabMouseEnter = (sectionId: SidebarSection) => {
    const ref = iconRefs[sectionId as keyof AnimatedIconHandles];
    if (ref?.current) {
      ref.current.startAnimation();
    }
  };

  const handleTabMouseLeave = (sectionId: SidebarSection) => {
    const ref = iconRefs[sectionId as keyof AnimatedIconHandles];
    if (ref?.current) {
      ref.current.stopAnimation();
    }
  };

  return (
    <div className="flex flex-col w-40 h-full border-e border-mid-gray/20 items-center px-2">
      <SonarusTextLogo width={120} className="m-4 text-logo-primary" />
      <div className="flex flex-col w-full items-center gap-1 pt-2 border-t border-mid-gray/20">
        {availableSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          const iconRef = iconRefs[section.id as keyof AnimatedIconHandles];

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
              onMouseEnter={() => handleTabMouseEnter(section.id)}
              onMouseLeave={() => handleTabMouseLeave(section.id)}
            >
              <Icon
                ref={iconRef as React.RefObject<any>}
                size={24}
                className="shrink-0"
              />
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
