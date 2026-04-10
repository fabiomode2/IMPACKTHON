/**
 * Minimalist, sober, premium color definitions.
 */

import { Platform } from 'react-native';

const tintColorLight = '#000000';
const tintColorDark = '#FFFFFF';

export const Colors = {
  light: {
    text: '#1C1C1E',
    textSecondary: '#6C6C70',
    background: '#F2F2F7',
    card: '#FFFFFF',
    border: '#E5E5EA',
    tint: tintColorLight,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
    success: '#34C759',
    error: '#FF3B30',
    accent: '#007AFF',
  },
  dark: {
    text: '#F2F2F7',
    textSecondary: '#EBEBF599', // Custom alpha opacity representation
    background: '#000000',
    card: '#1C1C1E',
    border: '#38383A',
    tint: tintColorDark,
    icon: '#98989D',
    tabIconDefault: '#98989D',
    tabIconSelected: tintColorDark,
    success: '#30D158',
    error: '#FF453A',
    accent: '#0A84FF',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
