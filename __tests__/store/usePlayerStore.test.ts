import { usePlayerStore } from '@/store/usePlayerStore';
import { MediaItem } from '@/types/media';

const createMockTrack = (id: string, title: string): MediaItem => ({
  id,
  title,
  url: `https://example.com/${id}.mp3`,
  duration: 120,
  type: 'audio',
  addedAt: Date.now(),
});

const mockQueue: MediaItem[] = [
  createMockTrack('1', 'Track One'),
  createMockTrack('2', 'Track Two'),
  createMockTrack('3', 'Track Three'),
];

describe('usePlayerStore', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
    jest.clearAllMocks();
  });

  describe('Queue Management', () => {
    it('should set queue and current track', () => {
      usePlayerStore.getState().setQueue(mockQueue, 0);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(3);
      expect(state.currentIndex).toBe(0);
      expect(state.currentTrack?.id).toBe('1');
    });

    it('should add item to queue', () => {
      usePlayerStore.getState().setQueue(mockQueue, 0);
      const newTrack = createMockTrack('4', 'Track Four');
      usePlayerStore.getState().addToQueue(newTrack);

      expect(usePlayerStore.getState().queue).toHaveLength(4);
    });

    it('should remove item from queue', () => {
      usePlayerStore.getState().setQueue(mockQueue, 0);
      usePlayerStore.getState().removeFromQueue(1);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(2);
      expect(state.queue.find((t) => t.id === '2')).toBeUndefined();
    });

    it('should clear queue', () => {
      usePlayerStore.getState().setQueue(mockQueue, 0);
      usePlayerStore.getState().clearQueue();

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(0);
      expect(state.currentTrack).toBeNull();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      usePlayerStore.getState().setQueue(mockQueue, 0);
    });

    it('should go to next track', async () => {
      await usePlayerStore.getState().nextTrack();
      expect(usePlayerStore.getState().currentIndex).toBe(1);
    });

    it('should go to previous track', async () => {
      usePlayerStore.getState().setQueue(mockQueue, 1);
      await usePlayerStore.getState().previousTrack();
      expect(usePlayerStore.getState().currentIndex).toBe(0);
    });

    it('should restart track if position > 3s on previous', async () => {
      usePlayerStore.getState().setQueue(mockQueue, 1);
      usePlayerStore.setState({ position: 5000 });

      await usePlayerStore.getState().previousTrack();
      // Should stay on same track but reset position
      expect(usePlayerStore.getState().currentIndex).toBe(1);
      expect(usePlayerStore.getState().position).toBe(0);
    });

    it('should loop to first track with repeat all', async () => {
      usePlayerStore.getState().setQueue(mockQueue, 2);
      usePlayerStore.setState({ repeatMode: 'all' });

      await usePlayerStore.getState().nextTrack();
      expect(usePlayerStore.getState().currentIndex).toBe(0);
    });

    it('should stop at last track with repeat off', async () => {
      usePlayerStore.getState().setQueue(mockQueue, 2);
      usePlayerStore.setState({ repeatMode: 'off' });

      await usePlayerStore.getState().nextTrack();
      expect(usePlayerStore.getState().status).toBe('stopped');
    });
  });

  describe('Shuffle', () => {
    it('should shuffle queue keeping current track first', () => {
      usePlayerStore.getState().setQueue(mockQueue, 0);
      usePlayerStore.getState().toggleShuffle();

      const state = usePlayerStore.getState();
      expect(state.isShuffled).toBe(true);
      expect(state.currentTrack?.id).toBe('1');
    });

    it('should restore original order on second toggle', () => {
      usePlayerStore.getState().setQueue(mockQueue, 0);
      usePlayerStore.getState().toggleShuffle();
      usePlayerStore.getState().toggleShuffle();

      const state = usePlayerStore.getState();
      expect(state.isShuffled).toBe(false);
      expect(state.queue[0].id).toBe('1');
      expect(state.queue[1].id).toBe('2');
    });
  });

  describe('Repeat Mode', () => {
    it('should cycle through off → all → one → off', () => {
      const store = usePlayerStore.getState();

      expect(store.repeatMode).toBe('off');
      store.cycleRepeatMode();
      expect(usePlayerStore.getState().repeatMode).toBe('all');
      store.cycleRepeatMode();
      expect(usePlayerStore.getState().repeatMode).toBe('one');
      store.cycleRepeatMode();
      expect(usePlayerStore.getState().repeatMode).toBe('off');
    });
  });

  describe('Sleep Timer', () => {
    it('should set sleep timer', () => {
      usePlayerStore.getState().setSleepTimer(30);

      const state = usePlayerStore.getState();
      expect(state.sleepTimerEnd).not.toBeNull();
      expect(state.sleepTimerRemaining).toBe(1800);
    });

    it('should clear sleep timer', () => {
      usePlayerStore.getState().setSleepTimer(30);
      usePlayerStore.getState().clearSleepTimer();

      const state = usePlayerStore.getState();
      expect(state.sleepTimerEnd).toBeNull();
      expect(state.sleepTimerRemaining).toBe(0);
    });
  });
});
