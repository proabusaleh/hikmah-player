import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useState } from 'react';

const isUnsupportedOrientationError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes('NotSupportedError') ||
    message.includes('screen.orientation.lock() is not available on this device')
  );
};

export const useScreenOrientation = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const nextValue = !isFullscreen;
    setIsFullscreen(nextValue);

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
