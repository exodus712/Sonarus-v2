// src/components/settings/ThemeToggle.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeValue } from '../../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeValue();

  const options = [
    { value: 'system', label: t('settings.theme.system', 'System') },
    { value: 'light', label: t('settings.theme.light', 'Light') },
    { value: 'dark', label: t('settings.theme.dark', 'Dark') },
  ] as const;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        {t('settings.theme.title', 'Theme')}
      </label>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              theme === option.value
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-text-primary hover:bg-bg-primary'
            }`}
            aria-pressed={theme === option.value}
            aria-label={option.label}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-text-secondary">
        {t('settings.theme.description', 'Choose your preferred theme')}
      </p>
    </div>
  );
};

export default ThemeToggle;
