# Theme System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a light/dark theme system for Sonarus with system preference default and manual toggle persistence.

**Architecture:** Tailwind CSS class-based dark mode with React ThemeProvider and Tauri store persistence.

**Tech Stack:** React, TypeScript, Tailwind CSS, Tauri, CSS Variables

---

## File Structure

```
src/
├── contexts/
│   └── ThemeProvider.tsx          # Theme context and state management
├── components/settings/
│   └── ThemeToggle.tsx            # Theme toggle UI component
├── hooks/
│   └── useTheme.ts                # Theme hook for components
├── App.css                        # Updated CSS variables
├── App.tsx                        # Wrap with ThemeProvider
└── tailwind.config.js             # Updated for class-based dark mode
```

---

## Chunk 1: Foundation Setup

### Task 1: Update Tailwind Configuration

**Files:**

- Modify: `tailwind.config.js`

- [ ] **Step 1: Update Tailwind config for class-based dark mode**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        text: "var(--color-text)",
        background: "var(--color-background)",
        "logo-primary": "var(--color-logo-primary)",
        "logo-stroke": "var(--color-logo-stroke)",
        "text-stroke": "var(--color-text-stroke)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        accent: "var(--color-accent)",
        "border-primary": "var(--color-border-primary)",
        "mid-gray": "var(--color-mid-gray)",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Run dev server to verify config works**

Run: `bun run dev`
Expected: Server starts without Tailwind errors

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: configure Tailwind for class-based dark mode"
```

### Task 2: Update CSS Design Tokens

**Files:**

- Modify: `src/App.css`

- [ ] **Step 1: Update CSS variables for theme system**

```css
@import "tailwindcss";

@theme {
  /* Design tokens - will be updated by theme system */
  --color-text: #0f0f0f;
  --color-background: #fbfbfb;
  --color-background-ui: #da5893;
  --color-logo-primary: #faa2ca;
  --color-logo-stroke: #382731;
  --color-text-stroke: #f6f6f6;
  --color-mid-gray: #808080;
}

:root {
  /* Typography */
  font-size: 15px;
  line-height: 24px;
  font-weight: 400;

  /* Light theme colors */
  --color-text-primary: #0f0f0f;
  --color-text-secondary: #808080;
  --color-bg-primary: #fbfbfb;
  --color-bg-secondary: #f6f6f6;
  --color-accent: #da5893;
  --color-border-primary: rgba(0, 0, 0, 0.1);

  /* Legacy colors for backward compatibility */
  --color-text: #0f0f0f;
  --color-background: #fbfbfb;
  --color-logo-primary: #faa2ca;
  --color-logo-stroke: #382731;
  --color-text-stroke: #f6f6f6;

  /* Typography settings */
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;

  --scrollbar-thumb: color-mix(in srgb, var(--color-text), transparent 85%);
  --scrollbar-thumb-hover: color-mix(
    in srgb,
    var(--color-text),
    transparent 70%
  );

  /* Apply colors */
  color: var(--color-text);
  background-color: var(--color-background);
}

/* Dark theme with warm neutrals */
.dark {
  --color-text-primary: #fbfbfb;
  --color-text-secondary: #b8b8b8;
  --color-bg-primary: #2c2b29;
  --color-bg-secondary: #383735;
  --color-accent: #f28cbb;
  --color-border-primary: rgba(255, 255, 255, 0.1);

  /* Update legacy colors */
  --color-text: #fbfbfb;
  --color-background: #2c2b29;
  --color-logo-primary: #f28cbb;
  --color-logo-stroke: #fad1ed;
}

.container {
  margin: 0;
  padding-top: 10vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

/* macOS - tint native overlay scrollbar thumb */
:root[data-platform="macos"] {
  scrollbar-color: var(--scrollbar-thumb) transparent;
}

/* Custom Scrollbar - only on Windows/Linux; macOS uses native overlay scrollbars */
:root:not([data-platform="macos"]) ::-webkit-scrollbar {
  width: 14px;
  height: 14px;
}

:root:not([data-platform="macos"]) ::-webkit-scrollbar-track {
  background: transparent;
}

:root:not([data-platform="macos"]) ::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb);
  border-radius: 20px;
  border: 3px solid transparent;
  border-right-width: 4px;
  border-left-width: 3px;
  background-clip: content-box;
  min-height: 32px;
}

