import { setAudioModeAsync } from 'expo-audio';

export const configureAudioEngine = async (): Promise<void> => {
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
      interruptionMode: 'doNotMix',
    });
  } catch (error) {
    console.error('[AudioEngine] Configuration Failed:', error);
  }
};
