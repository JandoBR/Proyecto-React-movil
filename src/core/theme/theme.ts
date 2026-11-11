import { MD3LightTheme } from 'react-native-paper';

import { colors } from './colors';

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.white,
    primaryContainer: colors.primarySoft,
    onPrimaryContainer: '#0D2A4A',
    secondary: colors.primaryDark,
    background: colors.cream,
    onBackground: colors.text,
    surface: colors.white,
    onSurface: colors.text,
    surfaceVariant: colors.chipBg,
    onSurfaceVariant: colors.muted,
    outline: colors.border,
    outlineVariant: colors.divider,
    error: colors.danger,
    onError: colors.white,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: colors.white,
      level2: colors.white,
      level3: colors.white,
    },
  },
};
