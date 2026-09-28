import { useEvent } from 'expo';
import { useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { clamp, createVideoSource, videoSpeedPresets } from '@/services/video/videoEngine';

export type VideoPlaybackState = {
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  playbackRate: number;
  status: 'idle' | 'loading' | 'readyToPlay' | 'error';
};

export const useVideoEngine = (sourceUri: string, title?: string) => {
  const [state, setState] = useState<VideoPlaybackState>({
    isPlaying: false,
    isBuffering: false,
    position: 0,
    duration: 0,
    playbackRate: 1,
    status: 'idle',
  });

  const player = useVideoPlayer(createVideoSource(sourceUri, title), (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.playbackRate = 1;
    nextPlayer.timeUpdateEventInterval = 0.25;
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
    const nextStatus = statusEvent?.status ?? player.status;
    const nextIsPlaying = Boolean(playingEvent?.isPlaying ?? player.playing);
    const nextPosition = Number(timeEvent?.currentTime ?? player.currentTime) || 0;
    const nextDuration = Number(player.duration) || 0;
    const nextRate = Number(player.playbackRate) || 1;

    setState({
      isPlaying: nextIsPlaying,
      isBuffering: nextStatus === 'loading',
      position: nextPosition,
      duration: nextDuration,
      playbackRate: nextRate,
      status: nextStatus === 'error' ? 'error' : nextStatus,
    });
  }, [player, playingEvent, statusEvent, timeEvent]);

  const currentSpeedIndex = useMemo(() => {
    const normalized = Number(state.playbackRate) || 1;
    const index = videoSpeedPresets.findIndex((preset) => preset === normalized);
    return index >= 0 ? index : 0;
  }, [state.playbackRate]);

  const togglePlayPause = useCallback(() => {
    if (player.playing) {
      player.pause();
      return;
    }

    player.play();
  }, [player]);

  const seekBy = useCallback(
    (seconds: number) => {
      const nextTime = clamp(player.currentTime + seconds, 0, Number(player.duration || 0));
      player.currentTime = nextTime;
      setState((prev) => ({ ...prev, position: nextTime }));
    },
    [player]
  );

  const seekTo = useCallback(
    (positionSeconds: number) => {
      const nextTime = clamp(positionSeconds, 0, Number(player.duration || 0));
      player.currentTime = nextTime;
      setState((prev) => ({ ...prev, position: nextTime }));
    },
    [player]
  );

  const setRate = useCallback(
    (rate: number) => {
      const safeRate = clamp(rate, 0.75, 2);
      player.playbackRate = safeRate;
      setState((prev) => ({ ...prev, playbackRate: safeRate }));
    },
    [player]
  );

  const cycleSpeed = useCallback(() => {
    const currentIndex = currentSpeedIndex >= 0 ? currentSpeedIndex : 0;
    const nextIndex = (currentIndex + 1) % videoSpeedPresets.length;
    setRate(videoSpeedPresets[nextIndex]);
  }, [currentSpeedIndex, setRate]);

  const reset = useCallback(() => {
    player.currentTime = 0;
    setState((prev) => ({ ...prev, position: 0 }));
  }, [player]);

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
    togglePlayPause,
  };
};
