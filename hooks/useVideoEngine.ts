import { useEvent } from 'expo';
import { useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Platform } from 'react-native';

import { clamp, createVideoSource, videoSpeedPresets } from '@/services/video/videoEngine';

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

export const useVideoEngine = (sourceUri: string, title?: string) => {
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

  const player = useVideoPlayer(createVideoSource(sourceUri, title), (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.playbackRate = 1;
    nextPlayer.timeUpdateEventInterval = 0.25;
  });

  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  });

  const statusEvent = useEvent(player, 'statusChange', {
    status: player.status,
    error: undefined,
  });

  const playingEvent = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const timeEvent = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    bufferedPosition: player.bufferedPosition,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
  });

  useEffect(() => {
    const currentPlayer = playerRef.current;
    const nextStatus = statusEvent?.status ?? currentPlayer.status;
    const nextIsPlaying = Boolean(playingEvent?.isPlaying ?? currentPlayer.playing);
    const nextPosition = Number(timeEvent?.currentTime ?? currentPlayer.currentTime) || 0;
    const nextDuration = Number(currentPlayer.duration) || 0;
    const nextRate = Number(currentPlayer.playbackRate) || 1;
    const nextVolume = clamp(Number(currentPlayer.volume ?? 1), 0, 1);
    const nextMuted = Boolean(currentPlayer.muted ?? false);

    setState({
      isPlaying: nextIsPlaying,
      isBuffering: nextStatus === 'loading',
      position: nextPosition,
      duration: nextDuration,
      playbackRate: nextRate,
      volume: nextVolume,
      isMuted: nextMuted,
      status: nextStatus === 'error' ? 'error' : nextStatus,
    });
  }, [playingEvent, statusEvent, timeEvent]);

  const currentSpeedIndex = useMemo(() => {
    const normalized = Number(state.playbackRate) || 1;
    const index = videoSpeedPresets.findIndex((preset) => preset === normalized);
    return index >= 0 ? index : 0;
  }, [state.playbackRate]);

  const togglePlayPause = useCallback(() => {
    const currentPlayer = playerRef.current;
    if (Platform.OS === 'web') {
      const nextStatus = String(statusEvent?.status ?? currentPlayer.status);
      if (!['readyToPlay', 'playing'].includes(nextStatus)) {
        return;
      }
    }

    if (currentPlayer.playing) {
      currentPlayer.pause();
      return;
    }

    try {
      currentPlayer.play();
    } catch {
      // Web can throw when the underlying media source is not yet playable.
    }
  }, [statusEvent]);

  const seekBy = useCallback(
    (seconds: number) => {
      const currentPlayer = playerRef.current;
      if (!currentPlayer || typeof currentPlayer.currentTime !== 'number') {
        return;
      }
      if (Platform.OS === 'web') {
        const nextStatus = String(statusEvent?.status ?? currentPlayer.status);
        if (!['readyToPlay', 'playing'].includes(nextStatus)) {
          return;
        }
      }
      const nextTime = clamp(currentPlayer.currentTime + seconds, 0, Number(currentPlayer.duration || 0));
      currentPlayer.currentTime = nextTime;
      setState((prev) => ({ ...prev, position: nextTime }));
    },
    [statusEvent]
  );

  const seekTo = useCallback(
    (positionSeconds: number) => {
      const currentPlayer = playerRef.current;
      if (!currentPlayer || typeof currentPlayer.currentTime !== 'number') {
        return;
      }
      if (Platform.OS === 'web') {
        const nextStatus = String(statusEvent?.status ?? currentPlayer.status);
        if (!['readyToPlay', 'playing'].includes(nextStatus)) {
          return;
        }
      }
      const nextTime = clamp(positionSeconds, 0, Number(currentPlayer.duration || 0));
      currentPlayer.currentTime = nextTime;
      setState((prev) => ({ ...prev, position: nextTime }));
    },
    [statusEvent]
  );

  const setRate = useCallback(
    (rate: number) => {
      const currentPlayer = playerRef.current;
      if (!currentPlayer || typeof currentPlayer.playbackRate !== 'number') {
        return;
      }
      const safeRate = clamp(rate, 0.75, 2);
      currentPlayer.playbackRate = safeRate;
      setState((prev) => ({ ...prev, playbackRate: safeRate }));
    },
    []
  );

  const setVolume = useCallback((level: number) => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer || typeof currentPlayer.volume !== 'number') {
      return;
    }
    const safeLevel = clamp(level, 0, 1);
    currentPlayer.volume = safeLevel;
    if (safeLevel > 0 && currentPlayer.muted) {
      currentPlayer.muted = false;
    }
    setState((prev) => ({
      ...prev,
      volume: safeLevel,
      isMuted: safeLevel > 0 ? false : prev.isMuted,
    }));
  }, []);

  const toggleMute = useCallback(() => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer || typeof currentPlayer.muted !== 'boolean') {
      return;
    }
    const nextMuted = !currentPlayer.muted;
    currentPlayer.muted = nextMuted;
    setState((prev) => ({ ...prev, isMuted: nextMuted }));
  }, []);

  const cycleSpeed = useCallback(() => {
    const currentIndex = currentSpeedIndex >= 0 ? currentSpeedIndex : 0;
    const nextIndex = (currentIndex + 1) % videoSpeedPresets.length;
    setRate(videoSpeedPresets[nextIndex]);
  }, [currentSpeedIndex, setRate]);

  const reset = useCallback(() => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer || typeof currentPlayer.currentTime !== 'number') {
      return;
    }
    currentPlayer.currentTime = 0;
    setState((prev) => ({ ...prev, position: 0 }));
  }, []);

  return {
    player,
    ...state,
    error: statusEvent?.error,
    currentSpeedIndex,
    cycleSpeed,
    reset,
    seekBy,
    seekTo,
    setRate,
    setVolume,
    toggleMute,
    togglePlayPause,
  };
};
