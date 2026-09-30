import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

/**
 * Thin wrapper around `expo-updates` for over-the-air updates.
 * OTA only works in release builds on native platforms — every entry
 * point bails out silently in dev and on web.
 */
const isUpdateCapable = (): boolean => {
  if (__DEV__) return false;
  if (Platform.OS === 'web') return false;
  try {
    return Updates.isEnabled;
  } catch {
    return false;
  }
};

export const UpdateService = {
  isCapable: isUpdateCapable,

  /** True when a newer published update is waiting on the server. */
  async checkForUpdate(): Promise<boolean> {
    if (!isUpdateCapable()) return false;
    try {
      const result = await Updates.checkForUpdateAsync();
      return result.isAvailable;
    } catch {
      return false;
    }
  },

  /** Download the pending update; it applies on the next cold start. */
  async downloadUpdate(): Promise<boolean> {
    if (!isUpdateCapable()) return false;
    try {
      const result = await Updates.fetchUpdateAsync();
      return result.isNew;
    } catch {
      return false;
    }
  },

  /** Restart into the downloaded update immediately. */
  async applyUpdate(): Promise<void> {
    await Updates.reloadAsync();
  },
};
