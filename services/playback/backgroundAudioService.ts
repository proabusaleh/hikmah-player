import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch {
      // Silent fail
    }
  },
};
