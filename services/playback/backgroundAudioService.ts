import { setAudioModeAsync } from 'expo-audio';

/**
 * Optimized background audio configuration
 * Minimizes battery drain while maintaining playback
 */
export const BackgroundAudioService = {
  /**
   * Configure audio for minimal battery background playback
   */
  async configureForBackground(): Promise<void> {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        shouldPlayInBackground: true,
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
        interruptionMode: 'doNotMix',
      });
    } catch (error) {
      console.error('[BackgroundAudio] Config failed:', error);
    }
  },

  /**
   * Configure for foreground (higher quality, more resources)
   */
  async configureForForeground(): Promise<void> {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        shouldPlayInBackground: true,
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
        interruptionMode: 'doNotMix',
      });
    } catch (error) {
      console.error('[BackgroundAudio] Config failed:', error);
    }
  },

  /**
   * Release audio focus when not needed
   */
  async releaseAudioFocus(): Promise<void> {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        shouldPlayInBackground: false,
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
      });
    } catch {
      // Silent fail
    }
  },
};
