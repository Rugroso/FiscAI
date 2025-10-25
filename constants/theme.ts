/**
 * Esquema de colores blanco y negro para la aplicación.
 * Los colores están definidos para modo claro y oscuro.
 */

import { Platform } from 'react-native';

const tintColorLight = '#000000';
const tintColorDark = '#FFFFFF';
const accentColor = '#FF0000';

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#666666',
    tabIconDefault: '#666666',
    tabIconSelected: tintColorLight,
    accent: accentColor,
    muted: '#6B6B6B',
    border: '#E6E6E6',
    surface: '#FFFFFF',
    progressPrimary: '#16A34A', // green-600
    progressTrack: '#E5E7EB', // gray-200
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: tintColorDark,
    icon: '#999999',
    tabIconDefault: '#999999',
    tabIconSelected: tintColorDark,
    accent: accentColor,
    muted: '#A1A1A1',
    border: '#2A2A2A',
    surface: '#111111',
    progressPrimary: '#34D399', // green-400 for dark
    progressTrack: '#262626', // gray-800
  },
};

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
