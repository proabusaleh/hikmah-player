import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

export const configureAudioEngine = async (): Promise<void> => {
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
    console.error('[AudioEngine] Configuration Failed:', error);
  }
};
