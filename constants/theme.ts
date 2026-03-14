/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// ============================================================
// MEDTRACK DESIGN TOKENS
// Large, high-contrast, warm — designed for elderly users
// ============================================================

export const Colors = {
  // Brand
  primary: "#1A5276",        // Deep navy — trust, calm
  primaryLight: "#2E86C1",
  accent: "#27AE60",         // Confident green — "taken" states
  accentLight: "#A9DFBF",

  // Danger / Panic
  danger: "#C0392B",
  dangerLight: "#FADBD8",

  // Warning
  warning: "#E67E22",
  warningLight: "#FDEBD0",

  // Neutrals
  background: "#F5F0EB",    // Warm cream — softer than white on aging eyes
  surface: "#FFFFFF",
  surfaceAlt: "#EBE5DC",
  border: "#D5CBB8",

  // Text — extra high contrast
  textPrimary: "#1C1C1C",
  textSecondary: "#5D5348",
  textMuted: "#9E8E7E",
  textOnDark: "#FFFFFF",

  // Dose status
  upcoming: "#2E86C1",
  taken: "#27AE60",
  overdue: "#C0392B",

  // Tab bar
  tabActive: "#1A5276",
  tabInactive: "#9E8E7E",
};

export const Typography = {
  // Sizes — bumped up for elderly readability
  displayXL: 34,   // Patient name
  displayL: 28,    // Screen titles
  displayM: 24,    // Card headers, section titles
  bodyXL: 22,      // Primary reading text
  bodyL: 20,       // Standard body
  bodyM: 18,       // Secondary text
  bodyS: 16,       // Labels, captions
  tiny: 14,        // Timestamps only

  bold: "700" as const,
  semibold: "600" as const,
  regular: "400" as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const Shadow = {
  card: {
    shadowColor: "#1C1C1C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
};

// WCAG 2.5.5 minimum is 44pt; we use 56pt floor for elderly accessibility
export const MinTouchTarget = 56;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
