import { Audio } from 'expo-av';

import { audioService } from '@/services/audio/audioService';
import { MediaItem } from '@/types/media';

const mockTrack: MediaItem = {
  id: 'test-1',
  title: 'Test Audio',
  artistOrSpeaker: 'Test Artist',
  url: 'https://example.com/test.mp3',
  duration: 120,
  type: 'audio',
  addedAt: Date.now(),
};

const createAsyncMock = Audio.Sound.createAsync as jest.Mock;

const lastSound = async () => {
  const result = await createAsyncMock.mock.results[createAsyncMock.mock.calls.length - 1].value;
  return result.sound;
};

describe('AudioService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await audioService.destroy();
  });

  afterEach(async () => {
    await audioService.destroy();
  });

  describe('initialize', () => {
    it('should configure audio mode on first call', async () => {
      await audioService.initialize();
      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
        })
      );
    });

    it('should not re-initialize if already initialized', async () => {
      await audioService.initialize();
      await audioService.initialize();
      expect(Audio.setAudioModeAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadTrack', () => {
    it('should create a sound instance and play', async () => {
      const result = await audioService.loadTrack(mockTrack, true);

      expect(createAsyncMock).toHaveBeenCalledWith(
        { uri: mockTrack.url },
        expect.objectContaining({ shouldPlay: true }),
        expect.any(Function)
      );
      expect(result.duration).toBe(120000);
    });

    it('should unload previous track before loading new one', async () => {
      await audioService.loadTrack(mockTrack);
      const firstSound = await lastSound();

      await audioService.loadTrack({ ...mockTrack, id: 'test-2' });

      expect(firstSound.unloadAsync).toHaveBeenCalled();
      expect(createAsyncMock).toHaveBeenCalledTimes(2);
    });

    it('should emit error event on load failure', async () => {
      createAsyncMock.mockRejectedValueOnce(new Error('Network error'));

      const listener = jest.fn();
      audioService.addListener(listener);

      await expect(audioService.loadTrack(mockTrack)).rejects.toThrow('Network error');
      expect(listener).toHaveBeenCalledWith('error', expect.any(Error));
    });
  });

  describe('transport controls', () => {
    beforeEach(async () => {
      await audioService.loadTrack(mockTrack);
    });

    it('should play', async () => {
      await audioService.play();
      expect((await lastSound()).playAsync).toHaveBeenCalled();
    });

    it('should pause', async () => {
      await audioService.pause();
      expect((await lastSound()).pauseAsync).toHaveBeenCalled();
    });

    it('should seek to position', async () => {
      await audioService.seek(30000);
      expect((await lastSound()).setPositionAsync).toHaveBeenCalledWith(30000);
    });

    it('should set playback rate', async () => {
      await audioService.setRate(1.5);
      expect((await lastSound()).setRateAsync).toHaveBeenCalledWith(1.5, true);
    });

    it('should clamp rate between 0.25 and 4.0', async () => {
      await audioService.setRate(10);
      expect((await lastSound()).setRateAsync).toHaveBeenCalledWith(4.0, true);

      await audioService.setRate(0.01);
      expect((await lastSound()).setRateAsync).toHaveBeenCalledWith(0.25, true);
    });
  });

  describe('event system', () => {
    it('should add and remove listeners', async () => {
      const listener = jest.fn();
      const unsubscribe = audioService.addListener(listener);

      expect(typeof unsubscribe).toBe('function');

      await audioService.loadTrack(mockTrack);
      expect(listener).toHaveBeenCalledWith('buffering', undefined);
      expect(listener).toHaveBeenCalledWith('play', undefined);

      unsubscribe();
      listener.mockClear();

      await audioService.play();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