:root:not([data-platform="macos"]) ::-webkit-scrollbar-thumb:hover {
  background-color: var(--scrollbar-thumb-hover);
}

@layer utilities {
  .text-stroke {
    -webkit-text-stroke: 2px var(--color-text-stroke);
  }
}

.logo-primary {
  fill: var(--color-logo-primary);
}

.logo-stroke {
  fill: var(--color-logo-stroke);
  stroke: var(--color-logo-stroke);
  stroke-width: 1;
}
```

- [ ] **Step 2: Test CSS variables work**

Run: `bun run dev`
Expected: App renders with light theme colors

- [ ] **Step 3: Commit**

```bash
git add src/App.css
git commit -m "feat: add CSS design tokens for theme system"
```

---

## Chunk 2: Theme Provider Implementation

### Task 3: Create Theme Context

**Files:**

- Create: `src/contexts/ThemeProvider.tsx`

- [ ] **Step 1: Write failing test for ThemeProvider**

```typescript
// tests/contexts/ThemeProvider.test.tsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeProvider';

describe('ThemeProvider', () => {
  it('should provide default theme context', () => {
    const TestComponent = () => {
      const { theme, effectiveTheme } = useTheme();
      return <div data-testid="theme">{theme}-{effectiveTheme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('system-light');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/contexts/ThemeProvider.test.tsx`
Expected: FAIL with "ThemeProvider not found"

- [ ] **Step 3: Create ThemeProvider implementation**

```typescript
// src/contexts/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { commands } from '@/bindings';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Load theme from store on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const result = await commands.getSetting('theme_mode');
        if (result.status === 'ok' && result.data) {
          setThemeState(result.data as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme setting:', error);
      }
    };

    loadTheme();
  }, []);

  // Update effective theme when theme or system preference changes
  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setEffectiveTheme(systemPrefersDark ? 'dark' : 'light');
      } else {
        setEffectiveTheme(theme);
      }
    };

    updateEffectiveTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateEffectiveTheme);
      return () => mediaQuery.removeEventListener('change', updateEffectiveTheme);
    }
  }, [theme]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [effectiveTheme]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      await commands.setSetting('theme_mode', newTheme);
    } catch (error) {
      console.warn('Failed to save theme setting:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    effectiveTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/contexts/ThemeProvider.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/contexts/ThemeProvider.tsx tests/contexts/ThemeProvider.test.tsx
git commit -m "feat: implement ThemeProvider with context and store integration"
```

### Task 4: Create Theme Hook

**Files:**

- Create: `src/hooks/useTheme.ts`

- [ ] **Step 1: Write failing test for useTheme hook**

```typescript
// tests/hooks/useTheme.test.tsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../src/contexts/ThemeProvider';
import { useThemeValue } from '../src/hooks/useTheme';

describe('useTheme', () => {
  it('should return theme context values', () => {
    const TestComponent = () => {
      const { theme, effectiveTheme, setTheme } = useThemeValue();
      return (
        <div data-testid="theme-hooks">
          <span data-testid="theme">{theme}</span>
          <span data-testid="effective">{effectiveTheme}</span>
          <button onClick={() => setTheme('dark')} data-testid="set-theme">Set Dark</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    expect(screen.getByTestId('effective')).toHaveTextContent('light');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/hooks/useTheme.test.tsx`
Expected: FAIL with "useThemeValue not found"

- [ ] **Step 3: Create useTheme hook**

```typescript
// src/hooks/useTheme.ts
import { useTheme as useThemeContext } from "../contexts/ThemeProvider";

export const useTheme = () => {
  return useThemeContext();
};

// Re-export for consistency with naming convention
export const useThemeValue = useTheme;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/hooks/useTheme.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTheme.ts tests/hooks/useTheme.test.tsx
git commit -m "feat: create useTheme hook for theme access"
```

---

## Chunk 3: Settings Integration

### Task 5: Create Theme Toggle Component

**Files:**

- Create: `src/components/settings/ThemeToggle.tsx`

- [ ] **Step 1: Write failing test for ThemeToggle**

```typescript
// tests/components/settings/ThemeToggle.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../../src/contexts/ThemeProvider';
import { ThemeToggle } from '../../../src/components/settings/ThemeToggle';

describe('ThemeToggle', () => {
  it('should render theme options', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('should call setTheme when option is selected', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const darkOption = screen.getByText('Dark');
    fireEvent.click(darkOption);

    // Verify theme was set (would need to mock the store)
    expect(darkOption).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/components/settings/ThemeToggle.test.tsx`
Expected: FAIL with "ThemeToggle not found"

- [ ] **Step 3: Create ThemeToggle component**

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/components/settings/ThemeToggle.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/ThemeToggle.tsx tests/components/settings/ThemeToggle.test.tsx
git commit -m "feat: create ThemeToggle component with system/light/dark options"
```

### Task 6: Add Theme Toggle to Settings

**Files:**

- Modify: `src/components/Sidebar.tsx` (or wherever settings sections are defined)

- [ ] **Step 1: Find settings section configuration**

First, examine the current settings structure:

```bash
find src -name "*.tsx" -exec grep -l "SECTIONS_CONFIG\|settings" {} \;
```

- [ ] **Step 2: Add theme section to settings**

Based on the existing pattern, add theme to the settings configuration. This will require examining the current settings structure first.

- [ ] **Step 3: Test theme toggle appears in settings**

Run: `bun run dev`
Expected: Theme toggle appears in settings panel

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add theme toggle to settings panel"
```

---

## Chunk 4: Integration and Testing

### Task 7: Wrap App with ThemeProvider

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx to use ThemeProvider**

```typescript
// Add this import near the top
import { ThemeProvider } from './contexts/ThemeProvider';

// Wrap the entire app return value with ThemeProvider
return (
  <ThemeProvider>
    <div
      dir={direction}
      className="h-screen flex flex-col select-none cursor-default"
    >
      {/* Rest of the app content remains the same */}
      <Toaster
        theme="system"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "bg-bg-primary border border-border-primary rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 text-sm",
            title: "font-medium",
            description: "text-text-secondary",
          },
        }}
      />
      {/* Main content area that takes remaining space */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeSection={currentSection}
          onSectionChange={setCurrentSection}
        />
        {/* Scrollable content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center p-4 gap-4">
              <AccessibilityPermissions />
              {renderSettingsContent(currentSection)}
            </div>
          </div>
        </div>
      </div>
      {/* Fixed footer at bottom */}
      <Footer />
    </div>
  </ThemeProvider>
);
```

- [ ] **Step 2: Test app with ThemeProvider**

Run: `bun run dev`
Expected: App renders successfully with theme system active

- [ ] **Step 3: Test theme switching**

In the running app:

1. Open settings
2. Click "Dark" theme option
3. Verify app switches to dark theme
4. Click "Light" theme option
5. Verify app switches back to light theme

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wrap App with ThemeProvider for theme system"
```

### Task 8: Add Theme Translations

**Files:**

- Modify: `src/i18n/locales/en.json` (and other locale files)

- [ ] **Step 1: Add theme translations to English**

```json
{
  "settings": {
    "theme": {
      "title": "Theme",
      "system": "System",
      "light": "Light",
      "dark": "Dark",
      "description": "Choose your preferred theme"
    }
  }
}
```

- [ ] **Step 2: Add theme translations to other locales**

Add similar translations to other locale files in `src/i18n/locales/`

- [ ] **Step 3: Test translations work**

Run: `bun run dev`
Expected: Theme toggle shows translated labels

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat: add theme translations"
```

---

## Chunk 5: Testing and Validation

### Task 9: End-to-End Theme Testing

**Files:**

- Create: `tests/e2e/theme.spec.ts` (if using Playwright)

- [ ] **Step 1: Write E2E test for theme switching**

```typescript
// tests/e2e/theme.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Theme System", () => {
  test("should default to system preference on first launch", async ({
    page,
  }) => {
    await page.goto("/");

    // Check initial theme based on system preference
    const html = page.locator("html");
    const systemPrefersDark = await page.evaluate(
      () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    );

    if (systemPrefersDark) {
      await expect(html).toHaveClass(/dark/);
    } else {
      await expect(html).not.toHaveClass(/dark/);
    }
  });

  test("should switch to dark theme when selected", async ({ page }) => {
    await page.goto("/");

    // Navigate to settings
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="theme-section"]');

    // Select dark theme
    await page.click('[data-testid="theme-dark"]');

    // Verify dark theme is applied
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Reload page and verify persistence
    await page.reload();
    await expect(html).toHaveClass(/dark/);
  });

  test("should switch to light theme when selected", async ({ page }) => {
    await page.goto("/");

    // Navigate to settings and select light theme
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="theme-section"]');
    await page.click('[data-testid="theme-light"]');

    // Verify light theme is applied
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    // Reload page and verify persistence
    await page.reload();
    await expect(html).not.toHaveClass(/dark/);
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `bun run test:playwright theme.spec.ts`
Expected: All theme tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/theme.spec.ts
git commit -m "test: add E2E tests for theme system"
```

### Task 10: Manual Testing Checklist

**Files:** No files modified

- [ ] **Step 1: Test system preference behavior**

1. Set system to light mode
2. Clear app settings (simulate first install)
3. Launch app - should use light theme
4. Set system to dark mode
5. Clear app settings again
6. Launch app - should use dark theme

- [ ] **Step 2: Test manual override behavior**

1. Set system to light mode
2. In app settings, select "Dark" theme
3. Verify app uses dark theme despite system preference
4. Restart app
5. Verify app still uses dark theme (persistence)

- [ ] **Step 3: Test theme switching**

1. Switch between all three theme options
2. Verify immediate visual changes
3. Verify no page reload required
4. Verify settings persistence

- [ ] **Step 4: Test accessibility**

1. Check color contrast ratios in both themes
2. Verify screen reader announces theme changes
3. Test keyboard navigation of theme toggle

- [ ] **Step 5: Test cross-platform behavior**

1. Test on macOS (if available)
2. Test on Windows (if available)
3. Verify consistent behavior

- [ ] **Step 6: Document test results**

Create a brief test report documenting any issues found

- [ ] **Step 7: Commit test report**

```bash
git add docs/theme-testing-report.md
git commit -m "docs: add theme system testing report"
```

---

## Final Verification

### Task 11: Final Integration Check

**Files:** Multiple files to verify

- [ ] **Step 1: Verify all theme files are created**

```bash
find src -name "*theme*" -o -name "*Theme*" | sort
```

Expected: ThemeProvider.tsx, ThemeToggle.tsx, useTheme.ts

- [ ] **Step 2: Run full test suite**

Run: `bun test`
Expected: All tests pass

- [ ] **Step 3: Run E2E tests**

Run: `bun run test:playwright`
Expected: All E2E tests pass

- [ ] **Step 4: Final manual smoke test**

1. Launch app
2. Navigate through all sections
3. Test theme switching
4. Verify no console errors
5. Verify performance is acceptable

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete theme system implementation with light/dark modes

- Add Tailwind class-based dark mode configuration
- Implement ThemeProvider with React context
- Create theme toggle settings component
- Add theme persistence via Tauri store
- Support system preference with manual override
- Include comprehensive test coverage
- Follow Sonarus design principles with warm neutrals"
```

---

## Implementation Notes

### Key Decisions Made

1. **Tailwind class-based strategy**: Chose over CSS variables for better component styling
2. **React Context**: Provides clean API for components to access theme state
3. **Tauri Store Integration**: Leverages existing settings infrastructure
4. **System Preference Default**: Meets requirement for first-install behavior
5. **Manual Override Persistence**: Honors user choice after initial selection

### Testing Strategy

- Unit tests for ThemeProvider and useTheme hook
- Component tests for ThemeToggle
- E2E tests for full theme switching workflow
- Manual testing checklist for cross-platform verification

### Future Considerations

- Theme transition animations (CSS transitions)
- Additional color schemes (if requirements change)
- System accent color integration
- Recording overlay theming integration

---

**Plan complete and saved to `docs/superpowers/plans/2026-03-23-theme-system.md`. Ready to execute?**
