import { create } from 'zustand';

import { audioService } from '@/services/audio/audioService';
import { MediaItem, PlaybackStatus } from '@/types/media';

export type ExtendedRepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  currentTrack: MediaItem | null;
  status: PlaybackStatus;
  position: number;
  duration: number;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;

  queue: MediaItem[];
  originalQueue: MediaItem[];
  currentIndex: number;
  isShuffled: boolean;
  repeatMode: ExtendedRepeatMode;

  sleepTimerEnd: number | null;
  sleepTimerRemaining: number;

  loadAndPlay: (item: MediaItem) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  seekRelative: (deltaSeconds: number) => Promise<void>;

  setQueue: (tracks: MediaItem[], startIndex?: number) => void;
  addToQueue: (track: MediaItem) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  moveInQueue: (fromIndex: number, toIndex: number) => void;

  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  playTrackAtIndex: (index: number) => Promise<void>;

  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setPlaybackSpeed: (speed: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  toggleMute: () => Promise<void>;

  setSleepTimer: (minutes: number) => void;
  clearSleepTimer: () => void;
  tickSleepTimer: () => void;

  updateProgress: (position: number, duration: number) => void;
  updateStatus: (status: PlaybackStatus) => void;
  resetPlayer: () => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  status: 'idle',
  position: 0,
  duration: 0,
  playbackSpeed: 1.0,
  volume: 1.0,
  isMuted: false,

  queue: [],
  originalQueue: [],
  currentIndex: -1,
  isShuffled: false,
  repeatMode: 'off',

  sleepTimerEnd: null,
  sleepTimerRemaining: 0,

  loadAndPlay: async (item) => {
    set({ currentTrack: item, status: 'buffering', position: 0 });
    try {
      const { duration } = await audioService.loadTrack(item, true);
      set({ status: 'playing', duration });
    } catch {
      set({ status: 'error' });
    }
  },

  togglePlayPause: async () => {
    const { status } = get();
    if (status === 'playing') {
      await audioService.pause();
      set({ status: 'paused' });
    } else if (status === 'paused') {
      await audioService.play();
      set({ status: 'playing' });
    }
  },

  pause: async () => {
    await audioService.pause();
    set({ status: 'paused' });
  },

  resume: async () => {
    await audioService.play();
    set({ status: 'playing' });
  },

  stop: async () => {
    await audioService.stop();
    set({ status: 'stopped', position: 0 });
  },

  seekTo: async (positionMs) => {
    await audioService.seek(positionMs);
    set({ position: positionMs });
  },

  seekRelative: async (deltaSeconds) => {
    await audioService.seekRelative(deltaSeconds * 1000);
  },

  setQueue: (tracks, startIndex = 0) => {
    set({
      queue: tracks,
      originalQueue: [...tracks],
      currentIndex: startIndex,
      currentTrack: tracks[startIndex] || null,
      isShuffled: false,
    });
  },

  addToQueue: (track) => {
    set((state) => ({
      queue: [...state.queue, track],
      originalQueue: [...state.originalQueue, track],
    }));
  },

  removeFromQueue: (index) => {
    const { queue, originalQueue, currentIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    const newOriginal = originalQueue.filter((_, i) => i !== index);
    let newIndex = currentIndex;

    if (index < currentIndex) newIndex -= 1;
    if (index === currentIndex && newQueue.length > 0) {
      newIndex = Math.min(currentIndex, newQueue.length - 1);
    }

    set({
      queue: newQueue,
      originalQueue: newOriginal,
      currentIndex: newIndex,
      currentTrack: newQueue[newIndex] || null,
    });
  },

  clearQueue: () => {
    set({
      queue: [],
      originalQueue: [],
      currentIndex: -1,
      currentTrack: null,
      status: 'idle',
    });
  },

  moveInQueue: (fromIndex, toIndex) => {
    const { queue } = get();
    const newQueue = [...queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);

    set({ queue: newQueue });
  },

  nextTrack: async () => {
    const { queue, currentIndex, repeatMode } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      await audioService.seek(0);
      await audioService.play();
      set({ position: 0, status: 'playing' });
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      set({ currentIndex: nextIndex });
      await get().loadAndPlay(queue[nextIndex]);
    } else if (repeatMode === 'all') {
      set({ currentIndex: 0 });
      await get().loadAndPlay(queue[0]);
    } else {
      set({ status: 'stopped', position: 0 });
    }
  },

  previousTrack: async () => {
    const { queue, currentIndex, position } = get();
    if (queue.length === 0) return;

    if (position > 3000) {
      await audioService.seek(0);
      set({ position: 0 });
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      set({ currentIndex: prevIndex });
      await get().loadAndPlay(queue[prevIndex]);
    } else if (get().repeatMode === 'all') {
      const lastIndex = queue.length - 1;
      set({ currentIndex: lastIndex });
      await get().loadAndPlay(queue[lastIndex]);
    }
  },

  playTrackAtIndex: async (index) => {
    const { queue } = get();
    if (index >= 0 && index < queue.length) {
      set({ currentIndex: index });
      await get().loadAndPlay(queue[index]);
    }
  },

  toggleShuffle: () => {
    const { isShuffled, queue, originalQueue, currentIndex, currentTrack } = get();

    if (isShuffled) {
      const originalIndex = originalQueue.findIndex((track) => track.id === currentTrack?.id);
      set({
        queue: [...originalQueue],
        currentIndex: originalIndex >= 0 ? originalIndex : 0,
        isShuffled: false,
      });
    } else {
      const remaining = queue.filter((_, index) => index !== currentIndex);
      const shuffled = shuffleArray(remaining);
      if (currentTrack) shuffled.unshift(currentTrack);
      set({
        queue: shuffled,
        currentIndex: 0,
        isShuffled: true,
      });
    }
  },

  cycleRepeatMode: () => {
    const { repeatMode } = get();
    const modes: ExtendedRepeatMode[] = ['off', 'all', 'one'];
    const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
    set({ repeatMode: modes[nextIndex] });
  },

  setPlaybackSpeed: async (speed) => {
    const clamped = Math.max(0.25, Math.min(4, speed));
    await audioService.setRate(clamped);
    set({ playbackSpeed: clamped });
  },

  setVolume: async (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    await audioService.setVolume(clamped);
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: async () => {
    const { isMuted, volume } = get();
    const nextMuted = !isMuted;
    await audioService.setMuted(nextMuted);
    set({ isMuted: nextMuted, volume: nextMuted ? 0 : volume || 1 });
  },

  setSleepTimer: (minutes) => {
    const endTime = Date.now() + minutes * 60 * 1000;
    set({
      sleepTimerEnd: endTime,
      sleepTimerRemaining: minutes * 60,
    });
  },

  clearSleepTimer: () => {
    set({ sleepTimerEnd: null, sleepTimerRemaining: 0 });
  },

  tickSleepTimer: () => {
    const { sleepTimerEnd } = get();
    if (!sleepTimerEnd) return;

    const remaining = Math.max(0, Math.floor((sleepTimerEnd - Date.now()) / 1000));
    if (remaining <= 0) {
      get().pause();
      get().clearSleepTimer();
    } else {
      set({ sleepTimerRemaining: remaining });
    }
  },

  updateProgress: (position, duration) => {
    set({ position, duration });
  },

  updateStatus: (status) => set({ status }),

  resetPlayer: () => {
    void audioService.unload();
    set({
      currentTrack: null,
      status: 'idle',
      position: 0,
      duration: 0,
      queue: [],
      originalQueue: [],
      currentIndex: -1,
      isShuffled: false,
      repeatMode: 'off',
      sleepTimerEnd: null,
      sleepTimerRemaining: 0,
    });
  },
}));
