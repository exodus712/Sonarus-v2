# Theme System Design

**Date:** 2026-03-23  
**Project:** Sonarus Theme System  
**Status:** Approved

## Overview

Design and implementation of a light/dark theme system for Sonarus that follows the product's design philosophy and technical requirements.

## Requirements

- System preference as default on first install
- Manual toggle in settings that persists user choice
- Only light and dark modes (no additional themes)
- Follow Sonarus design principles (warm neutrals, typography-first)
- Integrate with existing Tauri store and React architecture

## Architecture

### Core Components

1. **ThemeProvider** - React context managing theme state
2. **Tauri Store Integration** - Persistent theme setting storage  
3. **Tailwind Configuration** - Updated for class-based dark mode
4. **Settings UI** - Theme toggle component
5. **CSS Design Tokens** - Sonarus color system

### Technical Stack

- **React Context** for theme state management
- **Tailwind CSS** with class-based dark mode strategy
- **CSS Variables** for design token storage
- **Tauri Store** for persistent settings
- **TypeScript** for type safety

## Implementation Details

### 1. Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'accent': 'var(--color-accent)',
        'border-primary': 'var(--color-border-primary)',
        'mid-gray': 'var(--color-mid-gray)',
      }
    }
  }
}
```

### 2. Theme Provider

```typescript
interface ThemeContextType {
  theme: 'system' | 'light' | 'dark';
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: 'system' | 'light' | 'dark') => void;
}

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read from Tauri store, default to 'system' on first install
  // Apply .dark class to document.documentElement when needed
  // Listen for system preference changes when theme === 'system'
}
```

### 3. CSS Design Tokens

```css
/* Light theme (default) */
:root {
  --color-text-primary: #0f0f0f;
  --color-text-secondary: #808080;
  --color-bg-primary: #fbfbfb;
  --color-bg-secondary: #f6f6f6;
  --color-accent: #da5893;
  --color-border-primary: rgba(0, 0, 0, 0.1);
  --color-mid-gray: #808080;
}

/* Dark theme - warm neutrals */
.dark {
  --color-text-primary: #fbfbfb;
  --color-text-secondary: #b8b8b8;
  --color-bg-primary: #2c2b29;
  --color-bg-secondary: #383735;
  --color-accent: #f28cbb;
  --color-border-primary: rgba(255, 255, 255, 0.1);
  --color-mid-gray: #808080;
}
```

### 4. Settings Integration

- Add `theme_mode` setting to existing Tauri store
- Default value: `'system'` (for first install behavior)
- Theme toggle component in settings sidebar
- Use existing `useSettings` hook pattern

### 5. Component Styling

**Before:**
```jsx
<div className="bg-background border border-mid-gray/20">
```

**After:**
```jsx
<div className="bg-bg-primary border-border-primary">
```

**Conditional styling:**
```jsx
<button className="bg-accent hover:bg-accent/80 text-white">
  Recording
</button>
```

## Implementation Steps

1. **Update Tailwind config** for class-based dark mode
2. **Create ThemeProvider** with Tauri store integration
3. **Define Sonarus color tokens** in CSS variables  
4. **Add theme setting** to Tauri store with 'system' default
5. **Build theme toggle UI** in settings panel
6. **Migrate existing components** to use new color tokens
7. **Test system preference** switching and manual override

## Sonarus Design Alignment

- **Warm neutrals in dark mode** (`#2c2b29` instead of pure black)
- **Typography-first approach** with proper contrast ratios
- **Consistent accent colors** across themes (`#da5893` → `#f28cbb`)
- **Component-level styling** using Tailwind utilities
- **Nothing decorative** - every color choice serves a purpose

## File Structure

```
src/
├── contexts/
│   └── ThemeProvider.tsx
├── components/settings/
│   └── ThemeToggle.tsx
├── hooks/
│   └── useTheme.ts
├── App.css (updated)
└── tailwind.config.js (updated)
```

## Testing Requirements

- System preference detection and following
- Manual toggle persistence
- Theme switching without page reload
- Component styling consistency
- Accessibility contrast ratios
- Cross-platform behavior (macOS/Windows)

## Future Considerations

- Theme transition animations
- Additional color schemes (if needed)
- System integration (follow macOS/Windows accent colors)
- Recording overlay theming
- Custom accent color options
