/**
 * Тема приложения
 * Настройка цветов и стилей для React Native Paper
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { COLORS } from './index';

// Светлая тема
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.PRIMARY,
    primaryContainer: COLORS.PRIMARY_DARK,
    secondary: COLORS.SECONDARY,
    secondaryContainer: '#FFF3C4',
    tertiary: COLORS.INFO,
    tertiaryContainer: '#E3F2FD',
    surface: COLORS.WHITE,
    surfaceVariant: COLORS.LIGHT,
    surfaceContainerHighest: COLORS.LIGHT_GRAY,
    background: COLORS.WHITE,
    error: COLORS.ERROR,
    errorContainer: '#FFEBEE',
    onPrimary: COLORS.WHITE,
    onPrimaryContainer: COLORS.WHITE,
    onSecondary: COLORS.DARK,
    onSecondaryContainer: COLORS.DARK,
    onTertiary: COLORS.WHITE,
    onTertiaryContainer: COLORS.DARK,
    onSurface: COLORS.DARK,
    onSurfaceVariant: COLORS.DARK_GRAY,
    onBackground: COLORS.DARK,
    onError: COLORS.WHITE,
    onErrorContainer: COLORS.ERROR,
    outline: COLORS.GRAY,
    outlineVariant: COLORS.LIGHT_GRAY,
    inverseSurface: COLORS.DARK,
    inverseOnSurface: COLORS.WHITE,
    inversePrimary: COLORS.PRIMARY,
    shadow: COLORS.BLACK,
    scrim: COLORS.BLACK,
    surfaceDisabled: COLORS.LIGHT_GRAY,
    onSurfaceDisabled: COLORS.GRAY,
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  roundness: 12,
};

// Темная тема
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.PRIMARY,
    primaryContainer: COLORS.PRIMARY_DARK,
    secondary: COLORS.SECONDARY,
    secondaryContainer: '#FFF3C4',
    tertiary: COLORS.INFO,
    tertiaryContainer: '#E3F2FD',
    surface: COLORS.DARK,
    surfaceVariant: '#424242',
    surfaceContainerHighest: '#616161',
    background: '#121212',
    error: COLORS.ERROR,
    errorContainer: '#FFEBEE',
    onPrimary: COLORS.WHITE,
    onPrimaryContainer: COLORS.WHITE,
    onSecondary: COLORS.DARK,
    onSecondaryContainer: COLORS.DARK,
    onTertiary: COLORS.WHITE,
    onTertiaryContainer: COLORS.DARK,
    onSurface: COLORS.WHITE,
    onSurfaceVariant: COLORS.LIGHT_GRAY,
    onBackground: COLORS.WHITE,
    onError: COLORS.WHITE,
    onErrorContainer: COLORS.ERROR,
    outline: COLORS.GRAY,
    outlineVariant: '#424242',
    inverseSurface: COLORS.WHITE,
    inverseOnSurface: COLORS.DARK,
    inversePrimary: COLORS.PRIMARY,
    shadow: COLORS.BLACK,
    scrim: COLORS.BLACK,
    surfaceDisabled: '#424242',
    onSurfaceDisabled: COLORS.GRAY,
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  roundness: 12,
};

// Экспорт темы по умолчанию
export const theme = lightTheme;
