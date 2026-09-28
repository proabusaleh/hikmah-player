import { useEffect, useRef } from 'react';

import { AudioEventType, audioService } from '@/services/audio/audioService';
import { usePlayerStore } from '@/store/usePlayerStore';
import { MediaItem } from '@/types/media';

export const useAudioPlayback = () => {
  const store = usePlayerStore();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopProgressPolling = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const startProgressPolling = () => {
    stopProgressPolling();
    progressIntervalRef.current = setInterval(async () => {
      const status = await audioService.getStatus();
      if (status) {
        store.updateProgress(status.position, status.duration);
      }
    }, 500);
  };

  useEffect(() => {
    const unsubscribe = audioService.addListener((event: AudioEventType) => {
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
  }, [store]);

  return {
    currentTrack: store.currentTrack,
    status: store.status,
    position: store.position,
    duration: store.duration,
    playbackSpeed: store.playbackSpeed,
    volume: store.volume,
    isMuted: store.isMuted,
    queue: store.queue,
    currentIndex: store.currentIndex,
    isShuffled: store.isShuffled,
    repeatMode: store.repeatMode,

    playMedia: (item: MediaItem) => {
      void store.loadAndPlay(item);
    },
    togglePlayPause: store.togglePlayPause,
    pause: store.pause,
    resume: store.resume,
    stop: store.stop,
    seekTo: store.seekTo,
    seekRelative: store.seekRelative,

    setQueue: store.setQueue,
    addToQueue: store.addToQueue,
    removeFromQueue: store.removeFromQueue,
    clearQueue: store.clearQueue,

    skipNext: store.nextTrack,
    skipPrevious: store.previousTrack,
    playTrackAtIndex: store.playTrackAtIndex,

    toggleShuffle: store.toggleShuffle,
    cycleRepeatMode: store.cycleRepeatMode,
    setPlaybackSpeed: store.setPlaybackSpeed,
    setVolume: store.setVolume,
    toggleMute: store.toggleMute,
  };
};
