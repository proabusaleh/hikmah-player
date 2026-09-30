import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

const isUnsupportedOrientationError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  return (
    normalized.includes('notsupportederror') ||
    normalized.includes('not supported') ||
    normalized.includes('not available on this device') ||
    normalized.includes('screen.orientation.lock')
  );
};

export const useScreenOrientation = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const nextValue = !isFullscreen;
    setIsFullscreen(nextValue);

    // Orientation lock is a native capability. On web the underlying
    // screen.orientation.lock() requires fullscreen + user gesture and
    // otherwise rejects, so skip the native call entirely.
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await ScreenOrientation.lockAsync(
        nextValue
          ? ScreenOrientation.OrientationLock.LANDSCAPE
          : ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    } catch (error) {
      if (!isUnsupportedOrientationError(error)) {
        console.error('[ScreenOrientation] Failed to toggle orientation:', error);
      }
    }
  }, [isFullscreen]);

  const resetToPortrait = useCallback(async () => {
    setIsFullscreen(false);

    if (Platform.OS === 'web') {
      return;
    }

    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } catch (error) {
      if (!isUnsupportedOrientationError(error)) {
        console.error('[ScreenOrientation] Reset failed:', error);
      }
    }
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
    resetToPortrait,
  };
};
