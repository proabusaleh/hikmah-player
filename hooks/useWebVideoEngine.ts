import { useCallback, useMemo, useRef, useState } from 'react';

import { clamp, videoSpeedPresets } from '@/services/video/videoEngine';

export type VideoPlaybackState = {
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  status: 'idle' | 'loading' | 'readyToPlay' | 'error';
};

export const useWebVideoEngine = (sourceUri: string, title?: string) => {
  const [state, setState] = useState<VideoPlaybackState>({
    isPlaying: false,
    isBuffering: false,
    position: 0,
    duration: 0,
    playbackRate: 1,
    volume: 1,
    isMuted: false,
    status: 'idle',
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isSeekingRef = useRef(false);

  const updateState = useCallback((partial: Partial<VideoPlaybackState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial } as VideoPlaybackState;
      if ('status' in partial && partial.status === 'readyToPlay') {
        next.isPlaying = false;
      }
      return next;
    });
  }, []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      play();
    } else {
      pause();
    }
  }, [play, pause]);

  const seekTo = useCallback(
    (positionSeconds: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(positionSeconds)) return;

      isSeekingRef.current = true;
      video.currentTime = positionSeconds;
      updateState({ position: positionSeconds });
    },
    [updateState]
  );

  const seekBy = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.currentTime)) return;

      const nextTime = clamp(video.currentTime + seconds, 0, Number(video.duration) || 0);
      isSeekingRef.current = true;
      video.currentTime = nextTime;
      updateState({ position: nextTime });
    },
    [updateState]
  );

  const setRate = useCallback(
    (rate: number) => {
      const video = videoRef.current;
      if (!video) return;
      const safeRate = clamp(rate, 0.75, 2);
      video.playbackRate = safeRate;
      updateState({ playbackRate: safeRate });
    },
    [updateState]
  );

  const cycleSpeed = useCallback(() => {
    const currentIndex = state.playbackRate
      ? videoSpeedPresets.findIndex((preset) => preset === state.playbackRate)
      : -1;
    const nextIndex = (currentIndex >= 0 ? currentIndex : 0 + 1) % videoSpeedPresets.length;
    setRate(videoSpeedPresets[nextIndex]);
  }, [state.playbackRate, setRate]);

  const reset = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    updateState({ position: 0 });
  }, [updateState]);

  const setVolume = useCallback(
    (level: number) => {
      const video = videoRef.current;
      const safeLevel = clamp(level, 0, 1);
      if (video) {
        video.volume = safeLevel;
        if (safeLevel > 0 && video.muted) {
          video.muted = false;
        }
      }
      if (safeLevel > 0) {
        updateState({ volume: safeLevel, isMuted: false });
      } else {
        updateState({ volume: safeLevel });
      }
    },
    [updateState]
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    updateState({ isMuted: nextMuted });
  }, [updateState]);

  const attachVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (!video) return;

    const handleCanPlay = () => {
      updateState({ status: 'readyToPlay', isBuffering: false });
    };

    const handleWaiting = () => {
      updateState({ isBuffering: true });
    };

    const handlePlaying = () => {
      updateState({ isPlaying: true, isBuffering: false, status: 'readyToPlay' });
    };

    const handlePause = () => {
      updateState({ isPlaying: false, status: 'readyToPlay' });
    };

    const handleTimeUpdate = () => {
      if (isSeekingRef.current || !Number.isFinite(video.currentTime)) return;
      updateState({ position: video.currentTime });
    };

    const handleDurationChange = () => {
      if (Number.isFinite(video.duration)) {
        updateState({ duration: video.duration });
      }
    };

    const handleEnded = () => {
      updateState({ isPlaying: false, status: 'readyToPlay' });
    };

    const handleError = () => {
      updateState({ status: 'error', isBuffering: false });
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [updateState]);

  return {
    videoRef,
    attachVideo,
    ...state,
    currentSpeedIndex: useMemo(() => {
      const normalized = Number(state.playbackRate) || 1;
      return videoSpeedPresets.findIndex((preset) => preset === normalized);
    }, [state.playbackRate]),
    togglePlayPause,
    seekBy,
    seekTo,
    setRate,
    setVolume,
    toggleMute,
    cycleSpeed,
    reset,
  };
};
