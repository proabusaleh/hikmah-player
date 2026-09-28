import { create } from 'zustand';

import { StorageKeys } from '@/constants/theme';
import { StorageService } from '@/services/storage/storageService';
import type { QualityPreset } from '@/services/video/videoEngine';

export type AspectRatioMode = 'fit' | 'fill' | 'stretch' | '16:9' | '4:3';
export type SkipInterval = 5 | 10 | 15 | 30 | 60;

export interface PlayerSettings {
  playbackSpeed: number;
  quality: QualityPreset;
  audioTrack: string;
  subtitle: string;
  aspectRatio: AspectRatioMode;
  brightness: number;
  autoRotate: boolean;
  skipForwardInterval: SkipInterval;
  skipBackwardInterval: SkipInterval;
  autoPlayNext: boolean;
  rememberPosition: boolean;
  doubleTapToSeek: boolean;
}

interface SettingsState extends PlayerSettings {
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  updateSetting: <K extends keyof PlayerSettings>(key: K, value: PlayerSettings[K]) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: PlayerSettings = {
  playbackSpeed: 1,
  quality: 'auto',
  audioTrack: 'default',
  subtitle: 'off',
  aspectRatio: 'fit',
  brightness: 0.5,
  autoRotate: true,
  skipForwardInterval: 10,
  skipBackwardInterval: 10,
  autoPlayNext: true,
  rememberPosition: true,
  doubleTapToSeek: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const saved = await StorageService.getItem<PlayerSettings>(StorageKeys.SETTINGS);
      if (saved) {
        set({ ...DEFAULT_SETTINGS, ...saved, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  saveSettings: async () => {
    const state = get();
    const settingsToSave: PlayerSettings = {
      playbackSpeed: state.playbackSpeed,
      quality: state.quality,
      audioTrack: state.audioTrack,
      subtitle: state.subtitle,
      aspectRatio: state.aspectRatio,
      brightness: state.brightness,
      autoRotate: state.autoRotate,
      skipForwardInterval: state.skipForwardInterval,
      skipBackwardInterval: state.skipBackwardInterval,
      autoPlayNext: state.autoPlayNext,
      rememberPosition: state.rememberPosition,
      doubleTapToSeek: state.doubleTapToSeek,
    };

    await StorageService.setItem(StorageKeys.SETTINGS, settingsToSave);
  },

  updateSetting: (key, value) => {
    set((state) => ({ ...state, [key]: value } as Partial<SettingsState>));
    setTimeout(() => {
      void get().saveSettings();
    }, 250);
  },

  resetToDefaults: () => {
    set({ ...DEFAULT_SETTINGS, isLoaded: true });
    void get().saveSettings();
  },
}));
