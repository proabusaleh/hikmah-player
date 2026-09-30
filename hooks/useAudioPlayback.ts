import { useEffect, useRef } from 'react';

import { AudioEventType, audioService } from '@/services/audio/audioService';
import { usePlayerStore } from '@/store/usePlayerStore';
import { MediaItem } from '@/types/media';

export const useAudioPlayback = () => {
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to individual fields so this hook (and its polling effect
  // below) does not re-run on every store update.
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const status = usePlayerStore((s) => s.status);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const playbackSpeed = usePlayerStore((s) => s.playbackSpeed);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const isShuffled = usePlayerStore((s) => s.isShuffled);
  const repeatMode = usePlayerStore((s) => s.repeatMode);

  const loadAndPlay = usePlayerStore((s) => s.loadAndPlay);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const stop = usePlayerStore((s) => s.stop);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const seekRelative = usePlayerStore((s) => s.seekRelative);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const previousTrack = usePlayerStore((s) => s.previousTrack);
  const playTrackAtIndex = usePlayerStore((s) => s.playTrackAtIndex);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeatMode = usePlayerStore((s) => s.cycleRepeatMode);
  const setPlaybackSpeed = usePlayerStore((s) => s.setPlaybackSpeed);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  // Subscribe to audio-service events exactly once. Previously this effect
  // depended on the whole store object, so every progress tick (which
  // updates the store) ran the cleanup and killed the polling interval —
  // freezing the progress bar after the first tick.
  useEffect(() => {
    const stopProgressPolling = () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    const startProgressPolling = () => {
      stopProgressPolling();
      progressIntervalRef.current = setInterval(async () => {
        const result = await audioService.getStatus();
        if (result) {
          usePlayerStore.getState().updateProgress(result.position, result.duration);
        }
      }, 500);
    };

    const unsubscribe = audioService.addListener((event: AudioEventType) => {
      const store = usePlayerStore.getState();
      switch (event) {
        case 'play':
          store.updateStatus('playing');
          startProgressPolling();
          break;
        case 'pause':
          store.updateStatus('paused');
          stopProgressPolling();
          break;
        case 'stop':
          store.updateStatus('stopped');
          stopProgressPolling();
          break;
        case 'buffering':
          store.updateStatus('buffering');
          break;
        case 'error':
          store.updateStatus('error');
          stopProgressPolling();
          break;
        case 'trackEnd':
          void store.nextTrack();
          break;
        default:
          break;
      }
    });

    return () => {
      unsubscribe();
      stopProgressPolling();
    };
  }, []);

  return {
    currentTrack,
    status,
    position,
    duration,
    playbackSpeed,
    volume,
    isMuted,
    queue,
    currentIndex,
    isShuffled,
    repeatMode,

    playMedia: (item: MediaItem) => {
      void loadAndPlay(item);
    },
    togglePlayPause,
    pause,
    resume,
    stop,
    seekTo,
    seekRelative,

    setQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,

    skipNext: nextTrack,
    skipPrevious: previousTrack,
    playTrackAtIndex,

    toggleShuffle,
    cycleRepeatMode,
    setPlaybackSpeed,
    setVolume,
    toggleMute,
  };
};
