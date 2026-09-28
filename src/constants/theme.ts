import { Platform, TextStyle } from 'react-native';

const baseColors = {
  primary: '#0F172A',
  primaryLight: '#38BDF8',
  secondary: '#10B981',
  accent: '#34D399',
  background: '#020617',
  backgroundElement: '#0F172A',
  backgroundSelected: '#1E293B',
  surface: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  borderLight: '#475569',

  text: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  muted: '#94A3B8',
  dim: '#64748B',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#38BDF8',

  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(15, 23, 42, 0.85)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const Colors = {
  ...baseColors,
  light: {
    ...baseColors,
    background: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    surface: '#FFFFFF',
    card: '#F1F5F9',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textDim: '#94A3B8',
    muted: '#64748B',
    dim: '#94A3B8',
  },
  dark: {
    ...baseColors,
    background: '#020617',
    backgroundElement: '#0F172A',
    backgroundSelected: '#1E293B',
    surface: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    text: '#FFFFFF',
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    textDim: '#64748B',
    muted: '#94A3B8',
    dim: '#64748B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

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
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  h4: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.muted,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.dim,
    letterSpacing: 0.3,
  },
  button: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const StorageKeys = {
  PLAYLIST_HISTORY: '@hikmah_history',
  FAVORITES: '@hikmah_favorites',
  DOWNLOADS_METADATA: '@hikmah_downloads',
  SETTINGS: '@hikmah_settings',
} as const;
