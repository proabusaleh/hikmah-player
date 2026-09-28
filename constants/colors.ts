export const Colors = {
  dark: {
    background: '#020617',
    surface: '#0F172A',
    card: '#1E293B',
    border: '#334155',

    primary: '#0EA5E9',
    primaryLight: '#38BDF8',
    accent: '#10B981',

    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textDim: '#64748B',

    danger: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
  },
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#F1F5F9',
    border: '#E2E8F0',

    primary: '#0284C7',
    primaryLight: '#0EA5E9',
    accent: '#059669',

    text: '#0F172A',
    textMuted: '#64748B',
    textDim: '#94A3B8',

    danger: '#DC2626',
    warning: '#D97706',
    success: '#059669',
  },
};

export const StorageKeys = {
  PLAYLIST_HISTORY: '@hikmah_history',
  FAVORITES: '@hikmah_favorites',
  DOWNLOADS_METADATA: '@hikmah_downloads',
  SETTINGS: '@hikmah_settings',
} as const;
