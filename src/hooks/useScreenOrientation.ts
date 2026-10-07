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
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return;
    }

    const nextValue = !isFullscreen;

    try {
      await ScreenOrientation.lockAsync(
        nextValue
          ? ScreenOrientation.OrientationLock.LANDSCAPE
          : ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      setIsFullscreen(nextValue);
    } catch (error) {
      if (!isUnsupportedOrientationError(error)) {
        console.error('[ScreenOrientation] Failed to toggle orientation:', error);
      }
      // Preserve the UI state when the native lock fails on some devices.
      setIsFullscreen(isFullscreen);
    }
  }, [isFullscreen]);

  const resetToPortrait = useCallback(async () => {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      return;
    }

    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
    } catch (error) {
      if (!isUnsupportedOrientationError(error)) {
        console.error('[ScreenOrientation] Reset failed:', error);
      }
      setIsFullscreen(false);
    }
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
    resetToPortrait,
  };
};
