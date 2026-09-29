import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

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

const createPlayerMock = createAudioPlayer as jest.Mock;
const setAudioModeMock = setAudioModeAsync as jest.Mock;

const lastPlayer = () => {
  return createPlayerMock.mock.results[createPlayerMock.mock.calls.length - 1].value;
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
      expect(setAudioModeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldPlayInBackground: true,
          playsInSilentMode: true,
        })
      );
    });

    it('should not re-initialize if already initialized', async () => {
      await audioService.initialize();
      await audioService.initialize();
      expect(setAudioModeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadTrack', () => {
    it('should create a player instance and play', async () => {
      const result = await audioService.loadTrack(mockTrack, true);

      expect(createPlayerMock).toHaveBeenCalledWith(
        { uri: mockTrack.url },
        expect.objectContaining({ updateInterval: 250 })
      );
      expect(lastPlayer().play).toHaveBeenCalled();
      expect(result.duration).toBe(120000);
    });

    it('should remove previous player before loading new one', async () => {
      await audioService.loadTrack(mockTrack);
      const firstPlayer = lastPlayer();

      await audioService.loadTrack({ ...mockTrack, id: 'test-2' });

      expect(firstPlayer.remove).toHaveBeenCalled();
      expect(createPlayerMock).toHaveBeenCalledTimes(2);
    });

    it('should emit error event on load failure', async () => {
      createPlayerMock.mockImplementationOnce(() => {
        throw new Error('Network error');
      });

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
      expect(lastPlayer().play).toHaveBeenCalled();
    });

    it('should pause', async () => {
      await audioService.pause();
      expect(lastPlayer().pause).toHaveBeenCalled();
    });

    it('should seek to position (ms converted to seconds)', async () => {
      await audioService.seek(30000);
      expect(lastPlayer().seekTo).toHaveBeenCalledWith(30);
    });

    it('should set playback rate', async () => {
      await audioService.setRate(1.5);
      expect(lastPlayer().setPlaybackRate).toHaveBeenCalledWith(1.5);
    });

    it('should clamp rate between 0.25 and 4.0', async () => {
      await audioService.setRate(10);
      expect(lastPlayer().setPlaybackRate).toHaveBeenCalledWith(4.0);

      await audioService.setRate(0.01);
      expect(lastPlayer().setPlaybackRate).toHaveBeenCalledWith(0.25);
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
